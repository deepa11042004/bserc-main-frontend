import { NextResponse } from "next/server";

import { forwardFeaturedWorkshopSectionRequest } from "@/app/api/featured-workshop-section/_proxy";

function parseCardId(rawId: string): number | null {
  const parsed = Number.parseInt(rawId, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const cardId = parseCardId(id);

  if (!cardId) {
    return NextResponse.json({ message: "Invalid featured workshop card id" }, { status: 400 });
  }

  return forwardFeaturedWorkshopSectionRequest(
    `/api/featured-workshop-cards/${cardId}/image`,
    "GET",
  );
}
