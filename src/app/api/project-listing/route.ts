import { NextResponse } from "next/server";

const DEV_FALLBACK_BACKEND_URLS = [
  "http://127.0.0.1:5000",
  "http://localhost:5000",
];

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function getConfiguredApiUrl(): string {
  const apiUrl = process.env.API_URL?.trim();
  if (apiUrl) return apiUrl;

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (publicApiUrl) return publicApiUrl;

  return "";
}

function isLoopbackUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return isLocalHostname(parsed.hostname);
  } catch {
    return false;
  }
}

function getBackendBaseUrls(options?: { preferLocal?: boolean }): string[] {
  const envUrl = getConfiguredApiUrl();
  const preferLocal = Boolean(options?.preferLocal);
  const shouldIncludeDevFallback = !isProductionRuntime() || preferLocal;

  const raw = shouldIncludeDevFallback
    ? isLoopbackUrl(envUrl)
      ? [envUrl, ...DEV_FALLBACK_BACKEND_URLS]
      : [envUrl, ...DEV_FALLBACK_BACKEND_URLS]
    : [envUrl];

  const normalized = raw.filter((value): value is string => Boolean(value));
  return [...new Set(normalized.map((value) => value.replace(/\/$/, "")))];
}

async function parseUpstreamBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function extractPayloadMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as { message?: unknown; error?: unknown };
  if (typeof record.message === "string") return record.message.trim();
  if (typeof record.error === "string") return record.error.trim();
  return "";
}

function isMissingUpstreamRouteResponse(
  status: number,
  payload: unknown,
  method: string,
): boolean {
  if (status !== 404 && status !== 405) return false;
  const message = extractPayloadMessage(payload).toLowerCase();
  if (!message) return false;
  return message.includes(`cannot ${method.toLowerCase()} `);
}

export async function POST(request: Request) {
  let preferLocal = false;
  try {
    const requestUrl = new URL(request.url);
    preferLocal = isLocalHostname(requestUrl.hostname);
  } catch {
    preferLocal = false;
  }

  const backendUrls = getBackendBaseUrls({ preferLocal });

  if (backendUrls.length === 0) {
    return NextResponse.json(
      { message: "API_URL is missing on the server." },
      { status: 500 },
    );
  }

  // Forward the multipart/form-data as-is
  const contentType = request.headers.get("content-type") || "";
  let body: BodyInit;

  if (contentType.includes("multipart/form-data")) {
    body = await request.formData();
  } else {
    body = await request.arrayBuffer();
  }

  let lastRetriablePayload: unknown = null;
  let lastRetriableStatus: number | null = null;

  for (const backendUrl of backendUrls) {
    try {
      const fetchOptions: RequestInit = {
        method: "POST",
        body,
        cache: "no-store",
      };

      // Only set Content-Type for non-FormData bodies
      // (FormData boundary is set automatically by fetch)
      if (!contentType.includes("multipart/form-data")) {
        fetchOptions.headers = {
          "Content-Type": contentType || "application/octet-stream",
        };
      }

      const upstreamResponse = await fetch(
        `${backendUrl}/api/project-listing/submit`,
        fetchOptions,
      );

      const responsePayload = await parseUpstreamBody(upstreamResponse);

      if (
        isMissingUpstreamRouteResponse(
          upstreamResponse.status,
          responsePayload,
          "POST",
        )
      ) {
        lastRetriablePayload = responsePayload;
        lastRetriableStatus = upstreamResponse.status;
        continue;
      }

      if ([500, 502, 503, 504].includes(upstreamResponse.status)) {
        lastRetriablePayload = responsePayload;
        lastRetriableStatus = upstreamResponse.status;
        continue;
      }

      return NextResponse.json(responsePayload, {
        status: upstreamResponse.status,
      });
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
