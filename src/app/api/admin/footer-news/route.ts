import { forwardAdminFooterNewsRequest } from "@/app/api/admin/footer-news/_proxy";

const FOOTER_NEWS_ADMIN_ENDPOINT = "/api/admin/footer-news";

export async function GET(request: Request) {
  return forwardAdminFooterNewsRequest(request, FOOTER_NEWS_ADMIN_ENDPOINT, "GET");
}

export async function POST(request: Request) {
  return forwardAdminFooterNewsRequest(request, FOOTER_NEWS_ADMIN_ENDPOINT, "POST");
}
