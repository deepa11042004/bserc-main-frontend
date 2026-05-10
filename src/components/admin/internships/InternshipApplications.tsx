"use client";

import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  Download,
  Eye,
  Loader2,
  NotebookPen,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InternshipApplication } from "@/types/internshipApplication";
import {
  extractInternshipApplications,
  extractInternshipPagination,
  formatDate,
  formatDateTime,
  formatMoney,
  getApiMessage,
  getPaymentBadgeClasses,
} from "@/components/admin/internships/internshipUtils";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteInternshipApplication,
  getInternshipFeeSettings,
  transferInternshipApplicationPaymentStatus,
  updateInternshipFeeSettings,
} from "@/services/internshipRegistration";

type RegistrationTypeFilter = "all" | "regular" | "lateral";
type PaymentStatusFilter = "all" | "failed" | "captured" | "pending";
type FeeStatus = { type: "success" | "error"; message: string };
type ActiveModalType = "view" | "delete" | "transfer";
type TransferPaymentStatus = "failed" | "captured";

const INSTITUTION_NAME_MAX_DISPLAY_LENGTH = 42;
const QUALIFICATION_MAX_DISPLAY_LENGTH = 36;

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

function truncateDisplayValue(
  value: string | null | undefined,
  maxLength: number,
): string {
  const normalized = (value || "").trim();

  if (!normalized) {
    return "-";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function presentText(value: string | null | undefined): string {
  const normalized = (value || "").trim();
  return normalized || "-";
}

export default function InternshipApplications() {
  const { token, isHydrated } = useAuth();
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [registrationTypeFilter, setRegistrationTypeFilter] =
    useState<RegistrationTypeFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>("all");
  const [emailSearch, setEmailSearch] = useState("");
  const [debouncedEmailSearch, setDebouncedEmailSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportAll, setExportAll] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [jumpPageInput, setJumpPageInput] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [generalFeeInput, setGeneralFeeInput] = useState("100");
  const [lateralFeeInput, setLateralFeeInput] = useState("100");
  const [ewsLateralFeeInput, setEwsLateralFeeInput] = useState("1350");
  const [isFeeLoading, setIsFeeLoading] = useState(true);
  const [isFeeSaving, setIsFeeSaving] = useState(false);
  const [feeStatus, setFeeStatus] = useState<FeeStatus | null>(null);
  const [activeModalType, setActiveModalType] = useState<ActiveModalType | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<InternshipApplication | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [isDeletingApplication, setIsDeletingApplication] = useState(false);
  const [isTransferringPaymentStatus, setIsTransferringPaymentStatus] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const filteredApplications = applications;

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [registrationTypeFilter, paymentStatusFilter, debouncedEmailSearch, startDate, endDate]);

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      if (!isHydrated) {
        return;
      }

      if (!token) {
        setApplications([]);
        setError("Admin login required to view internship applications.");
        return;
      }

      setIsLoading(true);
      setError("");

      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        registrationType: registrationTypeFilter,
        paymentStatus: paymentStatusFilter,
        emailSearch: debouncedEmailSearch.trim(),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      });

      try {
        const response = await fetch(`/api/internship-registration/list?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const payload = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          throw new Error(
            getApiMessage(payload) || "Unable to fetch internship applications.",
          );
        }

        if (!isMounted) {
          return;
        }

        setApplications(extractInternshipApplications(payload));
        const pagination = extractInternshipPagination(payload);
        setTotalCount(pagination.total);
        setTotalPages(pagination.totalPages);
        if (page > pagination.totalPages) {
          setPage(pagination.totalPages);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setApplications([]);
        setTotalCount(0);
        setTotalPages(1);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Unable to fetch internship applications.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const loadFeeSettings = async () => {
      setIsFeeLoading(true);

      try {
        const payload = await getInternshipFeeSettings();

        if (!isMounted) {
          return;
        }

        setGeneralFeeInput(String(payload.general_fee_rupees ?? 0));
        setLateralFeeInput(String(payload.lateral_fee_rupees ?? 0));
        setEwsLateralFeeInput(String(payload.ews_lateral_fee_rupees ?? 1350));
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setFeeStatus({
          type: "error",
          message:
            err instanceof Error && err.message
              ? err.message
              : "Unable to load internship fee settings.",
        });
      } finally {
        if (isMounted) {
          setIsFeeLoading(false);
        }
      }
    };

    loadApplications();
    loadFeeSettings();

    return () => {
      isMounted = false;
    };
  }, [
    isHydrated,
    token,
    page,
    pageSize,
    registrationTypeFilter,
    paymentStatusFilter,
    debouncedEmailSearch,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (!actionNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActionNotice("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [actionNotice]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEmailSearch(emailSearch), 300);
    return () => clearTimeout(timer);
  }, [emailSearch]);

  useEffect(() => {
    setJumpPageInput("");
  }, [page, pageSize]);

  const handleSaveFeeSettings = async () => {
    const generalFee = Number(generalFeeInput);
    const lateralFee = Number(lateralFeeInput);
    const ewsLateralFee = Number(ewsLateralFeeInput);

    if (
      !Number.isFinite(generalFee) ||
      generalFee < 0 ||
      !Number.isFinite(lateralFee) ||
      lateralFee < 0 ||
      !Number.isFinite(ewsLateralFee) ||
      ewsLateralFee < 0
    ) {
      setFeeStatus({
        type: "error",
        message: "Please enter valid non-negative fee values for all registration types.",
      });
      return;
    }

    setIsFeeSaving(true);
    setFeeStatus(null);

    try {
      const payload = await updateInternshipFeeSettings({
        general_fee_rupees: generalFee,
        lateral_fee_rupees: lateralFee,
        ews_lateral_fee_rupees: ewsLateralFee,
      });

      setGeneralFeeInput(String(payload.general_fee_rupees));
      setLateralFeeInput(String(payload.lateral_fee_rupees));
      setEwsLateralFeeInput(String(payload.ews_lateral_fee_rupees ?? ewsLateralFee));
      setFeeStatus({
        type: "success",
        message: payload.message || "Internship fees updated successfully.",
      });
    } catch (err) {
      setFeeStatus({
        type: "error",
        message:
          err instanceof Error && err.message
            ? err.message
            : "Unable to update internship fees.",
      });
    } finally {
      setIsFeeSaving(false);
    }
  };

  const handleExport = async () => {
    if (isExporting || isLoading) return;
    setError("");
    setIsExporting(true);

    try {
      let recordsToExport: InternshipApplication[];

      if (exportAll) {
        const query = new URLSearchParams({
          exportAll: "true",
          registrationType: registrationTypeFilter,
          paymentStatus: paymentStatusFilter,
          emailSearch: debouncedEmailSearch.trim(),
          startDate: startDate.trim(),
          endDate: endDate.trim(),
        });
        const response = await fetch(`/api/internship-registration/list?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) throw new Error("Failed to fetch all records for export.");
        const payload = (await response.json().catch(() => ({}))) as unknown;
        recordsToExport = extractInternshipApplications(payload);
      } else {
        recordsToExport = filteredApplications;
      }

      if (recordsToExport.length === 0) {
        setError(
          registrationTypeFilter !== "all" || paymentStatusFilter !== "all" || debouncedEmailSearch.trim()
            ? "No applications match the selected filters."
            : "No internship applications available to export.",
        );
        return;
      }

      const XLSX = await import("xlsx");
      const { headers, rows } = buildDynamicExportRows(recordsToExport.map((a) => ({ ...a })));
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      worksheet["!cols"] = headers.map((h) => ({ wch: Math.max(16, Math.min(42, h.length + 4)) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Internship Applications");
      const now = new Date();
      const suffix = exportAll ? "-all" : "";
      const filename = `internship-applications-${registrationTypeFilter}-${paymentStatusFilter}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}${suffix}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to export internship applications.");
    } finally {
      setIsExporting(false);
    }
  };


  const selectedPaymentStatus =
    (selectedApplication?.payment_status || "").trim().toLowerCase();

  const openApplicationModal = (
    modalType: ActiveModalType,
    application: InternshipApplication,
  ) => {
    setActionError("");
    setSelectedApplication(application);
    setActiveModalType(modalType);

    if (
      modalType === "view"
      && application.has_passport_photo
      && !application.passport_photo_url
      && !isPhotoLoading
    ) {
      void (async () => {
        try {
          setIsPhotoLoading(true);
          const response = await fetch(
            `/api/internship-registration/${application.id}/passport-photo-url`,
            {
              method: "GET",
              cache: "no-store",
              credentials: "include",
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            },
          );

          const payload = (await response.json().catch(() => ({}))) as unknown;

          if (!response.ok) {
            throw new Error(
              getApiMessage(payload) || "Unable to load passport photo.",
            );
          }

          const url =
            payload && typeof payload === "object" && "url" in payload
              ? String((payload as { url?: unknown }).url || "")
              : "";

          if (!url) {
            throw new Error("Passport photo URL unavailable.");
          }

          setSelectedApplication((previous) =>
            previous && previous.id === application.id
              ? { ...previous, passport_photo_url: url }
              : previous,
          );

          setApplications((previous) =>
            previous.map((item) =>
              item.id === application.id ? { ...item, passport_photo_url: url } : item,
            ),
          );
        } catch (err) {
          setActionError(
            err instanceof Error && err.message
              ? err.message
              : "Unable to load passport photo.",
          );
        } finally {
          setIsPhotoLoading(false);
        }
      })();
    }
  };

  const closeApplicationModal = () => {
    if (isDeletingApplication || isTransferringPaymentStatus) {
      return;
    }

    setActionError("");
    setIsPhotoLoading(false);
    setSelectedApplication(null);
    setActiveModalType(null);
  };

  const handleDeleteApplication = async () => {
    if (!selectedApplication || isDeletingApplication) {
      return;
    }

    setIsDeletingApplication(true);
    setActionError("");
    setError("");

    try {
      const response = await deleteInternshipApplication(selectedApplication.id);
      const responseMessage = getApiMessage(response);

      setApplications((previous) =>
        previous.filter((application) => application.id !== selectedApplication.id),
      );
      setTotalCount((previous) => Math.max(0, previous - 1));

      setActionNotice(
        responseMessage
          || `Internship application for ${selectedApplication.full_name} deleted successfully.`,
      );

      setSelectedApplication(null);
      setActiveModalType(null);
    } catch (err) {
      setActionError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to delete internship application.",
      );
    } finally {
      setIsDeletingApplication(false);
    }
  };

  const handleTransferPaymentStatus = async (
    targetPaymentStatus: TransferPaymentStatus,
  ) => {
    if (!selectedApplication || isTransferringPaymentStatus) {
      return;
    }

    setIsTransferringPaymentStatus(true);
    setActionError("");
    setError("");

    try {
      const response = await transferInternshipApplicationPaymentStatus(
        selectedApplication.id,
        targetPaymentStatus,
      );

      const responseMessage = getApiMessage(response);
      const updatedApplication = response.application;

      setApplications((previous) =>
        previous.map((application) => {
          if (application.id !== selectedApplication.id) {
            return application;
          }

          return updatedApplication
            ? updatedApplication
            : { ...application, payment_status: targetPaymentStatus };
        }),
      );

      setActionNotice(
        responseMessage
          || `Payment status updated to ${targetPaymentStatus} for ${selectedApplication.full_name}.`,
      );

      setSelectedApplication(null);
      setActiveModalType(null);
    } catch (err) {
      setActionError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to transfer internship payment status.",
      );
    } finally {
      setIsTransferringPaymentStatus(false);
    }
  };

  return (
    <div className="min-h-screen container mx-auto max-w-8xl text-zinc-100">
      <div className="flex flex-col gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Internship Applications
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            All registrations submitted for summer internship.
          </p>
        </div>
      </div>

      <Card className="mb-6 bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-cyan-400" />
            Internship Fee Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeStatus && (
            <div
              className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                feeStatus.type === "success"
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                  : "border-rose-500/40 bg-rose-950/30 text-rose-200"
              }`}
            >
              {feeStatus.message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-zinc-300 font-medium">General Registration Fee (INR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={generalFeeInput}
                onChange={(event) => setGeneralFeeInput(event.target.value)}
                disabled={isFeeLoading || isFeeSaving}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-300 font-medium">Lateral Registration Fee (INR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={lateralFeeInput}
                onChange={(event) => setLateralFeeInput(event.target.value)}
                disabled={isFeeLoading || isFeeSaving}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-300 font-medium">Lateral EWS Fee (INR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={ewsLateralFeeInput}
                onChange={(event) => setEwsLateralFeeInput(event.target.value)}
                disabled={isFeeLoading || isFeeSaving}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-400">
              {isFeeLoading
                ? "Loading current fee settings..."
                : "These fees are used during payment order creation for general, lateral, and lateral EWS registrations."}
            </p>
            <button
              type="button"
              onClick={handleSaveFeeSettings}
              disabled={isFeeLoading || isFeeSaving}
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
            >
              {isFeeSaving ? "Saving..." : "Save Fees"}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-0">
          {/* Title row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-blue-400" />
                Submitted Applications
              </CardTitle>
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                {totalCount.toLocaleString()} total
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs text-zinc-400">Export All</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={exportAll}
                  onClick={() => setExportAll((v) => !v)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    exportAll ? "bg-cyan-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      exportAll ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={isLoading || isExporting || (!exportAll && filteredApplications.length === 0)}
                className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Export {exportAll ? "All" : "Page"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-zinc-800">
            <span className="text-xs font-medium text-zinc-500 mr-0.5 shrink-0">Type:</span>
            {(["all", "regular", "lateral"] as const).map((opt) => (
              <button
                key={`type-${opt}`}
                type="button"
                onClick={() => setRegistrationTypeFilter(opt)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                  registrationTypeFilter === opt
                    ? "bg-cyan-500 text-black"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {opt === "all" ? "All" : opt === "regular" ? "General" : "Lateral"}
              </button>
            ))}
            <span className="mx-1 text-zinc-700">·</span>
            <span className="text-xs font-medium text-zinc-500 mr-0.5 shrink-0">Payment:</span>
            {(["all", "captured", "pending", "failed"] as const).map((opt) => (
              <button
                key={`pay-${opt}`}
                type="button"
                onClick={() => setPaymentStatusFilter(opt)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                  paymentStatusFilter === opt
                    ? opt === "captured"
                      ? "bg-emerald-600 text-white"
                      : opt === "failed"
                      ? "bg-rose-600 text-white"
                      : opt === "pending"
                      ? "bg-amber-500 text-black"
                      : "bg-cyan-500 text-black"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {opt === "all" ? "All" : opt === "captured" ? "Captured" : opt === "pending" ? "Pending" : "Failed"}
              </button>
            ))}
            <span className="mx-1 text-zinc-700">·</span>
            <span className="text-xs font-medium text-zinc-500 mr-0.5 shrink-0">From:</span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none focus:border-cyan-500 [color-scheme:dark]"
            />
            <span className="text-xs font-medium text-zinc-500 shrink-0">To:</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-7 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none focus:border-cyan-500 [color-scheme:dark]"
            />
            <span className="flex-1 hidden sm:block" />
            <div className="relative">
              <input
                type="text"
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                placeholder="Search email…"
                className="h-7 w-44 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-cyan-500"
              />
              {emailSearch && emailSearch !== debouncedEmailSearch && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next) && next > 0) {
                  setPageSize(next);
                  setPage(1);
                }
              }}
              className="h-7 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none focus:border-cyan-500"
            >
              {[25, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRegistrationTypeFilter("all");
                setPaymentStatusFilter("all");
                setEmailSearch("");
                setStartDate("");
                setEndDate("");
                setJumpPageInput("");
              }}
              disabled={
                registrationTypeFilter === "all" &&
                paymentStatusFilter === "all" &&
                !emailSearch.trim() &&
                !startDate &&
                !endDate
              }
              className="h-7 px-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <X className="h-3 w-3 mr-0.5" />
              Clear
            </Button>
          </div>

          {/* Pagination row */}
          <div className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="text-xs text-zinc-500">
              Showing{" "}
              <span className="font-medium text-zinc-300">{applications.length.toLocaleString()}</span>
              {" "}of{" "}
              <span className="font-medium text-zinc-300">{totalCount.toLocaleString()}</span>
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={isLoading || page <= 1}
                className="h-7 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                ← Prev
              </Button>
              <span className="px-2 text-xs text-zinc-500">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={isLoading || page >= totalPages}
                className="h-7 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Next →
              </Button>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder="Go to"
                className="ml-2 h-7 w-16 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none focus:border-cyan-500"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const parsed = Number(jumpPageInput);
                  if (Number.isFinite(parsed)) {
                    setPage(Math.min(Math.max(1, Math.floor(parsed)), totalPages));
                  }
                }}
                disabled={isLoading || !jumpPageInput.trim()}
                className="h-7 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Go
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {actionNotice && (
            <div className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
              {actionNotice}
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
            <div className="w-full overflow-x-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-white w-[22%]">Applicant</TableHead>
                    <TableHead className="text-white w-[24%]">Contact</TableHead>
                    <TableHead className="text-white w-[22%]">Institution</TableHead>
                    <TableHead className="text-white w-[16%]">Payment</TableHead>
                    <TableHead className="text-white w-[16%]">Applied At / Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell colSpan={5} className="py-8 text-center text-zinc-500">
                        {applications.length === 0
                          ? "No internship applications found for the selected filters."
                          : "No applications found for the selected filters."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((application) => (
                      <TableRow key={application.id} className="border-zinc-800 align-top">
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <span className="font-medium text-zinc-100">{application.full_name}</span>
                            <span className="text-zinc-400">Guardian: {application.guardian_name}</span>
                            <span className="text-zinc-500">
                              {application.gender} • DOB: {formatDate(application.dob)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm text-zinc-300">
                            <span>{application.mobile_number}</span>
                            <span>{application.email}</span>
                            <span className="text-zinc-500">
                              Alt: {application.alternative_email || "-"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-0 flex-col gap-1 text-sm text-zinc-300">
                            <span
                              className="block truncate"
                              title={application.institution_name || undefined}
                            >
                              {truncateDisplayValue(
                                application.institution_name,
                                INSTITUTION_NAME_MAX_DISPLAY_LENGTH,
                              )}
                            </span>
                            <span
                              className="block truncate text-zinc-500"
                              title={application.educational_qualification || undefined}
                            >
                              {truncateDisplayValue(
                                application.educational_qualification,
                                QUALIFICATION_MAX_DISPLAY_LENGTH,
                              )}
                            </span>
                            <span className="text-zinc-500">
                              Declaration: {application.declaration_accepted ? "Accepted" : "No"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-2 text-sm text-zinc-300">
                            <span>
                              {formatMoney(
                                application.payment_amount,
                                application.payment_currency,
                              )}
                            </span>
                            <Badge className={getPaymentBadgeClasses(application.payment_status)}>
                              {application.payment_status || "-"}
                            </Badge>
                            <span className="text-zinc-500 text-xs">
                              ID: {application.razorpay_payment_id || "-"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-zinc-300 text-sm">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openApplicationModal("view", application)}
                                aria-label="View application"
                                title="View full application details"
                                className="rounded-md bg-cyan-500 p-1.5 text-black transition hover:bg-cyan-400"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openApplicationModal("delete", application)}
                                aria-label="Delete application"
                                title="Delete this internship entry"
                                className="rounded-md bg-rose-500 p-1.5 text-black transition hover:bg-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openApplicationModal("transfer", application)}
                                aria-label="Transfer status"
                                title="Transfer payment status to failed/captured"
                                className="rounded-md bg-amber-500 p-1.5 text-black transition hover:bg-amber-400"
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-zinc-500">{formatDateTime(application.created_at)}</span>
                            <span className="text-xs text-zinc-400">
                              {application.is_lateral ? "Lateral Registration" : "Regular Registration"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {activeModalType && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-3xl rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  {activeModalType === "view"
                    ? "Internship Application Details"
                    : activeModalType === "delete"
                    ? "Delete Internship Application"
                    : "Transfer Payment Status"}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Applicant: {presentText(selectedApplication.full_name)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeApplicationModal}
                disabled={isDeletingApplication || isTransferringPaymentStatus}
                aria-label="Close dialog"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
              {actionError && (
                <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
                  {actionError}
                </div>
              )}

              {activeModalType === "view" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Application ID</p>
                    <p className="mt-1 text-sm text-zinc-100">{selectedApplication.id}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Applicant Name</p>
                    <p className="mt-1 text-sm text-zinc-100">{presentText(selectedApplication.full_name)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Guardian Name</p>
                    <p className="mt-1 text-sm text-zinc-100">{presentText(selectedApplication.guardian_name)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Gender</p>
                    <p className="mt-1 text-sm text-zinc-100">{presentText(selectedApplication.gender)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Date of Birth</p>
                    <p className="mt-1 text-sm text-zinc-100">{formatDate(selectedApplication.dob)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Mobile Number</p>
                    <p className="mt-1 text-sm text-zinc-100">{presentText(selectedApplication.mobile_number)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Email</p>
                    <p className="mt-1 text-sm text-zinc-100 break-all">{presentText(selectedApplication.email)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Alternative Email</p>
                    <p className="mt-1 text-sm text-zinc-100 break-all">
                      {presentText(selectedApplication.alternative_email)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 sm:col-span-2">
                    <p className="text-xs text-zinc-500">Address</p>
                    <p className="mt-1 text-sm text-zinc-100">{presentText(selectedApplication.address)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">City</p>
                    <p className="mt-1 text-sm text-zinc-100">{presentText(selectedApplication.city)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">State</p>
                    <p className="mt-1 text-sm text-zinc-100">{presentText(selectedApplication.state)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">PIN Code</p>
                    <p className="mt-1 text-sm text-zinc-100">{presentText(selectedApplication.pin_code)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Internship Type</p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {selectedApplication.is_lateral ? "Lateral Registration" : "General Registration"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 sm:col-span-2">
                    <p className="text-xs text-zinc-500">Institution Name</p>
                    <p className="mt-1 text-sm text-zinc-100">{presentText(selectedApplication.institution_name)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 sm:col-span-2">
                    <p className="text-xs text-zinc-500">Educational Qualification</p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {presentText(selectedApplication.educational_qualification)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Internship Name</p>
                    <p className="mt-1 text-sm text-zinc-100">{presentText(selectedApplication.internship_name)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Internship Designation</p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {presentText(selectedApplication.internship_designation)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Declaration Accepted</p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {selectedApplication.declaration_accepted ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Passport Photo</p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {selectedApplication.has_passport_photo ? "Uploaded" : "Not uploaded"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 sm:col-span-2">
                    <p className="text-xs text-zinc-500">Passport Photo Preview</p>
                    {selectedApplication.passport_photo_url ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <div className="flex h-64 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/40 p-2">
                          <img
                            src={selectedApplication.passport_photo_url}
                            alt="Passport photo"
                            className="h-full w-full max-w-full object-contain"
                          />
                        </div>
                        <a
                          href={selectedApplication.passport_photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-sky-300 underline"
                        >
                          Open full image
                        </a>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-400">
                        {isPhotoLoading
                          ? "Loading passport photo..."
                          : "No photo URL available."}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Photo MIME Type</p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {presentText(selectedApplication.passport_photo_mime_type)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Photo File Name</p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {presentText(selectedApplication.passport_photo_file_name)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Payment Amount</p>
                    <p className="mt-1 text-sm text-zinc-100">
                      {formatMoney(
                        selectedApplication.payment_amount,
                        selectedApplication.payment_currency,
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Payment Status</p>
                    <div className="mt-1">
                      <Badge className={getPaymentBadgeClasses(selectedApplication.payment_status)}>
                        {presentText(selectedApplication.payment_status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Razorpay Order ID</p>
                    <p className="mt-1 break-all text-sm text-zinc-100">
                      {presentText(selectedApplication.razorpay_order_id)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Razorpay Payment ID</p>
                    <p className="mt-1 break-all text-sm text-zinc-100">
                      {presentText(selectedApplication.razorpay_payment_id)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Created At</p>
                    <p className="mt-1 text-sm text-zinc-100">{formatDateTime(selectedApplication.created_at)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-xs text-zinc-500">Updated At</p>
                    <p className="mt-1 text-sm text-zinc-100">{formatDateTime(selectedApplication.updated_at)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      activeModalType === "delete"
                        ? "border-rose-500/40 bg-rose-950/30 text-rose-200"
                        : "border-amber-500/40 bg-amber-950/30 text-amber-200"
                    }`}
                  >
                    <p className="font-medium">
                      {activeModalType === "delete"
                        ? "Warning: this action permanently deletes this internship entry from the database."
                        : "This action transfers payment status between failed and captured tags for this entry."}
                    </p>
                    {activeModalType === "transfer" && (
                      <p className="mt-2 text-xs text-amber-100/90">
                        Use this when an entry was marked with an incorrect payment tag and needs manual correction.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                    <p className="text-sm text-zinc-100">
                      <span className="text-zinc-500">Applicant:</span>{" "}
                      {presentText(selectedApplication.full_name)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-100 break-all">
                      <span className="text-zinc-500">Email:</span>{" "}
                      {presentText(selectedApplication.email)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-100">
                      <span className="text-zinc-500">Payment Amount:</span>{" "}
                      {formatMoney(
                        selectedApplication.payment_amount,
                        selectedApplication.payment_currency,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-zinc-100">
                      <span className="text-zinc-500">Current Status:</span>{" "}
                      <Badge className={getPaymentBadgeClasses(selectedApplication.payment_status)}>
                        {presentText(selectedApplication.payment_status)}
                      </Badge>
                    </p>
                    <p className="mt-1 text-sm text-zinc-100 break-all">
                      <span className="text-zinc-500">Order ID:</span>{" "}
                      {presentText(selectedApplication.razorpay_order_id)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-100 break-all">
                      <span className="text-zinc-500">Payment ID:</span>{" "}
                      {presentText(selectedApplication.razorpay_payment_id)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
              {activeModalType !== "view" && (
                <button
                  type="button"
                  onClick={closeApplicationModal}
                  disabled={isDeletingApplication || isTransferringPaymentStatus}
                  className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              )}

              {activeModalType === "view" && (
                <button
                  type="button"
                  onClick={closeApplicationModal}
                  className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400"
                >
                  Close
                </button>
              )}

              {activeModalType === "delete" && (
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteApplication();
                  }}
                  disabled={isDeletingApplication}
                  className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingApplication && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete Entry
                </button>
              )}

              {activeModalType === "transfer" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      void handleTransferPaymentStatus("failed");
                    }}
                    disabled={isTransferringPaymentStatus || selectedPaymentStatus === "failed"}
                    className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isTransferringPaymentStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                    Transfer To Failed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleTransferPaymentStatus("captured");
                    }}
                    disabled={isTransferringPaymentStatus || selectedPaymentStatus === "captured"}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isTransferringPaymentStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                    Transfer To Captured
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
