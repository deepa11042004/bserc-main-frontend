"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
 GraduationCap, 
  Rocket,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SlideData {
  id: number;
  badge: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  link: string;
  accentColor?: "cyan" | "violet" | "emerald" | "orange";
}

const slides: SlideData[] = [
  {
    id: 1,
    icon: <Rocket size={18} />,
    badge: "Programme 2026",
    title: "Def-Space Summer School 2026",
    desc: "A flagship 6-week intensive online initiative under Def-Space Education & Innovation — shaping India's future in Space, Defence, and Technology.",
    cta: "Register Now",
    link: "/summer-school/student-registration",
    accentColor: "cyan",
  },
  {
    id: 2,
    icon: <Shield size={18} />,
    badge: "Classes VI–XII",
    title: "Innovation in Defence & Space Technology",
    desc: "Explore Rocketry, Drones, AI, Robotics, and Aircraft Design. Aligned with Viksit Bharat @2047 and Atmanirbhar Bharat vision.",
    cta: "Internships",
    link: "/bsercinternship/summer-internship",
    accentColor: "emerald",
  },
  {
    id: 3,
     icon: <GraduationCap size={18} />,
    badge: "Merit Scholarships",   
    title: "Career Pathways in - ISRO - DRDO - HAL",
    desc: "Earn BSERC-issued certificates, explore career routes in India's top defence & space organisations, and unlock merit scholarship opportunities.",
    cta: "Apply for Scholarship",
  link: "/summer-school/student-registration",
    accentColor: "violet",
  },
];

const AUTOPLAY_DELAY = 6000;

const accentStyles: Record<
  NonNullable<SlideData["accentColor"]>,
  {
    gradient: string;
    glow: string;
    border: string;
    text: string;
    bg: string;
    hoverBg: string;
    glowColor: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
  }
