import { forwardAnnouncementBannersPublicRequest } from "@/app/api/announcement-banners/_proxy";

export const revalidate = 120;

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  return forwardAnnouncementBannersPublicRequest(
    `/api/announcement-banners${search}`,
    "GET",
  );
}
