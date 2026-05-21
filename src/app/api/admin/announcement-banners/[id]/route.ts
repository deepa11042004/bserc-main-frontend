import { NextResponse } from "next/server";

import { forwardAdminAnnouncementBannersRequest } from "@/app/api/admin/announcement-banners/_proxy";

function parseAnnouncementBannerId(rawId: string): number | null {
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
  const bannerId = parseAnnouncementBannerId(id);

  if (!bannerId) {
    return NextResponse.json({ message: "Invalid announcement banner id" }, { status: 400 });
  }

  return forwardAdminAnnouncementBannersRequest(
    request,
    `/api/admin/announcement-banners/${bannerId}`,
    "DELETE",
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const bannerId = parseAnnouncementBannerId(id);

  if (!bannerId) {
    return NextResponse.json({ message: "Invalid announcement banner id" }, { status: 400 });
  }

  return forwardAdminAnnouncementBannersRequest(
    request,
    `/api/admin/announcement-banners/${bannerId}`,
    "PUT",
  );
}
