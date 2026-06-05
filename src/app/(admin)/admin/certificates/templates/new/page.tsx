"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell, ErrorState } from "@/components/admin/email/PageShell";
import { emailApi } from "@/services/emailServer";
import { fileToBase64Input } from "@/lib/fileToBase64";

const ACCEPTED = ["image/png", "image/jpeg"];
const MAX_BYTES = 15 * 1024 * 1024;

export default function NewCertTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFileChange = (f: File | null) => {
    setError(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ACCEPTED.includes(f.type)) {
      setError("Only PNG or JPEG images are supported.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`Image is too large (max ${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB).`);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const image = await fileToBase64Input(file);
      const tpl = await emailApi.createCertTemplate({
        name: name.trim(),
        description: description.trim() || null,
        image: {
          filename: image.filename,
          contentType: file.type === "image/jpeg" ? "image/jpeg" : "image/png",
          data: image.data,
        },
      });
      router.push(`/admin/certificates/templates/${tpl.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <PageShell
      title="New certificate template"
      description="Upload a background image (PNG/JPEG) that will be rendered behind every generated certificate"
      breadcrumbs={[
        { label: "Certificates", href: "/admin/certificates" },
        { label: "New template" },
      ]}
    >
      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400">
                  Template name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                  placeholder="e.g. Internship Completion Certificate"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-[#1F1F23] bg-[#0F0F12] px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400">
                  Background image *
                </label>
                <input
                  required
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-xs text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-sky-400"
                />
                <p className="mt-1 text-xs text-gray-500">
                  PNG or JPEG, up to {(MAX_BYTES / 1024 / 1024).toFixed(0)}MB. Native dimensions become the PDF page size.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={busy || !file || !name.trim()}
                  className="bg-sky-500 text-white hover:bg-sky-400"
                >
                  <Upload className="size-4" /> {busy ? "Uploading…" : "Create template"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F12] ring-[#1F1F23]">
          <CardHeader className="border-b border-[#1F1F23] pb-3">
            <CardTitle className="text-white">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {preview ? (
              <div className="overflow-hidden rounded-md ring-1 ring-[#1F1F23]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Template preview"
                  className="block max-h-[60vh] w-full object-contain bg-[#1F1F23]"
                />
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-[#1F1F23] py-12 text-center text-sm text-gray-500">
                Select an image to preview it here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
