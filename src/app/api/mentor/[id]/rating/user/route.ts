import { NextResponse } from "next/server";
import { forwardMentorRequest } from "@/app/api/mentor/_proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  const endpoint = email
    ? `/api/mentor/${id}/rating/user?email=${encodeURIComponent(email)}`
    : `/api/mentor/${id}/rating/user`;

  return forwardMentorRequest(request, endpoint as any, "GET");
}
