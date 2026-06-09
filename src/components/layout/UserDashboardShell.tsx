"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Loader2 } from "lucide-react";

import { UserDashboardSidebar } from "@/components/layout/UserDashboardSidebar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardProfile, getMyWorkshops } from "@/services/userDashboard";
import type { AuthUser } from "@/types/auth";

export function UserDashboardShell({ children }: { children: ReactNode }) {
  const { isHydrated, isLoggedIn, role, user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [workshopCount, setWorkshopCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [dashboardUser, setDashboardUser] = useState<AuthUser | null>(user);

  const isUserSession = isLoggedIn && role === "user";

  useEffect(() => {
    setDashboardUser(user);
  }, [user]);

  useEffect(() => {
    if (!isUserSession) {
      return;
    }

    let isMounted = true;

    const loadDashboardProfile = async () => {
      try {
        const profile = await getDashboardProfile();

        if (!isMounted) {
          return;
        }

        setDashboardUser((prev) => ({
          ...(prev || {}),
          id: profile.id,
          full_name: profile.full_name || undefined,
          name: profile.full_name || undefined,
          email: profile.email || undefined,
          role: profile.role || prev?.role,
          phone: profile.phone || undefined,
          city: profile.city || undefined,
          institution: profile.institution || undefined,
          bio: profile.bio || undefined,
          profile_picture_url: profile.profile_picture_url || undefined,
        }));
      } catch {
        // Keep session profile as fallback when API call fails.
      }
    };

    void loadDashboardProfile();

    return () => {
      isMounted = false;
    };
  }, [isUserSession]);

  useEffect(() => {
    if (!isUserSession) {
      setWorkshopCount(0);
      setNotificationCount(0);
      return;
    }

    let isMounted = true;

    const loadSidebarStats = async () => {
      try {
        const workshops = await getMyWorkshops();

        if (!isMounted) {
          return;
        }

        const safeTotal = Number.isFinite(workshops.total)
          ? workshops.total
          : workshops.data.length;

        setWorkshopCount(Math.max(safeTotal, workshops.data.length));
        setNotificationCount(workshops.recommended.length);
      } catch {
        if (!isMounted) {
          return;
        }

        setWorkshopCount(0);
        setNotificationCount(0);
      }
    };

    void loadSidebarStats();

    return () => {
      isMounted = false;
    };
  }, [isUserSession, pathname]);

  if (!isHydrated) {
    return (
      <div className="min-h-[55vh] bg-slate-950 flex items-center justify-center text-slate-200">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isUserSession) {
    return (
      <div className="min-h-[60vh] bg-slate-950 px-4 py-12 text-slate-100">
        <div className="mx-auto max-w-3xl">
          <Card className="border-slate-800 bg-slate-900/80">
            <CardContent className="space-y-4 py-10 text-center">
              <h1 className="text-2xl font-semibold text-white">User Dashboard</h1>
              <p className="text-sm text-slate-300">
                Please log in with your learner account to access profile, workshops, and certificates.
              </p>
              <Link href="/login" prefetch={false}>
                <Button className="bg-cyan-600 text-white hover:bg-cyan-500">
                  Login to Continue
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 lg:py-8">
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-cyan-200">Learner Workspace</p>
            <p className="text-sm text-slate-300">
              Track your journey, materials, and support requests from one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                aria-label="Dashboard notifications"
              >
                <Bell className="h-4 w-4" />
              </Button>
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-black">
                  {notificationCount}
                </span>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              className="hidden rounded-md border border-rose-500 bg-rose-500 px-4 py-2 text-white hover:bg-rose-600 sm:inline-flex"
              onClick={() => logout("/login", { scope: "user" })}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-5">
          <UserDashboardSidebar
            user={dashboardUser}
            workshopCount={workshopCount}
            isMobileOpen={isMobileOpen}
            onMobileToggle={() => setIsMobileOpen(true)}
            onMobileClose={() => setIsMobileOpen(false)}
            onLogout={() => logout("/login", { scope: "user" })}
          />

          <div className="min-w-0 flex-1 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
