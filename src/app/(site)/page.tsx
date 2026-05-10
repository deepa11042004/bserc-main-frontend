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
      <div className="w-full bg-gradient-to-r from-red-800 via-red-700 to-red-800 py-5 px-4">
        <a
          href="https://www.youtube.com/live/oNB4W94ftuk"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-300 animate-pulse inline-block" />
            <span className="text-red-200 text-xs font-bold uppercase tracking-widest">Live Now</span>
          </span>
          <span className="text-white font-semibold text-lg text-center">
            National Technology Day — Advanced Drone Technology ( Live on YouTube on 11th May, 10AM onwards )
          </span>
          <span className="inline-flex items-center gap-2 bg-white text-red-700 px-5 py-2 rounded-full font-bold text-base shadow-lg hover:bg-red-50 transition-colors">
            ▶ Watch &amp; Subscribe
          </span>
        </a>
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
