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

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  return (
    <>
      {/* Header */}
      <header className="w-full bg-black border-b border-white/5 sticky top-0 z-[60] backdrop-blur-md">
        <div className="w-full bg-red-600 text-white text-center px-4 py-2 text-sm sm:text-base font-semibold">
          Last Date to Apply for Def-Space Summer School: 13th May, 2026
        </div>
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
          <div className="hidden lg:flex items-center">
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

              {/* Login Button */}
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
    </>
  );
}
