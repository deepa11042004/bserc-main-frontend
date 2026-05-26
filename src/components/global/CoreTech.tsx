"use client";
import React from "react";
import {
  
  
  Rocket,
  Shield,
  Bot ,
  Plane,
 Send,
 Brain,
 FileText,
} from "lucide-react";

type Feature = {
  title: string;
  description: string;
  icon: React.ElementType;
  accent: "blue" | "orange";
};

const features: Feature[] = [
  {
    title: "Generative Artificial Intelligence (AI)",
    description:
      "Foundations and applications of generative models, large language models and diffusion models.",
    icon: Brain,
    accent: "blue",
  },
  {
    title:
      "Cyber Security & Digital Forensics in Space, Defence, UAV & AI Ecosystems",
    description:
      "Includes: AI-Based Space Object Detection and Collision Prediction Framework; Cyber Security Framework for Satellite Communication Systems; Quantum-Secure Satellite Communication Framework for Space Networks; Autonomous UAV System for Space Terrain Mapping and Environmental Intelligence; Autonomous Space Exploration Rover using AI and IoT.",
    icon: Shield,
    accent: "orange",
  },
  {
    title: "Advanced Drone Technology (Air Taxi & Defence Drone)",
    description: "Air taxi systems, defence UAV architectures and autonomy for next-gen drones.",
    icon: Send,
    accent: "blue",
  },
  {
    title: "Aircraft Design Technology",
    description: "Aerodynamics, CFD simulation, structural design and systems integration for aircraft.",
    icon: Plane,
    accent: "orange",
  },
  {
    title: "Rocketry Design Technology",
    description: "Propulsion systems, launch vehicle design, staging and payload integration.",
    icon: Rocket,
    accent: "blue",
  },
  {
    title: "EV Technology and Charging Infrastructure for Future Engineers",
    description: "Electric vehicle powertrains, battery systems and charging infrastructure design.",
    icon: Send,
    accent: "orange",
  },
  {
    title: "Robotics Design Technology",
    description: "Robotic platforms, control systems, perception and embedded integrations.",
    icon: Bot,
    accent: "blue",
  },
  {
    title:
      "AI-Based Military Intelligence and Threat Analysis Dashboard using Machine Learning and Data Analytics",
    description: "ML-driven threat analysis, data pipelines, visualization and decision-support dashboards.",
    icon: Brain,
    accent: "orange",
  },
  {
    title: "Rocket Velocities and Orbital Speeds",
    description: "Orbital mechanics, delta-v budgeting, transfer maneuvers and re-entry dynamics.",
    icon: Rocket,
    accent: "blue",
  },
  {
    title: "Case Studies",
    description: "Real-world mission case studies, post-mortems and applied engineering lessons.",
    icon: FileText,
    accent: "orange",
  },
];

export const CoreTech: React.FC = () => {
  return (
    <section className="w-full py-12 sm:py-16 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}

        <div className="flex flex-col gap-3 justify-center items-center">
          <h3 className="text-4xl md:text-4xl text-center font-bold font-serif text-white  leading-tightlg:text-4xl ">
            Core Technology Domains
          </h3>

          <p className="text-center pb-5 text-gray-400  text-sm sm:text-base max-w-2xl mx-auto">
            Master cutting-edge technologies across core engineering domains
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const isBlue = feature.accent === "blue";

            return (
              <div
                key={i}
                className={`relative rounded-xl p-6 border-l-4 transition-all duration-300 hover:scale-[1.02]
                ${
                  isBlue
                    ? "border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-400/30"
                    : "border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-400/30"
                }`}
              >
                {/* Icon */}
                <div
                  className={`mb-4 ${
                    isBlue ? "text-blue-400" : "text-orange-400"
                  }`}
                >
                  <Icon className="w-10 h-10" />
                </div>

                {/* Title */}
                <h4 className="text-white font-semibold text-lg mb-2">
                  {feature.title}
                </h4>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
