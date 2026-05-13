import { forwardHeroSlidesPublicRequest } from "@/app/api/hero-slides/_proxy";

export const revalidate = 300;

export async function GET() {
  return forwardHeroSlidesPublicRequest("/api/hero-slides", "GET");
}
