"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Send,
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
import { PageShell, EmptyState, ErrorState, LoadingRow } from "@/components/admin/email/PageShell";
import { StatCard, StatsGrid } from "@/components/admin/email/StatsCards";
import { StatusBadge } from "@/components/admin/email/StatusBadge";
import { formatIST } from "@/lib/utils";

function progress(sent: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((sent / total) * 100));
}

export default function EmailDashboardPage() {
  const { data, error, loading, refresh } = useEmailQuery(
    () => emailApi.dashboardSummary(),
    [],
    { refreshIntervalMs: 15_000 }
  );

  return (
    <PageShell
      title="Email Notifications"
      description="Live overview of campaigns, deliveries, and worker activity"
      onRefresh={refresh}
      actions={
        <>
          <Button asChild className="bg-sky-500 text-white hover:bg-sky-400" size="lg">
            <Link href="/admin/email/campaigns/new">+ New Campaign</Link>
          </Button>
        </>
      }
    >
      {error && <ErrorState message={error.message} />}

      <StatsGrid>
        <StatCard
          label="Campaigns total"
          value={loading ? "—" : (data?.campaigns.total ?? 0)}
          icon={Mail}
        />
        <StatCard
          label="Active"
          value={loading ? "—" : (data?.campaigns.active ?? 0)}
          icon={Activity}
          tone="info"
        />
        <StatCard
          label="Sent today"
          value={loading ? "—" : (data?.today.sent ?? 0)}
          icon={Send}
          tone="success"
        />
        <StatCard
          label="Failed today"
          value={loading ? "—" : (data?.today.failed ?? 0)}
          icon={XCircle}
          tone={data && data.today.failed > 0 ? "danger" : "default"}
          hint={data && data.today.bounced ? `${data.today.bounced} bounced` : undefined}
        />
      </StatsGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">Active campaigns</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="px-4 py-6 text-sm text-gray-500">Loading…</div>
            ) : !data?.active?.length ? (
              <div className="px-4 py-6">
                <EmptyState
                  title="No active campaigns"
                  description="Create one to start sending."
                />
              </div>
            ) : (
              <ul className="divide-y divide-[#1F1F23]">
                {data.active.map((c) => {
                  const pct = progress(c.sent_count, c.total_recipients);
                  return (
                    <li key={c.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/admin/email/campaigns/${c.id}`}
                          className="truncate text-sm font-medium text-white hover:text-sky-300"
                        >
                          {c.campaign_name}
                        </Link>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span className="tabular-nums">
                          {c.sent_count}/{c.total_recipients} sent
                        </span>
                        {c.failed_count > 0 && (
                          <span className="text-rose-300">{c.failed_count} failed</span>
                        )}
                        <span className="ml-auto tabular-nums">{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1F1F23]">
                        <div
                          className="h-full bg-sky-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">Recent campaigns</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1F1F23] hover:bg-transparent">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">Sent / Total</TableHead>
                  <TableHead className="text-gray-400">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    <LoadingRow cols={4} />
                    <LoadingRow cols={4} />
                    <LoadingRow cols={4} />
                  </>
                ) : !data?.recent?.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                      No campaigns yet
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recent.map((c) => (
                    <TableRow key={c.id} className="border-[#1F1F23] hover:bg-[#1F1F23]/40">
                      <TableCell>
                        <Link
                          href={`/admin/email/campaigns/${c.id}`}
                          className="text-sm text-white hover:text-sky-300"
                        >
                          {c.campaign_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-gray-300">
                        {c.sent_count} / {c.total_recipients}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {formatIST(c.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {data && data.campaigns.failed > 0 && (
        <Card className="bg-amber-950/20 ring-amber-500/30">
          <CardContent className="flex items-center gap-3 py-3 text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <div className="text-sm">
              {data.campaigns.failed} campaign{data.campaigns.failed === 1 ? "" : "s"} marked
              as failed.{" "}
              <Link href="/admin/email/campaigns" className="underline">
                Review
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Today's totals
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 py-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-emerald-300 tabular-nums">
                {data.today.sent}
              </div>
              <div className="text-xs text-gray-400">Sent</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-rose-300 tabular-nums">
                {data.today.failed}
              </div>
              <div className="text-xs text-gray-400">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-orange-300 tabular-nums">
                {data.today.bounced}
              </div>
              <div className="text-xs text-gray-400">Bounced</div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
