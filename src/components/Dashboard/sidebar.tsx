"use client"

import {
  Users2,
  Shield,
  MessagesSquare,
  Video,
  ExternalLink,
  HelpCircle,
  LifeBuoy,
  Menu,
  LayoutPanelLeft,
  Contact,
  UserRoundSearch,
  Images,
  Home,
  GraduationCap,
  Building2,
  Mail,
  FileText,
  Send,
  XCircle,
  Activity,
} from "lucide-react"

import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"

type NavItemProps = {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  onClick?: () => void
  isActive?: boolean
  isExternal?: boolean
}

function NavItem({
  href,
  icon: Icon,
  children,
  onClick,
  isActive = false,
  isExternal = false,
}: NavItemProps) {
  const baseClasses = `
    flex items-center px-3 py-2 text-sm rounded-md transition-colors
    ${
      isActive
        ? "bg-[#1F1F23] text-white font-medium"
        : "text-gray-300 hover:text-white hover:bg-[#1F1F23]"
    }
  `

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={baseClasses}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        {children}
      </a>
    )
  }

  return (
    <Link href={href} onClick={onClick} className={baseClasses}>
      <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
      {children}
    </Link>
  )
}

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Normalize pathname for comparison (remove trailing slashes, handle root)
  const normalizedPath = pathname === "/" ? "/admin" : pathname

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-[#0F0F12] shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-5 w-5 text-gray-300" />
      </button>

      <nav
        className={`
          fixed inset-y-0 left-0 z-[70] w-64 bg-[#0F0F12] transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:w-64 border-r border-[#1F1F23]
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">
          <Link
            href="/admin"
            className="h-16 px-6 flex items-center border-b border-[#1F1F23]"
          >
            <div className="flex items-center gap-3">
              <Image
                src="/img/bserc_new_logo.png"
                alt="logo"
                width={40}
                height={40}
                className="flex-shrink-0"
              />
              <span className="text-lg font-semibold hover:cursor-pointer text-white">
                BSERC Admin
              </span>
            </div>
          </Link>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Overview
                </div>
                <NavItem
                  href="/admin"
                  icon={Home}
                  onClick={() => setIsMobileMenuOpen(false)}
                  isActive={normalizedPath === "/admin"}
                >
                  Dashboard
                </NavItem>
                <NavItem
                  href="/admin/contact-queries"
                  icon={MessagesSquare}
                  onClick={() => setIsMobileMenuOpen(false)}
                  isActive={normalizedPath === "/admin/contact-queries"}
                >
                  Contact Queries
                </NavItem>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Management
                </div>
                <div className="space-y-1">
                  <NavItem
                    href="/admin/workshops"
                    icon={LayoutPanelLeft}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/workshops"}
                  >
                    Workshops
                  </NavItem>
                  <NavItem
                    href="/admin/advisory-board"
                    icon={Contact}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/advisory-board"}
                  >
                    Advisory Board
                  </NavItem>
                  <NavItem
                    href="/admin/advisory-board/request"
                    icon={UserRoundSearch}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/advisory-board/request"}
                  >
                    Advisory Board Request
                  </NavItem>
                  <NavItem
                    href="/admin/sliders"
                    icon={Images}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/sliders"}
                  >
                    Hero Sliders
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Team Management
                </div>
                <div className="space-y-1">                  
                  <NavItem
                    href="/admin/mentors"
                    icon={Shield}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/mentors"}
                  >
                    Mentor List
                  </NavItem>
                  <NavItem
                    href="/admin/mentors/requests"
                    icon={Users2}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/mentors/requests"}
                  >
                    Mentor Requests
                  </NavItem>
                  <NavItem
                    href="/admin/faculty/internship-applications"
                    icon={GraduationCap}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/faculty/internship-applications"}
                  >
                    Internship Applications
                  </NavItem>
                  <NavItem
                    href="/admin/summer-school/registration"
                    icon={GraduationCap}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/summer-school/registration"}
                  >
                    Summer School Student Registrations
                  </NavItem>
                  <NavItem
                    href="/admin/institutional-applications"
                    icon={Building2}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/institutional-applications"}
                  >
                    Institutional Applications
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Email Notifications
                </div>
                <div className="space-y-1">
                  <NavItem
                    href="/admin/email"
                    icon={Mail}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/email"}
                  >
                    Email Dashboard
                  </NavItem>
                  <NavItem
                    href="/admin/email/templates"
                    icon={FileText}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath.startsWith("/admin/email/templates")}
                  >
                    Templates
                  </NavItem>
                  <NavItem
                    href="/admin/email/campaigns"
                    icon={Send}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath.startsWith("/admin/email/campaigns")}
                  >
                    Campaigns
                  </NavItem>
                  <NavItem
                    href="/admin/email/failed-emails"
                    icon={XCircle}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/email/failed-emails"}
                  >
                    Failed Emails
                  </NavItem>
                  <NavItem
                    href="/admin/email/queue-health"
                    icon={Activity}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/email/queue-health"}
                  >
                    Queue Health
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Users & Queries
                </div>
                <div className="space-y-1">
                  <NavItem
                    href="/admin/all-admins"
                    icon={Users2}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/all-admins"}
                  >
                    Admin Users
                  </NavItem>
                  <NavItem
                    href="/admin/website-users"
                    icon={Shield}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/website-users"}
                  >
                    Website Users
                  </NavItem>
                  <NavItem
                    href="/admin/tickets"
                    icon={LifeBuoy}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath.startsWith("/admin/tickets")}
                  >
                    Support Tickets
                  </NavItem>
                  <NavItem
                    href="/admin/mou-requests"
                    icon={MessagesSquare}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/mou-requests"}
                  >
                    MoU Requests
                  </NavItem>
                  <NavItem
                    href="/admin/collaboration-requests"
                    icon={Video}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/collaboration-requests"}
                  >
                    Collaboration Requests
                  </NavItem>
                  <NavItem
                    href="/admin/faqs"
                    icon={Video}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/faqs"}
                  >
                    FAQs
                  </NavItem>
                  <NavItem
                    href="/admin/quiz-questions"
                    icon={Video}
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={normalizedPath === "/admin/quiz-questions"}
                  >
                    Quiz Questions
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-[#1F1F23]">
            <div className="space-y-1">
              <NavItem
                href="/admin/mailing"
                icon={MessagesSquare}
                onClick={() => setIsMobileMenuOpen(false)}
                isActive={normalizedPath.startsWith('/admin/mailing')}
              >
                Mailing
              </NavItem>

              <NavItem
                //LMS Dashboard link (replace with actual URL if different) 
                href="https://bserc-frontend.vercel.app/"
                icon={ExternalLink}
                onClick={() => setIsMobileMenuOpen(false)}
                isActive={false}
                isExternal={true}
              >
                LMS Dashboard
              </NavItem>
              <NavItem
                href="/help"
                icon={HelpCircle}
                onClick={() => setIsMobileMenuOpen(false)}
                isActive={normalizedPath === "/help"}
              >
                Help
              </NavItem>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[65] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}