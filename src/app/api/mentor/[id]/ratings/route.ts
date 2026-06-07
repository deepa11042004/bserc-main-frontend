import { NextResponse } from "next/server";
import { forwardMentorRequest } from "@/app/api/mentor/_proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardMentorRequest(request, `/api/mentor/${id}/ratings`, "GET");
}
