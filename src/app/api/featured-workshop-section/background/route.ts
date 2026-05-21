import { forwardFeaturedWorkshopSectionRequest } from "@/app/api/featured-workshop-section/_proxy";

export async function GET() {
  return forwardFeaturedWorkshopSectionRequest(
    "/api/featured-workshop-section/background",
    "GET",
  );
}
