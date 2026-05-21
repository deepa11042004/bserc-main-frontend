import { forwardAdminFeaturedWorkshopCardsRequest } from "@/app/api/admin/featured-workshop-cards/_proxy";

const FEATURED_WORKSHOP_CARDS_ENDPOINT = "/api/admin/featured-workshop-cards";

export async function POST(request: Request) {
  return forwardAdminFeaturedWorkshopCardsRequest(
    request,
    FEATURED_WORKSHOP_CARDS_ENDPOINT,
    "POST",
  );
}
