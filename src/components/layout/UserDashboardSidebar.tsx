"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  Activity,
  Award,
  BookOpen,
  Download,
  FileText,
  Heart,
  HelpCircle,
  LifeBuoy,
  Menu,
  Settings,
  UserCircle2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  count?: number;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type UserDashboardSidebarProps = {
  user: AuthUser | null;
  workshopCount?: number;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
  onMobileClose: () => void;
  onLogout: () => void;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildDisplayName(user: AuthUser | null): string {
  const candidates = [
    normalizeText(user?.full_name),
    normalizeText(user?.name),
    normalizeText(user?.email),
  ];

  for (const value of candidates) {
    if (value) {
      return value;
    }
  }

  return "Workshop User";
}

function buildUserEmail(user: AuthUser | null): string {
  return normalizeText(user?.email) || "No email available";
}

function buildProfilePictureUrl(user: AuthUser | null): string {
  return normalizeText(user?.profile_picture_url);
}

function getInitials(value: string): string {
  const words = value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (!words.length) {
    return "WU";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/profile") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function DashboardNavContent({
  user,
  workshopCount,
  onLogout,
  onNavigate,
}: {
  user: AuthUser | null;
  workshopCount?: number;
  onLogout: () => void;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const fullName = buildDisplayName(user);
  const email = buildUserEmail(user);
  const initials = getInitials(fullName);
  const profilePictureUrl = buildProfilePictureUrl(user);

  const sections: NavSection[] = [
    {
      title: "Main",
      items: [
        { label: "My Profile", href: "/profile", icon: UserCircle2 },
        {
          label: "My Workshops",
          href: "/profile/workshops",
          icon: BookOpen,
          count: workshopCount,
        },
        { label: "Certificates", href: "/profile/certificates", icon: Award },
        { label: "Wishlist", href: "/profile/wishlist", icon: Heart },
      ],
    },
    {
      title: "Activity",
      items: [
        { label: "Progress", href: "/profile/progress", icon: Activity },
        { label: "Downloads", href: "/profile/downloads", icon: Download },
      ],
    },
    {
      title: "Support & Info",
      items: [
        { label: "Attendance", href: "/profile/attendance", icon: Activity },
        { label: "Settings", href: "/profile/settings", icon: Settings },
        { label: "Help Desk", href: "/help-desk", icon: LifeBuoy },
        { label: "FAQ", href: "/more/faq", icon: HelpCircle },
        {
          label: "Terms & Conditions",
          href: "/bserc-policies/terms-and-conditions",
          icon: FileText,
        },
        {
          label: "Refund Policy",
          href: "/bserc-policies/refund-policy",
          icon: FileText,
        },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/profile"
        prefetch={false}
        onClick={onNavigate}
        className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3 text-slate-100 transition hover:border-cyan-500/60"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/70 to-blue-500/70 text-sm font-semibold text-white">
            {profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profilePictureUrl}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{fullName}</p>
            <p className="truncate text-xs text-slate-300">{email}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-cyan-200/90">
          Enrolled Workshops: {workshopCount ?? 0}
        </p>
      </Link>

      <div className="mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {section.title}
            </p>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition",
                      active
                        ? "bg-cyan-500/20 text-cyan-100"
                        : "text-slate-300 hover:bg-slate-800 hover:text-slate-100",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {typeof item.count === "number" && item.count > 0 ?
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px] text-cyan-100">
                        {item.count}
                      </span>
                    : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="destructive"
        className="mt-4 h-9 justify-start border-rose-500 bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
        onClick={onLogout}
      >
        Logout
      </Button>
    </div>
  );
}

export function UserDashboardSidebar({
  user,
  workshopCount,
  isMobileOpen,
  onMobileToggle,
  onMobileClose,
  onLogout,
}: UserDashboardSidebarProps) {
  return (
    <>
      <div className="mb-3 flex lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="border-slate-700 bg-slate-900/90 text-slate-100 hover:bg-slate-800"
          onClick={onMobileToggle}
        >
          <Menu className="mr-2 h-4 w-4" />
          Dashboard Menu
        </Button>
      </div>

      <aside className="hidden w-80 shrink-0 rounded-2xl border border-slate-800 bg-slate-900/75 p-4 lg:block">
        <DashboardNavContent
          user={user}
          workshopCount={workshopCount}
          onLogout={onLogout}
          onNavigate={() => undefined}
        />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="flex-1 bg-black/55"
            onClick={onMobileClose}
            aria-label="Close dashboard menu"
          />
          <aside className="h-full w-[84vw] max-w-sm border-l border-slate-700 bg-slate-950 p-4">
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={onMobileClose}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DashboardNavContent
              user={user}
              workshopCount={workshopCount}
              onLogout={onLogout}
              onNavigate={onMobileClose}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
