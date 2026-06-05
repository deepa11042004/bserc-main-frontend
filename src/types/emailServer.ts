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

// ---------- Certificates ----------

export type CertTemplateStatus = "ACTIVE" | "DISABLED";
export type FontWeight = "NORMAL" | "BOLD";
export type TextAlign = "LEFT" | "CENTER" | "RIGHT";

export interface CertTemplate {
  id: number;
  name: string;
  description: string | null;
  image_s3_key: string;
  image_url: string;
  image_content_type: string;
  image_width: number;
  image_height: number;
  image_size_bytes: number;
  status: CertTemplateStatus;
  created_at: string;
  updated_at: string;
  placeholders?: CertPlaceholder[];
}

export interface CertPlaceholder {
  id: number;
  template_id: number;
  placeholder_key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font_family: string;
  font_size_pt: number;
  font_color_hex: string;
  font_weight: FontWeight;
  text_align: TextAlign;
  is_qr: 0 | 1;
  is_serial: 0 | 1;
  max_length: number;
  sort_order: number;
}

export interface PlaceholderInput {
  placeholderKey: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSizePt?: number;
  fontColorHex?: string;
  fontWeight?: FontWeight;
  textAlign?: TextAlign;
  isQr?: boolean;
  isSerial?: boolean;
  maxLength?: number;
  sortOrder?: number;
}

export type CertBatchStatus =
  | "DRAFT"
  | "READY"
  | "RENDERING"
  | "RENDERED"
  | "FAILED"
  | "DISTRIBUTING"
  | "COMPLETED"
  | "CANCELLED";

export interface SerialConfig {
  prefix?: string;
  suffix?: string;
  paddingWidth?: number;
  startAt?: number;
}

export interface CertBatch {
  id: number;
  name: string;
  template_id: number;
  status: CertBatchStatus;
  source_filename: string;
  source_content_type: string;
  source_s3_key: string;
  source_url: string;
  source_size_bytes: number;
  detected_columns_json: string[] | null;
  sample_rows_json: Record<string, string>[] | null;
  column_mapping_json: Record<string, string> | null;
  serial_config_json: SerialConfig | null;
  email_column: string | null;
  name_column: string | null;
  total_rows: number;
  rendered_count: number;
  failed_count: number;
  sent_count: number;
  email_campaign_id: number | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface CertRecipient {
  id: number;
  row_index: number;
  serial_no: string;
  verification_code: string;
  email: string | null;
  full_name: string | null;
  status:
    | "PENDING"
    | "RENDERING"
    | "RENDERED"
    | "FAILED"
    | "SENT"
    | "DOWNLOADED";
  cert_s3_key: string | null;
  cert_url: string;
  error_reason: string | null;
  retry_count: number;
  rendered_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  downloaded_at: string | null;
  download_count: number;
}

export interface CertColumnsResponse {
  columns: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

export interface CertPreviewResponse {
  url: string;
  s3Key: string;
}

export interface CertDistributeInput {
  emailTemplateId: number;
  fromEmail: string;
  replyTo?: string | null;
  campaignName?: string;
}

export interface CertDistributeResponse {
  batchId: number;
  campaignId: number;
  queuedRecipients: number;
}
