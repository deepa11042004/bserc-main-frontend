"use client";

import {
  Activity,
  Award,
  BookOpen,
  Download,
  FileText,
  Heart,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Settings,
  UserCircle2,
} from "lucide-react";

import Link from "next/link";
import { useState, useRef, useEffect, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardProfile, getMyWorkshops } from "@/services/userDashboard";

type ProfileNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type ProfileNavSection = {
  title: string;
  items: ProfileNavItem[];
};

const PROFILE_NAV_SECTIONS: ProfileNavSection[] = [
  {
    title: "Main",
    items: [
      { label: "My Profile", href: "/profile", icon: UserCircle2 },
      { label: "My Workshops", href: "/profile/workshops", icon: BookOpen },
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

function safeText(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  return fallback;
}

function getInitials(name: string, email: string): string {
  const base = safeText(name) || safeText(email) || "G";
  const words = base
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length <= 1) {
    return base.slice(0, 2).toUpperCase();
  }

  return `${words[0]?.[0] || ""}${words[1]?.[0] || ""}`.toUpperCase();
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/profile") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function StudentProfile() {
  const [open, setOpen] = useState(false);
  const [workshopCount, setWorkshopCount] = useState(0);
  const [profileSnapshot, setProfileSnapshot] = useState({
    full_name: "",
    email: "",
    profile_picture_url: "",
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuth();
  const pathname = usePathname();

  const displayName = safeText(profileSnapshot.full_name)
    || safeText(user?.full_name)
    || safeText(user?.name)
    || "Guest";
  const displayEmail = safeText(profileSnapshot.email)
    || safeText(user?.email)
    || "guest@example.com";
  const profilePictureUrl = safeText(profileSnapshot.profile_picture_url)
    || safeText(user?.profile_picture_url);
  const avatarLabel = getInitials(displayName, displayEmail);

  const handleLogout = () => {
    logout("/login", { scope: "user" });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    const loadDropdownData = async () => {
      const [workshopsResult, profileResult] = await Promise.allSettled([
        getMyWorkshops(),
        getDashboardProfile(),
      ]);

      if (!isMounted) {
        return;
      }

      if (workshopsResult.status === "fulfilled") {
        setWorkshopCount(workshopsResult.value.total);
      } else {
        setWorkshopCount(0);
      }

      if (profileResult.status === "fulfilled") {
        setProfileSnapshot({
          full_name: safeText(profileResult.value.full_name),
          email: safeText(profileResult.value.email),
          profile_picture_url: safeText(profileResult.value.profile_picture_url),
        });
      }
    };

    void loadDropdownData();

    return () => {
      isMounted = false;
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button type="button" onClick={() => setOpen((prev) => !prev)}>
        <div
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#10a5c4] text-white font-semibold text-sm uppercase 
           border border-white/10 hover:scale-105 transition"  >
          {profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profilePictureUrl}
              alt={displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            avatarLabel || "G"
          )}
        </div>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[#355287] ring-1 ring-[#273a63]/60 bg-[#07112a] p-3 shadow-[0_20px_48px_rgba(2,10,28,0.58)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="max-h-[78vh] space-y-3 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="rounded-xl border border-[#2a3b63] bg-[#0a1738] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#0f7fb8] text-sm font-semibold text-white">
                  {profilePictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profilePictureUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarLabel
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                  <p className="truncate text-xs text-[#b6c6e0]">{displayEmail}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#7ee0ff]">
                Enrolled Workshops: {workshopCount}
              </p>
            </div>

            {PROFILE_NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93a9c8]">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? "bg-[#0c3f5a] text-[#dcf6ff]"
                            : "text-[#d2def0] hover:bg-[#112247] hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg text-left text-sm transition border-rose-500 bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
