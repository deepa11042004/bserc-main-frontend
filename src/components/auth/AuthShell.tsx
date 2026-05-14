"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  actionLink?: { label: string; href: string };
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  actionLink,
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950 text-white">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(circle at top, rgba(59, 130, 246, 0.2), transparent 45%)," +
              "radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.3), transparent 40%)," +
              "linear-gradient(180deg, rgba(15, 23, 42, 0.6), rgba(2, 6, 23, 0.9))",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="relative bg-slate-900/80 border border-white/10 rounded-3xl shadow-[0_30px_120px_rgba(15,23,42,0.85)] backdrop-blur-xl p-8">
          <header className="mb-6">
            <p className="text-sm uppercase tracking-[0.4em] text-sky-400/80">
              Secure access
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
          </header>

          <div className="space-y-5">{children}</div>

          {(footer || actionLink) && (
            <div className="mt-6 border-t border-white/5 pt-4 text-sm text-slate-300">
              {footer}
              {actionLink && (
                <p className="mt-2">
                  <Link
                    href={actionLink.href}
                    prefetch={false}
                    className={cn(
                      "text-sky-400 font-semibold hover:text-sky-300",
                      "transition-colors duration-200",
                    )}
                  >
                    {actionLink.label}
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
