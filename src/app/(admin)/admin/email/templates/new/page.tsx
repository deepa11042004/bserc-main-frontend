"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateForm } from "@/components/admin/email/TemplateForm";
import { PageShell } from "@/components/admin/email/PageShell";
import { AdminToast } from "@/components/admin/AdminToast";

export default function NewTemplatePage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  return (
    <>
      <PageShell
        title="New template"
        description="Create a reusable email template with {{placeholders}}"
        breadcrumbs={[
          { label: "Email", href: "/admin/email" },
          { label: "Templates", href: "/admin/email/templates" },
          { label: "New" },
        ]}
      >
        <TemplateForm
          onSaved={(t) => {
            setToast({ message: `Created "${t.template_name}"`, variant: "success" });
            router.push(`/admin/email/templates/${t.id}`);
          }}
          onError={(message) => setToast({ message, variant: "error" })}
        />
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
