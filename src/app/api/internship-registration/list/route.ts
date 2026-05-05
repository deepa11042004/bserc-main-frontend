import { forwardInternshipRegistrationRequest } from "@/app/api/internship-registration/_proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const endpoint = `/api/internship/registration/list${qs ? `?${qs}` : ""}` as `/api/internship/registration${string}`;
  return forwardInternshipRegistrationRequest(request, endpoint, "GET");
}
