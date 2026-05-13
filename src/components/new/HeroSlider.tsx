"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useSWR from "swr";

import type { HeroSlide, HeroMediaType } from "@/types/heroSlide";

type HeroSlidesResponse = {
  data?: unknown;
  message?: unknown;
  error?: unknown;
};

const HERO_SECTION_SIZE_CLASS =
  "w-full aspect-[16/9] min-h-[420px] max-h-[90vh] md:min-h-[560px]";

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableText(value: unknown): string | null {
  const cleaned = toText(value);
  return cleaned || null;
}

function toPositiveInt(value: unknown): number {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : 0;
}

function toMediaType(value: unknown): HeroMediaType | null {
  const cleaned = toText(value).toLowerCase();

  if (cleaned === "image" || cleaned === "video") {
    return cleaned;
  }

  return null;
}

function toSafeHref(value: string | null | undefined, fallback: string): string {
  const cleaned = toText(value);

  if (!cleaned) {
    return fallback;
  }

  if (
    cleaned.startsWith("/")
    || cleaned.startsWith("http://")
    || cleaned.startsWith("https://")
    || cleaned.startsWith("mailto:")
    || cleaned.startsWith("tel:")
    || cleaned.startsWith("#")
  ) {
    return cleaned;
  }

  return fallback;
}

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const root = payload as HeroSlidesResponse;

  if (typeof root.message === "string" && root.message.trim()) {
    return root.message.trim();
  }

  if (typeof root.error === "string" && root.error.trim()) {
    return root.error.trim();
  }

  return "";
}

function normalizeSlide(item: unknown): HeroSlide | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const row = item as Record<string, unknown>;
  const id = toPositiveInt(row.id);
  const mediaType = toMediaType(row.media_type);

  if (!id || !mediaType) {
    return null;
  }

  // Prefer the URL provided by the API; fall back to the canonical media endpoint
  const backendMediaUrl = toText(row.media_url);
  const mediaUrl = backendMediaUrl || `/api/hero-slides/${id}/media`;

  return {
    id,
    title: toText(row.title),
    subtitle: toNullableText(row.subtitle),
    description: toNullableText(row.description),
    badge_text: toNullableText(row.badge_text),
    media_type: mediaType,
    media_mime_type: toNullableText(row.media_mime_type),
    media_url: mediaUrl,
    cta_text: toNullableText(row.cta_text),
    cta_link: toNullableText(row.cta_link),
    secondary_cta_text: toNullableText(row.secondary_cta_text),
    secondary_cta_link: toNullableText(row.secondary_cta_link),
    position: toPositiveInt(row.position) || id,
    is_active: typeof row.is_active === "boolean" ? row.is_active : undefined,
    created_at: toNullableText(row.created_at),
    updated_at: toNullableText(row.updated_at),
  };
}

import ViewportGate from "@/components/perf/ViewportGate";

export default function HeroSlider() {
  return (
    <ViewportGate rootMargin="400px" once>
      <HeroSliderInner />
    </ViewportGate>
  );
}

