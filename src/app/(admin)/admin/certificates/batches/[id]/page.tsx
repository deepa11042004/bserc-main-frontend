"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FolderKanban,
  Mail,
  RotateCw,
  StopCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageShell, ErrorState, LoadingRow } from "@/components/admin/email/PageShell";
import { StatCard, StatsGrid } from "@/components/admin/email/StatsCards";
import { StatusBadge } from "@/components/admin/email/StatusBadge";
import { useEmailQuery } from "@/hooks/useEmailQuery";
import { emailApi } from "@/services/emailServer";
import { formatIST } from "@/lib/utils";

export default function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const batchId = Number(id);

  const { data: batch, error, refresh } = useEmailQuery(
    () => emailApi.getCertBatch(batchId),
    [batchId],
    { refreshIntervalMs: 5_000 }
  );
  const { data: recipients, loading: recLoading, refresh: refreshRecipients } =
    useEmailQuery(
      () => emailApi.listCertRecipients(batchId, { limit: 50 }),
      [batchId],
      { refreshIntervalMs: 5_000 }
    );

  const [distOpen, setDistOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const onCancel = async () => {
    if (!confirm("Cancel this batch? Already-rendered certificates are preserved.")) {
      return;
    }
    try {
      await emailApi.cancelCertBatch(batchId);
      void refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const onRetry = async (rid: number) => {
    try {
      await emailApi.retryCertRecipient(batchId, rid);
      void refreshRecipients();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const progressPct =
    batch && batch.total_rows
      ? Math.round(((batch.rendered_count + batch.failed_count) / batch.total_rows) * 100)
      : 0;

  return (
    <PageShell
      title={batch?.name ?? "Batch"}
      breadcrumbs={[
        { label: "Certificates", href: "/admin/certificates" },
        { label: batch?.name ?? `Batch ${batchId}` },
      ]}
      onRefresh={() => {
        void refresh();
        void refreshRecipients();
      }}
      actions={
        <>
          {batch && <StatusBadge status={batch.status} />}
          {batch?.status === "RENDERED" && !batch.email_campaign_id && (
            <Button
              onClick={() => setDistOpen(true)}
              className="bg-emerald-500 text-white hover:bg-emerald-400"
            >
              <Mail className="size-4" /> Distribute by email
            </Button>
          )}
          {(batch?.status === "RENDERING" || batch?.status === "DISTRIBUTING") && (
            <Button variant="destructive" onClick={onCancel}>
              <StopCircle className="size-4" /> Cancel
            </Button>
          )}
          {batch?.email_campaign_id && (
            <Button asChild variant="outline">
              <Link href={`/admin/email/campaigns/${batch.email_campaign_id}`}>
                View email campaign →
              </Link>
            </Button>
          )}
        </>
      }
    >
      {error && <ErrorState message={error.message} />}
      {actionError && <ErrorState message={actionError} />}

      <StatsGrid>
        <StatCard
          label="Total rows"
          value={batch?.total_rows?.toLocaleString() ?? "—"}
          icon={FolderKanban}
        />
        <StatCard
          label="Rendered"
          value={batch?.rendered_count?.toLocaleString() ?? "—"}
          tone="success"
          icon={CheckCircle2}
          hint={
            batch ? `${progressPct}% complete` : undefined
          }
        />
        <StatCard
          label="Failed"
          value={batch?.failed_count?.toLocaleString() ?? "—"}
          tone={batch && batch.failed_count > 0 ? "danger" : "default"}
          icon={XCircle}
        />
        <StatCard
          label="Sent"
          value={batch?.sent_count?.toLocaleString() ?? "—"}
          tone="info"
          icon={Mail}
        />
      </StatsGrid>

      {distOpen && batch && (
        <DistributeModal
          batchId={batchId}
          batchName={batch.name}
          onClose={() => setDistOpen(false)}
          onSuccess={() => {
            setDistOpen(false);
            void refresh();
          }}
        />
      )}

      <Card className="bg-[#0F0F12] ring-[#1F1F23]">
        <CardHeader className="border-b border-[#1F1F23] pb-3">
          <CardTitle className="text-white">Recipients</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#1F1F23] hover:bg-transparent">
                <TableHead>Row</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rendered</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recLoading && <LoadingRow cols={7} />}
              {!recLoading && !recipients?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-sm text-gray-500">
                    No recipients yet. The batch will materialize them after starting.
                  </TableCell>
                </TableRow>
              )}
              {recipients?.map((r) => (
                <TableRow key={r.id} className="border-b border-[#1F1F23]">
                  <TableCell className="text-xs text-gray-500">{r.row_index}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-300">
                    {r.serial_no}
                  </TableCell>
                  <TableCell className="text-white">{r.full_name ?? "—"}</TableCell>
                  <TableCell className="text-gray-300">{r.email ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                    {r.error_reason && (
                      <span className="ml-2 text-xs text-rose-300">{r.error_reason}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {r.rendered_at ? formatIST(r.rendered_at) : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {r.cert_url && (
                      <a
                        href={r.cert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline"
                      >
                        <Download className="size-3.5" /> PDF
                      </a>
                    )}
                    {r.verification_code && (
                      <Link
                        href={`/verify/${r.verification_code}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline"
                      >
                        <ExternalLink className="size-3.5" /> Verify
                      </Link>
                    )}
                    {r.status === "FAILED" && (
                      <button
                        onClick={() => onRetry(r.id)}
                        className="inline-flex items-center gap-1 text-xs text-amber-300 hover:underline"
                      >
                        <RotateCw className="size-3.5" /> Retry
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function DistributeModal({
  batchId,
  batchName,
  onClose,
  onSuccess,
}: {
  batchId: number;
  batchName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: templates } = useEmailQuery(
    () => emailApi.listTemplates({ status: "ACTIVE", limit: 100 }),
    []
  );
  const { data: senders } = useEmailQuery(() => emailApi.listSenders(true), []);

  const [emailTemplateId, setEmailTemplateId] = useState<number | "">("");
  const [fromEmail, setFromEmail] = useState("");
  const [campaignName, setCampaignName] = useState(`Cert: ${batchName}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTemplateId || !fromEmail) return;
    setBusy(true);
    setError(null);
    try {
      await emailApi.distributeCertBatch(batchId, {
        emailTemplateId: Number(emailTemplateId),
        fromEmail,
        campaignName,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-lg bg-[#0F0F12] p-5 ring-1 ring-[#1F1F23]">
        <h3 className="text-lg font-semibold text-white">Distribute via email</h3>
        <p className="mt-1 text-xs text-gray-400">
          Creates an email campaign with one recipient per rendered certificate. Each email gets a
          unique verification URL via <code className="text-sky-300">{"{{certificate_url}}"}</code>.
        </p>
        {error && (
          <div className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400">
              Email template
            </label>
            <select
              required
              value={emailTemplateId}
              onChange={(e) => setEmailTemplateId(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-2 py-1.5 text-sm text-white"
            >
              <option value="" disabled>
                Pick a template
              </option>
              {templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.template_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400">From email</label>
            <select
              required
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-2 py-1.5 text-sm text-white"
            >
              <option value="" disabled>
                Pick a verified sender
              </option>
              {senders?.map((s) => (
                <option key={s.id} value={s.email}>
                  {s.display_name} &lt;{s.email}&gt;
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400">
              Campaign name
            </label>
            <input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-2 py-1.5 text-sm text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-emerald-500 text-white hover:bg-emerald-400"
            >
              {busy ? "Queuing…" : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
