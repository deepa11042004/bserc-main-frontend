import { forwardProjectListingRequest } from "@/app/api/project-listing/_proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return forwardProjectListingRequest(
    request, 
    `/api/project-listing/${resolvedParams.id}/document-url`, 
    "GET"
  );
}
