import PMVision from "@/components/new/Pmvision";
import SpaceSectorIndia from "@/components/new/SpaceSectorIndia";
import SpaceWorkshop from "@/components/new/SpaceWorkshop";
import BsercInitiative from "@/components/new/BsercInitiative";
import HomePageClientEffects from "@/components/new/HomePageClientEffects";
import OurFeatures from "@/components/new/OurFeatures";
import SpaceTravellers from "@/components/new/SpaceTravellers";
import SpaceEvents from "@/components/new/SpaceEvents";
import WhyEventsMatter from "@/components/new/WhyEventsMatte";
import DefenceEvents from "@/components/new/DefenceEvents";
import KeyDefence from "@/components/new/KeyProgram";
import KeyFigures from "@/components/new/KeyFigures";
import LatestNews from "@/components/new/LatestNews";
import ISROMissionsSection from "@/components/new/ISROMissionsSection";
import StatePartnership from "@/components/new/StatePartnership";
import FeaturedWorkshops from "@/components/new/FeaturedWorkshops";
import HeroSlider from "@/components/new/HeroSlider";
import Stats from "@/components/new/Stats";

export default function HomePage() {
  return (
    <>
      <HomePageClientEffects />
      <HeroSlider />
      <div className="flex justify-center my-6 bg-blue-700 py-4">
        <a href="https://forms.gle/NNBBxDkwzb84efgD6" className="inline-block">
          <button
            className="px-6 py-3 bg-orange-500 text-white rounded-lg shadow-[0_0_12px_rgba(249,115,22,0.6)] hover:shadow-[0_0_22px_rgba(249,115,22,1)] hover:bg-orange-600 transition-colors font-semibold text-lg"
          >
            National Technology Day
          </button>
        </a>
      </div>
      <div className="w-full bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 py-5 px-4">
        <div className="flex flex-col items-center gap-3">
          <p className="text-white font-bold text-lg sm:text-xl text-center">
            🎓 National Technology Day — Advanced Drone Technology
          </p>
          <p className="text-indigo-300 text-sm text-center">
            Missed the session? Share your feedback or watch the full recording below.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
            <a
              href="https://forms.gle/5eE7yfZYDLgWqbdb8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-colors"
            >
              📝 Feedback Form — Click Here
            </a>
            <a
              href="https://www.youtube.com/live/oNB4W94ftuk?si=OmFKbBK10JSQBQiD"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-colors"
            >
              ▶ Recorded Session — Click Here
            </a>
          </div>
        </div>
      </div>
      <Stats />
      <PMVision />
      <SpaceSectorIndia />
      <SpaceWorkshop />
      <BsercInitiative />
      <FeaturedWorkshops />
      <OurFeatures />
      <SpaceTravellers />
      <SpaceEvents />
      <WhyEventsMatter />
      <DefenceEvents />
      <KeyDefence />
      <KeyFigures />
      <LatestNews />
      <ISROMissionsSection />
      <StatePartnership />
    </>
  );
}
