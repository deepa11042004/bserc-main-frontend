"use client";

import { use, useState } from "react";
import { Loader2 } from "lucide-react";
import { TemplateForm } from "@/components/admin/email/TemplateForm";
import { PageShell, ErrorState } from "@/components/admin/email/PageShell";
import { AdminToast } from "@/components/admin/AdminToast";
import { useEmailQuery } from "@/hooks/useEmailQuery";
import { emailApi } from "@/services/emailServer";

export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const templateId = Number(id);
  const { data, loading, error, refresh } = useEmailQuery(
    () => emailApi.getTemplate(templateId),
    [templateId]
  );
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  return (
    <>
      <PageShell
        title={data ? `Edit "${data.template_name}"` : "Edit template"}
        breadcrumbs={[
          { label: "Email", href: "/admin/email" },
          { label: "Templates", href: "/admin/email/templates" },
          { label: data?.template_name ?? "Edit" },
        ]}
        onRefresh={refresh}
      >
        {error && <ErrorState message={error.message} />}
        {loading && (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading template…
          </div>
        )}
        {data && (
          <TemplateForm
            initial={data}
            onSaved={(t) => {
              setToast({ message: `Saved "${t.template_name}"`, variant: "success" });
              refresh();
            }}
            onError={(message) => setToast({ message, variant: "error" })}
          />
        )}
      </PageShell>

      <AdminToast
        open={!!toast}
        message={toast?.message ?? ""}
        variant={toast?.variant ?? "info"}
        onClose={() => setToast(null)}
      />
    </>
  );
}
