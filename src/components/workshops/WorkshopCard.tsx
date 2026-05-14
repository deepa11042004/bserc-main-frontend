"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  IndianRupee,
  Laptop,
  UserRound,
} from "lucide-react";

import type { Workshop } from "@/types/workshop";

const FALLBACK_IMAGE = "/img/bserc_new_logo.png";

function formatDate(value: string): string {
  if (!value) {
    return "TBA";
  }

  const normalizedValue = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T');
  const utcValue = normalizedValue.endsWith('Z') ? normalizedValue : `${normalizedValue}Z`;
  const date = new Date(utcValue);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit",
    month: "short",
    year: "numeric", });
}

function formatTime(value: string): string {
  if (!value) {
    return "TBA";
  }

  const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return value;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit",
    minute: "2-digit",
    hour12: true, });
}

function formatFee(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "Free";
  }

  return `Rs ${value.toLocaleString("en-IN")}`;
}

function formatMode(value: string): string {
  if (!value) {
    return "Not specified";
  }

  const normalized = value.trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function WorkshopCard({ workshop }: { workshop: Workshop }) {
  const registerHref = `/workshops/${encodeURIComponent(workshop.id)}`;
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    // Reset in case navigation is interrupted.
    const timeoutId = window.setTimeout(() => {
      setIsNavigating(false);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [isNavigating]);

  const handleRegisterClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isNavigating) {
      event.preventDefault();
      return;
    }

    // Respect modifier clicks that intentionally open new tabs/windows.
    const hasModifier =
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (event.button !== 0 || hasModifier) {
      return;
    }

    setIsNavigating(true);
  };

  return (
    <article className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-[#1E90FF]/10 to-[#FF6B35]/10 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-sky-400/60 hover:shadow-[0_0_22px_rgba(56,189,248,0.55)]">
      <div className="mb-4 h-[160px] overflow-hidden rounded-lg bg-zinc-900/80">
        <img
          src={workshop.thumbnailUrl}
          alt={workshop.title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            const target = event.currentTarget;
            if (target.src.includes(FALLBACK_IMAGE)) {
              return;
            }
            target.src = FALLBACK_IMAGE;
          }}
        />
      </div>

      <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-white">
        {workshop.title}
      </h3>
      <p className="mb-4 line-clamp-3 text-sm text-zinc-300">
        {workshop.description}
      </p>

      <div className="grid grid-cols-1 gap-2 text-sm text-zinc-200 sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-sky-400" />
          <span>{formatDate(workshop.workshopDate)}</span>
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-sky-400" />
          <span>{formatTime(workshop.startTime)}</span>
        </p>
        <p className="flex items-center gap-2">
          <Laptop className="h-4 w-4 text-sky-400" />
          <span>{formatMode(workshop.mode)}</span>
        </p>
        <p className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-sky-400" />
          <span>{formatFee(workshop.fee)}</span>
        </p>
      </div>

      <p className="mt-3 flex items-start gap-2 text-sm text-zinc-300">
        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
        <span className="line-clamp-2">{workshop.eligibility}</span>
      </p>

      <div className="mt-5">
        <Link
          href={registerHref}
          prefetch={false}
          onClick={handleRegisterClick}
          aria-busy={isNavigating}
          className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
            isNavigating
              ? "cursor-wait bg-sky-600 opacity-90"
              : "bg-sky-500 hover:bg-sky-400"
          }`}
        >
          {isNavigating ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M22 12a10 10 0 0 0-10-10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-80"
                />
              </svg>
              Opening...
            </>
          ) : (
            "Register"
          )}
        </Link>
      </div>
    </article>
  );
}
