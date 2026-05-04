// Client for the BSERC Email Notification backend, called via the Next.js
// `/api/email/...` proxy. Token is read from localStorage (`emailServerToken`).

import type {
  Campaign,
  CampaignApiInput,
  CampaignCreateResponse,
  CampaignDbInput,
  CampaignQueryInput,
  CampaignRecipient,
  CampaignStats,
  DashboardSummary,
  EmailLoginResponse,
  FailedEmailsResponse,
  QueueHealth,
  RecipientStatus,
  SuppressionEntry,
  Template,
  TemplateInput,
  TemplatePreview,
} from "@/types/emailServer";

export const EMAIL_TOKEN_KEY = "emailServerToken";
export const EMAIL_USER_KEY = "emailServerUser";

export class EmailApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "EmailApiError";
    this.status = status;
    this.details = details;
  }
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(EMAIL_TOKEN_KEY);
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const token = auth ? readToken() : null;

  const res = await fetch(`/api/email${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  const text = await res.text();
  let payload: unknown = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!res.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new EmailApiError(message, res.status, payload);
  }
  return payload as T;
}

export const emailApi = {
  // --- auth ---
  login(email: string, password: string) {
    return request<EmailLoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    });
  },

  // --- templates ---
  listTemplates(params: { status?: string; limit?: number; offset?: number } = {}) {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.limit !== undefined) q.set("limit", String(params.limit));
    if (params.offset !== undefined) q.set("offset", String(params.offset));
    const qs = q.toString();
    return request<Template[]>(`/templates${qs ? `?${qs}` : ""}`);
  },
  getTemplate(id: number) {
    return request<Template>(`/templates/${id}`);
  },
  createTemplate(input: TemplateInput) {
    return request<Template>("/templates", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateTemplate(id: number, input: Partial<TemplateInput>) {
    return request<Template>(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },
  deleteTemplate(id: number) {
    return request<void>(`/templates/${id}`, { method: "DELETE" });
  },
  previewTemplate(id: number, vars: Record<string, unknown>) {
    return request<TemplatePreview>(`/templates/${id}/preview`, {
      method: "POST",
      body: JSON.stringify({ vars }),
    });
  },

  // --- campaigns ---
  listCampaigns(params: { status?: string; limit?: number; offset?: number } = {}) {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.limit !== undefined) q.set("limit", String(params.limit));
    if (params.offset !== undefined) q.set("offset", String(params.offset));
    const qs = q.toString();
    return request<Campaign[]>(`/campaigns${qs ? `?${qs}` : ""}`);
  },
  getCampaign(id: number) {
    return request<Campaign>(`/campaigns/${id}`);
  },
  getCampaignStats(id: number) {
    return request<CampaignStats>(`/campaigns/${id}/stats`);
  },
  listRecipients(
    id: number,
    params: { status?: RecipientStatus; limit?: number; offset?: number } = {}
  ) {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.limit !== undefined) q.set("limit", String(params.limit));
    if (params.offset !== undefined) q.set("offset", String(params.offset));
    const qs = q.toString();
    return request<CampaignRecipient[]>(`/campaigns/${id}/recipients${qs ? `?${qs}` : ""}`);
  },
  sendApi(input: CampaignApiInput) {
    return request<CampaignCreateResponse>("/campaigns/send", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  sendFromDb(input: CampaignDbInput) {
    return request<CampaignCreateResponse>("/campaigns/send-from-db", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  sendFromQuery(input: CampaignQueryInput) {
    return request<CampaignCreateResponse>("/campaigns/send-from-query", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  pause(id: number) {
    return request<Campaign>(`/campaigns/${id}/pause`, { method: "POST" });
  },
  resume(id: number) {
    return request<Campaign>(`/campaigns/${id}/resume`, { method: "POST" });
  },
  cancel(id: number) {
    return request<Campaign>(`/campaigns/${id}/cancel`, { method: "POST" });
  },
  testSend(input: {
    templateId: number;
    fromEmail: string;
    toEmail: string;
    vars?: Record<string, unknown>;
  }) {
    return request<{ messageId: string; subject: string }>("/campaigns/test-send", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // --- suppression ---
  listSuppression(params: { limit?: number; offset?: number } = {}) {
    const q = new URLSearchParams();
    if (params.limit !== undefined) q.set("limit", String(params.limit));
    if (params.offset !== undefined) q.set("offset", String(params.offset));
    const qs = q.toString();
    return request<SuppressionEntry[]>(`/suppression${qs ? `?${qs}` : ""}`);
  },
  addSuppression(payload: { email: string; reason?: string; notes?: string }) {
    return request<SuppressionEntry>("/suppression", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  removeSuppression(email: string) {
    return request<void>(`/suppression/${encodeURIComponent(email)}`, {
      method: "DELETE",
    });
  },

  // --- admin / ops ---
  dashboardSummary() {
    return request<DashboardSummary>("/admin/dashboard-summary");
  },
  queueHealth() {
    return request<QueueHealth>("/admin/queue-health");
  },
  failedEmails(params: { limit?: number; offset?: number } = {}) {
    const q = new URLSearchParams();
    if (params.limit !== undefined) q.set("limit", String(params.limit));
    if (params.offset !== undefined) q.set("offset", String(params.offset));
    const qs = q.toString();
    return request<FailedEmailsResponse>(`/admin/failed-emails${qs ? `?${qs}` : ""}`);
  },
  retryRecipient(recipientId: number) {
    return request<{ recipientId: number; status: string }>(
      `/admin/retry/${recipientId}`,
      { method: "POST" }
    );
  },
  retryFailedForCampaign(campaignId: number) {
    return request<{ campaignId: number; retried: number }>(
      `/admin/retry-failed/${campaignId}`,
      { method: "POST" }
    );
  },
};
