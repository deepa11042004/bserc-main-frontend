"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Mail,
  Shield,
  Clock,
  ChevronRight,
  MessageCircle,
  LifeBuoy,
  Loader2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface StatCard {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  link: string;
  linkText: string;
  highlight?: string;
}

interface ParticipantRow {
  id: string;
  name: string;
  email: string;
  program: string;
  createdAt: string | null;
  createdAtUnix: number | null;
  avatar: string;
}

interface Query {
  id: string;
  from: string;
  email: string;
  subject: string;
  createdAt: string | null;
  createdAtUnix: number | null;
}

type WorkshopListItem = {
  id?: number | string;
};

type ParticipantApiItem = {
  id?: number | string;
  full_name?: string;
  email?: string;
  workshop_title?: string;
  workshop_id?: number | string | null;
  created_at?: string | null;
  created_at_unix?: number | string | null;
};

type ContactQueryApiItem = {
  id?: number | string;
  full_name?: string;
  organization_name?: string;
  email?: string;
  subject?: string;
  subject_name?: string;
  created_at?: string | null;
  created_at_unix?: number | string | null;
};

function extractWorkshopItems(payload: unknown): WorkshopListItem[] {
  if (Array.isArray(payload)) {
    return payload as WorkshopListItem[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as WorkshopListItem[];
    }

    if (Array.isArray(record.results)) {
      return record.results as WorkshopListItem[];
    }

    if (Array.isArray(record.workshops)) {
      return record.workshops as WorkshopListItem[];
    }
  }

  return [];
}

function extractParticipants(payload: unknown): ParticipantApiItem[] {
  if (Array.isArray(payload)) {
    return payload as ParticipantApiItem[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.participants)) {
      return record.participants as ParticipantApiItem[];
    }

    if (Array.isArray(record.data)) {
      return record.data as ParticipantApiItem[];
    }

    if (Array.isArray(record.results)) {
      return record.results as ParticipantApiItem[];
    }
  }

  return [];
}

function extractContactQueries(payload: unknown): ContactQueryApiItem[] {
  if (Array.isArray(payload)) {
    return payload as ContactQueryApiItem[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.data)) {
      return record.data as ContactQueryApiItem[];
    }

    if (Array.isArray(record.results)) {
      return record.results as ContactQueryApiItem[];
    }
  }

  return [];
}

