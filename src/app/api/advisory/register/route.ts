import { forwardAdvisoryRequest } from "@/app/api/advisory/_proxy";

export async function POST(request: Request) {
  return forwardAdvisoryRequest(request, "/api/advisory/register", "POST");
}
