"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell, ErrorState } from "@/components/admin/email/PageShell";
import { StatusBadge } from "@/components/admin/email/StatusBadge";
import { useEmailQuery } from "@/hooks/useEmailQuery";
import { emailApi } from "@/services/emailServer";
import { PlaceholderCanvasEditor } from "@/components/admin/certificates/PlaceholderCanvasEditor";
import type { PlaceholderInput } from "@/types/emailServer";

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const templateId = Number(id);

  const { data, error, refresh } = useEmailQuery(
    () => emailApi.getCertTemplate(templateId),
    [templateId]
  );

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onDelete = async () => {
    if (
      !confirm(
        "Delete this template? Existing batches that reference it will keep working."
      )
    ) {
      return;
    }
    try {
      await emailApi.deleteCertTemplate(templateId);
      router.push("/admin/certificates");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    }
  };

  const onSavePlaceholders = async (placeholders: PlaceholderInput[]) => {
    await emailApi.replaceCertPlaceholders(templateId, placeholders);
    await refresh();
  };

  return (
    <PageShell
      title={data?.name ?? "Template"}
      description={
        data?.description ??
        "Drag fields onto the certificate image to position them"
      }
      breadcrumbs={[
        { label: "Certificates", href: "/admin/certificates" },
        { label: data?.name ?? `Template ${templateId}` },
      ]}
      onRefresh={refresh}
      actions={
        <>
          {data && <StatusBadge status={data.status} />}
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" /> Delete
          </Button>
        </>
      }
    >
      {error && <ErrorState message={error.message} />}
      {deleteError && <ErrorState message={deleteError} />}

      <Card className="bg-[#0F0F12] ring-[#1F1F23]">
        <CardHeader className="border-b border-[#1F1F23] pb-3">
          <CardTitle className="text-white">Layout editor</CardTitle>
          <p className="mt-1 text-xs text-gray-500">
            Click <em>Add text field</em>, <em>Add serial number</em>, or <em>Add QR code</em>,
            then drag the marker on the image to place it. Edit field properties in the panel
            on the right.
          </p>
        </CardHeader>
        <CardContent>
          {!data ? (
            <p className="py-12 text-center text-sm text-gray-500">Loading…</p>
          ) : (
            <PlaceholderCanvasEditor
              imageUrl={data.image_url}
              imageWidth={data.image_width}
              imageHeight={data.image_height}
              initial={data.placeholders ?? []}
              onSave={onSavePlaceholders}
            />
          )}
        </CardContent>
      </Card>

      {data && (
        <p className="text-center text-xs text-gray-500">
          Image: {data.image_width} × {data.image_height} px ·{" "}
          {(data.image_size_bytes / 1024).toFixed(1)} KB ·{" "}
          uploaded {new Date(data.created_at).toLocaleString()}
        </p>
      )}
    </PageShell>
  );
}
