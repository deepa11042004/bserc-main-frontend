"use client";

import { useState, type FormEvent } from "react";
import { Eye, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { emailApi } from "@/services/emailServer";
import type { Template, TemplateInput } from "@/types/emailServer";
import { EmailPreviewModal } from "./EmailPreviewModal";

interface TemplateFormProps {
  initial?: Template;
  onSaved?: (t: Template) => void;
  onError?: (message: string) => void;
}

const PLACEHOLDERS = [
  "{{first_name}}",
  "{{last_name}}",
  "{{full_name}}",
  "{{email}}",
  "{{firstName}}",
  "{{lastName}}",
  "{{companyName}}",
  "{{today_date}}",
  "{{current_year}}",
];

export function TemplateForm({ initial, onSaved, onError }: TemplateFormProps) {
  const [form, setForm] = useState<TemplateInput>({
    templateCode: initial?.template_code ?? "",
    templateName: initial?.template_name ?? "",
    subject: initial?.subject ?? "",
    htmlBody: initial?.html_body ?? "",
    textBody: initial?.text_body ?? "",
    status: initial?.status ?? "ACTIVE",
  });
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; html: string; text: string | null; missing: string[] } | null>(null);

  function update<K extends keyof TemplateInput>(key: K, value: TemplateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function insertPlaceholder(token: string) {
    const ta = document.getElementById("template-html-body") as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart ?? form.htmlBody.length;
    const end = ta.selectionEnd ?? form.htmlBody.length;
    const next = form.htmlBody.slice(0, start) + token + form.htmlBody.slice(end);
    update("htmlBody", next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + token.length;
    });
  }

  async function handlePreview() {
    if (!initial) {
      // Render locally with empty vars (best-effort) when no id yet
      const html = form.htmlBody;
      const subj = form.subject;
      setPreview({ subject: subj, html, text: form.textBody ?? null, missing: [] });
      return;
    }
    try {
      const p = await emailApi.previewTemplate(initial.id, {});
      setPreview({ subject: p.subject, html: p.htmlBody, text: p.textBody, missing: p.missingPlaceholders });
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Preview failed");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = initial
        ? await emailApi.updateTemplate(initial.id, form)
        : await emailApi.createTemplate(form);
      onSaved?.(result);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card className="bg-[#0F0F12] ring-[#1F1F23]">
            <CardHeader className="border-b border-[#1F1F23] pb-3">
              <CardTitle className="text-white">Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Template name" required>
                  <input
                    required
                    value={form.templateName}
                    onChange={(e) => update("templateName", e.target.value)}
                    placeholder="e.g., Interview Invite"
                    className={inputCls}
                  />
                </Field>
                <Field label="Template code" required hint="Unique, [a-zA-Z0-9_-]+">
                  <input
                    required
                    pattern="[a-zA-Z0-9_-]+"
                    value={form.templateCode}
                    onChange={(e) => update("templateCode", e.target.value)}
                    placeholder="interview_invite_2026"
                    className={inputCls}
                    disabled={!!initial}
                  />
                </Field>
              </div>

              <Field label="Subject" required>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => update("subject", e.target.value)}
                  placeholder="Interview at {{companyName}} — {{candidateId}}"
                  className={inputCls}
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value as TemplateInput["status"])}
                  className={inputCls}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </Field>
            </CardContent>
          </Card>

          <Card className="bg-[#0F0F12] ring-[#1F1F23]">
            <CardHeader className="border-b border-[#1F1F23] pb-3">
              <CardTitle className="text-white">HTML body</CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              <textarea
                id="template-html-body"
                required
                value={form.htmlBody}
                onChange={(e) => update("htmlBody", e.target.value)}
                rows={18}
                placeholder="<p>Hi {{firstName}}, welcome to {{companyName}}.</p>"
                className={`${inputCls} font-mono text-xs`}
              />
            </CardContent>
          </Card>

          <Card className="bg-[#0F0F12] ring-[#1F1F23]">
            <CardHeader className="border-b border-[#1F1F23] pb-3">
              <CardTitle className="text-white">Plain-text body (optional, recommended)</CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              <textarea
                value={form.textBody ?? ""}
                onChange={(e) => update("textBody", e.target.value)}
                rows={6}
                placeholder="Hi {{firstName}}, plain-text fallback for clients without HTML."
                className={`${inputCls} font-mono text-xs`}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              className="border-[#1F1F23] text-gray-300"
            >
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-sky-500 text-white hover:bg-sky-400"
              size="lg"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {initial ? "Save changes" : "Create template"}
            </Button>
          </div>
        </div>

        <Card className="h-fit bg-[#0F0F12] ring-[#1F1F23] lg:sticky lg:top-4">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">Placeholders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 py-3">
            <p className="text-xs text-gray-400">
              Click to insert at cursor. Anything in recipient <code>data</code> or campaign{" "}
              <code>globalVars</code> is also available.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => insertPlaceholder(token)}
                  className="rounded border border-[#1F1F23] bg-[#0a0c16] px-2 py-1 text-xs font-mono text-sky-300 hover:bg-[#1F1F23]"
                >
                  {token}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-md border border-[#1F1F23] bg-[#0a0c16] p-2 text-xs text-gray-500">
              <strong className="text-gray-400">Tip:</strong> Unknown placeholders render as empty
              and appear in the preview's "missing" warning.
            </div>
          </CardContent>
        </Card>
      </form>

      {preview && (
        <EmailPreviewModal
          open={!!preview}
          subject={preview.subject}
          htmlBody={preview.html}
          textBody={preview.text}
          missingPlaceholders={preview.missing}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}

const inputCls =
  "w-full rounded-md border border-[#1F1F23] bg-[#0a0c16] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-500";

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
