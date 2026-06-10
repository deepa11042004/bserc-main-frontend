"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowLeft, Download, Eye, Filter, Loader2, Trash2, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/formatDate";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import type { ColDef } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

const agTheme = themeQuartz.withParams({
  backgroundColor: "#18181b",
  foregroundColor: "#e4e4e7",
  headerBackgroundColor: "#18181b",
  rowHoverColor: "#27272a",
  borderColor: "#27272a",
  headerTextColor: "#ffffff",
});

type Participant = {
  id: number;
  workshop_id: number | null;
  workshop_title: string;
  full_name: string;
  email: string;
  contact_number: string;
  alternative_email?: string | null;
  institution: string;
  nationality?: string | null;
  designation: string;
  payment_amount?: number | null;
  payment_currency?: string | null;
  razorpay_order_id?: string | null;
  payment_status: string | null;
  payment_mode?: string | null;
  razorpay_payment_id: string | null;
  agree_recording?: boolean;
  agree_terms?: boolean;
  created_at: string | null;
};

function extractParticipantRecords(payload: unknown): Record<string, unknown>[] {
  let items: unknown[] = [];

  if (Array.isArray(payload)) {
    items = payload;
  } else if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.participants)) {
      items = record.participants;
    } else if (Array.isArray(record.data)) {
      items = record.data;
    } else if (Array.isArray(record.results)) {
      items = record.results;
    }
  }

  return items.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function extractParticipants(payload: unknown): Participant[] {
  return extractParticipantRecords(payload) as Participant[];
}

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function toExportCellValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) {
    return "";
  }

  if (
    typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildDynamicExportRows(records: Record<string, unknown>[]) {
  const headers: string[] = [];

  records.forEach((record) => {
    Object.keys(record).forEach((key) => {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    });
  });

  const rows = records.map((record) => {
    const row: Record<string, string | number | boolean> = {};

    headers.forEach((header) => {
      row[header] = toExportCellValue(record[header]);
    });

    return row;
  });

  return { headers, rows };
}

// using shared formatter from src/lib/formatDate

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `Rs ${Number(value).toFixed(2)}`;
}

function presentText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  const text = String(value).trim();
  return text || "-";
}

function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return value ? "Yes" : "No";
}

