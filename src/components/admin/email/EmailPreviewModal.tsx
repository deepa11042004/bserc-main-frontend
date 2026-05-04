"use client";

import { X } from "lucide-react";
import DOMPurify from "dompurify";
import { useEffect, useMemo } from "react";

interface EmailPreviewModalProps {
  open: boolean;
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  missingPlaceholders?: string[];
  onClose: () => void;
}

export function EmailPreviewModal({
  open,
  subject,
  htmlBody,
  textBody,
  missingPlaceholders,
  onClose,
}: EmailPreviewModalProps) {
  const safeHtml = useMemo(() => {
    if (typeof window === "undefined") return htmlBody;
    return DOMPurify.sanitize(htmlBody, { USE_PROFILES: { html: true } });
  }, [htmlBody]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-[#1F1F23] bg-[#0F0F12] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#1F1F23] px-5 py-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Subject</div>
            <h3 className="text-sm font-semibold text-white">{subject || "(empty subject)"}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-[#1F1F23] hover:text-white"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {missingPlaceholders && missingPlaceholders.length > 0 && (
          <div className="border-b border-amber-500/30 bg-amber-950/20 px-5 py-2 text-xs text-amber-200">
            Missing placeholders rendered as empty:{" "}
            <code className="text-amber-100">{missingPlaceholders.join(", ")}</code>
          </div>
        )}

        <div className="overflow-auto bg-white p-6 text-black">
          <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
        </div>

        {textBody && (
          <div className="border-t border-[#1F1F23] bg-[#0a0c16] p-4">
            <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">Plain text</div>
            <pre className="whitespace-pre-wrap text-xs text-gray-300">{textBody}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
