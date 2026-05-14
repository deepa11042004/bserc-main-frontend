"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Rocket,
  ShieldCheck,
  Bot,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

const slides = [
  {
    icon: <Rocket size={60} />,
    title: "Advanced Aerospace Technology",
    desc: "Master drone technology, aircraft design, and rocketry engineering with hands-on projects and industry mentors.",
  },
  {
    icon: <Bot size={60} />,
    title: "Robotics & Artificial Intelligence",
    desc: "Build intelligent systems and develop cutting-edge AI algorithms for autonomous applications across industries.",
  },
  {
    icon: <ShieldCheck size={60} />,
    title: "Defence Technology Innovation",
    desc: "Explore military-grade systems and advanced surveillance technology with security-focused expertise.",
  },
  {
    icon: <Lightbulb size={60} />,
    title: "Viksit Bharat@2047 Vision",
    desc: "Contribute innovative solutions aligned with India's development goals and future technology initiatives.",
  },
];

const Hero: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  // ✅ Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3500); // change speed here

    return () => clearInterval(interval);
  }, []);
  return (
    <section className="w-full   bg-black px-4  pt-5">
      <div className=" text-white flex flex-col justify-center items-center  relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10  text-center">
            {/* Badge with top glow */}
            <div className="relative inline-flex justify-center  ">
              {/* Glow Effects */}
              <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-cyan-400/30 blur-2xl rounded-full" />
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-1/2 h-8 bg-cyan-300/40 blur-xl rounded-full" />

              {/* Badge */}
              <span className="relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold tracking-wide text-cyan-300 border border-cyan-500/50 bg-cyan-950/30 backdrop-blur-md">
                <Sparkles className="w-4 h-4" />
                Registration opens April 1st!
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif leading-tight pt-6 text-white">
              Def-Space Summer <br />
              <span
                className="italic bg-gradient-to-br from-[#1E90FF]
           to-[#FF6B35] bg-clip-text text-transparent"
              >
                Internship
              </span>
              <br />
              2026
            </h1>

            {/* Description */}
            <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto pt-2 leading-relaxed">
              Build cutting-edge solutions in drone technology, satellite
              systems, rocketry, and AI while contributing to India's space
              vision
            </p>

            {/* Buttons */}
            <div className="pt-5 flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Primary Button */}

              <Link href="/bsercinternship/summer-internship?source=regular" prefetch={false}>
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-semibold rounded-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-200">
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              {/* Secondary Button */}
              <Link href="/bsercinternship/summer-internship?source=lateral" prefetch={false}>
                <button className="w-full sm:w-auto px-8 py-3.5 border border-gray-600 text-white font-semibold rounded-lg hover:bg-gray-800 hover:border-gray-500 transition-all duration-200">
                  Lateral registration
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className=" pt-12">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 bg-[linear-gradient(to_right,#0d1a1a,#0f1913,#15170d,#1b140a,#1d110e)] text-center">
            {/* Slide Content */}
            <div className="flex flex-col items-center justify-center min-h-[180px] transition-all duration-500">
              <div className=" mb-4">{slides[activeSlide].icon}</div>

              <h3 className="text-xl md:text-2xl  font-semibold font-serif  text-white mb-2">
                {slides[activeSlide].title}
              </h3>

              <p className="text-gray-300 max-w-xl">
                {slides[activeSlide].desc}
              </p>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-2  rounded-full transition-all duration-300 ${
                    activeSlide === i ? "bg-green-800 w-4" : "bg-orange-800 w-2"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
