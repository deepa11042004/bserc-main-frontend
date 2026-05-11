import { forwardAdvisoryRequest } from "@/app/api/advisory/_proxy";

export async function GET(request: Request) {
  return forwardAdvisoryRequest(request, "/api/advisory/list", "GET");
}
