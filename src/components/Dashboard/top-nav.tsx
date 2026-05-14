"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { Bell, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import AdminProfile from "@/components/Dashboard/AdminProfile"
 
interface BreadcrumbItem {
  label: string
  href?: string
}

const routeLabels: Record<string, string> = {
  "dashboard": "Dashboard",
  "program-categories": "Program Categories",
  "programs": "Programs",
  "advisory-board": "Advisory Board",
  "advisory-board-request": "Advisory Board Request",
  "hero-sliders": "Hero Sliders",
  "faculty-requests": "Mentor Requests",
  "faculty-list": "Mentor List",
  "mentors": "Mentor List",
  "requests": "Mentor Requests",
  "internship-applications": "Internship Applications",
  "institutional-applications": "Institutional Applications",
  "summer-school": "Summer School",
  "registration": "Registration",
  "admin-users": "Admin Users",
  "website-users": "Website Users",
  "contact-queries": "Contact Queries",
  "tickets": "Support Tickets",
  "mou-requests": "MoU Requests",
  "collaboration-requests": "Collaboration Requests",
  "faqs": "FAQs",
  "quiz-question": "Quiz Question",
  "footer-news": "Footer News",
  "settings": "Settings",
  "help": "Help",
}

function formatLabel(segment: string): string {
  if (routeLabels[segment]) return routeLabels[segment]
  return segment
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [{ label: "", href: "/admin" }]
  
  let accumulatedPath = ""
  for (const segment of segments) {
    accumulatedPath += `/${segment}`
    breadcrumbs.push({
      label: formatLabel(segment),
      href: accumulatedPath,
    })
  }
  
  if (breadcrumbs.length > 1) {
    const last = breadcrumbs[breadcrumbs.length - 1]
    breadcrumbs[breadcrumbs.length - 1] = { label: last.label, href: undefined }
  }
  
  return breadcrumbs
}

export default function TopNav() {
  const pathname = usePathname()
  const breadcrumbs = buildBreadcrumbs(pathname)

  return (
    <nav className="px-3 sm:px-6 flex items-center justify-between bg-[#0F0F12] border-b border-[#1F1F23] h-full">
      
      <div className="font-medium text-sm hidden sm:flex items-center space-x-1 truncate max-w-[600px]">
        {breadcrumbs.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />}
            
            {item.href ? (
              <Link
                href={item.href}
                prefetch={false}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-white">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
        <button
          type="button"
          className="p-1.5 sm:p-2 hover:bg-[#1F1F23] rounded-full transition-colors"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Image
              src="/img/pfp.jpg"
              alt="profile"
              width={28}
              height={28}
              className="rounded-full ring-2 ring-[#2B2B30] sm:w-8 sm:h-8 cursor-pointer"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[280px] sm:w-80 bg-[#0F0F12] border border-[#1F1F23] rounded-lg shadow-lg"
          >
            <AdminProfile avatar="/img/pfp.jpg" />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}