function HeroSliderInner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHoveringNav, setIsHoveringNav] = useState(false);

  const fetchSlides = useCallback(async (url: string) => {
    const response = await fetch(url, { method: "GET" });
    const payload = (await response.json().catch(() => ({}))) as unknown;

    if (!response.ok) {
      throw new Error(getApiMessage(payload) || "Unable to load hero slides.");
    }

    return payload as HeroSlidesResponse;
  }, []);

  const { data, error, isLoading } = useSWR<HeroSlidesResponse>(
    "/api/hero-slides",
    fetchSlides,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 5 * 60 * 1000,
    },
  );

  const slides = useMemo(() => {
    const items = Array.isArray(data?.data) ? data?.data : [];
    return items
      .map(normalizeSlide)
      .filter((slide): slide is HeroSlide => Boolean(slide))
      .sort((a, b) => a.position - b.position || a.id - b.id);
  }, [data]);

  const loadError = error instanceof Error && error.message ? error.message : "";

  const totalSlides = slides.length;

  useEffect(() => {
    if (currentSlide >= totalSlides && totalSlides > 0) {
      setCurrentSlide(0);
    }
  }, [currentSlide, totalSlides]);

  const changeSlide = useCallback(
    (direction: "next" | "prev") => {
      if (isTransitioning || totalSlides <= 1) return;
      setIsTransitioning(true);
      setCurrentSlide((prev) => (direction === "next" ? (prev + 1) % totalSlides : (prev - 1 + totalSlides) % totalSlides));
      window.setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning, totalSlides],
  );

  useEffect(() => {
    if (totalSlides <= 1) return undefined;
    const timer = window.setInterval(() => setCurrentSlide((prev) => (prev + 1) % totalSlides), 7000);
    return () => window.clearInterval(timer);
  }, [totalSlides]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") changeSlide("next");
      if (event.key === "ArrowLeft") changeSlide("prev");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeSlide]);

  const current = useMemo(() => slides[currentSlide] || null, [slides, currentSlide]);

  if (isLoading) {
    return <section className={`${HERO_SECTION_SIZE_CLASS} animate-pulse bg-zinc-950`} aria-label="Loading hero" />;
  }

  if (!current) {
    return (
      <section className={`${HERO_SECTION_SIZE_CLASS} bg-black text-white flex items-center justify-center px-6 text-center`}>
        <p className="text-sm text-zinc-400">{loadError || "No active hero slides available."}</p>
      </section>
    );
  }

  return (
    <section
      className={`relative ${HERO_SECTION_SIZE_CLASS} overflow-hidden bg-black group`}
      onMouseEnter={() => setIsHoveringNav(true)}
      onMouseLeave={() => setIsHoveringNav(false)}
    >
      {slides.map((slide, index) => {
        const badgeText = toText(slide.badge_text);
        const headingText = toText(slide.title);
        const subheadingText = toText(slide.subtitle);
        const descriptionText = toText(slide.description);
        const primaryCtaText = toText(slide.cta_text);
        const primaryCtaLink = toSafeHref(slide.cta_link, "#");
        const secondaryCtaText = toText(slide.secondary_cta_text);
        const secondaryCtaLink = toSafeHref(slide.secondary_cta_link, "#");
        const hasOverlayContent = Boolean(badgeText || headingText || subheadingText || descriptionText || primaryCtaText || secondaryCtaText);

        // Render media only for the current slide and its immediate neighbors to avoid aggressive bandwidth use
        const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
        const nextIndex = (currentSlide + 1) % totalSlides;
        const shouldRenderMedia = index === currentSlide || index === prevIndex || index === nextIndex;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
          >
            {shouldRenderMedia ? (
              slide.media_type === "video" ? (
                <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata">
                  <source src={slide.media_url} type={slide.media_mime_type || "video/mp4"} />
                </video>
              ) : (
                <img src={slide.media_url} alt={slide.title || "Hero slide"} className="absolute inset-0 h-full w-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
              )
            ) : (
              <div className="absolute inset-0 h-full w-full bg-black" />
            )}

            {hasOverlayContent ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/50" />

                <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
                  <div className="relative mx-auto max-w-5xl text-center text-white">
                    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-3 h-32 w-56 -translate-x-1/2 rounded-full bg-cyan-400/25 blur-3xl" />

                    {badgeText ? (
                      <p className="relative inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-400/5 px-7 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/95">{badgeText}</p>
                    ) : null}

                    {headingText ? (
                      <h1 className="mt-7 whitespace-pre-line font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] font-bold tracking-tight text-white">{headingText}</h1>
                    ) : null}

                    {subheadingText ? (
                      <h2 className="mt-6 text-xl sm:text-2xl md:text-4xl font-semibold text-yellow-400">{subheadingText}</h2>
                    ) : null}

                    {descriptionText ? (
                      <p className="mt-6 mx-auto max-w-3xl whitespace-pre-line text-sm sm:text-base md:text-lg leading-relaxed text-zinc-300/95">{descriptionText}</p>
                    ) : null}

                    {primaryCtaText || secondaryCtaText ? (
                      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        {primaryCtaText ? (
                          <Link href={primaryCtaLink} className="inline-flex items-center rounded-xl bg-cyan-400 px-9 py-3.5 text-lg font-semibold text-black shadow-[0_0_26px_rgba(34,211,238,0.38)] transition hover:bg-cyan-300">{primaryCtaText}</Link>
                        ) : null}

                        {secondaryCtaText ? (
                          <Link href={secondaryCtaLink} className="inline-flex items-center rounded-xl border border-white/25 bg-black/35 px-9 py-3.5 text-lg font-semibold text-white transition hover:border-cyan-300/55 hover:bg-black/50">{secondaryCtaText}</Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        );
      })}

      {loadError ? (
        <div className="absolute top-3 left-1/2 z-40 -translate-x-1/2 rounded-md border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">{loadError}</div>
      ) : null}

      {totalSlides > 1 ? (
        <>
          <div className="absolute inset-x-4 inset-y-auto bottom-4 md:inset-y-0 md:left-0 md:right-0 flex items-center justify-between px-2 sm:px-4 md:px-8 z-30 pointer-events-none">
            <button onClick={() => changeSlide("prev")} disabled={isTransitioning} className={`pointer-events-auto p-2 sm:p-3 md:p-4 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/50 hover:border-cyan-400/50 hover:scale-110 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${isHoveringNav ? "opacity-100 translate-x-0" : "opacity-70 -translate-x-2"}`} aria-label="Previous slide">
              <ChevronLeft size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8" />
            </button>

            <button onClick={() => changeSlide("next")} disabled={isTransitioning} className={`pointer-events-auto p-2 sm:p-3 md:p-4 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/50 hover:border-cyan-400/50 hover:scale-110 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${isHoveringNav ? "opacity-100 translate-x-0" : "opacity-70 translate-x-2"}`} aria-label="Next slide">
              <ChevronRight size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8" />
            </button>
          </div>

          <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3">
            {slides.map((slide, index) => {
              const isActive = index === currentSlide;
              return (
                <button key={slide.id} onClick={() => { if (isTransitioning || isActive) return; setIsTransitioning(true); setCurrentSlide(index); window.setTimeout(() => setIsTransitioning(false), 500); }} className={`h-2.5 rounded-full transition-all duration-300 ${isActive ? "w-7 bg-cyan-400" : "w-2.5 bg-zinc-500 hover:bg-zinc-300"}`} aria-label={`Go to slide ${index + 1}`} />
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}