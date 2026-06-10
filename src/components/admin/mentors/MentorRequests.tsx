"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, UserCheck, XCircle } from "lucide-react";

import { AdminToast } from "@/components/admin/AdminToast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MentorProfile } from "@/types/mentor";
import {
  extractMentors,
  formatMentorDate,
  getApiMessage,
  getStatusBadgeClasses,
} from "@/components/admin/mentors/mentorUtils";
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

type ToastVariant = "success" | "error" | "info";

function toExportCellValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  try { return JSON.stringify(value); } catch { return String(value); }
}

function buildDynamicExportRows(records: Record<string, unknown>[]) {
  const headers: string[] = [];
  records.forEach((record) => {
    Object.keys(record).forEach((key) => {
      if (!headers.includes(key)) headers.push(key);
    });
  });
  const rows = records.map((record) => {
    const row: Record<string, string | number | boolean> = {};
    headers.forEach((header) => { row[header] = toExportCellValue(record[header]); });
    return row;
  });
  return { headers, rows };
}

export default function MentorRequests() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [approvingMentorIds, setApprovingMentorIds] = useState<number[]>([]);
  const [rejectingMentorIds, setRejectingMentorIds] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("info");
  const [quickFilterText, setQuickFilterText] = useState("");
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    let isMounted = true;
    const loadMentorRequests = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/mentor/requests", { method: "GET", cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as unknown;
        if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to fetch mentor requests.");
        if (!isMounted) return;
        setMentors(extractMentors(payload));
      } catch (err) {
        if (!isMounted) return;
        setMentors([]);
        setError(err instanceof Error && err.message ? err.message : "Unable to fetch mentor requests.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadMentorRequests();
    return () => { isMounted = false; };
  }, []);

  const pendingCount = useMemo(() => mentors.length, [mentors]);

  const handleExport = async () => {
    if (isExporting || isLoading) return;
    if (mentors.length === 0) { setError("No mentor requests available to export."); return; }
    setError("");
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      const mentorRecords = mentors.map((mentor) => ({ ...mentor }));
      const { headers, rows } = buildDynamicExportRows(mentorRecords);
      if (rows.length === 0) { setError("No mentor requests available to export."); return; }
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(16, Math.min(42, header.length + 4)) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Mentor Requests");
      const now = new Date();
      const filename = `mentor-requests-export-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to export mentor requests.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleApprove = async (mentorId: number) => {
    setApprovingMentorIds((prev) => prev.includes(mentorId) ? prev : [...prev, mentorId]);
    try {
      const response = await fetch(`/api/mentor/${mentorId}/approve`, { method: "PATCH", cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to approve mentor.");
      setMentors((prev) => prev.filter((mentor) => mentor.id !== mentorId));
      setToastVariant("success");
      setToastMessage("Mentor approved successfully.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(err instanceof Error && err.message ? err.message : "Unable to approve mentor.");
    } finally {
      setApprovingMentorIds((prev) => prev.filter((id) => id !== mentorId));
    }
  };

  const handleReject = async (mentorId: number) => {
    setRejectingMentorIds((prev) => prev.includes(mentorId) ? prev : [...prev, mentorId]);
    try {
      const response = await fetch(`/api/mentor/${mentorId}/reject`, { method: "DELETE", cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to reject mentor.");
      setMentors((prev) => prev.filter((mentor) => mentor.id !== mentorId));
      setToastVariant("success");
      setToastMessage("Mentor rejected and removed successfully.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(err instanceof Error && err.message ? err.message : "Unable to reject mentor.");
    } finally {
      setRejectingMentorIds((prev) => prev.filter((id) => id !== mentorId));
    }
  };

  const colDefs = useMemo<ColDef<MentorProfile>[]>(() => [
    {
      headerName: "Mentor",
      field: "full_name",
      flex: 1.5,
      minWidth: 200,
      filterValueGetter: (p: any) => p.data ? `${p.data.full_name} ${p.data.email}` : "",
      cellRenderer: (params: any) => {
        const mentor = params.data;
        if (!mentor) return null;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="text-zinc-100 font-medium">{mentor.full_name}</span>
            <span className="text-zinc-400 text-xs">{mentor.email}</span>
          </div>
        );
      },
    },
    {
      headerName: "Contact",
      field: "phone",
      flex: 1,
      minWidth: 130,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <span className="text-zinc-300 text-sm">{params.value || "-"}</span>
        </div>
      ),
    },
    {
      headerName: "Organization",
      field: "organization",
      flex: 1.5,
      minWidth: 200,
      filterValueGetter: (p: any) => p.data ? `${p.data.organization} ${p.data.current_position}` : "",
      cellRenderer: (params: any) => {
        const mentor = params.data;
        if (!mentor) return null;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="text-zinc-300 text-sm">{mentor.organization || "-"}</span>
            <span className="text-zinc-500 text-xs">{mentor.current_position || "-"}</span>
          </div>
        );
      },
    },
    {
      headerName: "Track",
      field: "primary_track",
      flex: 1.2,
      minWidth: 160,
      filterValueGetter: (p: any) => p.data ? `${p.data.primary_track} ${p.data.availability}` : "",
      cellRenderer: (params: any) => {
        const mentor = params.data;
        if (!mentor) return null;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="text-zinc-300 text-sm">{mentor.primary_track || "-"}</span>
            <span className="text-zinc-500 text-xs">{mentor.availability || "-"}</span>
          </div>
        );
      },
    },
    {
      headerName: "Status",
      field: "status",
      width: 120,
      cellRenderer: (params: any) => {
        if (!params.data) return null;
        return (
          <div className="flex items-center h-full">
            <Badge className={getStatusBadgeClasses(params.value)}>{params.value}</Badge>
          </div>
        );
      },
    },
    {
      headerName: "Registered",
      field: "created_at",
      width: 140,
      valueFormatter: (params: any) => formatMentorDate(params.value),
    },
    {
      headerName: "Actions",
      sortable: false,
      filter: false,
      pinned: "right",
      width: 230,
      cellRenderer: (params: any) => {
        const mentor = params.data;
        if (!mentor) return null;
        const approving = approvingMentorIds.includes(mentor.id);
        const rejecting = rejectingMentorIds.includes(mentor.id);
        const pending = approving || rejecting;
        return (
          <div className="flex items-center gap-2 h-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => void handleApprove(mentor.id)}
              className="border border-emerald-700 bg-transparent text-emerald-300 hover:bg-emerald-950/50 hover:text-emerald-200 h-8"
            >
              {approving ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Approving...</>
              ) : (
                <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Accept</>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => void handleReject(mentor.id)}
              className="border border-rose-700 bg-transparent text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 h-8"
            >
              {rejecting ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Rejecting...</>
              ) : (
                <><XCircle className="mr-1.5 h-3.5 w-3.5" />Reject</>
              )}
            </Button>
          </div>
        );
      },
    },
  ], [approvingMentorIds, rejectingMentorIds]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  return (
    <>
      <AdminToast
        open={Boolean(toastMessage)}
        message={toastMessage || ""}
        onClose={() => setToastMessage(null)}
        variant={toastVariant}
      />

      <div className="min-h-screen container mx-auto max-w-8xl text-zinc-100">
        <div className="flex flex-col gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Mentor Requests</h1>
            <p className="mt-1 text-sm text-zinc-400">Review and approve pending mentor registrations.</p>
          </div>
          <Link href="/admin/mentors">
            <Button className="bg-blue-500 border border-blue-700 font-bold text-white hover:bg-blue-700">
              View Mentor List
            </Button>
          </Link>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-400" />
                Pending Mentors
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search mentors..."
                  value={quickFilterText}
                  onChange={(e) => setQuickFilterText(e.target.value)}
                  className="w-full sm:w-64 rounded-md border border-zinc-700 bg-zinc-950/50 px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  disabled={isLoading || isExporting || mentors.length === 0}
                  className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  {isExporting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting...</>
                  ) : (
                    <><Download className="mr-2 h-4 w-4" />Export</>
                  )}
                </Button>
                <span className="text-sm text-zinc-400">Total: {pendingCount}</span>
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
              <div className="h-[600px] w-full rounded-lg overflow-hidden border border-zinc-800">
                <AgGridReact
                  ref={gridRef}
                  theme={agTheme}
                  rowData={mentors}
                  columnDefs={colDefs}
                  defaultColDef={defaultColDef}
                  rowHeight={72}
                  headerHeight={48}
                  suppressCellFocus={true}
                  enableCellTextSelection={true}
                  quickFilterText={quickFilterText}
                  rowSelection={{ mode: "multiRow" }}
                  pagination={true}
                  paginationPageSize={15}
                  paginationPageSizeSelector={[15, 30, 50, 100]}
                  overlayNoRowsTemplate='<span class="text-zinc-500">No pending mentor requests.</span>'
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
