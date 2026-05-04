"use client";

import { useEffect } from "react";
import { ArrowRight, CheckCircle2, Mail, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CampaignCreateResponse } from "@/types/emailServer";

interface CampaignSuccessModalProps {
  open: boolean;
  result: CampaignCreateResponse | null;
  campaignId?: number;
  campaignName?: string;
  onClose: () => void;
  onView: () => void;
}

function fireConfetti() {
  // Dynamic import so it doesn't block SSR
  import("canvas-confetti").then(({ default: confetti }) => {
    const duration = 2200;
    const end = Date.now() + duration;

    const colors = ["#38bdf8", "#818cf8", "#34d399", "#fb923c", "#f472b6"];

    // Left burst
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.65 },
      colors,
      gravity: 1.1,
    });
    // Right burst
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.65 },
      colors,
      gravity: 1.1,
    });

    // Sustained drizzle
    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 4,
        angle: 90,
        spread: 120,
        origin: { x: Math.random(), y: 0 },
        colors,
        gravity: 0.9,
        scalar: 0.8,
        drift: (Math.random() - 0.5) * 0.5,
      });
      requestAnimationFrame(frame);
    };
    frame();
  });
}

export function CampaignSuccessModal({
  open,
  result,
  campaignId,
  campaignName,
  onClose,
  onView,
}: CampaignSuccessModalProps) {
  useEffect(() => {
    if (open) fireConfetti();
  }, [open]);

  if (!open || !result) return null;

  const { stats } = result;
  const deliveryRate =
    stats.inserted > 0 ? Math.round((stats.inserted / stats.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Blurred dark overlay */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md animate-[modalIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both] rounded-2xl border border-[#2a2a35] bg-[#0d0d14] p-8 shadow-2xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% -20%, rgba(56,189,248,0.08) 0%, #0d0d14 60%)",
        }}
      >
        {/* Glow ring */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-sky-500/20" />

        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 ring-2 ring-sky-500/30">
            <div className="absolute inset-0 animate-ping rounded-full bg-sky-500/10" />
            <CheckCircle2 className="h-10 w-10 text-sky-400" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-1 text-center text-2xl font-bold text-white">
          Campaign launched!
        </div>
        {campaignName && (
          <p className="mb-6 text-center text-sm text-gray-400">
            &ldquo;{campaignName}&rdquo; is now queued for delivery
          </p>
        )}

        {/* Stats grid */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatPill
            icon={<Users className="h-4 w-4 text-sky-400" />}
            value={stats.total}
            label="Total"
          />
          <StatPill
            icon={<Mail className="h-4 w-4 text-emerald-400" />}
            value={stats.inserted}
            label="Queued"
            highlight
          />
          <StatPill
            icon={<Zap className="h-4 w-4 text-amber-400" />}
            value={`${deliveryRate}%`}
            label="Eligible"
          />
        </div>

        {/* Fine print */}
        {(stats.suppressed > 0 || stats.duplicates > 0 || stats.invalid > 0) && (
          <div className="mb-5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-300">
            {stats.suppressed > 0 && (
              <div>{stats.suppressed} suppressed (unsubscribed / bounced)</div>
            )}
            {stats.duplicates > 0 && <div>{stats.duplicates} duplicate emails removed</div>}
            {stats.invalid > 0 && <div>{stats.invalid} invalid addresses skipped</div>}
          </div>
        )}

        {/* Progress bar teaser */}
        <div className="mb-6">
          <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
            <span>Sending progress</span>
            <span>live on dashboard</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a24]">
            <div
              className="h-full animate-[progressFill_1.5s_ease-out_0.5s_both] rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
              style={{ width: "0%", animationFillMode: "forwards" }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-[#2a2a35] text-gray-400 hover:text-white"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-500 font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-400"
            onClick={onView}
          >
            View campaign <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.85) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 28%; }
        }
      `}</style>
    </div>
  );
}

function StatPill({
  icon,
  value,
  label,
  highlight = false,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 ${
        highlight
          ? "border-sky-500/30 bg-sky-500/10"
          : "border-[#1a1a24] bg-[#111118]"
      }`}
    >
      {icon}
      <span
        className={`text-xl font-bold tabular-nums ${
          highlight ? "text-sky-300" : "text-white"
        }`}
      >
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
    </div>
  );
}
