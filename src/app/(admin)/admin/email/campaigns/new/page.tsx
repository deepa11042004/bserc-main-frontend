"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CampaignForm } from "@/components/admin/email/CampaignForm";
import { PageShell } from "@/components/admin/email/PageShell";
import { AdminToast } from "@/components/admin/AdminToast";
import { CampaignSuccessModal } from "@/components/admin/email/CampaignSuccessModal";
import type { CampaignCreateResponse } from "@/types/emailServer";

export default function NewCampaignPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [successResult, setSuccessResult] = useState<CampaignCreateResponse | null>(null);
  const [lastCampaignName, setLastCampaignName] = useState<string>("");

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
          onCreated={(result, name) => {
            setLastCampaignName(name ?? "");
            setSuccessResult(result);
          }}
          onError={(message) => setToast({ message, variant: "error" })}
        />
      </PageShell>

      <CampaignSuccessModal
        open={!!successResult}
        result={successResult}
        campaignId={successResult?.campaignId}
        campaignName={lastCampaignName}
        onClose={() => {
          setSuccessResult(null);
          router.push("/admin/email/campaigns");
        }}
        onView={() => {
          const id = successResult?.campaignId;
          setSuccessResult(null);
          if (id) router.push(`/admin/email/campaigns/${id}`);
        }}
      />

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
