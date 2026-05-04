import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

const tones: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-gray-300",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-rose-400",
  info: "text-sky-400",
};

export function StatCard({ label, value, icon: Icon, hint, tone = "default" }: StatCardProps) {
  return (
    <Card className="bg-[#0F0F12] ring-[#1F1F23]">
      <CardContent className="flex items-start justify-between gap-3 py-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
          <div className={cn("mt-1 text-2xl font-semibold tabular-nums", tones[tone])}>
            {value}
          </div>
          {hint && <div className="mt-0.5 text-xs text-gray-500">{hint}</div>}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F1F23]",
            tones[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  );
}
