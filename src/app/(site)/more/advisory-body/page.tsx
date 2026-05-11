"use client";
import HeroBanner from "@/components/layout/Banner";
import Link from "next/link";

// types/advisory.ts
export interface AdvisoryMember {
  id: string;
  name: string;
  role: string;
  affiliation: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
  onApplyClick?: () => void;
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

const advisoryMembers: AdvisoryMember[] = [
  {
    id: "1",
    name: "Ramesh Gorantala",
    role: "Division Head (Retd) / Governing Council Member",
    affiliation: "ISRO / IETE",
  },
  {
    id: "2",
    name: "Aman Nautiyal",
    role: "BEL CRL",
    affiliation: "Advisor",
  },
  {
    id: "3",
    name: "Dr. Chikesh Ranjan",
    role: "Project Engineer",
    affiliation: "NIT Rourkela",
  },
  {
    id: "4",
    name: "Prof. (Dr.) Nikhil Kumar Yadav",
    role: "Professor, Dean Academics",
    affiliation: "Modern Institute of Technology & Research Centre, Alwar",
  },
  {
    id: "5",
    name: "A. Vanav Kumar",
    role: "Associate Professor",
    affiliation: "National Institute of Technology, Arunachal Pradesh",
  },
  {
    id: "6",
    name: "Girijesh Singh",
    role: "Senior Assistant",
    affiliation: "State Government-Horticulture Department, Bhadohi",
  },
  {
    id: "7",
    name: "Dr Nirkesh Sharma",
    role: "President",
    affiliation: "IITA- Indian International Teachers Association",
  },
  {
    id: "8",
    name: "Dr. Keshav Singh Rawat",
    role: "Professor",
    affiliation: "Central University of Haryana",
  },
  {
    id: "9",
    name: "Vanitha Rani Rentapalli",
    role: "Associate professor",
    affiliation: "VIT AP University",
  },
  {
    id: "10",
    name: "Khushi Veerapurmath",
    role: "Professor",
    affiliation: "India International school in Japan",
  },
  {
    id: "11",
    name: "Vivek Gupta",
    role: "Manager",
    affiliation: "nb",
  },
  {
    id: "12",
    name: "Saqib Khan",
    role: "Web Developer",
    affiliation: " ",
  },
  {
    id: "13",
    name: "Shanmugaraju K",
    role: "Structural Engineer - R & D",
    affiliation: "IIT Jodhpur, DOKA GmBH",
  },
];

export default function AdvisoryBoard() {
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

        {/* Grid */}
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
              {/* Avatar */}
              <div
                className="relative mx-auto mb-5 w-32 h-32 rounded-full overflow-hidden 
                            ring-4 ring-slate-700 group-hover:ring-blue-500/30 transition-all duration-300"
              >
                <InitialsAvatar name={member.name} />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-white">
                  {member.name}
                </h3>
                <p className="text-blue-500 font-medium">{member.role}</p>
                <p className="text-slate-400 text-sm">{member.affiliation}</p>
              </div>
            </article>
          ))}
        </div>

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