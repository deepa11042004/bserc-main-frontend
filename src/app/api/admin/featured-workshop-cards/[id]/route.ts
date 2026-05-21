import { NextResponse } from "next/server";

import { forwardAdminFeaturedWorkshopCardsRequest } from "@/app/api/admin/featured-workshop-cards/_proxy";

function parseCardId(rawId: string): number | null {
  const parsed = Number.parseInt(rawId, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const cardId = parseCardId(id);

  if (!cardId) {
    return NextResponse.json({ message: "Invalid featured workshop card id" }, { status: 400 });
  }

  return forwardAdminFeaturedWorkshopCardsRequest(
    request,
    `/api/admin/featured-workshop-cards/${cardId}`,
    "DELETE",
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const cardId = parseCardId(id);

  if (!cardId) {
    return NextResponse.json({ message: "Invalid featured workshop card id" }, { status: 400 });
  }

  return forwardAdminFeaturedWorkshopCardsRequest(
    request,
    `/api/admin/featured-workshop-cards/${cardId}`,
    "PUT",
  );
}
