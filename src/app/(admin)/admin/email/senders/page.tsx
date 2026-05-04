"use client";

import { useState } from "react";
import { Mail, Plus, Pencil, Trash2, CheckCircle2, Star, StarOff, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useEmailQuery } from "@/hooks/useEmailQuery";
import { emailApi } from "@/services/emailServer";
import { PageShell, EmptyState, ErrorState, LoadingRow } from "@/components/admin/email/PageShell";
import { ConfirmDialog } from "@/components/admin/email/ConfirmDialog";
import { AdminToast } from "@/components/admin/AdminToast";
import type { SenderIdentity, SenderInput } from "@/types/emailServer";

const inputCls =
  "w-full rounded-md border border-[#1F1F23] bg-[#0a0c16] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-500";

export default function SendersPage() {
  const { data, error, loading, refresh } = useEmailQuery(() => emailApi.listSenders());

  const [dialog, setDialog] = useState<null | "add" | "edit">(null);
  const [editing, setEditing] = useState<SenderIdentity | null>(null);
  const [form, setForm] = useState<SenderInput & { isActive?: boolean }>({
    displayName: "",
    email: "",
    replyTo: "",
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SenderIdentity | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  function openAdd() {
    setForm({ displayName: "", email: "", replyTo: "", isDefault: false });
    setEditing(null);
    setDialog("add");
  }

  function openEdit(s: SenderIdentity) {
    setForm({
      displayName: s.display_name,
      email: s.email,
      replyTo: s.reply_to ?? "",
      isDefault: s.is_default,
      isActive: s.is_active,
    });
    setEditing(s);
    setDialog("edit");
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        replyTo: form.replyTo?.trim() || null,
      };
      if (dialog === "add") {
        await emailApi.createSender(payload);
        setToast({ message: "Sender added", variant: "success" });
      } else if (editing) {
        await emailApi.updateSender(editing.id, payload);
        setToast({ message: "Sender updated", variant: "success" });
      }
      setDialog(null);
      await refresh();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Save failed", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await emailApi.deleteSender(deleteTarget.id);
      setToast({ message: "Sender removed", variant: "success" });
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Delete failed", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleDefault(s: SenderIdentity) {
    try {
      await emailApi.updateSender(s.id, { isDefault: true });
      await refresh();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Update failed", variant: "error" });
    }
  }

  return (
    <>
      <PageShell
        title="Sender identities"
        description="SES-verified From addresses and Reply-To defaults shown in campaign dropdowns"
        breadcrumbs={[{ label: "Email", href: "/admin/email" }, { label: "Senders" }]}
        onRefresh={refresh}
        actions={
          <Button onClick={openAdd} className="bg-sky-500 text-white hover:bg-sky-400">
            <Plus className="h-4 w-4" /> Add sender
          </Button>
        }
      >
        {error && <ErrorState message={error.message} />}

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1F1F23] hover:bg-transparent">
                  <TableHead className="text-gray-400">Display name</TableHead>
                  <TableHead className="text-gray-400">From address</TableHead>
                  <TableHead className="text-gray-400">Reply-To</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <><LoadingRow cols={5} /><LoadingRow cols={5} /></>
                ) : !data?.length ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        title="No senders configured"
                        description="Add a SES-verified From address to use in campaigns."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((s) => (
                    <TableRow key={s.id} className="border-[#1F1F23] hover:bg-[#1F1F23]/40">
                      <TableCell className="font-medium text-white">
                        <span className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-sky-400" />
                          {s.display_name}
                          {s.is_default && (
                            <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                              DEFAULT
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-300">{s.email}</TableCell>
                      <TableCell className="text-sm text-gray-400">{s.reply_to ?? "—"}</TableCell>
                      <TableCell>
                        {s.is_active ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!s.is_default && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[#1F1F23] text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10"
                              title="Set as default"
                              onClick={() => toggleDefault(s)}
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#1F1F23] text-gray-300"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                            onClick={() => setDeleteTarget(s)}
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

      {/* Add / Edit dialog */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {dialog === "add" ? "Add sender" : "Edit sender"}
              </h2>
              <button
                onClick={() => setDialog(null)}
                className="rounded p-1 text-gray-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">
                  Display name <span className="text-rose-400">*</span>
                </span>
                <input
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="BSERC Notifications"
                  className={inputCls}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">
                  From email <span className="text-rose-400">*</span>
                  <span className="ml-1 normal-case text-gray-500">(must be SES-verified)</span>
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="bulkemail@peltown.com"
                  className={inputCls}
                  disabled={dialog === "edit"}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">
                  Reply-To (optional)
                </span>
                <input
                  type="email"
                  value={form.replyTo ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, replyTo: e.target.value }))}
                  placeholder="support@bserc.org"
                  className={inputCls}
                />
              </label>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isDefault ?? false}
                    onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="h-4 w-4 rounded border-[#1F1F23] bg-[#0a0c16] accent-sky-500"
                  />
                  Set as default sender
                </label>

                {dialog === "edit" && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.isActive ?? true}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="h-4 w-4 rounded border-[#1F1F23] bg-[#0a0c16] accent-sky-500"
                    />
                    Active
                  </label>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-[#1F1F23] text-gray-300"
                onClick={() => setDialog(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={submitting || !form.displayName.trim() || !form.email.trim()}
                onClick={handleSave}
                className="bg-sky-500 text-white hover:bg-sky-400"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {dialog === "add" ? "Add sender" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove sender?"
        description={deleteTarget ? `Remove "${deleteTarget.display_name}" (${deleteTarget.email})? Existing campaigns are not affected.` : ""}
        variant="destructive"
        confirmText="Remove"
        loading={submitting}
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
