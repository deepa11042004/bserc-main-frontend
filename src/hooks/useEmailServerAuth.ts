"use client";

import { useCallback, useEffect, useState } from "react";
import { EMAIL_TOKEN_KEY, EMAIL_USER_KEY, emailApi } from "@/services/emailServer";
import type { EmailUser } from "@/types/emailServer";

interface State {
  token: string | null;
  user: EmailUser | null;
  isHydrated: boolean;
}

function decodeExpMs(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function readSession(): { token: string | null; user: EmailUser | null } {
  if (typeof window === "undefined") return { token: null, user: null };
  const token = window.localStorage.getItem(EMAIL_TOKEN_KEY);
  if (!token) return { token: null, user: null };
  const exp = decodeExpMs(token);
  if (!exp || exp <= Date.now()) {
    window.localStorage.removeItem(EMAIL_TOKEN_KEY);
    window.localStorage.removeItem(EMAIL_USER_KEY);
    return { token: null, user: null };
  }
  const userRaw = window.localStorage.getItem(EMAIL_USER_KEY);
  let user: EmailUser | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as EmailUser;
    } catch {
      user = null;
    }
  }
  return { token, user };
}

export function useEmailServerAuth() {
  const [state, setState] = useState<State>({
    token: null,
    user: null,
    isHydrated: false,
  });

  useEffect(() => {
    const { token, user } = readSession();
    setState({ token, user, isHydrated: true });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await emailApi.login(email, password);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(EMAIL_TOKEN_KEY, result.token);
      window.localStorage.setItem(EMAIL_USER_KEY, JSON.stringify(result.user));
    }
    setState({ token: result.token, user: result.user, isHydrated: true });
    return result;
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(EMAIL_TOKEN_KEY);
      window.localStorage.removeItem(EMAIL_USER_KEY);
    }
    setState({ token: null, user: null, isHydrated: true });
  }, []);

  return {
    token: state.token,
    user: state.user,
    isHydrated: state.isHydrated,
    isLoggedIn: Boolean(state.token),
    login,
    logout,
  };
}
