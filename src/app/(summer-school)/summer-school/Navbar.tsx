"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "HOME", href: "/summer-school" },
  { label: "ABOUT ", href: "/summer-school/about" },
   { label: "PROJECTS ", href: "/summer-school/projects" },
  { label: "REGISTRATION", href: "/summer-school/student-registration" },
  { label: "MENTORS", href: "/summer-school/mentors" },
  { label: "REG.MENTOR", href: "/summer-school/mentor-registration" },
  { label: "REG.INSTITUTION", href: "/summer-school/Institution-registration" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brochureOpen, setBrochureOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || brochureOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, brochureOpen]);

  const closeMenu = () => setMobileOpen(false);
  const openBrochure = () => setBrochureOpen(true);
  const closeBrochure = () => setBrochureOpen(false);

  const handleBrochureClick = () => {
    closeMenu();
    openBrochure();
  };

  return (
    <>
      {/* Header */}
      <header className="w-full bg-black border-b border-white/5 sticky top-0 z-[60] backdrop-blur-md">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-[70px]">
          {/* Logo */}
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-2"
            onClick={closeMenu}
          >
            <div className="relative w-9 h-9">
              <Image
                src="/img/BSERC_new.png"
                alt="logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">
              BSERC
            </span>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-300">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className="hover:text-gray-400  transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop Right */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={openBrochure}
              aria-haspopup="dialog"
              aria-expanded={brochureOpen}
              className="group flex items-center gap-2.5 rounded-xl border border-rose-300/40 bg-gradient-to-r from-rose-800 via-red-700 to-red-600 px-3.5 py-1.5 text-left transition hover:from-rose-900 hover:via-red-800 hover:to-red-700"
            >
              <span className="h-2 w-2 rounded-full bg-rose-200 shadow-[0_0_10px_rgba(251,113,133,0.65)]" />
              <span className="flex flex-col leading-tight">
                <span className="text-[11px] font-semibold text-white">BROCHURE</span>
                <span className="text-[10px] text-rose-100/85">
                  Def-Space info
                </span>
              </span>
            </button>
            <Link
              href="/summer-school/contact"
              prefetch={false}
              className="relative px-6 py-2 font-semibold text-white rounded-lg overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 opacity-80 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></span>
              <span className="relative z-10">CONTACT US</span>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-[58]"
            onClick={closeMenu}
          />

          {/* Drawer */}
          <div className="fixed top-[102px] left-0 right-0 bottom-0 bg-[#0a0c16] z-[59] overflow-y-auto">
            <ul className="flex flex-col text-sm font-medium text-gray-300">
              {NAV_ITEMS.map((item) => (
                <li key={item.label} className="border-b border-white/5">
                  <Link
                    href={item.href}
                    prefetch={false}
                    onClick={closeMenu}
                    className="block px-5 py-4 hover:text-white hover:bg-white/5 transition"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}

              {/* Brochure Button */}
              <li className="mt-4 px-4">
                <button
                  type="button"
                  onClick={handleBrochureClick}
                  className="w-full rounded-xl border border-rose-300/40 bg-gradient-to-r from-rose-800 via-red-700 to-red-600 px-4 py-3 text-left transition hover:from-rose-900 hover:via-red-800 hover:to-red-700"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-rose-200 shadow-[0_0_10px_rgba(251,113,133,0.65)]" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[11px] font-semibold text-white">
                        BROCHURE
                      </span>
                      <span className="text-[10px] text-rose-100/85">
                        Def-Space info
                      </span>
                      <span className="mt-1 text-[10px] text-rose-100/70">
                        click to downlode Brochur
                      </span>
                    </div>
                  </div>
                </button>
              </li>

              {/* Contact Button */}
              <li className="mt-4 px-4">
                <Link
                  href="/summer-school/contact"
                  prefetch={false}
                  onClick={closeMenu}
                  className="block text-center py-3 font-semibold text-white rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition"
                >
                  CONTACT US
                </Link>
              </li>
            </ul>
          </div>
        </>
      )}

      {brochureOpen && (
        <div
          className="fixed inset-0 z-[70]"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={closeBrochure}
          />
          <div className="relative mx-auto mt-20 w-[92%] max-w-lg rounded-xl bg-[#0a0c16] border border-white/10 p-6 text-white shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">Download Brochure for more information</h2>
              <button
                type="button"
                onClick={closeBrochure}
                className="text-gray-300 hover:text-white transition"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-4">
              <p className="text-sm text-rose-50/90">
                Explore program tracks, schedules, eligibility, and support
                details for the Def-Space Summer School and Def-Space Summer
                Internship.
              </p>
              <p className="mt-2 text-sm text-rose-100/90">
                For more information, check the brochure.
              </p>
            </div>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Link
                href="/summer-school"
                prefetch={false}
                className="w-full text-center py-3 font-semibold text-white rounded-lg bg-gradient-to-r from-rose-800 via-red-700 to-red-600 hover:from-rose-900 hover:via-red-800 hover:to-red-700 transition"
              >
                <span className="flex flex-col items-center leading-tight">
                  <span>SUMMER SCHOOL</span>
                  <span className="mt-1 text-[10px] text-rose-100/70">
                    click to downlode Brochure
                  </span>
                </span>
              </Link>
              <Link
                href="/bsercinternship"
                prefetch={false}
                className="w-full text-center py-3 font-semibold text-white rounded-lg bg-gradient-to-r from-rose-800 via-red-700 to-red-600 hover:from-rose-900 hover:via-red-800 hover:to-red-700 transition"
              >
                <span className="flex flex-col items-center leading-tight">
                  <span>SUMMER INTERNSHIP</span>
                  <span className="mt-1 text-[10px] text-rose-100/70">
                    click to downlode Brochure
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
