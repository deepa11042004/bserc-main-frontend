"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EmailGate, EmailLogoutButton } from "@/components/admin/email/EmailGate";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/email", label: "Dashboard" },
  { href: "/admin/email/templates", label: "Templates" },
  { href: "/admin/email/campaigns", label: "Campaigns" },
  { href: "/admin/email/failed-emails", label: "Failed" },
  { href: "/admin/email/queue-health", label: "Queue Health" },
];

export default function EmailModuleLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";

  const isActive = (href: string) => {
    if (href === "/admin/email") return pathname === "/admin/email";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <EmailGate>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F1F23] pb-3">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive(tab.href)
                    ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30"
                    : "text-gray-400 hover:bg-[#1F1F23] hover:text-white"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <EmailLogoutButton />
        </div>
        {children}
      </div>
    </EmailGate>
  );
}
