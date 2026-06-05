"use client";

import Link from "next/link";
import { Award, FileImage, FolderKanban, Plus, Send } from "lucide-react";
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
import { useEmailQuery } from "@/hooks/useEmailQuery";
import { emailApi } from "@/services/emailServer";
import {
  PageShell,
  EmptyState,
  ErrorState,
  LoadingRow,
} from "@/components/admin/email/PageShell";
import { StatCard, StatsGrid } from "@/components/admin/email/StatsCards";
import { StatusBadge } from "@/components/admin/email/StatusBadge";
import { formatIST } from "@/lib/utils";

export default function CertificatesDashboardPage() {
  const {
    data: templates,
    loading: tplLoading,
    error: tplError,
    refresh: refreshTpl,
  } = useEmailQuery(() => emailApi.listCertTemplates({ limit: 8 }), []);

  const {
    data: batches,
    loading: batchLoading,
    error: batchError,
    refresh: refreshBatches,
  } = useEmailQuery(() => emailApi.listCertBatches({ limit: 10 }), [], {
    refreshIntervalMs: 10_000,
  });

  const totalRendered = (batches ?? []).reduce((s, b) => s + b.rendered_count, 0);
  const totalSent = (batches ?? []).reduce((s, b) => s + b.sent_count, 0);
  const inProgress = (batches ?? []).filter(
    (b) => b.status === "RENDERING" || b.status === "DISTRIBUTING"
  ).length;

  const refresh = () => {
    void refreshTpl();
    void refreshBatches();
  };

  return (
    <PageShell
      title="Certificates"
      description="Upload templates, generate certificate batches, and distribute via email"
      onRefresh={refresh}
      actions={
        <>
          <Button
            asChild
            className="bg-sky-500 text-white hover:bg-sky-400"
            size="lg"
          >
            <Link href="/admin/certificates/batches/new">
              <Plus className="size-4" /> New batch
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/admin/certificates/templates/new">
              <FileImage className="size-4" /> New template
            </Link>
          </Button>
        </>
      }
    >
      {(tplError || batchError) && (
        <ErrorState message={(tplError ?? batchError)!.message} />
      )}

      <StatsGrid>
        <StatCard
          label="Templates"
          value={tplLoading ? "—" : (templates?.length ?? 0)}
          icon={FileImage}
        />
        <StatCard
          label="Batches"
          value={batchLoading ? "—" : (batches?.length ?? 0)}
          icon={FolderKanban}
        />
        <StatCard
          label="In progress"
          value={batchLoading ? "—" : inProgress}
          tone={inProgress > 0 ? "info" : "default"}
          icon={Award}
        />
        <StatCard
          label="Generated / Sent"
          value={
            batchLoading ? "—" : `${totalRendered.toLocaleString()} / ${totalSent.toLocaleString()}`
          }
          tone="success"
          icon={Send}
        />
      </StatsGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">Recent batches</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#1F1F23] hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rendered</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchLoading && <LoadingRow cols={5} />}
                {!batchLoading && !batches?.length && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        title="No batches yet"
                        description="Start by creating one from an existing template."
                      />
                    </TableCell>
                  </TableRow>
                )}
                {batches?.map((b) => (
                  <TableRow key={b.id} className="border-b border-[#1F1F23]">
                    <TableCell className="font-medium text-white">
                      <Link
                        href={`/admin/certificates/batches/${b.id}`}
                        className="hover:underline"
                      >
                        {b.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="text-right text-gray-300">
                      {b.rendered_count.toLocaleString()} /{" "}
                      {b.total_rows.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {formatIST(b.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/certificates/batches/${b.id}`}
                        className="text-xs text-sky-300 hover:underline"
                      >
                        Open →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">Templates</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {tplLoading ? (
              <div className="px-4 py-6 text-sm text-gray-500">Loading…</div>
            ) : !templates?.length ? (
              <div className="px-4 py-6">
                <EmptyState
                  title="No templates yet"
                  description="Upload a certificate background to get started."
                  action={
                    <Button asChild>
                      <Link href="/admin/certificates/templates/new">
                        Upload template
                      </Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-[#1F1F23]">
                {templates.map((t) => (
                  <li key={t.id} className="px-4 py-3 hover:bg-[#1F1F23]/40">
                    <Link
                      href={`/admin/certificates/templates/${t.id}`}
                      className="flex items-center gap-3"
                    >
                      {/* Thumbnail */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.image_url}
                        alt=""
                        className="h-10 w-14 rounded-sm object-cover ring-1 ring-[#1F1F23]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {t.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {t.image_width}×{t.image_height} • {t.placeholders?.length ?? 0} placeholder(s)
                        </p>
                      </div>
                      <StatusBadge status={t.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
