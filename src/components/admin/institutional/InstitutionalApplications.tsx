"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Loader2, NotebookPen, Trash2, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type InstitutionalApplication = {
  id: number;
  institute_name: string;
  board: string;
  city: string;
  state: string;
  pin_code: string | null;
  country: string;
  contact_name: string;
  designation: string;
  email: string;
  phone: string;
  student_count: string;
  head_name: string;
  head_email: string;
  head_phone: string | null;
  message: string | null;
  payment_status: string;
  payment_amount: number | null;
  payment_currency: string | null;
  transaction_id: string | null;
  failure_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const typedPayload = payload as { message?: unknown; error?: unknown };

  if (typeof typedPayload.message === "string" && typedPayload.message.trim()) {
    return typedPayload.message.trim();
  }

  if (typeof typedPayload.error === "string" && typedPayload.error.trim()) {
    return typedPayload.error.trim();
  }

  return "";
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableText(value: unknown): string | null {
  const cleaned = toText(value);
  return cleaned || null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toPositiveInt(value: unknown): number {
  const numeric = toNumberOrNull(value);
  if (numeric === null || !Number.isInteger(numeric) || numeric < 0) {
    return 0;
  }

  return numeric;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const normalizedValue = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T');
  const utcValue = normalizedValue.endsWith('Z') ? normalizedValue : `${normalizedValue}Z`;
  const date = new Date(utcValue);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric",
    month: "short",
    day: "2-digit", });
}

function formatTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const normalizedValue = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T');
  const utcValue = normalizedValue.endsWith('Z') ? normalizedValue : `${normalizedValue}Z`;
  const date = new Date(utcValue);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit",
    minute: "2-digit", hour12: true });
}

function formatSubmittedDateTime(value: string | null): string {
  const date = formatDate(value);
  const time = formatTime(value);

  if (date === "-" && time === "-") {
    return "-";
  }

  return `${date} | ${time}`;
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (
    text.includes(",")
    || text.includes("\"")
    || text.includes("\n")
    || text.includes("\r")
  ) {
    return `"${text.replace(/\"/g, '""')}"`;
  }

  return text;
}

function mapApplication(record: Record<string, unknown>): InstitutionalApplication {
  return {
    id: toPositiveInt(record.id),
    institute_name: toText(record.institute_name),
    board: toText(record.board),
    city: toText(record.city),
    state: toText(record.state),
    pin_code: toNullableText(record.pin_code),
    country: toText(record.country),
    contact_name: toText(record.contact_name),
    designation: toText(record.designation),
    email: toText(record.email),
    phone: toText(record.phone),
    student_count: toText(record.student_count),
    head_name: toText(record.head_name),
    head_email: toText(record.head_email),
    head_phone: toNullableText(record.head_phone),
    message: toNullableText(record.message),
    payment_status: toText(record.payment_status),
    payment_amount: toNumberOrNull(record.payment_amount),
    payment_currency: toNullableText(record.payment_currency),
    transaction_id: toNullableText(record.transaction_id),
    failure_reason: toNullableText(record.failure_reason),
    created_at: toNullableText(record.created_at),
    updated_at: toNullableText(record.updated_at),
  };
}

function extractApplications(payload: unknown): InstitutionalApplication[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const root = payload as Record<string, unknown>;
  if (!Array.isArray(root.data)) {
    return [];
  }

  return root.data
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    )
    .map(mapApplication);
}

