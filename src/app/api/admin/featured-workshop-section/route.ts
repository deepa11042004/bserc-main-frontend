import { forwardAdminFeaturedWorkshopSectionRequest } from "@/app/api/admin/featured-workshop-section/_proxy";

const FEATURED_WORKSHOP_SECTION_ENDPOINT = "/api/admin/featured-workshop-section";

export async function GET(request: Request) {
  return forwardAdminFeaturedWorkshopSectionRequest(
    request,
    FEATURED_WORKSHOP_SECTION_ENDPOINT,
    "GET",
  );
}

export async function PUT(request: Request) {
  return forwardAdminFeaturedWorkshopSectionRequest(
    request,
    FEATURED_WORKSHOP_SECTION_ENDPOINT,
    "PUT",
  );
}