> = {
  cyan: {
    gradient: "from-cyan-500/20 via-cyan-400/10 to-transparent",
    glow: "shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)]",
    border: "border-cyan-400/30",
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    hoverBg: "hover:bg-cyan-500/20",
    glowColor: "bg-cyan-500",
    badgeBg: "bg-cyan-950/30",
    badgeBorder: "border-cyan-500/50",
    badgeText: "text-cyan-300",
  },
  violet: {
    gradient: "from-violet-500/20 via-violet-400/10 to-transparent",
    glow: "shadow-[0_0_40px_-10px_rgba(167,139,250,0.3)]",
    border: "border-violet-400/30",
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    hoverBg: "hover:bg-violet-500/20",
    glowColor: "bg-violet-500",
    badgeBg: "bg-violet-950/30",
    badgeBorder: "border-violet-500/50",
    badgeText: "text-violet-300",
  },
  emerald: {
    gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent",
    glow: "shadow-[0_0_40px_-10px_rgba(52,211,153,0.3)]",
    border: "border-emerald-400/30",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    hoverBg: "hover:bg-emerald-500/20",
    glowColor: "bg-emerald-500",
    badgeBg: "bg-emerald-950/30",
    badgeBorder: "border-emerald-500/50",
    badgeText: "text-emerald-300",
  },
  orange: {
    gradient: "from-orange-500/20 via-orange-400/10 to-transparent",
    glow: "shadow-[0_0_40px_-10px_rgba(251,146,60,0.3)]",
    border: "border-orange-400/30",
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    hoverBg: "hover:bg-orange-500/20",
    glowColor: "bg-orange-500",
    badgeBg: "bg-orange-950/30",
    badgeBorder: "border-orange-500/50",
    badgeText: "text-orange-300",
  },
};

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // Autoplay - FIXED: Clean implementation without progress bar
  useEffect(() => {
    if (isPaused || prefersReducedMotion) {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      return;
    }

    autoplayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_DELAY);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isPaused, prefersReducedMotion]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToSlide((currentSlide + 1) % slides.length);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Touch handlers - IMPROVED: Better swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) {
      setTouchStartX(null);
      setTouchEndX(null);
      return;
    }

    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // Increased for better mobile experience
    
    if (distance > minSwipeDistance) {
      goToSlide((currentSlide + 1) % slides.length);
    } else if (distance < -minSwipeDistance) {
      goToSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1);
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  const currentSlideData = slides[currentSlide];
  const currentAccent = accentStyles[currentSlideData.accentColor || "cyan"];

  return (
    <section
      className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[80vh] bg-black overflow-hidden"
      role="region"
      aria-label="Featured programmes carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-15 sm:opacity-20" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(30, 30, 40, 0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(30, 30, 40, 0.8) 1px, transparent 1px)
            `,
            backgroundSize: "30px 30px",
          }}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-b ${currentAccent.gradient} transition-all duration-1000`}
        />
      </div>

      {/* Dynamic Glow Orb - Responsive sizing */}
      {!prefersReducedMotion && (
        <div
          className={`absolute -top-1/4 -right-1/4 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px] rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] opacity-10 sm:opacity-15 lg:opacity-20 animate-pulse hidden sm:block ${currentAccent.glowColor}`}
          aria-hidden="true"
        />
      )}

      {/* Slides Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          const accent = accentStyles[slide.accentColor || "cyan"];

          return (
            <article
              key={slide.id}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
                isActive
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={!isActive}
            >
              {/* Dark Overlay - Responsive gradient */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black via-black/90 sm:via-black/85 to-black/60"
                aria-hidden="true"
              />

              {/* Content - IMPROVED: Better responsive spacing and typography */}
              <div className="relative z-20 text-center w-full px-4 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[200px] sm:min-h-[280px]">
                
                {/* Badge with dynamic accent colors */}
                <div className="relative inline-flex justify-center mb-4 sm:mb-6">
                  {/* Dynamic Glow Effects - Responsive */}
                  <div className={`pointer-events-none absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 w-2/3 sm:w-3/4 h-12 sm:h-16 ${currentAccent.glowColor}/30 blur-xl sm:blur-2xl rounded-full`} />
                  <div className={`pointer-events-none absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 w-1/3 sm:w-1/2 h-6 sm:h-8 ${currentAccent.glowColor}/40 blur-lg sm:blur-xl rounded-full`} />

                  {/* Badge - Responsive sizing */}
                  <span className={`relative flex justify-center items-center gap-2 px-4 py-2  rounded-full text-xs sm:text-sm font-semibold tracking-wide ${accent.badgeText} border ${accent.badgeBorder} ${accent.badgeBg} backdrop-blur-md`}>
                    <span className="w-4 h-4">{slide.icon}</span>
                    <span className="line-clamp-1">{slide.badge}</span>
                  </span>
                </div>

                {/* Title - IMPROVED: Better responsive typography with line clamping */}
                <h1
                  className={` text-4xl md:text-6xl font-bold font-serif mb-3 sm:mb-4 text-white leading-tight tracking-tight px-2 line-clamp-2 ${
                    prefersReducedMotion
                      ? ""
                      : `transition-all duration-500 ease-out ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`
                  }`}
                >
                  {slide.title}
                </h1>

                {/* Description - IMPROVED: Better mobile readability */}
                <p
                  className={`text-xs sm:text-sm md:text-base text-gray-300 sm:text-gray-400 mb-4 sm:mb-6 md:mb-8 max-w-xl mx-auto leading-relaxed px-2 line-clamp-3 sm:line-clamp-none ${
                    prefersReducedMotion
                      ? ""
                      : `transition-all duration-500 ease-out delay-100 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`
                  }`}
                >
                  {slide.desc}
                </p>

                {/* CTA Button - IMPROVED: Better touch targets and responsive sizing */}
                <Link
                  href={slide.link || "#"}
                  prefetch={false}
                  className={`inline-flex items-center justify-center w-full sm:w-auto px-5 sm:px-7 py-3 sm:py-3.5 rounded-full font-medium text-sm sm:text-base text-white backdrop-blur-md border ${accent.border} ${accent.bg} ${accent.hoverBg} ${accent.glow} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black min-h-[44px] sm:min-h-[48px] ${
                    prefersReducedMotion
                      ? ""
                      : `delay-200 ${
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3"
                        }`
                  }`}
                >
                  <span className="truncate pr-1">{slide.cta}</span>
                  <ChevronRight className="ml-1 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* Navigation Arrows - IMPROVED: Better positioning and touch targets */}
      <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2 sm:px-4 lg:px-6 z-30 pointer-events-none">
        <button
          onClick={() =>
            goToSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)
          }
          className="pointer-events-auto group p-2 sm:p-2.5 lg:p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 min-w-[36px] sm:min-w-[40px] lg:min-w-[44px] min-h-[36px] sm:min-h-[40px] lg:min-h-[44px] flex items-center justify-center"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => goToSlide((currentSlide + 1) % slides.length)}
          className="pointer-events-auto group p-2 sm:p-2.5 lg:p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 min-w-[36px] sm:min-w-[40px] lg:min-w-[44px] min-h-[36px] sm:min-h-[40px] lg:min-h-[44px] flex items-center justify-center"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Indicators - IMPROVED: Better spacing and touch targets */}
      <div
        className="absolute bottom-3 sm:bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 z-30"
        role="tablist"
      >
        {slides.map((slide, i) => {
          const accent = accentStyles[slide.accentColor || "cyan"];
          const isActive = i === currentSlide;

          return (
            <button
              key={slide.id}
              onClick={() => goToSlide(i)}
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${i + 1}: ${slide.title}`}
              className={`relative rounded-full transition-all duration-200 bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white/20 ${
                isActive
                  ? `w-6 sm:w-8 lg:w-10 h-1.5 sm:h-2 ${accent.text.replace("text", "bg")}`
                  : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          );
        })}
      </div>

      {/* Slide Counter - Mobile only - IMPROVED: Better visibility */}
      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-30 text-[10px] sm:text-xs text-white/50 sm:hidden bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
        {currentSlide + 1}/{slides.length}
      </div>
    </section>
  );
}