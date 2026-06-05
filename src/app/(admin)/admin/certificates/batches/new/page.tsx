"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell, ErrorState } from "@/components/admin/email/PageShell";
import { useEmailQuery } from "@/hooks/useEmailQuery";
import { emailApi } from "@/services/emailServer";
import { fileToBase64Input } from "@/lib/fileToBase64";
import type {
  CertBatch,
  CertColumnsResponse,
  CertTemplate,
  PlaceholderInput,
  SerialConfig,
} from "@/types/emailServer";

type Step = 1 | 2 | 3 | 4;

export default function NewBatchPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Step 1 state
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Step 2 state (after creation)
  const [batch, setBatch] = useState<CertBatch | null>(null);
  const [columns, setColumns] = useState<CertColumnsResponse | null>(null);
  const [template, setTemplate] = useState<CertTemplate | null>(null);

  // Step 3 state (mapping)
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [emailColumn, setEmailColumn] = useState<string>("");
  const [nameColumn, setNameColumn] = useState<string>("");
  const [serial, setSerial] = useState<SerialConfig>({
    prefix: "",
    suffix: "",
    paddingWidth: 4,
    startAt: 1,
  });

  // Step 4 state (preview)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: templates, loading: tplLoading } = useEmailQuery(
    () => emailApi.listCertTemplates({ status: "ACTIVE", limit: 100 }),
    []
  );

  const mappablePlaceholders = useMemo(
    () =>
      (template?.placeholders ?? []).filter((p) => !p.is_qr && !p.is_serial),
    [template]
  );

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !templateId || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const f = await fileToBase64Input(file);
      const created = await emailApi.createCertBatch({
        name: name.trim(),
        templateId,
        file: f,
      });
      setBatch(created);
      const [cols, tpl] = await Promise.all([
        emailApi.getCertBatchColumns(created.id),
        emailApi.getCertTemplate(templateId),
      ]);
      setColumns(cols);
      setTemplate(tpl);
      // initialize mapping by trying name-similarity matches
      const init: Record<string, string> = {};
      for (const p of (tpl.placeholders ?? []).filter(
        (x) => !x.is_qr && !x.is_serial
      )) {
        const match = cols.columns.find(
          (c) =>
            c.toLowerCase().replace(/\W+/g, "") ===
            p.placeholder_key.toLowerCase().replace(/\W+/g, "")
        );
        if (match) init[p.placeholder_key] = match;
      }
      setMapping(init);
      // try to auto-pick email/name columns
      const emailCol = cols.columns.find((c) => /e[-_]?mail/i.test(c));
      if (emailCol) setEmailColumn(emailCol);
      const nameCol = cols.columns.find((c) => /^(full[_ ]?)?name$/i.test(c));
      if (nameCol) setNameColumn(nameCol);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onSaveMapping = async () => {
    if (!batch) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await emailApi.saveCertBatchMapping(batch.id, {
        columnMapping: mapping,
        emailColumn: emailColumn || null,
        nameColumn: nameColumn || null,
        serialConfig: serial,
      });
      setBatch(updated);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onPreview = async () => {
    if (!batch) return;
    setBusy(true);
    setError(null);
    try {
      const out = await emailApi.previewCertBatch(batch.id, 0);
      setPreviewUrl(out.url);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onStart = async () => {
    if (!batch) return;
    setBusy(true);
    setError(null);
    try {
      await emailApi.startCertBatch(batch.id);
      router.push(`/admin/certificates/batches/${batch.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <PageShell
      title="New batch"
      description="Upload data, map columns, preview a certificate, then start rendering"
      breadcrumbs={[
        { label: "Certificates", href: "/admin/certificates" },
        { label: "New batch" },
      ]}
    >
      {error && <ErrorState message={error} />}

      <StepIndicator step={step} />

      {step === 1 && (
        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">1 — Template &amp; data file</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400">
                  Batch name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                  placeholder="e.g. Summer School 2026 Cohort"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400">
                  Template *
                </label>
                <select
                  required
                  value={templateId ?? ""}
                  onChange={(e) => setTemplateId(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                >
                  <option value="" disabled>
                    {tplLoading ? "Loading…" : "Pick a template"}
                  </option>
                  {templates?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {templates && templates.length === 0 && (
                  <p className="mt-1 text-xs text-amber-400">
                    No templates yet —{" "}
                    <Link
                      href="/admin/certificates/templates/new"
                      className="underline"
                    >
                      upload one first
                    </Link>
                    .
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400">
                  Participant data (CSV / XLSX, up to 50MB) *
                </label>
                <input
                  required
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-xs text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-sky-400"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={busy || !file || !templateId || !name.trim()}
                  className="bg-sky-500 text-white hover:bg-sky-400"
                >
                  <Upload className="size-4" /> {busy ? "Uploading…" : "Upload & detect columns"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step >= 2 && batch && columns && template && (
        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">
              2 — Map columns to placeholders
            </CardTitle>
            <p className="mt-1 text-xs text-gray-500">
              Detected {columns.columns.length} columns across {columns.totalRows.toLocaleString()} rows.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {mappablePlaceholders.map((p) => (
                <div key={p.id}>
                  <label className="block text-xs font-medium text-gray-400">
                    Placeholder <code className="text-sky-300">{p.placeholder_key}</code>
                  </label>
                  <select
                    value={mapping[p.placeholder_key] ?? ""}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [p.placeholder_key]: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-2 py-1.5 text-sm text-white outline-none focus:border-sky-500"
                  >
                    <option value="">— pick column —</option>
                    {columns.columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-[#1F1F23] pt-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-400">
                  Email column (for distribution)
                </label>
                <select
                  value={emailColumn}
                  onChange={(e) => setEmailColumn(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-2 py-1.5 text-sm text-white outline-none focus:border-sky-500"
                >
                  <option value="">— none —</option>
                  {columns.columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400">
                  Full-name column (for display)
                </label>
                <select
                  value={nameColumn}
                  onChange={(e) => setNameColumn(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-2 py-1.5 text-sm text-white outline-none focus:border-sky-500"
                >
                  <option value="">— none —</option>
                  {columns.columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#1F1F23] pt-4 md:grid-cols-4">
              <SerialField
                label="Prefix"
                value={serial.prefix ?? ""}
                onChange={(v) => setSerial({ ...serial, prefix: v })}
              />
              <SerialField
                label="Suffix"
                value={serial.suffix ?? ""}
                onChange={(v) => setSerial({ ...serial, suffix: v })}
              />
              <SerialField
                label="Padding width"
                type="number"
                value={String(serial.paddingWidth ?? 4)}
                onChange={(v) => setSerial({ ...serial, paddingWidth: Number(v) })}
              />
              <SerialField
                label="Start at"
                type="number"
                value={String(serial.startAt ?? 1)}
                onChange={(v) => setSerial({ ...serial, startAt: Number(v) })}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={onSaveMapping}
                disabled={busy}
                className="bg-sky-500 text-white hover:bg-sky-400"
              >
                <ArrowRight className="size-4" />{" "}
                {busy ? "Saving…" : "Save mapping"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step >= 3 && batch && (
        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">3 — Preview one row</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Generate a sample certificate using the first detected row to verify the layout.
            </p>
            <div className="mt-3 flex gap-2">
              <Button onClick={onPreview} disabled={busy} variant="outline">
                <Eye className="size-4" /> {busy && step < 4 ? "Rendering…" : "Render preview"}
              </Button>
              {previewUrl && (
                <Button asChild variant="outline">
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    Open PDF
                  </a>
                </Button>
              )}
            </div>
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="mt-4 h-[60vh] w-full rounded-md ring-1 ring-[#1F1F23]"
                title="Certificate preview"
              />
            )}
          </CardContent>
        </Card>
      )}

      {step >= 4 && batch && (
        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">
              4 — Start rendering {batch.total_rows.toLocaleString()} certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Materializes recipients and enqueues a render job per row. The page will redirect to the batch detail view.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={onStart}
                disabled={busy}
                className="bg-emerald-500 text-white hover:bg-emerald-400"
              >
                <Play className="size-4" /> {busy ? "Starting…" : "Start batch"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const labels = ["Data", "Map", "Preview", "Start"];
  return (
    <ol className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex size-5 items-center justify-center rounded-full ring-1 ${
                done
                  ? "bg-emerald-500 text-white ring-emerald-500"
                  : active
                    ? "bg-sky-500 text-white ring-sky-500"
                    : "bg-[#0F0F12] text-gray-500 ring-[#1F1F23]"
              }`}
            >
              {n}
            </span>
            <span className={active || done ? "text-gray-200" : ""}>{label}</span>
            {i < labels.length - 1 && (
              <span className="h-px w-6 bg-[#1F1F23]" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SerialField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-2 py-1.5 text-sm text-white"
      />
    </div>
  );
}
