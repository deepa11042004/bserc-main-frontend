"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />
      <div className="relative w-full max-w-sm rounded-lg border border-[#1F1F23] bg-[#0F0F12] p-5 shadow-xl">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-gray-400">{description}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="border-[#1F1F23] text-gray-300"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              variant === "destructive"
                ? "bg-rose-600 text-white hover:bg-rose-500"
                : "bg-sky-500 text-white hover:bg-sky-400"
            )}
          >
            {loading ? "Working…" : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
