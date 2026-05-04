// Server-side proxy that forwards requests from the Next.js admin UI to the
// standalone BSERC Email Notification backend (Node.js + AWS SES + SQS).
// This avoids exposing the email backend URL/credentials to the browser and
// keeps a same-origin call path for the admin UI.
//
// The browser MUST send `Authorization: Bearer <emailServerToken>` itself —
// we forward it through unchanged because the email server signs its own JWTs
// (separate from the BSERC main app auth).

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_API_BASE = (process.env.EMAIL_API_URL || "http://localhost:4000").replace(
  /\/$/,
  ""
);

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const segments = Array.isArray(path) ? path.join("/") : "";
  const url = new URL(req.url);
  const target = `${EMAIL_API_BASE}/api/${segments}${url.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Email backend unreachable",
        message: error instanceof Error ? error.message : String(error),
        target,
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    responseHeaders.set(key, value);
  });
  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
