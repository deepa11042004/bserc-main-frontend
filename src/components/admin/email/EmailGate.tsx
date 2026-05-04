"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEmailServerAuth } from "@/hooks/useEmailServerAuth";
import { EmailApiError } from "@/services/emailServer";

interface EmailGateProps {
  children: React.ReactNode;
}

export function EmailGate({ children }: EmailGateProps) {
  const { isHydrated, isLoggedIn, login } = useEmailServerAuth();
  const [email, setEmail] = useState("admin@bserc.local");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (isLoggedIn) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg =
        err instanceof EmailApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Login failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#0F0F12] ring-[#1F1F23]">
        <CardHeader className="border-b border-[#1F1F23] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-white">Email Notification Service</CardTitle>
              <CardDescription className="text-gray-400">
                Sign in to the email backend (separate from your BSERC admin)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[#1F1F23] bg-[#0a0c16] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-500"
                placeholder="admin@bserc.local"
                autoComplete="username"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">
                Password
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-[#1F1F23] bg-[#0a0c16] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {error && (
              <div className="rounded-md border border-rose-500/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full bg-sky-500 text-white hover:bg-sky-400"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <p className="text-center text-xs text-gray-500">
              Default: <code className="text-gray-400">admin@bserc.local</code> /{" "}
              <code className="text-gray-400">ChangeMe!2026</code>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmailLogoutButton({ className }: { className?: string }) {
  const { logout, user, isLoggedIn } = useEmailServerAuth();
  if (!isLoggedIn) return null;
  return (
    <button
      type="button"
      onClick={logout}
      className={`inline-flex items-center gap-1.5 rounded-md border border-[#1F1F23] bg-[#0F0F12] px-2.5 py-1 text-xs text-gray-300 hover:bg-[#1F1F23] ${className ?? ""}`}
    >
      <LogOut className="h-3 w-3" />
      <span>{user?.email ? `Logout (${user.email})` : "Logout"}</span>
    </button>
  );
}
