import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

interface PageShellProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  onRefresh?: () => void;
  children: React.ReactNode;
}

export function PageShell({
  title,
  description,
  breadcrumbs,
  actions,
  onRefresh,
  children,
}: PageShellProps) {
  return (
    <div className="space-y-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-gray-500">
          {breadcrumbs.map((c, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight className="h-3 w-3 text-gray-600" />}
              {c.href ? (
                <Link href={c.href} className="hover:text-gray-300">
                  {c.label}
                </Link>
              ) : (
                <span className="text-gray-400">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#1F1F23] bg-[#0F0F12] px-2.5 py-1 text-xs text-gray-300 hover:bg-[#1F1F23]"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          )}
          {actions}
        </div>
      </div>

      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#1F1F23] bg-[#0F0F12]/40 px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-xs text-gray-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-rose-500/40 bg-rose-950/20 px-4 py-3 text-sm text-rose-200">
      {message}
    </div>
  );
}

export function LoadingRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div className="h-3 w-full animate-pulse rounded bg-[#1F1F23]" />
        </td>
      ))}
    </tr>
  );
}
