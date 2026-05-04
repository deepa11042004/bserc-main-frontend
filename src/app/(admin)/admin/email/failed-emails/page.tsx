"use client";

import Link from "next/link";
import { useState } from "react";
import { RefreshCcw } from "lucide-react";
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
import { ConfirmDialog } from "@/components/admin/email/ConfirmDialog";
import { AdminToast } from "@/components/admin/AdminToast";

export default function FailedEmailsPage() {
  const { data, error, loading, refresh } = useEmailQuery(
    () => emailApi.failedEmails({ limit: 200 }),
    [],
    { refreshIntervalMs: 15_000 }
  );
  const [retryTarget, setRetryTarget] = useState<{ id: number; email: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  async function retry(id: number) {
    setSubmitting(true);
    try {
      await emailApi.retryRecipient(id);
      setToast({ message: "Re-queued for delivery", variant: "success" });
      setRetryTarget(null);
      await refresh();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Retry failed", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageShell
        title="Failed emails"
        description="Recipients that did not deliver. Retry one or in bulk per campaign."
        breadcrumbs={[{ label: "Email", href: "/admin/email" }, { label: "Failed" }]}
        onRefresh={refresh}
      >
        {error && <ErrorState message={error.message} />}

        <div className="text-xs text-gray-400">
          {loading ? "…" : `${data?.total ?? 0} total failures`}
        </div>

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1F1F23] hover:bg-transparent">
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Campaign</TableHead>
                  <TableHead className="text-gray-400">Error</TableHead>
                  <TableHead className="text-right text-gray-400">Retries</TableHead>
                  <TableHead className="text-right text-gray-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    <LoadingRow cols={5} />
                    <LoadingRow cols={5} />
                    <LoadingRow cols={5} />
                  </>
                ) : !data?.items?.length ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        title="No failed emails 🎉"
                        description="All recipients are either sent, delivered, or still in flight."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((r) => (
                    <TableRow key={r.id} className="border-[#1F1F23] hover:bg-[#1F1F23]/40">
                      <TableCell className="text-sm text-white">{r.email}</TableCell>
                      <TableCell className="text-xs text-gray-300">
                        <Link
                          href={`/admin/email/campaigns/${r.campaign_id}`}
                          className="hover:text-sky-300"
                        >
                          {r.campaign_name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-xs text-rose-300">
                        {r.error_reason ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-400">
                        {r.retry_count}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#1F1F23] text-gray-300"
                          onClick={() => setRetryTarget({ id: r.id, email: r.email })}
                        >
                          <RefreshCcw className="h-3 w-3" /> Retry
                        </Button>
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
        open={!!retryTarget}
        title="Retry this email?"
        description={retryTarget ? `Re-queue ${retryTarget.email} for another delivery attempt.` : ""}
        loading={submitting}
        onConfirm={() => retryTarget && retry(retryTarget.id)}
        onCancel={() => setRetryTarget(null)}
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
