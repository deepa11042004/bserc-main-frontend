import { forwardFeaturedWorkshopSectionRequest } from "@/app/api/featured-workshop-section/_proxy";

export const revalidate = 300;

export async function GET() {
  return forwardFeaturedWorkshopSectionRequest(
    "/api/featured-workshop-section",
    "GET",
  );
}
