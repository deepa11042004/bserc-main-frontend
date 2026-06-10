"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, Filter, Loader2, NotebookPen, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
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

type SummerSchoolStudentRegistration = {
  id: number;
  full_name: string;
  email: string;
  dob: string | null;
  category: string;
  grade: string;
  school: string;
  board: string;
  nationality: string;
  gender: string | null;
  guardian_name: string;
  relationship: string;
  guardian_email: string;
  guardian_phone: string;
  alt_phone: string | null;
  batch: string;
  experience: string | null;
  payment_amount: number | null;
  payment_currency: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_status: string | null;
  payment_mode: string | null;
  created_at: string | null;
};

type SummerSchoolRegistrationSettingsResponse = {
  indian_fee_amount?: number;
  ews_fee_amount?: number;
  other_fee_amount?: number;
  batch_options?: string[];
  message?: string;
  error?: string;
};

type SettingsStatus = {
  type: "success" | "error";
  message: string;
};

const DEFAULT_BATCH_OPTIONS_TEXT =
  "Batch 1: 15th May - 30th June\nBatch 2: 19th June - 30th July";

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

  if (date === "-") {
    return time;
  }

  if (time === "-") {
    return date;
  }

  return `${date} | ${time}`;
}

function formatPayment(amount: number | null, currency: string | null): string {
  if (amount === null) {
    return "-";
  }

  if (currency === "USD") {
    return `$${amount.toFixed(2)}`;
  }

  if (currency === "INR") {
    return `Rs. ${amount.toFixed(2)}`;
  }

  return `${amount.toFixed(2)}${currency ? ` ${currency}` : ""}`;
}

function getPaymentBadgeClass(status: string | null): string {
  const normalized = (status || "").toLowerCase();

  if (normalized === "captured" || normalized === "authorized") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/50";
  }

  if (normalized === "pending" || normalized === "created") {
    return "bg-amber-500/15 text-amber-300 border-amber-500/50";
  }

  if (normalized === "failed") {
    return "bg-rose-500/15 text-rose-300 border-rose-500/50";
  }

  return "bg-zinc-700/50 text-zinc-200 border-zinc-600";
}

function mapRegistration(record: Record<string, unknown>): SummerSchoolStudentRegistration {
  return {
    id: toPositiveInt(record.id),
    full_name: toText(record.full_name),
    email: toText(record.email),
    dob: toNullableText(record.dob),
    category: toText(record.category),
    grade: toText(record.grade),
    school: toText(record.school),
    board: toText(record.board),
    nationality: toText(record.nationality),
    gender: toNullableText(record.gender),
    guardian_name: toText(record.guardian_name),
    relationship: toText(record.relationship),
    guardian_email: toText(record.guardian_email),
    guardian_phone: toText(record.guardian_phone),
    alt_phone: toNullableText(record.alt_phone),
    batch: toText(record.batch),
    experience: toNullableText(record.experience),
    payment_amount: toNumberOrNull(record.payment_amount),
    payment_currency: toNullableText(record.payment_currency),
    razorpay_order_id: toNullableText(record.razorpay_order_id),
    razorpay_payment_id: toNullableText(record.razorpay_payment_id),
    payment_status: toNullableText(record.payment_status),
    payment_mode: toNullableText(record.payment_mode),
    created_at: toNullableText(record.created_at),
  };
}

function extractRegistrations(payload: unknown): SummerSchoolStudentRegistration[] {
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
    .map(mapRegistration);
}

