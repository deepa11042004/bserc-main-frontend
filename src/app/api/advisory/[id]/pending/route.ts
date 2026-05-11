import { NextResponse } from "next/server";

import { forwardAdvisoryRequest } from "@/app/api/advisory/_proxy";

function parseAdvisoryId(rawId: string): number | null {
  const parsed = Number.parseInt(rawId, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const advisoryId = parseAdvisoryId(id);

  if (!advisoryId) {
    return NextResponse.json({ message: "Invalid advisory id" }, { status: 400 });
  }

  return forwardAdvisoryRequest(
    request,
    `/api/advisory/${advisoryId}/pending`,
    "PATCH",
  );
}
