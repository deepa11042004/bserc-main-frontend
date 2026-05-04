"use client";

import { Activity, AlertTriangle, CheckCircle2, Database, Inbox, ServerCog, Skull } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmailQuery } from "@/hooks/useEmailQuery";
import { emailApi } from "@/services/emailServer";
import { PageShell, ErrorState } from "@/components/admin/email/PageShell";
import { StatCard, StatsGrid } from "@/components/admin/email/StatsCards";
import { StatusBadge } from "@/components/admin/email/StatusBadge";
import { formatIST } from "@/lib/utils";

export default function QueueHealthPage() {
  const { data, error, loading, refresh } = useEmailQuery(
    () => emailApi.queueHealth(),
    [],
    { refreshIntervalMs: 5_000 }
  );

  return (
    <PageShell
      title="Queue health"
      description="SQS queue depth, in-flight messages, dead-letter, and worker config"
      breadcrumbs={[{ label: "Email", href: "/admin/email" }, { label: "Queue Health" }]}
      onRefresh={refresh}
      actions={data && <StatusBadge status={data.status} />}
    >
      {error && <ErrorState message={error.message} />}

      <StatsGrid>
        <StatCard
          label="Visible in queue"
          value={loading ? "—" : (data?.queue?.visible ?? 0)}
          icon={Inbox}
          tone="info"
        />
        <StatCard
          label="In flight"
          value={loading ? "—" : (data?.queue?.inFlight ?? 0)}
          icon={Activity}
          hint="Currently being processed"
        />
        <StatCard
          label="DLQ messages"
          value={loading ? "—" : (data?.dlq?.messages ?? 0)}
          icon={Skull}
          tone={data && (data.dlq?.messages ?? 0) > 0 ? "danger" : "success"}
          hint="Should be 0 in healthy state"
        />
        <StatCard
          label="Pending in DB"
          value={loading ? "—" : (data?.db?.pendingRecipients ?? 0)}
          icon={Database}
          hint="Awaiting worker pickup"
        />
      </StatsGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <ServerCog className="h-4 w-4 text-sky-300" /> Worker configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 py-3 text-sm">
            <KV label="Concurrency" value={data?.worker?.concurrency} />
            <KV label="Batch size" value={data?.worker?.batchSize} />
            <KV
              label="Visibility timeout"
              value={data?.worker ? `${data.worker.visibilityTimeoutSec}s` : "—"}
            />
            <KV
              label="SES rate cap"
              value={data?.worker ? `${data.worker.sesMaxSendRatePerSec}/s` : "—"}
            />
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Inbox className="h-4 w-4 text-sky-300" /> Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 py-3 text-sm">
            <KV label="Name" value={data?.queue?.name ?? "—"} />
            <KV label="Visible" value={data?.queue?.visible ?? 0} />
            <KV label="In flight" value={data?.queue?.inFlight ?? 0} />
            <KV label="Delayed" value={data?.queue?.delayed ?? 0} />
            {data?.queue?.status === "error" && (
              <div className="rounded border border-rose-500/40 bg-rose-950/20 p-2 text-xs text-rose-200">
                {data.queue.message}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Skull className="h-4 w-4 text-rose-300" /> Dead-letter queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 py-3 text-sm">
            <KV label="Name" value={data?.dlq?.name ?? "(unconfigured)"} />
            <KV label="Messages" value={data?.dlq?.messages ?? 0} />
            {data?.dlq?.status === "unconfigured" && (
              <p className="text-xs text-amber-300">
                <AlertTriangle className="mr-1 inline-block h-3 w-3" />
                <code>SQS_DLQ_URL</code> is empty — set it in the email-server <code>.env</code>.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="h-4 w-4 text-sky-300" /> DB counters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 py-3 text-sm">
            <KV label="Pending recipients" value={data?.db?.pendingRecipients ?? 0} />
            <KV label="Failed recipients" value={data?.db?.failedRecipients ?? 0} />
            <KV label="Active campaigns" value={data?.db?.activeCampaigns ?? 0} />
          </CardContent>
        </Card>
      </div>

      {data && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CheckCircle2 className="h-3 w-3" /> Last refreshed {formatIST(data.timestamp)} (auto-refresh 5s)
        </div>
      )}
    </PageShell>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm tabular-nums text-white">{value}</span>
    </div>
  );
}