function extractRegistrationRecords(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const root = payload as Record<string, unknown>;
  if (!Array.isArray(root.data)) {
    return [];
  }

  return root.data.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
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

export default function SummerSchoolRegistrations() {
  const [registrations, setRegistrations] =
    useState<SummerSchoolStudentRegistration[]>([]);
  const [registrationRecords, setRegistrationRecords] =
    useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [selectedNationalityFilter, setSelectedNationalityFilter] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [error, setError] = useState("");
  const [indianFeeInput, setIndianFeeInput] = useState("1350");
  const [ewsFeeInput, setEwsFeeInput] = useState("750");
  const [otherFeeInput, setOtherFeeInput] = useState("150");
  const [batchOptionsInput, setBatchOptionsInput] = useState(
    DEFAULT_BATCH_OPTIONS_TEXT,
  );
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<SettingsStatus | null>(null);
  const [selectedRegistration, setSelectedRegistration] =
    useState<SummerSchoolStudentRegistration | null>(null);
  const [deletingRegistrationId, setDeletingRegistrationId] = useState<number | null>(null);
  const [quickFilterText, setQuickFilterText] = useState("");
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    let isMounted = true;

    const loadRegistrations = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/summer-school/student-registration", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          throw new Error(
            getApiMessage(payload)
              || "Unable to fetch summer school student registrations.",
          );
        }

        if (!isMounted) {
          return;
        }

        setRegistrationRecords(extractRegistrationRecords(payload));
        setRegistrations(extractRegistrations(payload));
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setRegistrationRecords([]);
        setRegistrations([]);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Unable to fetch summer school student registrations.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const loadSettings = async () => {
      setIsSettingsLoading(true);

      try {
        const response = await fetch("/api/summer-school/student-registration/settings", {
          method: "GET",
          cache: "no-store",
        });

        const payload =
          (await response.json().catch(() => ({}))) as SummerSchoolRegistrationSettingsResponse;

        if (!response.ok) {
          throw new Error(
            getApiMessage(payload)
              || "Unable to load summer school registration settings.",
          );
        }

        if (!isMounted) {
          return;
        }

          setIndianFeeInput(String(payload.indian_fee_amount ?? 0));
          setEwsFeeInput(String(payload.ews_fee_amount ?? 0));
        setOtherFeeInput(String(payload.other_fee_amount ?? 0));

        const batchOptions = Array.isArray(payload.batch_options)
          ? payload.batch_options
              .map((option) => option.trim())
              .filter(Boolean)
          : [];

        setBatchOptionsInput(
          batchOptions.length > 0
            ? batchOptions.join("\n")
            : DEFAULT_BATCH_OPTIONS_TEXT,
        );
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setSettingsStatus({
          type: "error",
          message:
            err instanceof Error && err.message
              ? err.message
              : "Unable to load summer school registration settings.",
        });
      } finally {
        if (isMounted) {
          setIsSettingsLoading(false);
        }
      }
    };

    loadRegistrations();
    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalRegistrations = useMemo(() => registrations.length, [registrations]);

  const classOptions = useMemo(() => {
    const uniqueClasses = new Set<string>();

    registrations.forEach((registration) => {
      const classValue = registration.grade.trim();
      if (classValue) {
        uniqueClasses.add(classValue);
      }
    });

    return Array.from(uniqueClasses).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [registrations]);

  const nationalityOptions = useMemo(() => {
    const uniqueNationalities = new Set<string>();

    registrations.forEach((registration) => {
      const nationalityValue = registration.nationality.trim();
      if (nationalityValue) {
        uniqueNationalities.add(nationalityValue);
      }
    });

    return Array.from(uniqueNationalities).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    const normalizedEmailSearch = emailSearch.trim().toLowerCase();

    if (!selectedClassFilter && !selectedNationalityFilter && !normalizedEmailSearch) {
      return registrations;
    }

    return registrations.filter((registration) => {
      const matchesClass =
        !selectedClassFilter || registration.grade.trim() === selectedClassFilter;
      const matchesNationality =
        !selectedNationalityFilter
        || registration.nationality.trim() === selectedNationalityFilter;
      const matchesEmail =
        !normalizedEmailSearch
        || registration.email.trim().toLowerCase().includes(normalizedEmailSearch);

      return matchesClass && matchesNationality && matchesEmail;
    });
  }, [emailSearch, registrations, selectedClassFilter, selectedNationalityFilter]);

  const filteredRegistrationRecords = useMemo(() => {
    const normalizedEmailSearch = emailSearch.trim().toLowerCase();

    if (!selectedClassFilter && !selectedNationalityFilter && !normalizedEmailSearch) {
      return registrationRecords;
    }

    return registrationRecords.filter((record) => {
      const grade = toText(record.grade);
      const nationality = toText(record.nationality);
      const email = toText(record.email).toLowerCase();

      const matchesClass = !selectedClassFilter || grade === selectedClassFilter;
      const matchesNationality =
        !selectedNationalityFilter || nationality === selectedNationalityFilter;
      const matchesEmail = !normalizedEmailSearch || email.includes(normalizedEmailSearch);

      return matchesClass && matchesNationality && matchesEmail;
    });
  }, [emailSearch, registrationRecords, selectedClassFilter, selectedNationalityFilter]);

  const handleExport = async () => {
    if (isExporting || isLoading) {
      return;
    }

    if (filteredRegistrationRecords.length === 0) {
      const hasActiveFilters =
        Boolean(selectedClassFilter)
        || Boolean(selectedNationalityFilter)
        || Boolean(emailSearch.trim());

      setError(
        hasActiveFilters
          ? "No registrations found for the selected filters to export."
          : "No registrations available to export.",
      );
      return;
    }

    setError("");
    setIsExporting(true);

    try {
      const XLSX = await import("xlsx");

      const { headers, rows } = buildDynamicExportRows(filteredRegistrationRecords);

      if (rows.length === 0) {
        setError("No registrations available to export.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      worksheet["!cols"] = headers.map((header) => ({
        wch: Math.max(16, Math.min(42, header.length + 4)),
      }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Student Registrations");

      const now = new Date();
      const filename = `summer-school-student-registrations-${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(
        now.getHours(),
      ).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to export student registrations.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveSettings = async () => {
    const indianFeeAmount = Number(indianFeeInput);
    const ewsFeeAmount = Number(ewsFeeInput);
    const otherFeeAmount = Number(otherFeeInput);
    const batchOptions = batchOptionsInput
      .split(/\r?\n/)
      .map((option) => option.trim())
      .filter(Boolean);

    if (
      !Number.isFinite(indianFeeAmount)
      || indianFeeAmount < 0
      || !Number.isFinite(ewsFeeAmount)
      || ewsFeeAmount < 0
      || !Number.isFinite(otherFeeAmount)
      || otherFeeAmount < 0
    ) {
      setSettingsStatus({
        type: "error",
        message: "Please enter valid non-negative fee values for all fee groups.",
      });
      return;
    }

    if (batchOptions.length === 0) {
      setSettingsStatus({
        type: "error",
        message: "Please add at least one batch option.",
      });
      return;
    }

    setIsSettingsSaving(true);
    setSettingsStatus(null);

    try {
      const response = await fetch("/api/summer-school/student-registration/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indian_fee_amount: indianFeeAmount,
          ews_fee_amount: ewsFeeAmount,
          other_fee_amount: otherFeeAmount,
          batch_options: batchOptions,
        }),
        cache: "no-store",
      });

      const payload =
        (await response.json().catch(() => ({}))) as SummerSchoolRegistrationSettingsResponse;

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload)
            || "Unable to update summer school registration settings.",
        );
      }

        setIndianFeeInput(String(payload.indian_fee_amount ?? indianFeeAmount));
        setEwsFeeInput(String(payload.ews_fee_amount ?? ewsFeeAmount));
      setOtherFeeInput(String(payload.other_fee_amount ?? otherFeeAmount));

      const updatedBatchOptions = Array.isArray(payload.batch_options)
        ? payload.batch_options
            .map((option) => option.trim())
            .filter(Boolean)
        : batchOptions;

      setBatchOptionsInput(updatedBatchOptions.join("\n"));
      setSettingsStatus({
        type: "success",
        message: payload.message || "Summer school registration settings updated successfully.",
      });
    } catch (err) {
      setSettingsStatus({
        type: "error",
        message:
          err instanceof Error && err.message
            ? err.message
            : "Unable to update summer school registration settings.",
      });
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const handleViewRegistration = (registration: SummerSchoolStudentRegistration) => {
    setSelectedRegistration(registration);
  };

  const handleDeleteRegistration = async (registration: SummerSchoolStudentRegistration) => {
    if (deletingRegistrationId !== null) {
      return;
    }

    const confirmDelete = window.confirm(
      `Delete registration for ${registration.full_name || registration.email || "this student"}?`,
    );

    if (!confirmDelete) {
      return;
    }

    setError("");
    setDeletingRegistrationId(registration.id);

    try {
      const response = await fetch(
        `/api/summer-school/student-registration/${registration.id}`,
        {
          method: "DELETE",
          cache: "no-store",
        },
      );

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload) || "Unable to delete summer school registration.",
        );
      }

      setRegistrations((prev) =>
        prev.filter((item) => item.id !== registration.id),
      );
      setRegistrationRecords((prev) =>
        prev.filter((record) => toPositiveInt(record.id) !== registration.id),
      );

      setSelectedRegistration((prev) =>
        prev && prev.id === registration.id ? null : prev,
      );
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to delete summer school registration.",
      );
    } finally {
      setDeletingRegistrationId(null);
    }
  };

  const colDefs = useMemo<ColDef<SummerSchoolStudentRegistration>[]>(() => [
    {
      headerName: "Student",
      field: "full_name",
      flex: 1.5,
      minWidth: 200,
      filterValueGetter: (p: any) => p.data ? `${p.data.full_name} ${p.data.email} ${p.data.dob || ""} ${p.data.gender || ""}` : "",
      cellRenderer: (params: any) => {
        const r = params.data;
        if (!r) return null;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="text-zinc-100 font-medium">{r.full_name || "-"}</span>
            <span className="text-zinc-400 text-xs">{r.email || "-"}</span>
            <span className="text-zinc-500 text-xs">DOB: {r.dob || "-"}{r.gender ? ` | ${r.gender}` : ""}</span>
          </div>
        );
      },
    },
    {
      headerName: "Academic",
      field: "grade",
      flex: 1.5,
      minWidth: 180,
      filterValueGetter: (p: any) => p.data ? `${p.data.grade} ${p.data.school} ${p.data.board}` : "",
      cellRenderer: (params: any) => {
        const r = params.data;
        if (!r) return null;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="text-zinc-300 text-sm">{r.grade || "-"}</span>
            <span className="text-zinc-400 text-xs truncate max-w-[200px]" title={r.school || "-"}>{r.school || "-"}</span>
            <span className="text-zinc-500 text-xs">Board: {r.board || "-"}</span>
          </div>
        );
      },
    },
    {
      headerName: "Batch / Nationality",
      field: "batch",
      flex: 1.5,
      minWidth: 180,
      filterValueGetter: (p: any) => p.data ? `${p.data.batch} ${p.data.nationality} ${p.data.category}` : "",
      cellRenderer: (params: any) => {
        const r = params.data;
        if (!r) return null;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="text-zinc-300 text-sm">{r.batch || "-"}</span>
            <span className="text-zinc-500 text-xs">{r.nationality || "-"}</span>
            <span className="text-zinc-500 text-xs">Category: {r.category || "-"}</span>
          </div>
        );
      },
    },
    {
      headerName: "Payment",
      field: "payment_status",
      flex: 2,
      minWidth: 220,
      filterValueGetter: (p: any) => p.data ? `${p.data.payment_status || ""} ${p.data.payment_mode || ""} ${p.data.razorpay_order_id || ""} ${p.data.razorpay_payment_id || ""}` : "",
      cellRenderer: (params: any) => {
        const r = params.data;
        if (!r) return null;
        return (
          <div className="flex flex-col justify-center h-full gap-0.5">
            <span className="text-zinc-300 text-sm">Amount: {formatPayment(r.payment_amount, r.payment_currency)}</span>
            <span className={`inline-flex w-fit rounded border px-1.5 py-0.5 text-xs font-medium ${getPaymentBadgeClass(r.payment_status)}`}>
              {(r.payment_status || "not available").toUpperCase()}
            </span>
            <span className="text-zinc-500 text-xs">Mode: {r.payment_mode || "-"}</span>
            <span className="text-zinc-500 text-xs break-all">Order: {r.razorpay_order_id || "-"}</span>
          </div>
        );
      },
    },
    {
      headerName: "Actions / Submitted",
      sortable: false,
      filter: false,
      pinned: "right",
      width: 220,
      cellRenderer: (params: any) => {
        const r = params.data;
        if (!r) return null;
        const deleting = deletingRegistrationId === r.id;
        return (
          <div className="flex flex-col justify-center h-full gap-1.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleViewRegistration(r)}
                aria-label="View registration"
                title="View complete registration details"
                className="rounded-md bg-cyan-500 p-1.5 text-black transition hover:bg-cyan-400"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteRegistration(r)}
                aria-label="Delete registration"
                title="Delete this registration"
                disabled={deleting}
                className="rounded-md bg-rose-500 p-1.5 text-black transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
            <span className="text-zinc-500 text-xs">{formatSubmittedDateTime(r.created_at)}</span>
          </div>
        );
      },
    },
  ], [deletingRegistrationId]);

  const defaultColDef = useMemo<ColDef>(() => ({ sortable: true, filter: true, resizable: true }), []);

  return (
    <div className="min-h-screen container mx-auto max-w-8xl text-zinc-100">
      <div className="flex flex-col gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Summer School Registration
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Student applications submitted for Def-Space Summer School.
          </p>
        </div>
      </div>

      <Card className="mb-6 bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-cyan-400" />
            Registration Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settingsStatus && (
            <div
              className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                settingsStatus.type === "success"
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                  : "border-rose-500/40 bg-rose-950/30 text-rose-200"
              }`}
            >
              {settingsStatus.message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-zinc-300 font-medium">
                Indian Fee (INR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={indianFeeInput}
                onChange={(event) => setIndianFeeInput(event.target.value)}
                disabled={isSettingsLoading || isSettingsSaving}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-300 font-medium">
                EWS Fee (INR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={ewsFeeInput}
                onChange={(event) => setEwsFeeInput(event.target.value)}
                disabled={isSettingsLoading || isSettingsSaving}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-300 font-medium">
                Others Fee (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otherFeeInput}
                onChange={(event) => setOtherFeeInput(event.target.value)}
                disabled={isSettingsLoading || isSettingsSaving}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm text-zinc-300 font-medium">
              Batch Options (one batch per line)
            </label>
            <textarea
              rows={4}
              value={batchOptionsInput}
              onChange={(event) => setBatchOptionsInput(event.target.value)}
              disabled={isSettingsLoading || isSettingsSaving}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-400">
              {isSettingsLoading
                ? "Loading current registration settings..."
                : "These fee and batch settings are used dynamically in the Summer School student registration form."}
            </p>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSettingsLoading || isSettingsSaving}
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
            >
              {isSettingsSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-blue-400" />
              Student Registrations
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Search registrations..."
                value={quickFilterText}
                onChange={(e) => setQuickFilterText(e.target.value)}
                className="w-full sm:w-56 rounded-md border border-zinc-700 bg-zinc-950/50 px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
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
                disabled={isLoading || isExporting || filteredRegistrationRecords.length === 0}
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
                Total: {filteredRegistrations.length}/{totalRegistrations}
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
                    htmlFor="classFilter"
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400"
                  >
                    Filter by Class
                  </label>
                  <select
                    id="classFilter"
                    value={selectedClassFilter}
                    onChange={(event) => setSelectedClassFilter(event.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  >
                    <option value="">All Classes</option>
                    {classOptions.map((classOption) => (
                      <option key={classOption} value={classOption}>
                        {classOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-72">
                  <label
                    htmlFor="nationalityFilter"
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400"
                  >
                    Filter by Nationality
                  </label>
                  <select
                    id="nationalityFilter"
                    value={selectedNationalityFilter}
                    onChange={(event) => setSelectedNationalityFilter(event.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  >
                    <option value="">All Nationalities</option>
                    {nationalityOptions.map((nationalityOption) => (
                      <option key={nationalityOption} value={nationalityOption}>
                        {nationalityOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-72">
                  <label
                    htmlFor="summer-school-email-filter"
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400"
                  >
                    Search by Email
                  </label>
                  <input
                    id="summer-school-email-filter"
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
                    setSelectedClassFilter("");
                    setSelectedNationalityFilter("");
                    setEmailSearch("");
                  }}
                  disabled={!selectedClassFilter && !selectedNationalityFilter && !emailSearch.trim()}
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
            <div className="h-[600px] w-full rounded-lg overflow-hidden border border-zinc-800">
              <AgGridReact
                ref={gridRef}
                theme={agTheme}
                rowData={filteredRegistrations}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                rowHeight={88}
                headerHeight={48}
                suppressCellFocus={true}
                enableCellTextSelection={true}
                quickFilterText={quickFilterText}
                rowSelection={{ mode: "multiRow" }}
                pagination={true}
                paginationPageSize={15}
                paginationPageSizeSelector={[15, 30, 50, 100]}
                overlayNoRowsTemplate={`<span class="text-zinc-500">${
                  selectedClassFilter || selectedNationalityFilter || emailSearch.trim()
                    ? "No registrations found for the selected filters."
                    : "No summer school student registrations found."
                }</span>`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-6 sm:py-10">
          <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Summer School Registration Details
                </h2>
                <p className="text-xs text-zinc-400">
                  Complete information for {selectedRegistration.full_name || "selected student"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRegistration(null)}
                className="rounded-md bg-zinc-800 p-2 text-zinc-200 transition hover:bg-zinc-700"
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-1 gap-4 text-sm text-zinc-300 md:grid-cols-2">
                <div>
                  <span className="text-zinc-500">Full Name</span>
                  <p className="text-zinc-100">{selectedRegistration.full_name || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Email</span>
                  <p className="text-zinc-100 break-all">{selectedRegistration.email || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Date of Birth</span>
                  <p className="text-zinc-100">{selectedRegistration.dob || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Gender</span>
                  <p className="text-zinc-100">{selectedRegistration.gender || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Category</span>
                  <p className="text-zinc-100">{selectedRegistration.category || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Nationality</span>
                  <p className="text-zinc-100">{selectedRegistration.nationality || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Grade</span>
                  <p className="text-zinc-100">{selectedRegistration.grade || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Board</span>
                  <p className="text-zinc-100">{selectedRegistration.board || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-zinc-500">School / Institution Name</span>
                  <p className="text-zinc-100">{selectedRegistration.school || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Batch</span>
                  <p className="text-zinc-100">{selectedRegistration.batch || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Experience</span>
                  <p className="text-zinc-100">{selectedRegistration.experience || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Guardian Name</span>
                  <p className="text-zinc-100">{selectedRegistration.guardian_name || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Relationship</span>
                  <p className="text-zinc-100">{selectedRegistration.relationship || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Guardian Email</span>
                  <p className="text-zinc-100 break-all">{selectedRegistration.guardian_email || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Guardian Phone</span>
                  <p className="text-zinc-100">{selectedRegistration.guardian_phone || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Alternative Phone</span>
                  <p className="text-zinc-100">{selectedRegistration.alt_phone || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Submitted</span>
                  <p className="text-zinc-100">{formatSubmittedDateTime(selectedRegistration.created_at)}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Payment Amount</span>
                  <p className="text-zinc-100">
                    {formatPayment(
                      selectedRegistration.payment_amount,
                      selectedRegistration.payment_currency,
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Payment Status</span>
                  <p className="text-zinc-100">{selectedRegistration.payment_status || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Payment Mode</span>
                  <p className="text-zinc-100">{selectedRegistration.payment_mode || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Razorpay Order ID</span>
                  <p className="text-zinc-100 break-all">{selectedRegistration.razorpay_order_id || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Razorpay Payment ID</span>
                  <p className="text-zinc-100 break-all">{selectedRegistration.razorpay_payment_id || "-"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-zinc-800 px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedRegistration(null)}
                className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
