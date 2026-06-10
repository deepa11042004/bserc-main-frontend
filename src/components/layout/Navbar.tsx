"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import StudentLoginButton from "./StudentLoginButton";
import StudentProfile from "@/components/layout/studentProfile";

type DropdownItem =
  | { type: "link"; label: string; href: string; external?: boolean }
  | {
      type: "nested";
      label: string;
      children: { label: string; href: string; external?: boolean }[];
    }
  | { type: "divider" };

const NAV_ITEMS: {
  label: string;
  href?: string;
  dropdown?: DropdownItem[];
  external?: boolean;
}[] = [
  { label: "Home", href: "/", external: false },
  { label: "About", href: "/about", external: false },

   

  {
    label: "Institutions",
    dropdown: [
      {
        type: "link",
        label: "MoU",
        href: "/institutions/mou-form",
        external: false,
      },
      {
        type: "link",
        label: "Collaboration",
        href: "/institutions/collaboration",
        external: false,
      },
    ],
  },
  {
    label: "Internships",
    dropdown: [
      { type: "link", label: "Workshop", href: "/workshops", external: false },

      {
        type: "link",
        label: "Def-Space Summer School",
        href: "/summer-school",
        external: true,
      },
      {
        type: "link",
        label: "Def-Space Summer Internship",
        href: "/bsercinternship",
        external: true,
      },
      {
        type: "link",
        label: "Def-Space Innovation Corridor 2026",
        href: "/def-space-innovation-corridor",
        external: false,
      },
    ],
  },

  {
    label: "Results",
    dropdown: [
      {
        type: "link",
        label: "Def-Space Winter Internship Result 2025",
        href: "/results/winter-internship-results",
        external: false,
      },
      {
        type: "link",
        label: "Def-Space Summer Internship Results 2026",
        href: "/results/summer-internship-results",
        external: false,
      },
    ],
  },

  {
    label: "Career",
    dropdown: [
      {
        type: "link",
        label: "Apprenticeship",
        href: "/careers/apprenticeship",
        external: false,
      },
      {
        type: "link",
        label: "Job Vacancy",
        href: "/careers/job-vacancy",
        external: false,
      },
      {
        type: "link",
        label: "Mentors",
        href: "/careers/mentors",
        external: false,
      },
      {
        type: "link",
        label: "Advisor",
        href: "/",
        external: false,
      },
      {
        type: "link",
        label: "Speaker",
        href: "/people/speaker",
        external: false,
      },
      {
        type: "link",
        label: "Startup",
        href: "/",
        external: false,
      },
      {
        type: "link",
        label: "Partnership ",
        href: "/",
        external: false,
      },
      {
        type: "link",
        label: "Delegate",
        href: "/",
        external: false,
      },
      {
        type: "link",
        label: "Membership",
        href: "/membership",
        external: false,
      },
      {
        type: "link",
        label: "IEDC",
        href: "/",
        external: false,
      },
      {
        type: "link",
        label: "Exhibitor",
        href: "/",
        external: false,
      },
      {
        type: "link",
        label: "Investor ",
        href: "/",
        external: false,
      },
      {
        type: "link",
        label: "Organization ",
        href: "/",
        external: false,
      },
    ],
  },
  {
    label: "More",
    dropdown: [
      { type: "link", label: "Advisory Body", href: "/more/advisory-body", external: false,  },
      {
        label: "Administration",
        type: "nested",
        children: [
          { label: "Chairman", href: "/more/administration/chairman", external: false },
          { label: "Secretary", href: "/", external: false },
          { label: "Director General", href: "/", external: false },
          { label: "Director", href: "/", external: false },
          { label: "Staff", href: "/", external: false },
          { label: "Coordinator", href: "/", external: false },
          { label: "Committee", href: "/", external: false },
        ],
      },
      {
        type: "nested",
        label: "Technology Partner",
        children: [
          { label: "ISRO", href: "/tech-partner#isro", external: false },
          { label: "ESA", href: "/tech-partner#esa", external: false },
          { label: "KAT", href: "/tech-partner#kat", external: false },
          { label: "JAXA", href: "/tech-partner#jaxa", external: false },
          { label: "NASA", href: "/tech-partner#nasa", external: false },
          { label: "UN-GGIM", href: "/tech-partner#un-ggim", external: false },
        ],
      },
      { type: "link", label: "Mentor", href: "/more/mentor", external: false },
      { type: "link", label: "Speakers", href: "/", external: false },
      { type: "link", label: "Delegates", href: "/", external: false },
      {
        type: "link",
        label: "University Partner ",
        href: "/",
        external: false,
      },

      { type: "link", label: "Missions", href: "/missions", external: false },

      {
        type: "nested",
        label: "People",
        children: [
          {
            label: "Faculty/Guest faculty",
            href: "/people/faculty",
            external: false,
          },
          {
            label: "Research Scholar",
            href: "/people/research-scholar",
            external: false,
          },

          {
            label: "FDP Members",
            href: "/people/fdp-members",
            external: false,
          },
        ],
      },

      { type: "divider" },

      {
        type: "link",
        label: "Knowledge Hub (Learn)",
        href: "/knowledge-hub",
        external: false,
      },

      {
        type: "link",
        label: "Space Quiz",
        href: "/space-quiz",
        external: false,
      },
      { type: "link", label: "Glossary", href: "/glossary", external: false },
      { type: "link", label: "FAQ", href: "/faq", external: false },
    ],
  },
  { label: "Contact Us", href: "/contact", external: false },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openNested, setOpenNested] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeAll = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setOpenNested(null);
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown((p) => (p === label ? null : label));
    setOpenNested(null);
  };

  const { isLoggedIn, role, logout } = useAuth();
  const isStudentSession = isLoggedIn && role === "user";

  const handleStudentLogout = () => {
    closeAll();
    logout("/login", { scope: "user" });
  };

  return (
    <>
      <header className="w-full bg-black border-b border-white/5 sticky top-0 z-[60] backdrop-blur-md">
        <div className="w-full block bg-orange-600 text-white text-center px-4 py-2 text-sm sm:text-base font-semibold transition-colors">
          <span>Apply for def-space summer internship </span>
          <Link
            href="/bsercinternship"
            prefetch={false}
            className="text-blue-700 underline font-bold hover:text-blue-500"
          >
            Click here
          </Link>
          <span className="mx-2">|</span>
          <span>Apply for def-space summer school </span>
          <Link
            href="/summer-school"
            prefetch={false}
            className="text-blue-700 underline font-bold hover:text-blue-500"
          >
            Click here
          </Link>
        </div>
        {/* <div className="w-full bg-indigo-900 text-white text-center px-4 py-2 text-sm sm:text-base flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          <span className="font-semibold">🎓 National Technology Day — Advanced Drone Technology</span>
          <span className="text-indigo-300 hidden sm:inline">|</span>
          <a
            href="https://forms.gle/5eE7yfZYDLgWqbdb8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-400 text-white px-3 py-0.5 rounded-full font-bold text-sm transition-colors"
          >
            📝 Feedback Form
          </a>
          <a
            href="https://www.youtube.com/live/oNB4W94ftuk?si=OmFKbBK10JSQBQiD"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-3 py-0.5 rounded-full font-bold text-sm transition-colors"
          >
            ▶ Watch Recording
          </a>
        </div> */}
        <div className="w-full bg-indigo-900 text-white text-center px-4 py-2 text-sm sm:text-base flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          <span className="font-semibold">📢 Offer letters will be shared on your registered email address on 1st June 2026</span>
        </div>
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-[70px]">
          {/* Logo Left */}

          
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-2 shrink-0"
            onClick={closeAll}
          >
            <div className="relative w-9 h-9">
              <Image
                src="/img/BSERC_new.png"
                alt="logo"
                fill
                sizes="36px"
                className="object-contain"
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              BSERC
            </span>
          </Link>

          {/* Nav Center */}
          <ul className="hidden lg:flex items-center gap-4 text-[14px] font-medium text-gray-300 mx-auto">
            {NAV_ITEMS.map((item) =>
              item.href ? (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    {...(item.external && {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    })}
                    className="px-3 py-2 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                </li>
              ) : (
                <DesktopDropdown
                  key={item.label}
                  title={item.label}
                  items={item.dropdown!}
                />
              ),
            )}
          </ul>

          <div className="hidden lg:flex items-center">
            {!isStudentSession ? <StudentLoginButton /> : <StudentProfile />}
          </div>

          {/* Hamburger */}
          <button
            className="lg:hidden p-2 -mr-1 text-gray-300 hover:text-white transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-[58] bg-black/60"
            onClick={closeAll}
          />
          <div className="lg:hidden fixed top-[102px] left-0 right-0 bottom-0 z-[59] bg-[#0a0c16] overflow-y-auto">
            <ul className="flex flex-col text-[14px] font-medium text-gray-300 pb-10">
              {NAV_ITEMS.map((item) =>
                item.href ? (
                  <li key={item.label} className="border-b border-white/5">
                    <Link
                      href={item.href}
                      prefetch={false}
                      {...(item.external && {
                        target: "_blank",
                        rel: "noopener noreferrer",
                      })}
                      className="block px-5 py-4 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={closeAll}
                    >
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <MobileDropdown
                    key={item.label}
                    title={item.label}
                    items={item.dropdown!}
                    isOpen={openDropdown === item.label}
                    onToggle={() => toggleDropdown(item.label)}
                    openNested={openNested}
                    onNestedToggle={(label) =>
                      setOpenNested((p) => (p === label ? null : label))
                    }
                    onClose={closeAll}
                  />
                ),
              )}

              <li className="border-t border-white/5 mt-4 mx-4 space-y-2 pt-4">
                {isStudentSession ? (
                  <>
                    <Link
                      href="/profile"
                      prefetch={false}
                      className="block w-full text-center py-3 font-semibold text-white rounded-lg bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg"
                      onClick={closeAll}
                    >
                      My Profile
                    </Link>
                    <button
                      type="button"
                      className="block w-full text-center py-3 font-semibold text-red-200 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all duration-300 border border-red-500/30"
                      onClick={handleStudentLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    prefetch={false}
                    className="block w-full text-center py-3 font-semibold text-white rounded-lg bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg"
                    onClick={closeAll}
                  >
                    Log In
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </>
      )}
    </>
  );
}