function getRecordId(record: Record<string, unknown>): number | null {
  const rawId = record.id;
  if (typeof rawId === "number" && Number.isFinite(rawId)) {
    return rawId;
  }

  if (typeof rawId === "string") {
    const parsed = Number(rawId);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getPaymentBadgeClasses(status: string | null): string {
  const normalized = (status || "").trim().toLowerCase();

  if (normalized === "captured" || normalized === "authorized") {
    return "bg-emerald-950 text-emerald-200 border border-emerald-900";
  }

  if (normalized === "not_required") {
    return "bg-sky-950 text-sky-200 border border-sky-900";
  }

  if (normalized === "failed" || normalized === "faild") {
    return "bg-rose-950 text-rose-200 border border-rose-900";
  }

  return "bg-zinc-800 text-zinc-200 border border-zinc-700";
}

function formatFilterLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantRecords, setParticipantRecords] = useState<Record<string, unknown>[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingSelectedParticipant, setIsExportingSelectedParticipant] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState("");
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [deletingParticipantId, setDeletingParticipantId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadParticipants = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/workshop-list/participants", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof (payload as { message?: unknown }).message === "string"
              ? (payload as { message: string }).message
              : "Unable to fetch participants";

          throw new Error(message);
        }

        if (!isMounted) {
          return;
        }

        setParticipantRecords(extractParticipantRecords(payload));
        setParticipants(extractParticipants(payload));
        setSelectedParticipant(null);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setParticipantRecords([]);
        setParticipants([]);
        setSelectedParticipant(null);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Unable to fetch participants",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadParticipants();

    return () => {
      isMounted = false;
    };
  }, []);

  const workshopOptions = useMemo(() => {
    const workshopSet = new Set<string>();

    participants.forEach((participant) => {
      const workshopTitle = participant.workshop_title.trim();
      if (workshopTitle) {
        workshopSet.add(workshopTitle);
      }
    });

    return Array.from(workshopSet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [participants]);

  const paymentStatusOptions = useMemo(() => {
    const paymentStatusSet = new Set<string>();

    participants.forEach((participant) => {
      const paymentStatus = (participant.payment_status || "").trim().toLowerCase();
      if (paymentStatus) {
        paymentStatusSet.add(paymentStatus);
      }
    });

    return Array.from(paymentStatusSet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    const normalizedEmailSearch = emailSearch.trim().toLowerCase();

    if (!selectedWorkshopFilter && !selectedPaymentStatusFilter && !normalizedEmailSearch) {
      return participants;
    }

    return participants.filter((participant) => {
      const workshopTitle = participant.workshop_title.trim();
      const paymentStatus = (participant.payment_status || "").trim().toLowerCase();
      const participantEmail = participant.email.trim().toLowerCase();

      const matchesWorkshop =
        !selectedWorkshopFilter || workshopTitle === selectedWorkshopFilter;
      const matchesPaymentStatus =
        !selectedPaymentStatusFilter || paymentStatus === selectedPaymentStatusFilter;
      const matchesEmail =
        !normalizedEmailSearch || participantEmail.includes(normalizedEmailSearch);

      return matchesWorkshop && matchesPaymentStatus && matchesEmail;
    });
  }, [emailSearch, participants, selectedPaymentStatusFilter, selectedWorkshopFilter]);

  const filteredParticipantRecords = useMemo(() => {
    const normalizedEmailSearch = emailSearch.trim().toLowerCase();

    if (!selectedWorkshopFilter && !selectedPaymentStatusFilter && !normalizedEmailSearch) {
      return participantRecords;
    }

    return participantRecords.filter((record) => {
      const workshopTitle = toText(record.workshop_title);
      const paymentStatus = toText(record.payment_status).toLowerCase();
      const email = toText(record.email).toLowerCase();

      const matchesWorkshop =
        !selectedWorkshopFilter || workshopTitle === selectedWorkshopFilter;
      const matchesPaymentStatus =
        !selectedPaymentStatusFilter || paymentStatus === selectedPaymentStatusFilter;
      const matchesEmail = !normalizedEmailSearch || email.includes(normalizedEmailSearch);

      return matchesWorkshop && matchesPaymentStatus && matchesEmail;
    });
  }, [
    emailSearch,
    participantRecords,
    selectedPaymentStatusFilter,
    selectedWorkshopFilter,
  ]);

  const totalParticipants = useMemo(() => filteredParticipants.length, [filteredParticipants]);
  const totalParticipantsAll = useMemo(() => participants.length, [participants]);

  const handleViewParticipant = (participant: Participant) => {
    // Spread into a fresh object so repeated clicks on the same row still update the panel.
    setSelectedParticipant({ ...participant });
  };

  const handleExportSelectedParticipant = async () => {
    if (!selectedParticipant || isExportingSelectedParticipant) {
      return;
    }

    setError("");
    setIsExportingSelectedParticipant(true);

    try {
      const XLSX = await import("xlsx");

      const row = {
        participant_id: selectedParticipant.id,
        workshop_id: selectedParticipant.workshop_id ?? "-",
        workshop_title: presentText(selectedParticipant.workshop_title),
        full_name: presentText(selectedParticipant.full_name),
        email: presentText(selectedParticipant.email),
        alternative_email: presentText(selectedParticipant.alternative_email),
        contact_number: presentText(selectedParticipant.contact_number),
        institution: presentText(selectedParticipant.institution),
        designation: presentText(selectedParticipant.designation),
        nationality: presentText(selectedParticipant.nationality),
        payment_amount: formatCurrency(selectedParticipant.payment_amount),
        payment_status: presentText(selectedParticipant.payment_status),
        payment_currency: presentText(selectedParticipant.payment_currency),
        payment_mode: presentText(selectedParticipant.payment_mode),
        razorpay_order_id: presentText(selectedParticipant.razorpay_order_id),
        razorpay_payment_id: presentText(selectedParticipant.razorpay_payment_id),
        agree_recording: formatBoolean(selectedParticipant.agree_recording),
        agree_terms: formatBoolean(selectedParticipant.agree_terms),
        registered_at: formatDateTime(selectedParticipant.created_at),
      };

      const headers = Object.keys(row);
      const worksheet = XLSX.utils.json_to_sheet([row], { header: headers });

      worksheet["!cols"] = headers.map((header) => ({
        wch: Math.max(16, Math.min(42, header.length + 4)),
      }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Participant Details");

      const now = new Date();
      const safeName = (selectedParticipant.full_name || "participant")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "participant";

      const filename = `participant-${safeName}-${selectedParticipant.id}-${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(
        now.getHours(),
      ).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to export participant details.",
      );
    } finally {
      setIsExportingSelectedParticipant(false);
    }
  };

  const handleDeleteParticipant = async (participant: Participant) => {
    if (deletingParticipantId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Delete registration for ${participant.full_name || "this participant"}?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeletingParticipantId(participant.id);

    try {
      const response = await fetch(
        `/api/workshop-list/participants/${encodeURIComponent(String(participant.id))}`,
        {
          method: "DELETE",
          cache: "no-store",
        },
      );

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        const message =
          payload
          && typeof payload === "object"
          && "message" in payload
          && typeof (payload as { message?: unknown }).message === "string"
            ? (payload as { message: string }).message
            : "Unable to delete participant";

        throw new Error(message);
      }

      setParticipants((current) => current.filter((item) => item.id !== participant.id));
      setParticipantRecords((current) =>
        current.filter((record) => {
          const recordId = getRecordId(record);
          return recordId === null || recordId !== participant.id;
        }),
      );
      setSelectedParticipant((current) =>
        current && current.id === participant.id ? null : current,
      );
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to delete participant",
      );
    } finally {
      setDeletingParticipantId(null);
    }
  };

  const handleExport = async () => {
    if (isExporting || isLoading) {
      return;
    }

    let recordsToExport = filteredParticipantRecords;

    if (gridRef.current && gridRef.current.api) {
      const selectedNodes = gridRef.current.api.getSelectedNodes();
      
      if (selectedNodes.length > 0) {
        const selectedIds = new Set(selectedNodes.map(node => node.data.id));
        recordsToExport = filteredParticipantRecords.filter(record => {
          const recordId = getRecordId(record);
          return recordId !== null && selectedIds.has(recordId);
        });
      } else {
        const visibleIds = new Set();
        gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
          if (node.data && node.data.id) {
            visibleIds.add(node.data.id);
          }
        });
        
        recordsToExport = filteredParticipantRecords.filter(record => {
          const recordId = getRecordId(record);
          return recordId !== null && visibleIds.has(recordId);
        });
      }
    }

    if (recordsToExport.length === 0) {
      const hasActiveFilters =
        Boolean(selectedWorkshopFilter)
        || Boolean(selectedPaymentStatusFilter)
        || Boolean(emailSearch.trim());

      setError(
        hasActiveFilters
          ? "No participants found for the selected filters to export."
          : "No participants available to export.",
      );
      return;
    }

    setError("");
    setIsExporting(true);

    try {
      const XLSX = await import("xlsx");

      const { headers, rows } = buildDynamicExportRows(recordsToExport);

      if (rows.length === 0) {
        setError("No participants available to export.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      worksheet["!cols"] = headers.map((header) => ({
        wch: Math.max(16, Math.min(42, header.length + 4)),
      }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "All Participants");

      const now = new Date();
      const filename = `all-participants-export-${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(
        now.getHours(),
      ).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to export participants.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen container mx-auto max-w-8xl text-zinc-100">
      <div className="flex flex-col gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            All Participants
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            View all workshop participants across every workshop.
          </p>
        </div>

        <Link href="/admin">
          <Button className="bg-blue-500 border border-blue-700 font-bold text-white hover:bg-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              Participants
            </CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Search across all columns..."
                value={quickFilterText}
                onChange={(e) => setQuickFilterText(e.target.value)}
                className="w-full sm:w-64 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={isLoading || isExporting || filteredParticipantRecords.length === 0}
                className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
              <span className="text-sm text-zinc-400">
                Total: {totalParticipants}/{totalParticipantsAll}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isFilterOpen && (
            <div className="mb-4 rounded-md border border-zinc-700 bg-zinc-950/40 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="w-full sm:w-72">
                  <label
                    htmlFor="participants-workshop-filter"
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400"
                  >
                    Filter by Workshop
                  </label>
                  <select
                    id="participants-workshop-filter"
                    value={selectedWorkshopFilter}
                    onChange={(event) => setSelectedWorkshopFilter(event.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  >
                    <option value="">All Workshops</option>
                    {workshopOptions.map((workshopOption) => (
                      <option key={workshopOption} value={workshopOption}>
                        {workshopOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-64">
                  <label
                    htmlFor="participants-payment-filter"
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400"
                  >
                    Filter by Payment
                  </label>
                  <select
                    id="participants-payment-filter"
                    value={selectedPaymentStatusFilter}
                    onChange={(event) => setSelectedPaymentStatusFilter(event.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {paymentStatusOptions.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {formatFilterLabel(statusOption)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-72">
                  <label
                    htmlFor="participants-email-search"
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400"
                  >
                    Search by Email
                  </label>
                  <input
                    id="participants-email-search"
                    type="text"
                    value={emailSearch}
                    onChange={(event) => setEmailSearch(event.target.value)}
                    placeholder="Enter email"
                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedWorkshopFilter("");
                    setSelectedPaymentStatusFilter("");
                    setEmailSearch("");
                  }}
                  disabled={
                    !selectedWorkshopFilter
                    && !selectedPaymentStatusFilter
                    && !emailSearch.trim()
                  }
                  className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-[600px] w-full">
              <AgGridReact
                ref={gridRef}
                theme={agTheme}
                rowData={filteredParticipants}
                columnDefs={[
                  {
                    headerName: "ID",
                    field: "id",
                    width: 110,
                    filter: 'agNumberColumnFilter',
                    headerCheckboxSelection: true,
                    checkboxSelection: true,
                  },
                  {
                    headerName: "Name",
                    field: "full_name",
                    filterValueGetter: (p: any) => p.data ? `${p.data.full_name || ""} ${p.data.contact_number || ""} ${p.data.email || ""}` : "",
                    flex: 1.5,
                    minWidth: 250,
                    cellRenderer: (params: any) => {
                      const participant = params.data;
                      if (!participant) return null;
                      return (
                        <div className="flex flex-col justify-center h-full gap-0.5 text-sm py-2 leading-tight">
                          <span className="font-medium text-zinc-100">{participant.full_name}</span>
                          <span className="text-zinc-400 text-xs">{participant.contact_number}</span>
                          <span className="text-zinc-500 text-xs">{participant.email}</span>
                        </div>
                      );
                    }
                  },
                  {
                    headerName: "Workshop",
                    field: "workshop_title",
                    flex: 1.5,
                    minWidth: 200,
                    cellRenderer: (params: any) => {
                       const participant = params.data;
                       if (!participant) return null;
                       return (
                          <div className="flex flex-col justify-center h-full">
                             <span
                               className="block max-w-[240px] truncate text-zinc-300"
                               title={participant.workshop_title || "-"}
                             >
                               {participant.workshop_title || "-"}
                             </span>
                          </div>
                       );
                    }
                  },
                  {
                    headerName: "Payment",
                    field: "payment_status",
                    filterValueGetter: (p: any) => p.data ? `${p.data.payment_status || ""} ${p.data.razorpay_payment_id || ""}` : "",
                    flex: 1,
                    minWidth: 200,
                    cellRenderer: (params: any) => {
                      const participant = params.data;
                      if (!participant) return null;
                      
                      const badgeClasses = getPaymentBadgeClasses(participant.payment_status);
                      return (
                        <div className="flex flex-col justify-center h-full gap-1.5 text-sm py-2">
                          <span className="font-medium text-zinc-100">
                            Amount: {formatCurrency(participant.payment_amount)}
                          </span>
                          <div>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${badgeClasses}`}>
                              {participant.payment_status || "-"}
                            </span>
                          </div>
                          <span className="text-zinc-500 text-xs">
                            Payment ID: {participant.razorpay_payment_id || "-"}
                          </span>
                        </div>
                      );
                    }
                  },
                  {
                    headerName: "Registered At",
                    field: "created_at",
                    filter: 'agDateColumnFilter',
                    filterParams: {
                      comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
                        if (!cellValue) return -1;
                        const cellDate = new Date(cellValue);
                        cellDate.setHours(0, 0, 0, 0);
                        if (cellDate.getTime() === filterLocalDateAtMidnight.getTime()) return 0;
                        if (cellDate < filterLocalDateAtMidnight) return -1;
                        if (cellDate > filterLocalDateAtMidnight) return 1;
                        return 0;
                      }
                    },
                    width: 180,
                    valueFormatter: (params: any) => formatDateTime(params.value)
                  },
                  {
                    headerName: "Actions",
                    width: 150,
                    sortable: false,
                    filter: false,
                    pinned: "right",
                    cellRenderer: (params: any) => {
                      const participant = params.data;
                      if (!participant) return null;
                      return (
                        <div className="flex items-center gap-2 h-full">
                          <button
                            type="button"
                            title="View participant details"
                            onClick={() => handleViewParticipant(participant)}
                            className="rounded-md bg-cyan-500 p-1.5 text-black transition hover:bg-cyan-400"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete participant"
                            onClick={() => {
                              void handleDeleteParticipant(participant);
                            }}
                            disabled={deletingParticipantId === participant.id}
                            className="rounded-md bg-rose-500 p-1.5 text-black transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingParticipantId === participant.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      );
                    }
                  }
                ]}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                }}
                rowHeight={90}
                headerHeight={48}
                suppressCellFocus={true}
                enableCellTextSelection={true}
                quickFilterText={quickFilterText}
                rowSelection={{ mode: 'multiRow' }}
                overlayNoRowsTemplate='<span class="text-zinc-500">No participants found.</span>'
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 20, 50, 100]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedParticipant && (
        <Card className="fixed inset-x-2 bottom-2 z-50 max-h-[88vh] overflow-hidden border border-zinc-700 bg-zinc-900/95 shadow-2xl backdrop-blur sm:inset-x-auto sm:right-4 sm:w-[720px] lg:w-[920px]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-zinc-100 text-lg">
                Participant Details
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void handleExportSelectedParticipant();
                  }}
                  disabled={isExportingSelectedParticipant}
                  className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  {isExportingSelectedParticipant ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedParticipant(null)}
                  className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[74vh] overflow-y-auto pb-6">
            <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-zinc-500 text-xs">Participant ID</p>
                <p className="text-zinc-100">{selectedParticipant.id}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Workshop</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.workshop_title)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Registered At</p>
                <p className="text-zinc-100">{formatDateTime(selectedParticipant.created_at)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Full Name</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.full_name)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Email</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.email)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Alternative Email</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.alternative_email)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Contact Number</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.contact_number)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Institution</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.institution)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Designation</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.designation)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Nationality</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.nationality)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Payment Amount</p>
                <p className="text-zinc-100">{formatCurrency(selectedParticipant.payment_amount)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Payment Status</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.payment_status)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Payment ID</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.razorpay_payment_id)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Order ID</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.razorpay_order_id)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Payment Currency</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.payment_currency)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Payment Mode</p>
                <p className="text-zinc-100">{presentText(selectedParticipant.payment_mode)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Recording Consent</p>
                <p className="text-zinc-100">{formatBoolean(selectedParticipant.agree_recording)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Terms Accepted</p>
                <p className="text-zinc-100">{formatBoolean(selectedParticipant.agree_terms)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
