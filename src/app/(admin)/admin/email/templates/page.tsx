"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2, Eye, Plus } from "lucide-react";
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
import { EmailPreviewModal } from "@/components/admin/email/EmailPreviewModal";
import { ConfirmDialog } from "@/components/admin/email/ConfirmDialog";
import { AdminToast } from "@/components/admin/AdminToast";
import { formatIST } from "@/lib/utils";
import type { Template, TemplatePreview } from "@/types/emailServer";

export default function TemplatesListPage() {
  const { data, error, loading, refresh } = useEmailQuery(() => emailApi.listTemplates({ limit: 100 }));
  const [preview, setPreview] = useState<TemplatePreview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  async function handlePreview(t: Template) {
    try {
      const p = await emailApi.previewTemplate(t.id, {});
      setPreview(p);
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Preview failed", variant: "error" });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await emailApi.deleteTemplate(deleteTarget.id);
      setToast({ message: `Deleted "${deleteTarget.template_name}"`, variant: "success" });
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Delete failed", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageShell
        title="Templates"
        description="Reusable email templates with placeholder support"
        breadcrumbs={[{ label: "Email", href: "/admin/email" }, { label: "Templates" }]}
        onRefresh={refresh}
        actions={
          <Button asChild className="bg-sky-500 text-white hover:bg-sky-400" size="lg">
            <Link href="/admin/email/templates/new">
              <Plus className="h-4 w-4" /> New template
            </Link>
          </Button>
        }
      >
        {error && <ErrorState message={error.message} />}

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1F1F23] hover:bg-transparent">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Code</TableHead>
                  <TableHead className="text-gray-400">Subject</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Updated</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    <LoadingRow cols={6} />
                    <LoadingRow cols={6} />
                    <LoadingRow cols={6} />
                  </>
                ) : !data?.length ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        title="No templates yet"
                        description="Create your first template to start sending campaigns."
                        action={
                          <Button asChild className="bg-sky-500 text-white hover:bg-sky-400">
                            <Link href="/admin/email/templates/new">+ New template</Link>
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((t) => (
                    <TableRow key={t.id} className="border-[#1F1F23] hover:bg-[#1F1F23]/40">
                      <TableCell className="font-medium text-white">{t.template_name}</TableCell>
                      <TableCell className="text-xs text-gray-400">
                        <code className="rounded bg-[#1F1F23] px-1.5 py-0.5">{t.template_code}</code>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-gray-300">{t.subject}</TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">{formatIST(t.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handlePreview(t)}
                            className="text-gray-400 hover:text-white"
                            aria-label="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            asChild
                            className="text-gray-400 hover:text-white"
                          >
                            <Link href={`/admin/email/templates/${t.id}`} aria-label="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(t)}
                            className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageShell>

      {preview && (
        <EmailPreviewModal
          open={!!preview}
          subject={preview.subject}
          htmlBody={preview.htmlBody}
          textBody={preview.textBody}
          missingPlaceholders={preview.missingPlaceholders}
          onClose={() => setPreview(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.template_name}"?`}
        description="This template will be permanently removed. Existing campaigns referring to it will keep working."
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
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
