import { forwardAdminAnnouncementBannersRequest } from "@/app/api/admin/announcement-banners/_proxy";

const ANNOUNCEMENT_BANNERS_ADMIN_ENDPOINT = "/api/admin/announcement-banners";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  return forwardAdminAnnouncementBannersRequest(
    request,
    `${ANNOUNCEMENT_BANNERS_ADMIN_ENDPOINT}${search}`,
    "GET",
  );
}

export async function POST(request: Request) {
  return forwardAdminAnnouncementBannersRequest(
    request,
    ANNOUNCEMENT_BANNERS_ADMIN_ENDPOINT,
    "POST",
  );
}