// ─── Desktop Dropdown ─────────────────────────────────────────────────────────

function DesktopDropdown({
  title,
  items,
  external,
}: {
  title: string;
  items: DropdownItem[];
  external?: boolean;
}) {
  return (
    <li className="relative group py-[22px]">
      <button className="flex items-center gap-1 px-2 hover:text-white transition-colors outline-none whitespace-nowrap">
        {title}
        <ChevronDown
          size={13}
          className="opacity-50 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-200"
        />
      </button>

      <ul
        className="invisible opacity-0 group-hover:visible group-hover:opacity-100
          absolute left-0 top-full z-50 mt-0 min-w-[210px]
          bg-[#0b1220] border border-white/10 rounded-xl py-2 shadow-2xl
          transition-all duration-200 translate-y-2 group-hover:translate-y-0"
      >
        {items.map((item, i) => {
          if (item.type === "divider")
            return <hr key={i} className="border-white/5 my-1" />;

          if (item.type === "link")
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  prefetch={false}
                  {...(item.external && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                  className="block px-4 py-2 hover:bg-white/5 hover:text-white transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              </li>
            );

          // nested fly-out
          return (
            <li key={item.label} className="relative group/nested">
              <div className="flex items-center justify-between px-4 py-2 hover:bg-white/5 hover:text-white cursor-pointer transition-colors">
                <span className="whitespace-nowrap">{item.label}</span>
                <ChevronRight
                  size={13}
                  className="ml-2 opacity-60 rotate-180"
                />
              </div>
              <ul
                className="invisible opacity-0 group-hover/nested:visible group-hover/nested:opacity-100
                  absolute right-full top-0 mr-[1px] min-w-[200px]
                  bg-[#0b1220] border border-white/10 rounded-xl py-2 shadow-2xl
                  transition-all duration-200"
              >
                {item.children.map((child) => (
                  <li key={child.label}>
                    <Link
                      href={child.href}
                      prefetch={false}
                      {...(child.external && {
                        target: "_blank",
                        rel: "noopener noreferrer",
                      })}
                      className="block px-4 py-2 hover:bg-white/5 hover:text-white transition-colors whitespace-nowrap"
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

// ─── Mobile Dropdown ─────────────────────────────────────────────────────────

function MobileDropdown({
  title,
  items,
  isOpen,
  onToggle,
  openNested,
  onNestedToggle,
  onClose,
}: {
  title: string;
  items: DropdownItem[];
  isOpen: boolean;
  onToggle: () => void;
  openNested: string | null;
  onNestedToggle: (label: string) => void;
  onClose: () => void;
}) {
  return (
    <li className="border-b border-white/5">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:text-white transition-colors"
        onClick={onToggle}
      >
        <span>{title}</span>
        <ChevronDown
          size={15}
          className={`opacity-50 transition-transform duration-200 ${isOpen ? "rotate-180 opacity-100" : ""}`}
        />
      </button>

      {isOpen && (
        <ul className="bg-[#080a14] py-1">
          {items.map((item, i) => {
            if (item.type === "divider")
              return <hr key={i} className="border-white/5 my-1 mx-4" />;

            if (item.type === "link")
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    {...(item.external && {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    })}
                    className="block px-8 py-3 text-[13px] hover:text-white hover:bg-white/5 transition-colors"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                </li>
              );

            // nested accordion
            return (
              <li key={item.label}>
                <button
                  className="w-full flex items-center justify-between px-8 py-3 text-[13px] hover:text-white transition-colors"
                  onClick={() => onNestedToggle(item.label)}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    size={13}
                    className={`opacity-50 transition-transform duration-200 ${openNested === item.label ? "rotate-180 opacity-100" : ""}`}
                  />
                </button>

                {openNested === item.label && (
                  <ul className="bg-[#060810]">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <Link
                          href={child.href}
                          prefetch={false}
                          {...(child.external && {
                            target: "_blank",
                            rel: "noopener noreferrer",
                          })}
                          className="block px-12 py-2.5 text-[12.5px] text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                          onClick={onClose}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
