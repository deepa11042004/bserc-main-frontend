import { NextResponse } from "next/server";

import { forwardAdminFooterNewsRequest } from "@/app/api/admin/footer-news/_proxy";

function parseFooterNewsId(rawId: string): number | null {
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
  const itemId = parseFooterNewsId(id);

  if (!itemId) {
    return NextResponse.json({ message: "Invalid footer news id" }, { status: 400 });
  }

  return forwardAdminFooterNewsRequest(
    request,
    `/api/admin/footer-news/${itemId}`,
    "DELETE",
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const itemId = parseFooterNewsId(id);

  if (!itemId) {
    return NextResponse.json({ message: "Invalid footer news id" }, { status: 400 });
  }

  return forwardAdminFooterNewsRequest(
    request,
    `/api/admin/footer-news/${itemId}`,
    "PUT",
  );
}