function parseTimestamp(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const normalized = text.includes(' ') && !text.includes('T')
    ? text.replace(' ', 'T')
    : text;

  // If timezone is missing, treat DB-like datetime strings as UTC to avoid local offset drift.
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  if (!hasTimezone) {
    const match = normalized.match(
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/,
    );

    if (match) {
      const [, year, month, day, hour, minute, second = "0"] = match;
      const utcMs = Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      );

      if (Number.isFinite(utcMs)) {
        return new Date(utcMs);
      }
    }
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRelativeTime(
  value?: string | null,
  referenceMs = Date.now(),
  createdAtUnix?: number | null,
): string {
  let timestampMs: number | null = null;

  const unixSeconds = Number(createdAtUnix);
  if (Number.isFinite(unixSeconds) && unixSeconds > 0) {
    timestampMs = unixSeconds * 1000;
  } else {
    const parsed = parseTimestamp(value);
    if (parsed) {
      timestampMs = parsed.getTime();
    }
  }

  if (timestampMs === null) {
    return "Recently";
  }

  const diffMs = referenceMs - timestampMs;
  if (diffMs < 0) {
    return new Date(timestampMs).toLocaleDateString();
  }

  if (diffMs < 60_000) {
    return "Just now";
  }

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return new Date(timestampMs).toLocaleDateString();
}

function toParticipantRow(item: ParticipantApiItem): ParticipantRow {
  const idAsNumber =
    typeof item.id === "number"
      ? item.id
      : Number.parseInt(String(item.id ?? ""), 10);

  const id = Number.isInteger(idAsNumber) && idAsNumber > 0 ? idAsNumber : 0;
  const name = (item.full_name || "").trim() || `Participant ${id || "-"}`;
  const email = (item.email || "").trim() || "N/A";
  const workshopId =
    typeof item.workshop_id === "number"
      ? item.workshop_id
      : Number.parseInt(String(item.workshop_id ?? ""), 10);
  const program =
    (item.workshop_title || "").trim() ||
    (Number.isInteger(workshopId) && workshopId > 0
      ? `Workshop ${workshopId}`
      : "Workshop");
  const createdAtUnix = Number(item.created_at_unix);

  return {
    id: String(id || Math.random()),
    name,
    email,
    program,
    createdAt: item.created_at || null,
    createdAtUnix:
      Number.isFinite(createdAtUnix) && createdAtUnix > 0
        ? createdAtUnix
        : null,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=32`,
  };
}

function toQueryRow(item: ContactQueryApiItem): Query {
  const idAsNumber =
    typeof item.id === "number"
      ? item.id
      : Number.parseInt(String(item.id ?? ""), 10);

  const id = Number.isInteger(idAsNumber) && idAsNumber > 0 ? idAsNumber : 0;
  const from = (item.full_name || item.organization_name || "").trim() || "Unknown";
  const email = (item.email || "").trim() || "N/A";
  const subject = (item.subject || item.subject_name || "").trim() || "No subject";
  const createdAtUnix = Number(item.created_at_unix);

  return {
    id: String(id || Math.random()),
    from,
    email,
    subject,
    createdAt: item.created_at || null,
    createdAtUnix:
      Number.isFinite(createdAtUnix) && createdAtUnix > 0
        ? createdAtUnix
        : null,
  };
}

const StatCard: React.FC<{ card: StatCard }> = ({ card }) => (
  <Card
    className={`h-full overflow-hidden border-0 bg-gradient-to-br ${card.gradient} text-white shadow-lg`}
  >
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div>
          <CardDescription className="text-white/80 uppercase text-xs font-bold tracking-wider">
            {card.title}
          </CardDescription>
          <CardTitle className="text-3xl font-bold mt-1 text-white">
            {card.value}
          </CardTitle>
        </div>
        <div className="bg-white/20 rounded-full p-2.5 backdrop-blur-sm">
          {card.icon}
        </div>
      </div>
    </CardHeader>
    <CardContent className="pb-2">
      <p
        className={`text-xs ${card.highlight ? "text-white font-bold" : "text-white/80"}`}
      >
        {card.subtitle}
      </p>
    </CardContent>
    <CardFooter className="pt-2 border-t border-white/10">
      <Link
        href={card.link}
        prefetch={false}
        className="text-white/90 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors group"
      >
        {card.linkText}
        <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </CardFooter>
  </Card>
);

const ParticipantsTable: React.FC<{
  participants: ParticipantRow[];
  isLoading?: boolean;
  nowMs?: number;
}> = ({ participants, isLoading = false, nowMs }) => {
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => nowMs ?? Date.now());

  useEffect(() => {
    setCurrentTimeMs(nowMs ?? Date.now());
  }, [nowMs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800">
          <TableHead className="w-[200px] text-zinc-400">Name</TableHead>
          <TableHead className="text-zinc-400">Workshop</TableHead>
          <TableHead className="text-right text-zinc-400">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.length === 0 ? (
          <TableRow className="border-zinc-800">
            <TableCell colSpan={3} className="py-8 text-center text-zinc-500">
              No participants found.
            </TableCell>
          </TableRow>
        ) : (
          participants.map((participant) => (
            <TableRow
              key={participant.id}
              className="border-zinc-800 hover:bg-zinc-900/50"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-zinc-700">
                    <AvatarImage src={participant.avatar} alt={participant.name} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400">
                      {participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-zinc-100">
                      {participant.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {participant.email}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 font-normal bg-transparent"
                >
                  {participant.program}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-sm text-zinc-500">
                {formatRelativeTime(
                  participant.createdAt,
                  nowMs,
                  participant.createdAtUnix,
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

const QueriesTable: React.FC<{ queries: Query[]; isLoading?: boolean; nowMs?: number }> = ({
  queries,
  isLoading = false,
  nowMs,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800">
          <TableHead className="w-[180px] text-zinc-400">From</TableHead>
          <TableHead className="text-zinc-400">Subject</TableHead>
          <TableHead className="text-right text-zinc-400">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queries.length === 0 ? (
          <TableRow className="border-zinc-800">
            <TableCell colSpan={3} className="py-8 text-center text-zinc-500">
              No recent queries found.
            </TableCell>
          </TableRow>
        ) : (
          queries.map((query) => (
            <TableRow
              key={query.id}
              className="border-zinc-800 hover:bg-zinc-900/50"
            >
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-zinc-100">
                    {query.from}
                  </span>
                  <span className="text-xs text-zinc-500">{query.email}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-zinc-300">
                {query.subject}
              </TableCell>
              <TableCell className="text-right text-sm text-zinc-400">
                {formatRelativeTime(query.createdAt, nowMs, query.createdAtUnix)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default function MainDashboard() {
  const [workshopCount, setWorkshopCount] = useState(0);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [recentQueries, setRecentQueries] = useState<Query[]>([]);
  const [contactQueriesCount, setContactQueriesCount] = useState(0);
  const [supportTicketsCount, setSupportTicketsCount] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(true);
  const [isContactQueriesLoading, setIsContactQueriesLoading] = useState(true);
  const [isSupportTicketsLoading, setIsSupportTicketsLoading] = useState(true);
  const [isRecentQueriesLoading, setIsRecentQueriesLoading] = useState(true);
  const [relativeTimeTick, setRelativeTimeTick] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRelativeTimeTick(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadWorkshops = async () => {
      setIsStatsLoading(true);

      try {
        const response = await fetch("/api/workshop-list", {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error("Unable to fetch workshops");
        }

        if (!isMounted) {
          return;
        }

        setWorkshopCount(extractWorkshopItems(payload).length);
      } catch {
        if (isMounted) {
          setWorkshopCount(0);
        }
      } finally {
        if (isMounted) {
          setIsStatsLoading(false);
        }
      }
    };

    const loadParticipants = async () => {
      setIsParticipantsLoading(true);

      try {
        const response = await fetch("/api/workshop-list/participants", {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error("Unable to fetch participants");
        }

        if (!isMounted) {
          return;
        }

        const participantRows = extractParticipants(payload).map(toParticipantRow);
        setParticipants(participantRows);
      } catch {
        if (isMounted) {
          setParticipants([]);
        }
      } finally {
        if (isMounted) {
          setIsParticipantsLoading(false);
        }
      }
    };

    loadWorkshops();
    loadParticipants();

    const loadContactQueries = async () => {
      setIsContactQueriesLoading(true);
      setIsRecentQueriesLoading(true);

      try {
        const response = await fetch("/api/contact-queries", {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error("Unable to fetch contact queries");
        }

        if (!isMounted) {
          return;
        }

        const data = extractContactQueries(payload)
          .map(toQueryRow)
          .sort((a, b) => {
            const aMs = a.createdAtUnix ? a.createdAtUnix * 1000 : parseTimestamp(a.createdAt)?.getTime() || 0;
            const bMs = b.createdAtUnix ? b.createdAtUnix * 1000 : parseTimestamp(b.createdAt)?.getTime() || 0;
            return bMs - aMs;
          });

        setContactQueriesCount(data.length);
        setRecentQueries(data.slice(0, 5));
      } catch {
        if (isMounted) {
          setContactQueriesCount(0);
          setRecentQueries([]);
        }
      } finally {
        if (isMounted) {
          setIsContactQueriesLoading(false);
          setIsRecentQueriesLoading(false);
        }
      }
    };

    const loadSupportTickets = async () => {
      setIsSupportTicketsLoading(true);

      try {
        const response = await fetch("/api/admin/tickets", {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error("Unable to fetch support tickets");
        }

        if (!isMounted) {
          return;
        }

        const root = payload as Record<string, unknown>;
        const items = Array.isArray(root.data) ? root.data : [];
        setSupportTicketsCount(items.length);
      } catch {
        if (isMounted) {
          setSupportTicketsCount(0);
        }
      } finally {
        if (isMounted) {
          setIsSupportTicketsLoading(false);
        }
      }
    };

    loadContactQueries();
    loadSupportTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  const statsData: StatCard[] = useMemo(
    () => [
      {
        title: "Total Workshops",
        value: isStatsLoading ? "..." : workshopCount,
        subtitle: isStatsLoading
          ? "Loading workshops..."
          : `${workshopCount} Available`,
        icon: <Mail className="h-5 w-5" />,
        gradient: "from-blue-600 to-blue-400",
        link: "/admin/workshops",
        linkText: "View Workshops",
      },
      {
        title: "Total Participants",
        value: isParticipantsLoading ? "..." : participants.length,
        subtitle: isParticipantsLoading
          ? "Loading participants..."
          : "Workshop Registrations",
        icon: <Users className="h-5 w-5" />,
        gradient: "from-green-700 to-green-500",
        link: "/admin/participants",
        linkText: "View Participants",
      },
      {
        title: "Support Tickets",
        value: isSupportTicketsLoading ? "..." : supportTicketsCount,
        subtitle: isSupportTicketsLoading
          ? "Loading tickets..."
          : `${supportTicketsCount} Total`,
        icon: <LifeBuoy className="h-5 w-5" />,
        gradient: "from-amber-600 to-amber-400",
        link: "/admin/tickets",
        linkText: "View Tickets",
      },
      {
        title: "Admin Users",
        value: 2,
        subtitle: "System Administrators",
        icon: <Shield className="h-5 w-5" />,
        gradient: "from-zinc-600 to-zinc-400",
        link: "/admin/users",
        linkText: "Manage Admins",
      },
    ],
    [isParticipantsLoading, isStatsLoading, isContactQueriesLoading, isSupportTicketsLoading, participants.length, workshopCount, contactQueriesCount, supportTicketsCount],
  );

  const recentParticipants = useMemo(() => participants.slice(0, 5), [participants]);

  return (
    <div className="min-h-screen  text-zinc-100 container mx-auto max-w-8xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsData.map((card, index) => (
          <StatCard key={index} card={card} />
        ))}
      </div>

      <Separator className="my-6 bg-zinc-800" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full flex flex-col bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-lg text-zinc-100">
                  Recent Participants
                </CardTitle>
              </div>
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded">
                <Link href="/admin/participants" prefetch={false}>View All</Link>
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0 overflow-hidden">
            <div className="overflow-x-auto -mx-6 px-6">
              <ParticipantsTable
                participants={recentParticipants}
                isLoading={isParticipantsLoading}
                nowMs={relativeTimeTick}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-lg text-zinc-100">
                  Recent Queries
                </CardTitle>
              </div>

              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded">
                <Link href="/admin/contact-queries" prefetch={false}>View All</Link>
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0 overflow-hidden">
            <div className="overflow-x-auto -mx-6 px-6">
              <QueriesTable
                queries={recentQueries}
                isLoading={isRecentQueriesLoading}
                nowMs={relativeTimeTick}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
