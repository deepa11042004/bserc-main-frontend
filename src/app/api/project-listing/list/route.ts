import { forwardProjectListingRequest } from "@/app/api/project-listing/_proxy";

export async function GET(request: Request) {
  // We extract search params from the request URL to append them to the backend endpoint
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const query = searchParams ? `?${searchParams}` : "";

  return forwardProjectListingRequest(
    request, 
    `/api/project-listing/list${query}` as `/api/project-listing/${string}`, 
    "GET"
  );
}
