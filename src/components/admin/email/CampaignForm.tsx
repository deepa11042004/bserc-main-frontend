"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, Send, Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { useEmailQuery } from "@/hooks/useEmailQuery";
import { emailApi } from "@/services/emailServer";
import type {
  CampaignApiInput,
  CampaignCreateResponse,
  CampaignDbInput,
  CampaignQueryInput,
  SenderIdentity,
  Template,
} from "@/types/emailServer";

type Source = "API" | "DB_TABLE" | "SQL_QUERY";

interface CampaignFormProps {
  onCreated: (result: CampaignCreateResponse, campaignName: string) => void;
  onError: (message: string) => void;
}

interface RecipientRow {
  email: string;
  firstName: string;
  lastName: string;
  data: string;
}

const inputCls =
  "w-full rounded-md border border-[#1F1F23] bg-[#0a0c16] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-500";

function emptyRow(): RecipientRow {
  return { email: "", firstName: "", lastName: "", data: "" };
}

export function CampaignForm({ onCreated, onError }: CampaignFormProps) {
  const { data: templates, loading: loadingTemplates } = useEmailQuery(
    () => emailApi.listTemplates({ status: "ACTIVE", limit: 200 })
  );
  const { data: senders, loading: loadingSenders } = useEmailQuery(
    () => emailApi.listSenders(true)
  );

  const [campaignName, setCampaignName] = useState("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [senderId, setSenderId] = useState<number | "">("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [globalVars, setGlobalVars] = useState<Array<{ key: string; value: string }>>([
    { key: "companyName", value: "BSERC" },
  ]);
  const [source, setSource] = useState<Source>("API");
  const [submitting, setSubmitting] = useState(false);
  const [csvSkipped, setCsvSkipped] = useState(0);

  // API recipients
  const [recipients, setRecipients] = useState<RecipientRow[]>([emptyRow()]);

  // DB table inputs
  const [tableName, setTableName] = useState("");
  const [emailColumn, setEmailColumn] = useState("email");
  const [firstNameColumn, setFirstNameColumn] = useState("");
  const [lastNameColumn, setLastNameColumn] = useState("");
  const [whereClause, setWhereClause] = useState("");
  const [limit, setLimit] = useState<number | "">(100);

  // SQL Query
  const [query, setQuery] = useState("");

  const selectedTemplate = useMemo(
    () => templates?.find((t) => t.id === templateId) ?? null,
    [templates, templateId]
  );

  // Auto-select default sender when senders load
  useEffect(() => {
    if (!senders?.length || senderId !== "") return;
    const defaultSender = senders.find((s) => s.is_default) ?? senders[0];
    if (defaultSender) {
      setSenderId(defaultSender.id);
      setFromEmail(defaultSender.email);
      setReplyTo(defaultSender.reply_to ?? "");
    }
  }, [senders, senderId]);

  function addRow() {
    setRecipients((r) => [...r, emptyRow()]);
  }
  function updateRow(idx: number, patch: Partial<RecipientRow>) {
    setRecipients((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function removeRow(idx: number) {
    setRecipients((r) => r.filter((_, i) => i !== idx));
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return;
      const header = lines[0]!.split(",").map((s) => s.trim().toLowerCase());
      const idx = (name: string) => header.indexOf(name);
      const emailIdx = idx("email");
      if (emailIdx === -1) {
        onError('CSV must include an "email" column header');
        return;
      }
      const fnIdx = idx("firstname") >= 0 ? idx("firstname") : idx("first_name");
      const lnIdx = idx("lastname") >= 0 ? idx("lastname") : idx("last_name");
      const rows: RecipientRow[] = [];
      let skipped = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i]!.split(",").map((s) => s.trim());
        const email = cols[emailIdx] ?? "";
        if (!email || !EMAIL_RE.test(email)) {
          if (email) skipped++;
          continue;
        }
        rows.push({
          email,
          firstName: fnIdx >= 0 ? (cols[fnIdx] ?? "") : "",
          lastName: lnIdx >= 0 ? (cols[lnIdx] ?? "") : "",
          data: "",
        });
      }
      if (rows.length) setRecipients(rows);
      setCsvSkipped(skipped);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function buildGlobalVars(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const { key, value } of globalVars) {
      const k = key.trim();
      if (!k) continue;
      out[k] = value;
    }
    return out;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (typeof templateId !== "number") {
      onError("Please choose a template");
      return;
    }
    setSubmitting(true);
    try {
      const base = {
        campaignName,
        templateId,
        fromEmail,
        replyTo: replyTo || null,
        globalVars: buildGlobalVars(),
      };
      let result: CampaignCreateResponse;
      if (source === "API") {
        const cleaned = recipients
          .map((r) => ({
            email: r.email.trim(),
            firstName: r.firstName.trim() || null,
            lastName: r.lastName.trim() || null,
            data: r.data.trim() ? safeParseJson(r.data) : undefined,
          }))
          .filter((r) => r.email && EMAIL_RE.test(r.email));
        if (!cleaned.length) {
          onError("Add at least one recipient");
          setSubmitting(false);
          return;
        }
        const payload: CampaignApiInput = { ...base, recipients: cleaned };
        result = await emailApi.sendApi(payload);
      } else if (source === "DB_TABLE") {
        const payload: CampaignDbInput = {
          ...base,
          tableName: tableName.trim(),
          emailColumn: emailColumn.trim(),
          firstNameColumn: firstNameColumn.trim() || undefined,
          lastNameColumn: lastNameColumn.trim() || undefined,
          whereClause: whereClause.trim() || undefined,
          limit: typeof limit === "number" ? limit : undefined,
        };
        result = await emailApi.sendFromDb(payload);
      } else {
        const payload: CampaignQueryInput = {
          ...base,
          query: query.trim(),
          limit: typeof limit === "number" ? limit : undefined,
        };
        result = await emailApi.sendFromQuery(payload);
      }
      onCreated(result, campaignName);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic info */}
      <Card className="bg-[#0F0F12] ring-[#1F1F23]">
        <CardHeader className="border-b border-[#1F1F23] pb-3">
          <CardTitle className="text-white">1. Basic info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 py-3 sm:grid-cols-2">
          <Field label="Campaign name" required>
            <input
              required
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="April Hiring Drive 2026"
              className={inputCls}
            />
          </Field>
          <Field label="Template" required>
            <select
              required
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : "")}
              className={inputCls}
              disabled={loadingTemplates}
            >
              <option value="">— Choose template —</option>
              {templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.template_name} (#{t.id})
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="mt-1 text-[11px] text-gray-500">
                Subject: <span className="text-gray-400">{selectedTemplate.subject}</span>
              </p>
            )}
          </Field>
        </CardContent>
      </Card>

      {/* Sender info */}
      <Card className="bg-[#0F0F12] ring-[#1F1F23]">
        <CardHeader className="border-b border-[#1F1F23] pb-3">
          <CardTitle className="text-white">2. Sender</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 py-3 sm:grid-cols-2">
          {senders && senders.length > 0 ? (
            <>
              <Field label="From address" required hint="Configured sender identities">
                <select
                  required
                  value={senderId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSenderId(id);
                    const s = senders.find((x) => x.id === id);
                    if (s) {
                      setFromEmail(s.email);
                      setReplyTo(s.reply_to ?? "");
                    }
                  }}
                  className={inputCls}
                  disabled={loadingSenders}
                >
                  <option value="">— Choose sender —</option>
                  {senders.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.display_name} &lt;{s.email}&gt;
                      {s.is_default ? " ★" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reply-To" hint="Pre-filled from sender; override if needed">
                <input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="support@bserc.org"
                  className={inputCls}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="From email" required hint="Must be SES-verified">
                <input
                  required
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="bulkemail@peltown.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Reply-to (optional)">
                <input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="support@bserc.org"
                  className={inputCls}
                />
              </Field>
              <p className="col-span-2 text-xs text-amber-400">
                No senders configured yet.{" "}
                <a href="/admin/email/senders" className="underline hover:text-amber-300">
                  Add one in Sender Identities
                </a>{" "}
                to use a dropdown here.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recipient source */}
      <Card className="bg-[#0F0F12] ring-[#1F1F23]">
        <CardHeader className="border-b border-[#1F1F23] pb-3">
          <CardTitle className="text-white">3. Recipients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 py-3">
          <div className="flex flex-wrap gap-2">
            {(["API", "DB_TABLE", "SQL_QUERY"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  source === s
                    ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30"
                    : "border border-[#1F1F23] text-gray-400 hover:bg-[#1F1F23]"
                }`}
              >
                {s === "API" ? "Manual list" : s === "DB_TABLE" ? "DB table" : "Custom query"}
              </button>
            ))}
          </div>

          {source === "API" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#1F1F23] bg-[#0a0c16] px-2.5 py-1 text-xs text-gray-300 hover:bg-[#1F1F23]">
                    <Upload className="h-3 w-3" /> Upload CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addRow}
                    className="border-[#1F1F23] text-gray-300"
                  >
                    <Plus className="h-3 w-3" /> Row
                  </Button>
                </div>
              </div>
              {csvSkipped > 0 && (
                <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-xs text-amber-300">
                  <span className="font-semibold">{csvSkipped} row{csvSkipped === 1 ? "" : "s"} skipped</span>
                  — invalid email format (plain text, missing @, etc.). These will not be sent to.
                </div>
              )}
              <div className="overflow-x-auto rounded-md border border-[#1F1F23]">
                <table className="w-full text-xs">
                  <thead className="bg-[#0a0c16] text-gray-400">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium">Email *</th>
                      <th className="px-2 py-2 text-left font-medium">First</th>
                      <th className="px-2 py-2 text-left font-medium">Last</th>
                      <th className="px-2 py-2 text-left font-medium">Data (JSON)</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r, i) => (
                      <tr key={i} className="border-t border-[#1F1F23]">
                        <td className="p-1">
                          <input
                            type="email"
                            value={r.email}
                            onChange={(e) => updateRow(i, { email: e.target.value })}
                            placeholder="user@example.com"
                            className={inputCls}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={r.firstName}
                            onChange={(e) => updateRow(i, { firstName: e.target.value })}
                            className={inputCls}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={r.lastName}
                            onChange={(e) => updateRow(i, { lastName: e.target.value })}
                            className={inputCls}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={r.data}
                            onChange={(e) => updateRow(i, { data: e.target.value })}
                            placeholder='{"candidateId":"CAND-1001"}'
                            className={`${inputCls} font-mono`}
                          />
                        </td>
                        <td className="p-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(i)}
                            className="rounded p-1 text-gray-500 hover:bg-rose-500/10 hover:text-rose-300"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-gray-500">
                CSV format: header row with <code>email</code> (required) and optional{" "}
                <code>firstName</code>, <code>lastName</code>.
              </p>
            </div>
          )}

          {source === "DB_TABLE" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Table name" required hint="Must be in ALLOWED_RECIPIENT_TABLES">
                <input
                  required={source === "DB_TABLE"}
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="users"
                  className={inputCls}
                />
              </Field>
              <Field label="Email column" required>
                <input
                  required={source === "DB_TABLE"}
                  value={emailColumn}
                  onChange={(e) => setEmailColumn(e.target.value)}
                  placeholder="email"
                  className={inputCls}
                />
              </Field>
              <Field label="First-name column">
                <input
                  value={firstNameColumn}
                  onChange={(e) => setFirstNameColumn(e.target.value)}
                  placeholder="first_name"
                  className={inputCls}
                />
              </Field>
              <Field label="Last-name column">
                <input
                  value={lastNameColumn}
                  onChange={(e) => setLastNameColumn(e.target.value)}
                  placeholder="last_name"
                  className={inputCls}
                />
              </Field>
              <Field label="WHERE clause (optional)">
                <input
                  value={whereClause}
                  onChange={(e) => setWhereClause(e.target.value)}
                  placeholder="status = 'ACTIVE'"
                  className={inputCls}
                />
              </Field>
              <Field label="Limit">
                <input
                  type="number"
                  min={1}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : "")}
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          {source === "SQL_QUERY" && (
            <div className="space-y-2">
              <Field
                label="SELECT query"
                required
                hint="ALLOW_RAW_QUERY must be true. SELECT only — no semicolons, no DDL."
              >
                <textarea
                  required={source === "SQL_QUERY"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={5}
                  placeholder={`SELECT email,
       SUBSTRING_INDEX(full_name, ' ', 1) AS firstName,
       SUBSTRING_INDEX(full_name, ' ', -1) AS lastName
  FROM users WHERE active = 1`}
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Limit">
                <input
                  type="number"
                  min={1}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : "")}
                  className={inputCls}
                />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global vars */}
      <Card className="bg-[#0F0F12] ring-[#1F1F23]">
        <CardHeader className="border-b border-[#1F1F23] pb-3">
          <CardTitle className="text-white">4. Global variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 py-3">
          <p className="text-xs text-gray-400">
            Available to every recipient as <code>{"{{key}}"}</code> in the template.
          </p>
          {globalVars.map((kv, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={kv.key}
                onChange={(e) =>
                  setGlobalVars((g) => g.map((row, idx) => (idx === i ? { ...row, key: e.target.value } : row)))
                }
                placeholder="key"
                className={`${inputCls} max-w-[200px] font-mono`}
              />
              <input
                value={kv.value}
                onChange={(e) =>
                  setGlobalVars((g) => g.map((row, idx) => (idx === i ? { ...row, value: e.target.value } : row)))
                }
                placeholder="value"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setGlobalVars((g) => g.filter((_, idx) => idx !== i))}
                className="rounded p-1 text-gray-500 hover:bg-rose-500/10 hover:text-rose-300"
                aria-label="Remove variable"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setGlobalVars((g) => [...g, { key: "", value: "" }])}
            className="border-[#1F1F23] text-gray-300"
          >
            <Plus className="h-3 w-3" /> Variable
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <Button
          type="submit"
          disabled={submitting}
          size="lg"
          className="bg-sky-500 text-white hover:bg-sky-400"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Create & queue campaign
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
          {required && <span className="text-rose-400"> *</span>}
        </span>
        {hint && <span className="text-[10px] text-gray-500">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function safeParseJson(text: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}
