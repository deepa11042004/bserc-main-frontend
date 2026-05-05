"use client";

import { use, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  Send,
  StopCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmailQuery } from "@/hooks/useEmailQuery";
import { emailApi } from "@/services/emailServer";
import { PageShell, ErrorState, LoadingRow } from "@/components/admin/email/PageShell";
import { StatCard, StatsGrid } from "@/components/admin/email/StatsCards";
import { StatusBadge } from "@/components/admin/email/StatusBadge";
import { ConfirmDialog } from "@/components/admin/email/ConfirmDialog";
import { AdminToast } from "@/components/admin/AdminToast";
import { formatIST } from "@/lib/utils";
import type { CampaignStatus, RecipientStatus } from "@/types/emailServer";

const RECIPIENT_STATUSES: RecipientStatus[] = [
  "PENDING",
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
  "BOUNCED",
  "COMPLAINT",
  "SUPPRESSED",
];

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const campaignId = Number(id);

  const stats = useEmailQuery(() => emailApi.getCampaignStats(campaignId), [campaignId], {
    refreshIntervalMs: 5_000,
  });
  const [recipientStatus, setRecipientStatus] = useState<RecipientStatus | "">("");
  const recipients = useEmailQuery(
    () => emailApi.listRecipients(campaignId, { status: recipientStatus || undefined, limit: 200 }),
    [campaignId, recipientStatus]
  );

  const [confirm, setConfirm] = useState<null | "pause" | "resume" | "cancel" | "retry">(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  const status: CampaignStatus | undefined = stats.data?.status;

  async function performAction(kind: "pause" | "resume" | "cancel" | "retry") {
    setActionLoading(true);
    try {
      if (kind === "pause") {
        await emailApi.pause(campaignId);
        setToast({ message: "Campaign paused", variant: "success" });
      } else if (kind === "resume") {
        await emailApi.resume(campaignId);
        setToast({ message: "Campaign resumed", variant: "success" });
      } else if (kind === "cancel") {
        await emailApi.cancel(campaignId);
        setToast({ message: "Campaign cancelled", variant: "success" });
      } else {
        const r = await emailApi.retryFailedForCampaign(campaignId);
        setToast({ message: `Re-queued ${r.retried} failed recipients`, variant: "success" });
      }
      await Promise.all([stats.refresh(), recipients.refresh()]);
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Action failed", variant: "error" });
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  }

  const counters = stats.data?.counters;
  const total = counters?.total ?? 0;
  const sent = counters?.sent ?? 0;
  const delivered = counters?.delivered ?? 0;
  const failed = counters?.failed ?? 0;
  const pct = total ? Math.min(100, Math.round((sent / total) * 100)) : 0;
  const deliveryPct = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
  const canPause = status === "QUEUED" || status === "RUNNING";
  const canResume = status === "PAUSED";
  const canCancel = status === "QUEUED" || status === "RUNNING" || status === "PAUSED";
  const canRetry = (failed ?? 0) > 0;
  const isCompleted = status === "COMPLETED";

  return (
    <>
      <PageShell
        title={stats.data?.name ?? `Campaign #${campaignId}`}
        breadcrumbs={[
          { label: "Email", href: "/admin/email" },
          { label: "Campaigns", href: "/admin/email/campaigns" },
          { label: stats.data?.name ?? `#${campaignId}` },
        ]}
        onRefresh={() => {
          stats.refresh();
          recipients.refresh();
        }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {status && <StatusBadge status={status} />}
            {canPause && (
              <Button
                size="lg"
                variant="outline"
                className="border-[#1F1F23] text-amber-300"
                onClick={() => setConfirm("pause")}
              >
                <PauseCircle className="h-4 w-4" /> Pause
              </Button>
            )}
            {canResume && (
              <Button
                size="lg"
                className="bg-sky-500 text-white hover:bg-sky-400"
                onClick={() => setConfirm("resume")}
              >
                <PlayCircle className="h-4 w-4" /> Resume
              </Button>
            )}
            {canCancel && (
              <Button
                size="lg"
                variant="outline"
                className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                onClick={() => setConfirm("cancel")}
              >
                <StopCircle className="h-4 w-4" /> Cancel
              </Button>
            )}
            {canRetry && (
              <Button
                size="lg"
                variant="outline"
                className="border-[#1F1F23] text-gray-300"
                onClick={() => setConfirm("retry")}
              >
                <RefreshCcw className="h-4 w-4" /> Retry failed
              </Button>
            )}
          </div>
        }
      >
        {stats.error && <ErrorState message={stats.error.message} />}

        {/* Completion celebration banner */}
        {isCompleted && (
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-[#0d1a14] to-sky-950/60 px-6 py-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(52,211,153,0.12),transparent_70%)]" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Campaign completed successfully</p>
                <p className="text-sm text-gray-400">
                  {sent.toLocaleString()} emails sent
                  {delivered > 0 && ` · ${delivered.toLocaleString()} confirmed delivered (${deliveryPct}%)`}
                  {failed > 0 && ` · ${failed} failed`}
                </p>
              </div>
            </div>
          </div>
        )}

        <StatsGrid>
          <StatCard label="Total" value={total} icon={Mail} />
          <StatCard label="Sent" value={sent} icon={Send} tone="success" />
          <StatCard
            label="Delivered"
            value={counters?.delivered ?? 0}
            icon={CheckCircle2}
            tone="success"
            hint={counters?.complaints ? `${counters.complaints} complaints` : undefined}
          />
          <StatCard
            label="Failed / bounced"
            value={`${failed} / ${counters?.bounced ?? 0}`}
            icon={XCircle}
            tone={(failed ?? 0) + (counters?.bounced ?? 0) > 0 ? "danger" : "default"}
            hint={counters?.suppressed ? `${counters.suppressed} suppressed` : undefined}
          />
        </StatsGrid>

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Sending progress</span>
                {(status === "RUNNING" || status === "QUEUED") && (
                  <span className="flex items-center gap-1 text-[11px] text-sky-400">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
                    </span>
                    Live
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold tabular-nums text-white">
                {sent.toLocaleString()} / {total.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-gray-500">({pct}%)</span>
              </span>
            </div>

            {/* Gradient progress bar */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1a1a24]">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                  isCompleted
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : status === "FAILED" || status === "CANCELLED"
                      ? "bg-rose-500"
                      : "bg-gradient-to-r from-sky-500 to-indigo-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 sm:grid-cols-4">
              <div>Started: {stats.data?.startedAt ? formatIST(stats.data.startedAt) : "—"}</div>
              <div>
                Completed:{" "}
                {stats.data?.completedAt ? formatIST(stats.data.completedAt) : "—"}
              </div>
              <div>Queued in DB: {(counters?.queued ?? 0).toLocaleString()}</div>
              <div>Suppressed: {(counters?.suppressed ?? 0).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="flex-row items-center justify-between border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">Recipients</CardTitle>
            <select
              value={recipientStatus}
              onChange={(e) => setRecipientStatus(e.target.value as RecipientStatus | "")}
              className="rounded-md border border-[#1F1F23] bg-[#0a0c16] px-2 py-1 text-xs text-gray-300"
            >
              <option value="">All statuses</option>
              {RECIPIENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1F1F23] hover:bg-transparent">
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Error / Reason</TableHead>
                  <TableHead className="text-gray-400">Sent at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.loading ? (
                  <>
                    <LoadingRow cols={5} />
                    <LoadingRow cols={5} />
                    <LoadingRow cols={5} />
                  </>
                ) : !recipients.data?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-gray-500">
                      <AlertCircle className="mx-auto mb-1 h-4 w-4 text-gray-600" />
                      No recipients in this status
                    </TableCell>
                  </TableRow>
                ) : (
                  recipients.data.map((r) => (
                    <TableRow key={r.id} className="border-[#1F1F23] hover:bg-[#1F1F23]/40">
                      <TableCell className="text-sm text-white">{r.email}</TableCell>
                      <TableCell className="text-sm text-gray-300">
                        {[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="max-w-md truncate text-xs text-rose-300">
                        {r.error_reason ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {r.sent_at ? formatIST(r.sent_at) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageShell>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === "pause"
            ? "Pause this campaign?"
            : confirm === "resume"
              ? "Resume sending?"
              : confirm === "cancel"
                ? "Cancel this campaign?"
                : "Retry all failed recipients?"
        }
        description={
          confirm === "cancel"
            ? "Cancellation is permanent. Recipients still in queue will be skipped."
            : confirm === "retry"
              ? `Re-queue ${failed} failed recipients for another delivery attempt.`
              : undefined
        }
        confirmText={confirm === "cancel" ? "Cancel campaign" : "Confirm"}
        variant={confirm === "cancel" ? "destructive" : "default"}
        loading={actionLoading}
        onConfirm={() => confirm && performAction(confirm)}
        onCancel={() => setConfirm(null)}
      />

      <AdminToast
        open={!!toast}
        message={toast?.message ?? ""}
        variant={toast?.variant ?? "info"}
        onClose={() => setToast(null)}
      />
    </>
  );
}
