"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CampaignForm } from "@/components/admin/email/CampaignForm";
import { PageShell } from "@/components/admin/email/PageShell";
import { AdminToast } from "@/components/admin/AdminToast";

export default function NewCampaignPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  return (
    <>
      <PageShell
        title="New campaign"
        description="Choose a template, sender, and recipient source"
        breadcrumbs={[
          { label: "Email", href: "/admin/email" },
          { label: "Campaigns", href: "/admin/email/campaigns" },
          { label: "New" },
        ]}
      >
        <CampaignForm
          onCreated={(result) => {
            setToast({
              message: `Queued campaign #${result.campaignId} (${result.stats.inserted} recipients, ${result.stats.suppressed} suppressed, ${result.stats.duplicates} duplicates)`,
              variant: "success",
            });
            router.push(`/admin/email/campaigns/${result.campaignId}`);
          }}
          onError={(message) => setToast({ message, variant: "error" })}
        />
      </PageShell>
      <AdminToast
        open={!!toast}
        message={toast?.message ?? ""}
        variant={toast?.variant ?? "info"}
        onClose={() => setToast(null)}
        durationMs={5000}
      />
    </>
  );
}
