"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Megaphone, Menu, X } from "lucide-react";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";

const NAV_ITEMS = [
  { label: "Home", href: "/bsercinternship" },
  { label: "About", href: "/bsercinternship/about" },
  { label: "Projects", href: "/bsercinternship/projects" },
  { label: "Registration", href: "/bsercinternship/summer-internship" },
  { label: "Lateral", href: "/bsercinternship/registration-lateral" },
  { label: "Mentor", href: "/bsercinternship/mentorship" },
  { label: "Reg.Mentor", href: "/bsercinternship/mentor-registration" },
  { label: "REG.INSTITUTION", href: "/bsercinternship/institutional-registration" },
];

const MOVING_NOTIFICATION =
  "Registration through the examination process for 1,150 seats closes today at 11:59 PM. Applicants who miss this deadline may apply through lateral entry, which remains open until 16 June. Admit cards and offers will be sent on 1 or 2 June. Corrections to applications (name, email address, etc.) can be made from 2 June to 6 June until 5:00 PM.";

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
        {/* <div className="w-full bg-red-600 text-white text-center px-4 py-2 text-sm sm:text-base font-semibold">
          Last Date to Apply for Def-Space Summer Internship: May 27, 2026
        </div> */}
        <AnnouncementBanner section="summer-internship" />
        <div className="w-full overflow-hidden border-y border-amber-300/20 bg-amber-100/10 text-amber-100">
          <div className="ticker-track flex w-max whitespace-nowrap py-2 text-xs font-semibold tracking-wide sm:text-sm">
            <span className="px-4 pr-10 inline-flex items-center gap-2">
              <Megaphone size={18} className="shrink-0 text-red-500" aria-hidden="true" />
              {MOVING_NOTIFICATION}
            </span>
            <span className="px-4 pr-10 inline-flex items-center gap-2" aria-hidden="true">
              <Megaphone size={18} className="shrink-0 text-red-500" aria-hidden="true" />
              {MOVING_NOTIFICATION}
            </span>
          </div>
        </div>
        <div className="w-full bg-indigo-900 text-white text-center px-4 py-2 text-sm sm:text-base flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          <span className="font-semibold">📢 Offer letters will be shared on your registered email address on 16th June 2026</span>
        </div>
        {/* <div className="w-full bg-[#DC2626] text-white text-center px-4 py-2 text-sm sm:text-base flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          <span className="font-semibold">📢 Registration via the examination is closed for all 1,150 seats. Applicants who still wish to enroll may apply through the Lateral Entry route. <Link href="/bsercinternship/registration-lateral" prefetch={false}><u className="underline text-indigo-400">Apply here</u></Link></span>
        </div> */}
        <nav className="max-w-8xl mx-auto flex items-center justify-evenly px-4 sm:px-6 h-[70px]">
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
                  className="hover:text-gray-400 uppercase transition-colors"
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
              href="/bsercinternship/contact"
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
                    className="block px-5 py-4 hover:text-white hover:bg-white/5 uppercase transition"
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
                  href="/bsercinternship/contact"
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

      <style jsx>{`
        .ticker-track {
          will-change: transform;
          animation: internshipTicker 26s linear infinite;
        }

        @keyframes internshipTicker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

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
