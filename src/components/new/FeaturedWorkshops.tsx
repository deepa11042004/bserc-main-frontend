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
    <section className="w-full bg-black px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
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
        <div className="mt-6 relative left-1/2 right-1/2 -translate-x-1/2 w-screen">
          <div className="w-full overflow-hidden">
            {/* wrapper keeps aspect ratio: paddingTop = 35% for a slightly taller banner */}
            <div className="relative w-full" style={{ paddingTop: '37%' }}>
              {/* Background image container (covers full area) */}
              <div
                aria-hidden
                className="absolute inset-0 w-full h-full bg-center bg-cover transform scale-105 sm:scale-110 origin-center"
                style={{ backgroundImage: `url('${backgroundUrl}')` }}
              />

              {/* Overlay content placed on top of the background image. */}
              <div className="absolute inset-0 flex items-center">
                {/* subtle dark gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

                <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* Left hero text */}
                    <div className="col-span-7 text-white">
                      <h1 className="mt-2 font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight whitespace-pre-line">
                        {title}
                      </h1>
                      <p className="mt-5 max-w-xl text-base sm:text-lg text-white/85">
                        {description}
                      </p>
                      <div className="mt-6">
                        <Link
                          href="/workshops"
                          prefetch={false}
                          className="inline-flex rounded-lg border border-blue-600 bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Register Now
                        </Link>
                      </div>
                    </div>

                  {/* Right stacked cards: grid 2x3 to match reference */}
                    <div className="col-span-5 flex justify-end">
                      <div className="grid grid-cols-2 gap-3">
                        {cards.map((card, index) => {
                          const isLeft = index % 2 === 0;
                          const clipPath = isLeft
                            ? 'polygon(0 0, 86% 0, 100% 15%, 100% 85%, 86% 100%, 0 100%, 0 0)'
                            : 'polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 85%, 0 15%)';

                          return (
                            <div
                              key={card.id ?? `${card.title}-${index}`}
                              className="w-44 h-20 rounded-md overflow-hidden shadow-lg relative"
                              style={{ clipPath }}
                            >
                              <img
                                src={card.image_url}
                                alt={card.title}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40" />
                              <div className="absolute inset-0 flex items-center justify-center px-2">
                                <span className="text-white text-[11px] sm:text-xs font-bold text-center uppercase leading-tight">
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
