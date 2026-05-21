import { NextResponse } from "next/server";

const DEV_FALLBACK_BACKEND_URLS = [
  "http://127.0.0.1:5001",
  "http://localhost:5001",
  "http://127.0.0.1:5000",
  "http://localhost:5000",
];

type FeaturedWorkshopSectionHttpMethod = "GET";
type FeaturedWorkshopSectionEndpoint =
  | "/api/featured-workshop-section"
  | "/api/featured-workshop-section/background"
  | `/api/featured-workshop-cards/${number}/image`;

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

function isJsonResponse(contentType: string | null): boolean {
  return Boolean(contentType && contentType.toLowerCase().includes("application/json"));
}

export async function forwardFeaturedWorkshopSectionRequest(
  endpoint: FeaturedWorkshopSectionEndpoint,
  method: FeaturedWorkshopSectionHttpMethod,
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
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method,
        next: { revalidate: 300 },
      });

      const contentType = response.headers.get("content-type");

      if (!isJsonResponse(contentType)) {
        const rawBody = await response.arrayBuffer();
        const bodyBytes = new Uint8Array(rawBody);

        if ([500, 502, 503, 504].includes(response.status)) {
          lastRetriableResponse = new NextResponse(bodyBytes, {
            status: response.status,
            headers: {
              "Content-Type": contentType || "text/plain; charset=utf-8",
            },
          });
          continue;
        }

        return new NextResponse(bodyBytes, {
          status: response.status,
          headers: {
            "Content-Type": contentType || "text/plain; charset=utf-8",
          },
        });
      }

      const payload = await parseUpstreamBody(response);

      if ([500, 502, 503, 504].includes(response.status)) {
        lastRetriableResponse = NextResponse.json(payload, { status: response.status });
        continue;
      }

      return NextResponse.json(payload, {
        status: response.status,
        headers: {
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
    { message: "Featured workshop section service is unavailable." },
    { status: 502 },
  );
}
