// Types for the BSERC Email Notification backend (separate service from main BSERC API).

export type Role = "ADMIN" | "OPERATOR" | "VIEWER";

export interface EmailUser {
  id: number;
  email: string;
  name: string | null;
  role: Role;
}

export interface EmailLoginResponse {
  token: string;
  user: EmailUser;
}

export type TemplateStatus = "ACTIVE" | "DISABLED";

export interface Template {
  id: number;
  template_code: string;
  template_name: string;
  subject: string;
  html_body: string;
  text_body: string | null;
  status: TemplateStatus;
  created_at: string;
  updated_at: string;
}

export interface TemplateInput {
  templateCode: string;
  templateName: string;
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  status?: TemplateStatus;
}

export interface TemplatePreview {
  subject: string;
  htmlBody: string;
  textBody: string | null;
  missingPlaceholders: string[];
}

export type CampaignStatus =
  | "DRAFT"
  | "QUEUED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface Campaign {
  id: number;
  campaign_name: string;
  template_id: number;
  from_email?: string;
  reply_to?: string | null;
  source_type?: "API" | "DB_TABLE" | "SQL_QUERY";
  status: CampaignStatus;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  bounced_count: number;
  complaint_count: number;
  delivered_count: number;
  suppressed_count: number;
  queued_count?: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface CampaignStats {
  id: number;
  name: string;
  status: CampaignStatus;
  counters: {
    total: number;
    queued: number;
    sent: number;
    failed: number;
    bounced: number;
    complaints: number;
    delivered: number;
    suppressed: number;
  };
  recipientStatusBreakdown: Record<string, number>;
  startedAt: string | null;
  completedAt: string | null;
}

export type RecipientStatus =
  | "PENDING"
  | "QUEUED"
  | "SENT"
  | "FAILED"
  | "BOUNCED"
  | "COMPLAINT"
  | "SUPPRESSED"
  | "DELIVERED";

export interface CampaignRecipient {
  id: number;
  campaign_id?: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: RecipientStatus;
  ses_message_id: string | null;
  error_reason: string | null;
  retry_count: number;
  queued_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
}

export interface CampaignBaseInput {
  campaignName: string;
  templateId: number;
  fromEmail: string;
  replyTo?: string | null;
  globalVars?: Record<string, unknown>;
}

export interface CampaignApiInput extends CampaignBaseInput {
  recipients: Array<{
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    data?: Record<string, unknown>;
  }>;
}

export interface CampaignDbInput extends CampaignBaseInput {
  tableName: string;
  emailColumn: string;
  firstNameColumn?: string;
  lastNameColumn?: string;
  whereClause?: string;
  limit?: number;
}

export interface CampaignQueryInput extends CampaignBaseInput {
  query: string;
  limit?: number;
}

export interface CampaignCreateResponse {
  campaignId: number;
  stats: {
    total: number;
    inserted: number;
    invalid: number;
    duplicates: number;
    suppressed: number;
  };
}

export interface SuppressionEntry {
  email: string;
  reason: "BOUNCE" | "COMPLAINT" | "MANUAL" | "UNSUBSCRIBE";
  notes: string | null;
  created_at: string;
}

export interface DashboardSummary {
  campaigns: { total: number; active: number; completed: number; failed: number };
  today: { sent: number; failed: number; bounced: number };
  recent: Campaign[];
  active: Campaign[];
}

export interface QueueHealth {
  timestamp: string;
  status: "healthy" | "warning" | "critical";
  queue?: {
    name?: string;
    url?: string;
    visible?: number;
    inFlight?: number;
    delayed?: number;
    status?: string;
    message?: string;
  };
  dlq?: {
    name?: string;
    url?: string;
    messages?: number;
    status?: string;
    message?: string;
  };
  worker: {
    concurrency: number;
    batchSize: number;
    visibilityTimeoutSec: number;
    sesMaxSendRatePerSec: number;
  };
  db: {
    pendingRecipients: number;
    failedRecipients: number;
    activeCampaigns: number;
  };
}

export interface FailedEmailsResponse {
  items: Array<CampaignRecipient & { campaign_name: string }>;
  total: number;
}

export interface SenderIdentity {
  id: number;
  display_name: string;
  email: string;
  reply_to: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SenderInput {
  displayName: string;
  email: string;
  replyTo?: string | null;
  isDefault?: boolean;
}

export interface TemplateAttachment {
  id: number;
  template_id: number;
  filename: string;
  s3_key: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  download_url: string;
}
