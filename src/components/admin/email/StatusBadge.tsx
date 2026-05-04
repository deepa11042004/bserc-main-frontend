import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // campaign
  DRAFT: "bg-gray-500/15 text-gray-300 ring-gray-500/30",
  QUEUED: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  RUNNING: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  PAUSED: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  FAILED: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  CANCELLED: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  // recipient
  PENDING: "bg-gray-500/15 text-gray-300 ring-gray-500/30",
  SENT: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  DELIVERED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  BOUNCED: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  COMPLAINT: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  SUPPRESSED: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  // template
  ACTIVE: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  DISABLED: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  // queue health
  healthy: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  critical: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-500/15 text-gray-300 ring-gray-500/30";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1",
        cls
      )}
    >
      {status}
    </span>
  );
}
