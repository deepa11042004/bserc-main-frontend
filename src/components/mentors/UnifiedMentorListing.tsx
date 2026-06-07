"use client";

import { ArrowRight, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { MentorProfile } from "@/types/mentor";

type MentorApiPayload = {
  mentors?: unknown;
  message?: string;
  error?: string;
};

interface UnifiedMentorListingProps {
  badgeLabel?: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  className?: string;
}

interface MentorWithRating extends MentorProfile {
  averageRating?: number;
  totalRatings?: number;
}

function getApiMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  return null;
}

function toMentorList(payload: unknown): MentorProfile[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as MentorApiPayload;

  if (!Array.isArray(record.mentors)) {
    return [];
  }

  return record.mentors.filter(
    (mentor): mentor is MentorProfile =>
      Boolean(mentor)
      && typeof mentor === "object"
      && Number.isInteger(Number((mentor as MentorProfile).id)),
  );
}

function getInitial(name: string): string {
  const letter = name.trim().charAt(0).toUpperCase();
  return letter || "M";
}

function getRole(mentor: MentorProfile): string {
  return mentor.current_position || mentor.organization || "Mentor";
}

function getExpertise(mentor: MentorProfile): string {
  return mentor.primary_track || mentor.key_competencies || "Domain expertise";
}

function getIntro(mentor: MentorProfile): string {
  if (mentor.professional_bio && mentor.professional_bio.trim()) {
    return mentor.professional_bio;
  }

  if (mentor.secondary_skills && mentor.secondary_skills.trim()) {
    return mentor.secondary_skills;
  }

  return "Experienced mentor supporting students through practical guidance and industry insights.";
}

export default function UnifiedMentorListing({
  badgeLabel = "Mentors",
  title = "Active Mentor Network",
  description =
    "Connect with active mentors and domain experts across aerospace, defence, AI, robotics, and innovation tracks.",
  emptyMessage = "No active mentors available right now.",
  className,
}: UnifiedMentorListingProps) {
  const [mentors, setMentors] = useState<MentorWithRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadMentors = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/mentor/list", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          throw new Error(getApiMessage(payload) || "Unable to fetch mentors.");
        }

        if (!isMounted) {
          return;
        }

        const mentorsList = toMentorList(payload);
        
        // Fetch ratings for each mentor
        const mentorsWithRatings = await Promise.all(
          mentorsList.map(async (mentor) => {
            try {
              const ratingResponse = await fetch(`/api/mentor/${mentor.id}/rating/average`);
              if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                return {
                  ...mentor,
                  averageRating: ratingData.average_rating,
                  totalRatings: ratingData.total_ratings,
                };
              }
            } catch (err) {
              console.error(`Error fetching rating for mentor ${mentor.id}:`, err);
            }
            return mentor;
          })
        );

        setMentors(mentorsWithRatings);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setMentors([]);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Unable to fetch mentors.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMentors();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className={className || ""}>
      <div className="mb-8 border-b border-zinc-800 pb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-300">
          {badgeLabel}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400 sm:text-base">
          {description}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-52 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
        </div>
      ) : mentors.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-6 py-10 text-center text-zinc-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mentors.map((mentor) => (
            <Link
              key={mentor.id}
              href={`/careers/mentors/${mentor.id}`}
              className="group"
            >
              <article className="group rounded-2xl border border-zinc-700/70 bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 px-5 py-6 text-center shadow-[0_8px_24px_rgba(0,0,0,0.24)] transition-all duration-300 hover:-translate-y-2 hover:border-cyan-500/50 hover:shadow-[0_12px_32px_rgba(34,211,238,0.15)] cursor-pointer h-full flex flex-col backdrop-blur-sm">
                <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-zinc-600/80 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-[0_4px_14px_rgba(0,0,0,0.28)] transition-all duration-300 group-hover:border-cyan-500/50 group-hover:shadow-[0_8px_20px_rgba(34,211,238,0.2)] group-hover:scale-105">
                  {mentor.has_profile_photo ? (
                    <img
                      src={`/api/mentor/${mentor.id}/profile-photo`}
                      alt={`${mentor.full_name} profile photo`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-100">
                      {getInitial(mentor.full_name)}
                    </div>
                  )}
                </div>

                <h2 className="text-lg font-bold leading-tight text-white group-hover:text-cyan-200 transition-colors duration-300">
                  {mentor.full_name}
                </h2>

                <p className="mt-2 text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors duration-300">
                  {getRole(mentor)}
                </p>

                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">
                  {getExpertise(mentor)}
                </p>

                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-zinc-400 flex-grow">
                  {getIntro(mentor)}
                </p>

                {/* Footer with Rating and More Info */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  {/* Rating Display - Premium Style */}
                  {mentor.averageRating !== undefined && mentor.totalRatings !== undefined && mentor.totalRatings > 0 ? (
                    <div className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 hover:border-amber-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 transition-transform duration-300 group-hover:scale-110 ${
                              star <= Math.round(mentor.averageRating!)
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-700"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-amber-300 group-hover:text-amber-200 transition-colors">
                          {mentor.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-amber-300/60 group-hover:text-amber-300/80 transition-colors">
                          ({mentor.totalRatings})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div></div>
                  )}

                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300 hover:text-cyan-200 transition-all duration-300 group-hover:gap-3">
                    More Info
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
