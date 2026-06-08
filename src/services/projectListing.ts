import { ApiError } from "@/services/api";

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export interface ProjectListingSubmitResponse {
  message: string;
  data?: { id: number };
}

export async function submitProjectListing(
  formData: FormData,
): Promise<ProjectListingSubmitResponse> {
  const response = await fetch("/api/project-listing", {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, body);
  }

  return body as ProjectListingSubmitResponse;
}
