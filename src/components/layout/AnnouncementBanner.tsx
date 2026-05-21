"use client";

import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";

import type { AnnouncementBanner, AnnouncementSection } from "@/types/announcementBanner";

type AnnouncementBannerApiResponse = {
  data?: unknown;
  message?: unknown;
  error?: unknown;
};

type AnnouncementBannerProps = {
  section: AnnouncementSection;
  className?: string;
};

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }

  return false;
}

function toPositiveInt(value: unknown): number {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : 0;
}

function toNullablePositiveInt(value: unknown): number | null {
  const numeric = Number(value);

  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
}

function toSection(value: unknown): AnnouncementSection | null {
  const cleaned = toText(value).toLowerCase();

  if (cleaned === "summer-school" || cleaned === "summer-internship") {
    return cleaned;
  }

  return null;
}

function isExternalUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("http://") || normalized.startsWith("https://");
}

function normalizeBanner(item: unknown): AnnouncementBanner | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const row = item as Record<string, unknown>;
  const id = toPositiveInt(row.id);
  const section = toSection(row.section);
  const title = toText(row.title || row.message || row.text);
  const link = toText(row.link || row.href || row.url);

  if (!id || !section || !title || !link) {
    return null;
  }

  return {
    id,
    section,
    title,
    link,
    is_active: toBoolean(row.is_active),
    position: toNullablePositiveInt(row.position),
  };
}

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const root = payload as AnnouncementBannerApiResponse;

  if (typeof root.message === "string" && root.message.trim()) {
    return root.message.trim();
  }

  if (typeof root.error === "string" && root.error.trim()) {
    return root.error.trim();
  }

  return "";
}

async function fetchAnnouncementBanners(url: string): Promise<AnnouncementBannerApiResponse> {
  const response = await fetch(url, { method: "GET" });
  const payload = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    throw new Error(getApiMessage(payload) || "Unable to load announcement banner.");
  }

  return payload as AnnouncementBannerApiResponse;
}

export default function AnnouncementBanner({ section, className }: AnnouncementBannerProps) {
  const { data, error } = useSWR<AnnouncementBannerApiResponse>(
    `/api/announcement-banners?section=${encodeURIComponent(section)}`,
    fetchAnnouncementBanners,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 2 * 60 * 1000,
    },
  );

  const banners = useMemo(() => {
    const items = Array.isArray(data?.data) ? data?.data : [];
    return items
      .map(normalizeBanner)
      .filter((item): item is AnnouncementBanner => Boolean(item))
      .sort((a, b) => {
        const aPosition = a.position ?? Number.MAX_SAFE_INTEGER;
        const bPosition = b.position ?? Number.MAX_SAFE_INTEGER;

        if (aPosition !== bPosition) {
          return aPosition - bPosition;
        }

        return b.id - a.id;
      });
  }, [data]);

  if (error || banners.length === 0) {
    return null;
  }

  const classes = `w-full bg-red-600 text-white px-4 py-2 text-sm sm:text-base font-semibold ${className || ""}`.trim();
  const linkClasses = "text-blue-200 hover:text-blue-100 underline underline-offset-2 font-semibold";

  return (
    <div className="w-full">
      {banners.map((banner) => {
        const href = banner.link;

        return (
          <div key={banner.id} className={classes}>
            <div className="max-w-7xl mx-auto text-center leading-snug">
              <span>{banner.title}</span>
              <span className="ml-2">
                {isExternalUrl(href) ? (
                  <a
                    href={href}
                    className={linkClasses}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open link for ${banner.title}`}
                  >
                    Click here
                  </a>
                ) : (
                  <Link
                    href={href}
                    prefetch={false}
                    className={linkClasses}
                    aria-label={`Open link for ${banner.title}`}
                  >
                    Click here
                  </Link>
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
