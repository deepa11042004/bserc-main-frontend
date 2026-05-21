import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DEV_FALLBACK_BACKEND_URLS = [
  "http://127.0.0.1:5001",
  "http://localhost:5001",
  "http://127.0.0.1:5000",
  "http://localhost:5000",
];

type AdminAnnouncementBannersHttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type AdminAnnouncementBannersEndpoint = `/api/admin/announcement-banners${string}`;

type ForwardPayload = {
  body?: BodyInit;
  headers?: Record<string, string>;
};

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function splitConfiguredApiUrls(): string[] {
  const configured = [
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.API_URL_FALLBACK,
  ]
    .map((value) => value?.trim() ?? "")
    .filter((value) => Boolean(value));

  return configured.flatMap((value) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => Boolean(entry)),
  );
}

function getBackendBaseUrls(options?: { preferLocal?: boolean }): string[] {
  const envUrls = splitConfiguredApiUrls();
  const preferLocal = Boolean(options?.preferLocal);
  const raw = isProductionRuntime()
    ? envUrls
    : envUrls.length > 0
      ? preferLocal
        ? [...DEV_FALLBACK_BACKEND_URLS, ...envUrls]
        : [...envUrls, ...DEV_FALLBACK_BACKEND_URLS]
      : DEV_FALLBACK_BACKEND_URLS;

  const normalized = raw.filter((value): value is string => Boolean(value));
  return [...new Set(normalized.map((value) => value.replace(/\/$/, "")))];
}

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

async function parseIncomingJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function buildForwardPayload(
  request: Request,
  method: AdminAnnouncementBannersHttpMethod,
): Promise<ForwardPayload | null> {
  if (method === "GET" || method === "DELETE") {
    return {};
  }

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

async function getAdminAuthorizationHeader(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("adminAuthToken")?.value?.trim();

  if (!token) {
    return null;
  }

  return `Bearer ${token}`;
}

export async function forwardAdminAnnouncementBannersRequest(
  request: Request,
  endpoint: AdminAnnouncementBannersEndpoint,
  method: AdminAnnouncementBannersHttpMethod,
): Promise<NextResponse> {
  let preferLocal = false;

  try {
    const requestUrl = new URL(request.url);
    preferLocal = (
      requestUrl.hostname === "localhost"
      || requestUrl.hostname === "127.0.0.1"
      || requestUrl.hostname === "::1"
    );
  } catch {
    preferLocal = false;
  }

  const backendUrls = getBackendBaseUrls({ preferLocal });

  if (!backendUrls.length) {
    return NextResponse.json(
      { message: "API_URL is not configured on the server." },
      { status: 500 },
    );
  }

  const authorization = await getAdminAuthorizationHeader();

  if (!authorization) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  const payload = await buildForwardPayload(request, method);

  if (payload === null) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  let lastRetriablePayload: unknown = null;
  let lastRetriableStatus: number | null = null;

  for (const backendUrl of backendUrls) {
    try {
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: authorization,
          ...(payload.headers || {}),
        },
        body: payload.body,
        cache: "no-store",
      });

      const responsePayload = await parseUpstreamBody(response);

      if ([500, 502, 503, 504].includes(response.status)) {
        lastRetriablePayload = responsePayload;
        lastRetriableStatus = response.status;
        continue;
      }

      return NextResponse.json(responsePayload, { status: response.status });
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
    { message: "Announcement banner admin service is unavailable." },
    { status: 502 },
  );
}
