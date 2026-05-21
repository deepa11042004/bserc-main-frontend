import Link from "next/link";

import WorkshopCard from "@/components/workshops/WorkshopCard";
import { fetchWorkshops } from "@/lib/workshops";

type FeaturedWorkshopCard = {
  id?: number;
  title: string;
  image_url: string;
  position?: number | null;
};

type FeaturedWorkshopSection = {
  title: string;
  description: string;
  background_url: string | null;
  cards: FeaturedWorkshopCard[];
};

type FeaturedWorkshopApiResponse = {
  data?: unknown;
  message?: unknown;
  success?: unknown;
};

const FALLBACK_SECTION_TITLE = "SUMMER\nINTERNSHIP 2026";
const FALLBACK_SECTION_DESCRIPTION =
  "6 Tech Domain & Project. Batch Start: 19th - 30th July 2026 - Defence - Space Education - For innovators and learners.";
const FALLBACK_BACKGROUND_URL = "/img/banner_rocket.jpg";
const FALLBACK_CARDS: FeaturedWorkshopCard[] = [
  { title: "AIRCRAFT", image_url: "/img/aircraft_design.png" },
  { title: "DRONE", image_url: "/img/drone.jpg" },
  { title: "ADVANCED DRONE TECHNOLOGY", image_url: "/img/advance_drone_flight.png" },
  { title: "ROCKETRY", image_url: "/img/twoday_rocketry.png" },
  { title: "ARTIFICIAL INTELLIGENCE", image_url: "/img/ai_robotics.png" },
  { title: "ROBOTICS", image_url: "/img/research.png" },
];

const FALLBACK_BACKEND_URLS = [
  "http://127.0.0.1:5001",
  "http://localhost:5001",
  "http://127.0.0.1:5000",
  "http://localhost:5000",
];

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInt(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCard(item: unknown): FeaturedWorkshopCard | null {
  if (!isRecord(item)) {
    return null;
  }

  const title = toText(item.title);
  const imageUrl = toText(item.image_url || item.imageUrl || item.image);
  const position = toPositiveInt(item.position);

  if (!title || !imageUrl) {
    return null;
  }

  return {
    id: toPositiveInt(item.id) || undefined,
    title,
    image_url: imageUrl,
    position,
  };
}

function normalizeSection(payload: unknown): FeaturedWorkshopSection | null {
  if (!isRecord(payload)) {
    return null;
  }

  const title = toText(payload.title);
  const description = toText(payload.description);
  const backgroundUrl = toText(payload.background_url || payload.backgroundUrl || payload.background);
  const cardsRaw = Array.isArray(payload.cards) ? payload.cards : [];
  const cards = cardsRaw
    .map(normalizeCard)
    .filter((card): card is FeaturedWorkshopCard => Boolean(card));

  return {
    title,
    description,
    background_url: backgroundUrl || null,
    cards,
  };
}

function splitConfiguredApiUrls(): string[] {
  const configured = [
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.API_URL_FALLBACK,
  ]
    .map((value) => value?.trim() ?? "")
    .filter((value) => Boolean(value));

  return configured.flatMap((value) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => Boolean(entry)),
  );
}

function getCandidateBackendUrls(): string[] {
  const envUrls = splitConfiguredApiUrls();
  const raw = envUrls.length > 0 ? [...envUrls, ...FALLBACK_BACKEND_URLS] : FALLBACK_BACKEND_URLS;
  const normalized = raw.filter((value): value is string => Boolean(value));

  return [...new Set(normalized.map((value) => value.replace(/\/$/, "")))];
}

