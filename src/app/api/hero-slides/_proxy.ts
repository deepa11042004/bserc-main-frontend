import { NextResponse } from "next/server";

const DEV_FALLBACK_BACKEND_URLS = [
  "http://127.0.0.1:5001",
  "http://localhost:5001",
  "http://127.0.0.1:5000",
  "http://localhost:5000",
];

type HeroSlidesHttpMethod = "GET";

type HeroSlidesEndpoint = "/api/hero-slides" | `/api/hero-slides/${number}/media`;

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

function getBackendBaseUrls(): string[] {
  const envUrls = splitConfiguredApiUrls();
  const raw = isProductionRuntime()
    ? envUrls
    : envUrls.length > 0
      ? [...envUrls, ...DEV_FALLBACK_BACKEND_URLS]
      : DEV_FALLBACK_BACKEND_URLS;

  const normalized = raw.filter((value): value is string => Boolean(value));
  return [...new Set(normalized.map((value) => value.replace(/\/$/, "")))];
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return contentType.toLowerCase().includes("application/json");
}

function isHtmlMissingRouteResponse(contentType: string | null, status: number): boolean {
  if (status !== 404 || !contentType) {
    return false;
  }

  return contentType.toLowerCase().includes("text/html");
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

export async function forwardHeroSlidesPublicRequest(
  endpoint: HeroSlidesEndpoint,
  method: HeroSlidesHttpMethod,
): Promise<NextResponse> {
  const backendUrls = getBackendBaseUrls();

  if (!backendUrls.length) {
    return NextResponse.json(
      { message: "API_URL is not configured on the server." },
      { status: 500 },
    );
  }

  let lastRetriableResponse: NextResponse | null = null;

  for (const backendUrl of backendUrls) {
    try {
      const isMediaRequest = endpoint.includes("/media");
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method,
        ...(isMediaRequest
          ? { cache: "no-store" }
          : { next: { revalidate: 300 } }),
      });

      const contentType = response.headers.get("content-type");

      if (!isJsonContentType(contentType)) {
        const rawBody = await response.arrayBuffer();
        const bodyBytes = new Uint8Array(rawBody);

        const responseHeaders: Record<string, string> = {
          "Content-Type": contentType || "application/octet-stream",
          "Cache-Control": response.headers.get("cache-control") || "public, max-age=300, s-maxage=600",
        };

        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition) {
          responseHeaders["Content-Disposition"] = contentDisposition;
        }

        const shouldRetry =
          [500, 502, 503, 504].includes(response.status)
          || isHtmlMissingRouteResponse(contentType, response.status);

        if (shouldRetry) {
          lastRetriableResponse = new NextResponse(bodyBytes, {
            status: response.status,
            headers: responseHeaders,
          });
          continue;
        }

        return new NextResponse(bodyBytes, {
          status: response.status,
          headers: responseHeaders,
        });
      }

      const payload = await parseUpstreamBody(response);

      if ([500, 502, 503, 504].includes(response.status)) {
        lastRetriableResponse = new NextResponse(JSON.stringify(payload), {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
        continue;
      }

      return new NextResponse(JSON.stringify(payload), {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": response.status === 200 ? "public, max-age=300, s-maxage=600" : "no-store",
        },
      });
    } catch {
      continue;
    }
  }

  if (lastRetriableResponse) {
    return lastRetriableResponse;
  }

  return NextResponse.json(
    { message: "Hero slide service is unavailable." },
    { status: 502 },
  );
}
