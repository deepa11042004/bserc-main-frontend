"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/admin/email/StatusBadge";
import { formatIST } from "@/lib/utils";
import { useState } from "react";

export default function CampaignsListPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, error, loading, refresh } = useEmailQuery(
    () => emailApi.listCampaigns({ status: statusFilter || undefined, limit: 100 }),
    [statusFilter],
    { refreshIntervalMs: 10_000 }
  );

  return (
    <PageShell
      title="Campaigns"
      description="Bulk email campaigns and their delivery progress"
      breadcrumbs={[{ label: "Email", href: "/admin/email" }, { label: "Campaigns" }]}
      onRefresh={refresh}
      actions={
        <>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-[#1F1F23] bg-[#0F0F12] px-2 py-1 text-xs text-gray-300"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="QUEUED">Queued</option>
            <option value="RUNNING">Running</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Button asChild className="bg-sky-500 text-white hover:bg-sky-400" size="lg">
            <Link href="/admin/email/campaigns/new">
              <Plus className="h-4 w-4" /> New campaign
            </Link>
          </Button>
        </>
      }
    >
      {error && <ErrorState message={error.message} />}

      <Card className="bg-[#0F0F12] ring-[#1F1F23]">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1F1F23] hover:bg-transparent">
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-right text-gray-400">Total</TableHead>
                <TableHead className="text-right text-gray-400">Sent</TableHead>
                <TableHead className="text-right text-gray-400">Failed</TableHead>
                <TableHead className="text-right text-gray-400">Bounced</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  <LoadingRow cols={7} />
                  <LoadingRow cols={7} />
                </>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      title="No campaigns yet"
                      description="Create one to start sending emails."
                      action={
                        <Button asChild className="bg-sky-500 text-white hover:bg-sky-400">
                          <Link href="/admin/email/campaigns/new">+ New campaign</Link>
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.map((c) => (
                  <TableRow key={c.id} className="border-[#1F1F23] hover:bg-[#1F1F23]/40">
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/email/campaigns/${c.id}`}
                        className="text-white hover:text-sky-300"
                      >
                        {c.campaign_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-gray-300">
                      {c.total_recipients}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-300">
                      {c.sent_count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-rose-300">
                      {c.failed_count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-orange-300">
                      {c.bounced_count}
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
    </PageShell>
  );
}
