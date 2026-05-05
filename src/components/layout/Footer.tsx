"use client";

import { useEffect, useState } from "react";

import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { FiMail } from "react-icons/fi";
import { IconType } from "react-icons";
import Image from "next/image";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────────

interface SocialLink {
  icon: IconType;
  label: string;
  href: string;
}

interface ContactItem {
  icon: IconType;
  label: string;
  href?: string;
}

interface NewsItem {
  id: number;
  title: string;
  href: string;
  external: boolean;
}

interface FooterNewsApiResponse {
  data?: unknown;
  message?: unknown;
  error?: unknown;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInt(value: unknown): number {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : 0;
}

function isExternalUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("http://") || normalized.startsWith("https://");
}

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const root = payload as FooterNewsApiResponse;

  if (typeof root.message === "string" && root.message.trim()) {
    return root.message.trim();
  }

  if (typeof root.error === "string" && root.error.trim()) {
    return root.error.trim();
  }

  return "";
}

function normalizeNewsItem(item: unknown): NewsItem | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const row = item as Record<string, unknown>;
  const id = toPositiveInt(row.id);
  const title = toText(row.title || row.heading);
  const href = toText(row.link || row.href || row.url);

  if (!id || !title || !href) {
    return null;
  }

  return {
    id,
    title,
    href,
    external: isExternalUrl(href),
  };
}

// ─────────────────────────────────────────────────────────────
// Typed data arrays
// ─────────────────────────────────────────────────────────────

const socialLinks: SocialLink[] = [
  { icon: FaFacebookF, label: "Facebook", href: "#" },
  { icon: FaInstagram, label: "Instagram", href: "#" },
  { icon: FaTwitter, label: "Twitter", href: "#" },
  { icon: FaLinkedinIn, label: "LinkedIn", href: "#" },
];

const contactItems: ContactItem[] = [
  { icon: FiMail, label: "Contact Us", href: "/contact" },
  { icon: FiMail, label: "info@bserc.org", href: "mailto:info@bserc.org" },
  {
    icon: FiMail,
    label: "outreach@bserc.org",
    href: "mailto:outreach@bserc.org",
  },
];

// ─────────────────────────────────────────────────────────────
// Four-Column Footer Component
// ─────────────────────────────────────────────────────────────

const Footer = () => {
  const [newsUpdates, setNewsUpdates] = useState<NewsItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadFooterNews = async () => {
      try {
        const response = await fetch("/api/footer-news", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          throw new Error(getApiMessage(payload) || "Unable to fetch footer news.");
        }

        const root = payload as FooterNewsApiResponse;
        const rows = Array.isArray(root.data) ? root.data : [];
        const normalizedItems = rows
          .map(normalizeNewsItem)
          .filter((item): item is NewsItem => Boolean(item));

        if (!isMounted) {
          return;
        }

        setNewsUpdates(normalizedItems);
      } catch {
        if (isMounted) {
          setNewsUpdates([]);
        }
      }
    };

    void loadFooterNews();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="bg-black text-white border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {/* Four Column Grid - Responsive */}
        {/* col from 4 to 3 */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">

          {/* Column 1: Brand + Social */}
          <div className="space-y-4 text-center md:text-left">
            {/* Logo + Title */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="h-12 w-12 flex-shrink-0">
                <Image
                  src="/img/bserc_new_logo.png"
                  alt="BSERC logo"
                  width={500}
                  height={500}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold">BSERC</p>
                <p className="text-xs tracking-wide text-slate-400 leading-tight">
                  Def- Space Education & Innovation
                </p>

              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto md:mx-0">
              Empowering Future Innovators in Space Exploration. We are
              dedicated to advancing space science education and fostering
              innovation across India.
            </p>

            {/* Social Icons */}
            <div className="flex justify-center md:justify-start gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#0b1224] text-slate-200 transition hover:text-white hover:bg-[#1a2340]"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Partner Logos - Improved responsive grid */}
          {/* <div>
             
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-4 items-center">
              {partnerLogos.map((item, idx) => (
                <div 
                  key={idx} 
                  className="h-12 sm:h-14 flex items-center justify-center md:justify-start"
                >
                  <Image
                  priority
                    src={item.src}
                    alt={item.alt}
                    width={76}
                    height={76}
                    className="max-h-full w-auto object-contain  "
                  />
                </div>
              ))}
            </div>
          </div> */}

          {/* Column 4: Contact Us */}
          <div className="text-center md:text-left">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3">
              {contactItems.map(({ icon: Icon, label, href }, idx) => {
                const Wrapper = href ? "a" : "div";
                return (
                  <li key={idx}>
                    <Wrapper
                      href={href}
                      className="flex items-center justify-center md:justify-start gap-2 group"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0b1224] text-[#3B82F6] flex-shrink-0">
                        <Icon size={12} />
                      </span>
                      <span className="text-xs sm:text-sm text-slate-300 leading-relaxed group-hover:text-[#3B82F6] transition">
                        {label}
                      </span>
                    </Wrapper>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3: News and Updates */}
          <div className="text-center md:text-left">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">
              News and Updates
            </h4>
            <div className="w-full max-h-[160px] overflow-y-auto rounded-md border border-white/10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#0b1224] [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300 relative">
                <tbody className="divide-y divide-white/10">
                  {newsUpdates.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-xs sm:text-sm text-slate-500">
                        No updates available right now.
                      </td>
                    </tr>
                  ) : (
                    newsUpdates.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="px-3 py-2.5">
                          <a
                            href={item.href}
                            {...(item.external && {
                              target: "_blank",
                              rel: "noopener noreferrer",
                            })}
                            className="hover:text-[#3B82F6] transition inline-block w-full"
                          >
                            {item.title}
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>


        </div>

        <div className="mt-10 sm:mt-12 border-t border-white/5 pt-6">
          <div className="flex flex-col-reverse sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6">
            <p className="text-[10px] sm:text-xs text-slate-400 text-center sm:text-left break-words">
              © 2026 BSERC. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-2 text-[10px] sm:text-xs text-slate-400">
              <Link
                href="/help-desk"
                className="transition hover:text-[#3B82F6] active:opacity-80 touch-manipulation whitespace-nowrap"
              >
                Help Desk
              </Link>
              <span className="text-slate-600">|</span>
              <Link
                href="/faq"
                className="transition hover:text-[#3B82F6] active:opacity-80 touch-manipulation whitespace-nowrap"
              >
                FAQ
              </Link>
              <span className="text-slate-600">|</span>
              <Link
                href="/bserc-policies/refund-policy"
                className="transition hover:text-[#3B82F6] active:opacity-80 touch-manipulation whitespace-nowrap"
              >
                Refund Policy
              </Link>
              <span className="text-slate-600">|</span>
              <Link
                href="/bserc-policies/privacy-policy"
                className="transition hover:text-[#3B82F6] active:opacity-80 touch-manipulation whitespace-nowrap"
              >
                Privacy Policy
              </Link>
              <span className="text-slate-600">|</span>
              <Link
                href="/bserc-policies/terms-and-conditions"
                className="transition hover:text-[#3B82F6] active:opacity-80 touch-manipulation whitespace-nowrap"
              >
                Terms and Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;