import { forwardFooterNewsPublicRequest } from "@/app/api/footer-news/_proxy";

export const revalidate = 300;

export async function GET() {
  return forwardFooterNewsPublicRequest("/api/footer-news", "GET");
}