async function fetchFeaturedWorkshopSection(): Promise<FeaturedWorkshopSection | null> {
  const backendUrls = getCandidateBackendUrls();

  for (const backendUrl of backendUrls) {
    try {
      const response = await fetch(`${backendUrl}/api/featured-workshop-section`, {
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json().catch(() => ({}))) as FeaturedWorkshopApiResponse;
      const section = normalizeSection(payload.data);
      if (section) {
        return section;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function buildCardList(cards: FeaturedWorkshopCard[]): FeaturedWorkshopCard[] {
  const sorted = [...cards].sort((a, b) => {
    const aPos = a.position ?? Number.MAX_SAFE_INTEGER;
    const bPos = b.position ?? Number.MAX_SAFE_INTEGER;
    return aPos - bPos;
  });

  const source = sorted.length > 0 ? sorted : FALLBACK_CARDS;

  return FALLBACK_CARDS.map((fallback, index) => {
    const card = source[index];
    if (!card) {
      return fallback;
    }

    return {
      id: card.id,
      title: card.title || fallback.title,
      image_url: card.image_url || fallback.image_url,
      position: card.position ?? fallback.position,
    };
  });
}

export default async function FeaturedWorkshops() {
  const section = await fetchFeaturedWorkshopSection();
  const title = section?.title?.trim() || FALLBACK_SECTION_TITLE;
  const description = section?.description?.trim() || FALLBACK_SECTION_DESCRIPTION;
  const backgroundUrl = section?.background_url?.trim() || FALLBACK_BACKGROUND_URL;
  const cards = buildCardList(section?.cards ?? []);

  // Temporarily disable fetching featured workshops so cards don't load.
  // Commented out while backend/frontend sync is validated.
  // const workshops = await fetchWorkshops({
  //   limit: 6,
  //   revalidateSeconds: 300,
  // });

  const workshops: any[] = [];

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-black via-slate-950 to-black px-4 py-12 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 right-8 h-64 w-64 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-6 h-72 w-72 rounded-full bg-amber-500/10 blur-[140px]" />
      </div>
      <div className="relative mx-auto max-w-6xl">
        <h2 className="pb-10 text-center font-serif text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
          Featured Workshops
        </h2>


        {/* {workshops.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workshops.map((workshop) => (
              <WorkshopCard key={workshop.id} workshop={workshop} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-10 text-center text-sm text-zinc-400">
            Workshops are currently unavailable. Please check back shortly.
          </p>
        )} */}

        {/* Full-bleed image with 19:6 ratio (height = 6/19 of width).
            Uses an intrinsic-ratio wrapper so the image covers full width
            and keeps object-cover to avoid empty space on left/right. */}
        <div className="group mt-6 relative left-1/2 right-1/2 -translate-x-1/2 w-screen">
          <div className="w-full overflow-hidden">
            {/* wrapper keeps aspect ratio: paddingTop = 35% for a slightly taller banner */}
            <div className="relative w-full" style={{ paddingTop: "37%" }}>
              {/* Background image container (covers full area) */}
              <div
                aria-hidden
                className="absolute inset-0 h-full w-full origin-center bg-center bg-cover transition-transform duration-700 ease-out will-change-transform scale-105 sm:scale-110 group-hover:scale-[1.08]"
                style={{ backgroundImage: `url('${backgroundUrl}')` }}
              />

              {/* Overlay content placed on top of the background image. */}
              <div className="absolute inset-0 flex items-center">
                {/* subtle dark gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

                <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
                  <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                    {/* Left hero text */}
                    <div className="lg:col-span-7 text-white">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/80 backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                        Registrations open
                      </div>
                      <h1 className="mt-2 font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight whitespace-pre-line">
                        {title}
                      </h1>
                      <p className="mt-5 max-w-xl text-base sm:text-lg text-white/85">
                        {description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {cards.slice(0, 3).map((card, index) => (
                          <span
                            key={card.id ?? `${card.title}-${index}`}
                            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/75 backdrop-blur transition hover:border-white/35 hover:bg-white/20"
                          >
                            {card.title}
                          </span>
                        ))}
                      </div>
                      <div className="mt-6">
                        <Link
                          href="/workshops"
                          prefetch={false}
                          className="group/cta inline-flex items-center gap-3 rounded-lg border border-blue-500/70 bg-blue-600/90 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(59,130,246,0.9)] transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-500"
                        >
                          <span>Register Now</span>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition group-hover/cta:translate-x-1 group-hover/cta:bg-white/25">
                            <svg
                              aria-hidden
                              viewBox="0 0 20 20"
                              className="h-4 w-4 fill-current"
                            >
                              <path d="M11.5 4.5 10.09 5.9l3.1 3.1H4.5v2h8.69l-3.1 3.1 1.41 1.4 5.5-5.5-5.5-5.5z" />
                            </svg>
                          </span>
                        </Link>
                      </div>
                    </div>
                    {/* Right stacked cards: grid 2x3 to match reference */}
                    <div className="lg:col-span-5 flex justify-start lg:justify-end">
                      <div className="grid grid-cols-2 gap-4">
                        {cards.map((card, index) => {
                          const isLeft = index % 2 === 0;
                          const tiltClass = isLeft ? "hover:rotate-1" : "hover:-rotate-1";
                          const clipPath = isLeft
                            ? 'polygon(0 0, 86% 0, 100% 15%, 100% 85%, 86% 100%, 0 100%, 0 0)'
                            : 'polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 85%, 0 15%)';

                          return (
                            <div
                              key={card.id ?? `${card.title}-${index}`}
                              className={`group/card relative h-24 w-40 sm:h-24 sm:w-44 lg:h-28 lg:w-52 overflow-hidden rounded-lg shadow-lg ring-1 ring-white/10 transition duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.03] ${tiltClass} hover:shadow-[0_24px_55px_-30px_rgba(56,189,248,0.75)] hover:ring-white/30 cursor-pointer`}
                              style={{ clipPath }}
                            >
                              <img
                                src={card.image_url}
                                alt={card.title}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 transition-opacity duration-300 group-hover/card:opacity-60" />
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
                              <div className="absolute inset-0 flex items-center justify-center px-2">
                                <span className="text-white text-[11px] sm:text-xs font-bold text-center uppercase leading-tight drop-shadow">
                                  {card.title}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
