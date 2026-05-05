import { forwardFooterNewsPublicRequest } from "@/app/api/footer-news/_proxy";

export async function GET() {
  return forwardFooterNewsPublicRequest("/api/footer-news", "GET");
}
