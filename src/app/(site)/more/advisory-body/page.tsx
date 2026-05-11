"use client";
import { Loader2 } from "lucide-react";
import HeroBanner from "@/components/layout/Banner";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdvisoryProfile } from "@/types/advisory";

type AdvisoryCardItem = {
  id: number;
  name: string;
  role: string;
  affiliation: string;
  bio: string | null;
};

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

function toAdvisoryItems(payload: unknown): AdvisoryCardItem[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as { advisories?: unknown };

  if (!Array.isArray(record.advisories)) {
    return [];
  }

  return record.advisories
    .filter(
      (item): item is AdvisoryProfile =>
        Boolean(item)
        && typeof item === "object"
        && Number.isInteger(Number((item as AdvisoryProfile).id)),
    )
    .map((item) => ({
      id: Number(item.id),
      name: item.full_name || `Advisor ${item.id}`,
      role: item.designation || "Advisory Member",
      affiliation: item.organization_institution || "-",
      bio: item.professional_expertise || null,
    }));
}

// Generate initials from full name (first + last name)
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  const first = parts[0][0].toUpperCase();
  const last = parts[parts.length - 1][0].toUpperCase();
  return `${first}${last}`;
}

// Generate a consistent random color based on the name
const AVATAR_COLORS = [
  { bg: "#4F46E5", text: "#ffffff" }, // indigo
  { bg: "#0891B2", text: "#ffffff" }, // cyan
  { bg: "#059669", text: "#ffffff" }, // emerald
  { bg: "#D97706", text: "#ffffff" }, // amber
  { bg: "#DC2626", text: "#ffffff" }, // red
  { bg: "#7C3AED", text: "#ffffff" }, // violet
  { bg: "#DB2777", text: "#ffffff" }, // pink
  { bg: "#0284C7", text: "#ffffff" }, // sky
  { bg: "#16A34A", text: "#ffffff" }, // green
  { bg: "#EA580C", text: "#ffffff" }, // orange
  { bg: "#9333EA", text: "#ffffff" }, // purple
  { bg: "#0F766E", text: "#ffffff" }, // teal
];

function getAvatarColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// Avatar component using initials
function InitialsAvatar({ name }: { name: string }) {
  const initials = getInitials(name);
  const color = getAvatarColor(name);
  return (
    <div
      style={{ backgroundColor: color.bg, color: color.text }}
      className="w-full h-full flex items-center justify-center text-3xl font-bold select-none"
    >
      {initials}
    </div>
  );
}

export default function AdvisoryBoard() {
  const [advisoryMembers, setAdvisoryMembers] = useState<AdvisoryCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAdvisoryMembers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/advisory/list", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          throw new Error(
            getApiMessage(payload) || "Unable to fetch advisory members.",
          );
        }

        if (!isMounted) {
          return;
        }

        setAdvisoryMembers(toAdvisoryItems(payload));
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setAdvisoryMembers([]);
        setError(
          fetchError instanceof Error && fetchError.message
            ? fetchError.message
            : "Unable to fetch advisory members.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAdvisoryMembers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-black">
      <HeroBanner
        title="Advisory Board"
        backgroundImage="/img/about-hero-v2.webp"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Advisory Board", isActive: true },
        ]}
      />
      <div className="container mx-auto px-4 max-w-7xl py-16 bg-black">
        {/* Header */}
        <div className="text-center mx-auto mb-12 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Guiding Our Vision
          </h1>
          <p className="text-gray-400 text-lg">
            Our Advisory Body comprises distinguished experts from academia,
            space research organizations, and the technology industry. Their
            guidance helps shape our strategic direction and ensures educational
            excellence.
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-md border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
          </div>
        ) : advisoryMembers.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center text-zinc-400">
            No active advisory members are published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advisoryMembers.map((member, index) => (
              <article
                key={member.id}
                className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 text-center 
                           border border-slate-700 hover:border-blue-500/50 
                           transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10
                           hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className="relative mx-auto mb-5 w-32 h-32 rounded-full overflow-hidden 
                              ring-4 ring-slate-700 group-hover:ring-blue-500/30 transition-all duration-300"
                >
                  <InitialsAvatar name={member.name} />
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                  <p className="text-blue-500 font-medium">{member.role}</p>
                  <p className="text-slate-400 text-sm">{member.affiliation}</p>
                  {member.bio ? (
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="w-full text-center">
            <h2 className="text-white text-3xl font-bold mb-4">
              Interested in Joining?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              We are always looking for distinguished experts to join our
              advisory board.
            </p>

            <Link
              href="/more/advisory-body/apply"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Apply for Advisory Board
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}