export default function InstitutionalApplications() {
  const [applications, setApplications] = useState<InstitutionalApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<InstitutionalApplication | null>(null);
  const [deletingApplicationId, setDeletingApplicationId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/institutional-registration", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          throw new Error(
            getApiMessage(payload)
              || "Unable to fetch institutional applications.",
          );
        }

        if (!isMounted) {
          return;
        }

        setApplications(extractApplications(payload));
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setApplications([]);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Unable to fetch institutional applications.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalApplications = useMemo(() => applications.length, [applications]);

  const handleExportApplications = () => {
    if (!applications.length) {
      return;
    }

    const headers = [
      "id",
      "institute_name",
      "board",
      "city",
      "state",
      "pin_code",
      "country",
      "contact_name",
      "designation",
      "email",
      "phone",
      "student_count",
      "head_name",
      "head_email",
      "head_phone",
      "message",
      "payment_status",
      "payment_amount",
      "payment_currency",
      "transaction_id",
      "failure_reason",
      "created_at",
      "updated_at",
    ];

    const rows = applications.map((application) => [
      application.id,
      application.institute_name,
      application.board,
      application.city,
      application.state,
      application.pin_code,
      application.country,
      application.contact_name,
      application.designation,
      application.email,
      application.phone,
      application.student_count,
      application.head_name,
      application.head_email,
      application.head_phone,
      application.message,
      application.payment_status,
      application.payment_amount,
      application.payment_currency,
      application.transaction_id,
      application.failure_reason,
      application.created_at,
      application.updated_at,
    ]);

    const csv = [
      headers.map((header) => toCsvValue(header)).join(","),
      ...rows.map((row) => row.map((cell) => toCsvValue(cell)).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[.:]/g, "-");

    link.href = url;
    link.download = `institutional-applications-${timestamp}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewApplication = (application: InstitutionalApplication) => {
    setSelectedApplication(application);
  };

  const handleDeleteApplication = async (application: InstitutionalApplication) => {
    if (deletingApplicationId !== null) {
      return;
    }

    const confirmDelete = window.confirm(
      `Delete application for ${application.institute_name || application.contact_name || 'this institution'}?`,
    );

    if (!confirmDelete) {
      return;
    }

    setError("");
    setDeletingApplicationId(application.id);

    try {
      const response = await fetch(
        `/api/institutional-registration/${encodeURIComponent(application.id.toString())}`,
        {
          method: "DELETE",
          cache: "no-store",
        },
      );

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload) || "Unable to delete institutional application.",
        );
      }

      setApplications((prev) => prev.filter((item) => item.id !== application.id));
      setSelectedApplication((prev) =>
        prev?.id === application.id ? null : prev,
      );
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to delete institutional application.",
      );
    } finally {
      setDeletingApplicationId(null);
    }
  };

  const colDefs = useMemo<ColDef<InstitutionalApplication>[]>(() => [
    {
      headerName: "Institute",
      field: "institute_name",
      flex: 1.5,
      minWidth: 280,
      cellRenderer: (params: any) => {
        const app = params.data;
        if (!app) return null;
        return (
          <div className="flex flex-col text-zinc-300 text-sm h-full justify-center leading-tight py-2">
            <span
              className="max-w-[260px] truncate text-zinc-100 font-medium"
              title={app.institute_name || "-"}
            >
              {app.institute_name || "-"}
            </span>
            <span className="mt-0.5">{app.board || "-"}</span>
            <span className="text-zinc-500 mt-0.5">
              {app.city || "-"}, {app.state || "-"}
            </span>
            <span className="text-zinc-500 mt-0.5">
              PIN: {app.pin_code || "-"}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Primary Contact",
      field: "contact_name",
      flex: 1,
      minWidth: 260,
      cellRenderer: (params: any) => {
        const app = params.data;
        if (!app) return null;
        return (
          <div className="flex flex-col text-zinc-300 text-sm h-full justify-center leading-tight py-2">
            <span className="text-zinc-100 font-medium">{app.contact_name || "-"}</span>
            <span className="mt-0.5">{app.designation || "-"}</span>
            <span className="text-zinc-500 mt-0.5">{app.email || "-"}</span>
            <span className="text-zinc-500 mt-0.5">{app.phone || "-"}</span>
          </div>
        );
      }
    },
    {
      headerName: "Institution Head",
      field: "head_name",
      flex: 1,
      minWidth: 260,
      cellRenderer: (params: any) => {
        const app = params.data;
        if (!app) return null;
        return (
          <div className="flex flex-col text-zinc-300 text-sm h-full justify-center leading-tight py-2">
            <span className="text-zinc-100 font-medium">{app.head_name || "-"}</span>
            <span className="text-zinc-500 mt-0.5">{app.head_email || "-"}</span>
            <span className="text-zinc-500 mt-0.5">{app.head_phone || "-"}</span>
          </div>
        );
      }
    },
    {
      headerName: "Students",
      field: "student_count",
      width: 130,
      valueFormatter: (params: any) => params.value || "-"
    },
    {
      headerName: "Submitted & Actions",
      width: 250,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const app = params.data;
        if (!app) return null;
        return (
          <div className="flex flex-col justify-center h-full py-2 gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleViewApplication(app)}
                className="rounded-md bg-cyan-500 px-2 py-1 text-xs font-semibold uppercase text-black transition hover:bg-cyan-400"
              >
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  View
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteApplication(app)}
                disabled={deletingApplicationId === app.id}
                className="rounded-md bg-rose-500 px-2 py-1 text-xs font-semibold uppercase text-black transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingApplicationId === app.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </span>
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-zinc-500 text-xs">
              <span>{formatDate(app.created_at)}</span>
              <span>|</span>
              <span>{formatTime(app.created_at)}</span>
            </div>
          </div>
        );
      }
    }
  ], [deletingApplicationId]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  return (
    <div className="min-h-screen container mx-auto max-w-8xl text-zinc-100">
      <div className="flex flex-col gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Institutional Applications
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Applications submitted through institutional registration form.
          </p>
        </div>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-blue-400" />
              Application List
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">Total: {totalApplications}</span>
              <button
                type="button"
                onClick={handleExportApplications}
                disabled={isLoading || applications.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-semibold uppercase text-black transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                theme={agTheme}
                rowData={applications}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                rowHeight={104}
                headerHeight={48}
                suppressCellFocus={true}
                overlayNoRowsTemplate='<span class="text-zinc-400">No institutional applications found.</span>'
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 20, 50, 100]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-6 sm:py-10">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Institutional Application Details</h2>
                <p className="text-sm text-zinc-400">Review submitted details for the selected institution.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="rounded-full border border-zinc-700 bg-zinc-900 p-2 text-zinc-300 transition hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-5 text-sm text-zinc-300">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-1">Institute</div>
                  <div className="text-white font-medium">{selectedApplication.institute_name || '-'}</div>
                  <div className="text-zinc-500 mt-1">{selectedApplication.board || '-'}</div>
                  <div className="text-zinc-500">{selectedApplication.city || '-'}, {selectedApplication.state || '-'}</div>
                  <div className="text-zinc-500">Country: {selectedApplication.country || '-'}</div>
                  <div className="text-zinc-500">PIN: {selectedApplication.pin_code || '-'}</div>
                  <div className="text-zinc-500">Students: {selectedApplication.student_count || '-'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-1">Primary Contact</div>
                  <div className="text-white font-medium">{selectedApplication.contact_name || '-'}</div>
                  <div className="text-zinc-500">{selectedApplication.designation || '-'}</div>
                  <div className="text-zinc-500">{selectedApplication.email || '-'}</div>
                  <div className="text-zinc-500">{selectedApplication.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-1">Institution Head</div>
                  <div className="text-white font-medium">{selectedApplication.head_name || '-'}</div>
                  <div className="text-zinc-500">{selectedApplication.head_email || '-'}</div>
                  <div className="text-zinc-500">{selectedApplication.head_phone || '-'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-1">Registration & Payment</div>
                  <div className="text-zinc-500">ID: {selectedApplication.id}</div>
                  <div className="text-zinc-500">Submitted: {formatSubmittedDateTime(selectedApplication.created_at)}</div>
                  <div className="text-zinc-500">Updated: {formatSubmittedDateTime(selectedApplication.updated_at)}</div>
                  <div className="text-zinc-500">Payment Status: {selectedApplication.payment_status || '-'}</div>
                  <div className="text-zinc-500">
                    Payment Amount: {
                      selectedApplication.payment_amount === null
                        ? '-'
                        : `${selectedApplication.payment_amount}${selectedApplication.payment_currency ? ` ${selectedApplication.payment_currency}` : ''}`
                    }
                  </div>
                  <div className="text-zinc-500">Payment Currency: {selectedApplication.payment_currency || '-'}</div>
                  <div className="text-zinc-500">Transaction ID: {selectedApplication.transaction_id || '-'}</div>
                  <div className="text-zinc-500">Failure Reason: {selectedApplication.failure_reason || '-'}</div>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">Message</div>
                <p className="whitespace-pre-wrap text-sm text-zinc-300">
                  {selectedApplication.message || 'No additional message provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
