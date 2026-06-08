import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DEV_FALLBACK_BACKEND_URLS = [
  "http://127.0.0.1:5000",
  "http://localhost:5000",
];

const RETRIABLE_UPSTREAM_STATUSES = new Set([500, 502, 503, 504, 521, 522, 523, 524]);

type ProjectListingEndpoint = `/api/project-listing/${string}`;
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function getConfiguredApiUrl(): string {
  const configured = [
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.API_URL_FALLBACK,
  ]
    .map((value) => value?.trim() ?? "")
    .filter((value) => Boolean(value));

  return configured.join(",");
}

function splitConfiguredApiUrls(configuredValue: string): string[] {
  if (!configuredValue) {
    return [];
  }

  return configuredValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => Boolean(value));
}

function isLoopbackUrl(value: string): boolean {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1"
    );
  } catch {
    return false;
  }
}

function getBackendBaseUrls(options?: { preferLocal?: boolean }): string[] {
  const envUrls = splitConfiguredApiUrls(getConfiguredApiUrl());
  const preferLocal = Boolean(options?.preferLocal);
  const shouldIncludeDevFallback = !isProductionRuntime() || preferLocal;

  const raw = shouldIncludeDevFallback
    ? [
        ...envUrls.filter((value) => isLoopbackUrl(value)),
        ...DEV_FALLBACK_BACKEND_URLS,
        ...envUrls.filter((value) => !isLoopbackUrl(value)),
      ]
    : envUrls;

  const normalized = raw.filter((value): value is string => Boolean(value));
  return [...new Set(normalized.map((value) => value.replace(/\/$/, "")))];
}

type ForwardPayload = {
  body?: BodyInit;
  headers?: Record<string, string>;
};

async function parseUpstreamBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return contentType.toLowerCase().includes("application/json");
}

function looksLikeCloudflareErrorPage(bodyText: string): boolean {
  const content = bodyText.toLowerCase();
  return (
    content.includes("error code: 521")
    || content.includes("web server is down")
    || content.includes("cloudflare")
  );
}

async function parseIncomingJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function buildForwardPayload(
  request: Request,
  method: HttpMethod,
): Promise<ForwardPayload | null> {
  if (method === "GET" || method === "DELETE") {
    return {};
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    const body = await parseIncomingJson(request);

    if (!body || typeof body !== "object") {
      return null;
    }

    return {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return { body: formData };
  }

  const rawBody = await request.arrayBuffer();

  return {
    body: rawBody.byteLength > 0 ? rawBody : undefined,
    headers: contentType
      ? {
          "Content-Type":
            request.headers.get("content-type") || "application/octet-stream",
        }
      : undefined,
  };
}

async function getAdminAuthorizationHeader(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("adminAuthToken")?.value?.trim();

  if (!token) {
    return null;
  }

  return `Bearer ${token}`;
}

export async function forwardProjectListingRequest(
  request: Request,
  endpoint: ProjectListingEndpoint,
  method: HttpMethod = "POST",
): Promise<NextResponse> {
  let preferLocal = false;
  try {
    const requestUrl = new URL(request.url);
    preferLocal = isLocalHostname(requestUrl.hostname);
  } catch {
    preferLocal = false;
  }

  const apiBaseUrls = getBackendBaseUrls({ preferLocal });

  if (!apiBaseUrls.length) {
    return NextResponse.json(
      {
        message:
          "API_URL is missing on the server. Configure API_URL in deployment environment variables.",
      },
      { status: 500 },
    );
  }

  const payload = await buildForwardPayload(request, method);

  if (payload === null) {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 },
    );
  }

  let lastRetriablePayload: unknown = null;
  let lastRetriableStatus: number | null = null;

  const authorization = await getAdminAuthorizationHeader();

  for (const apiBaseUrl of apiBaseUrls) {
    try {
      const fetchHeaders: Record<string, string> = { ...payload.headers };
      if (authorization) {
        fetchHeaders["Authorization"] = authorization;
      }

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method,
        headers: fetchHeaders,
        body: payload.body,
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type");

      if (!isJsonContentType(contentType)) {
        const rawBody = await response.arrayBuffer();
        const bodyBytes = new Uint8Array(rawBody);
        const bodyText = new TextDecoder().decode(bodyBytes);

        if (RETRIABLE_UPSTREAM_STATUSES.has(response.status)) {
          lastRetriablePayload = {
            message: looksLikeCloudflareErrorPage(bodyText)
              ? "Upstream backend is unavailable (Cloudflare 52x)."
              : "Upstream backend temporarily unavailable.",
          };
          lastRetriableStatus = response.status;
          continue;
        }

        const responseHeaders: Record<string, string> = {
          "Content-Type": contentType || "application/octet-stream",
          "Cache-Control": "no-store",
        };

        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition) {
          responseHeaders["Content-Disposition"] = contentDisposition;
        }

        return new NextResponse(bodyBytes, {
          status: response.status,
          headers: responseHeaders,
        });
      }

      const upstreamPayload = await parseUpstreamBody(response);

      if (RETRIABLE_UPSTREAM_STATUSES.has(response.status)) {
        lastRetriablePayload = upstreamPayload;
        lastRetriableStatus = response.status;
        continue;
      }

      return NextResponse.json(upstreamPayload, { status: response.status });
    } catch {
      continue;
    }
  }

  if (lastRetriableStatus !== null) {
    return NextResponse.json(lastRetriablePayload ?? {}, {
      status: lastRetriableStatus,
    });
  }

  return NextResponse.json(
    { message: "Project listing service is unavailable" },
    { status: 502 },
  );
}
