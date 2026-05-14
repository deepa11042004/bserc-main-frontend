import Link from "next/link";

import WorkshopCard from "@/components/workshops/WorkshopCard";
import { fetchWorkshops } from "@/lib/workshops";

export default async function FeaturedWorkshops() {
  const workshops = await fetchWorkshops({
    limit: 6,
    revalidateSeconds: 300,
  });

  return (
    <section className="w-full bg-black px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="pb-10 text-center font-serif text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
          Featured Workshops
        </h2>

        {workshops.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workshops.map((workshop) => (
              <WorkshopCard key={workshop.id} workshop={workshop} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-10 text-center text-sm text-zinc-400">
            Workshops are currently unavailable. Please check back shortly.
          </p>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href="/workshops"
            prefetch={false}
            className="rounded-lg border border-blue-600 bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            See More
          </Link>
        </div>
      </div>
    </section>
  );
}
