"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { Download, Eye, Loader2, Trash2, UsersRound } from "lucide-react";

import { AdminToast } from "@/components/admin/AdminToast";
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
import type { MentorProfile } from "@/types/mentor";
import {
  extractMentors,
  formatMentorDate,
  getApiMessage,
} from "@/components/admin/mentors/mentorUtils";

type ToastVariant = "success" | "error" | "info";

function extractMentorRecords(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.mentors)) {
    return [];
  }

  return record.mentors.filter(
    (mentor): mentor is Record<string, unknown> =>
      Boolean(mentor) && typeof mentor === "object" && !Array.isArray(mentor),
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

export default function MentorList() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [mentorRecords, setMentorRecords] = useState<Record<string, unknown>[]>([]);
  const gridRef = useRef<AgGridReact>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [movingMentorIds, setMovingMentorIds] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("info");
  const [error, setError] = useState("");
  const [quickFilterText, setQuickFilterText] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadMentorList = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/mentor/list", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          throw new Error(getApiMessage(payload) || "Unable to fetch mentor list.");
        }

        if (!isMounted) {
          return;
        }

        setMentorRecords(extractMentorRecords(payload));
        setMentors(extractMentors(payload));
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setMentorRecords([]);
        setMentors([]);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Unable to fetch mentor list.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMentorList();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalMentors = useMemo(() => mentors.length, [mentors]);

  const isMovingMentor = (mentorId: number) => movingMentorIds.includes(mentorId);

  const colDefs = useMemo<ColDef<MentorProfile>[]>(() => [
    {
      headerName: "Mentor",
      field: "full_name",
      filterValueGetter: (p: any) => p.data ? `${p.data.full_name} ${p.data.email} ${p.data.phone || ""}` : "",
      flex: 1.5,
      minWidth: 250,
      cellRenderer: (params: any) => {
        const mentor = params.data;
        if (!mentor) return null;
        return (
          <div className="flex items-center gap-3 h-full">
            {mentor.has_profile_photo ? (
              <img
                src={`/api/mentor/${mentor.id}/profile-photo`}
                alt={`${mentor.full_name} profile photo`}
                className="h-10 w-10 rounded-full border border-zinc-700 object-cover bg-zinc-800"
                loading="lazy"
              />
            ) : (
              <div className="h-10 w-10 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-300 text-sm font-semibold">
                {mentor.full_name.trim().charAt(0).toUpperCase() || "M"}
              </div>
            )}
            <div className="flex flex-col justify-center">
              <span className="text-zinc-100 font-medium">{mentor.full_name}</span>
              <span className="text-zinc-400 text-xs">{mentor.phone || "-"}</span>
              <span className="text-zinc-400 text-xs">{mentor.email}</span>
            </div>
          </div>
        );
      }
    },
    {
      headerName: "Organization",
      field: "organization",
      filterValueGetter: (p: any) => p.data ? `${p.data.organization || ""} ${p.data.current_position || ""}` : "",
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => {
        const mentor = params.data;
        if (!mentor) return null;
        return (
          <div className="flex flex-col text-zinc-300 text-sm h-full justify-center">
            <span>{mentor.organization || "-"}</span>
            <span className="text-zinc-500">{mentor.current_position || "-"}</span>
          </div>
        );
      }
    },
    {
      headerName: "Track",
      field: "primary_track",
      filterValueGetter: (p: any) => p.data ? `${p.data.primary_track || ""} ${p.data.availability || ""}` : "",
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => {
        const mentor = params.data;
        if (!mentor) return null;
        return (
          <div className="flex flex-col text-zinc-300 text-sm h-full justify-center">
            <span>{mentor.primary_track || "-"}</span>
            <span className="text-zinc-500">{mentor.availability || "-"}</span>
          </div>
        );
      }
    },
    {
      headerName: "Experience",
      field: "years_experience",
      filter: 'agNumberColumnFilter',
      width: 130,
      valueFormatter: (params: any) => 
        params.value === null ? "-" : `${params.value} years`
    },
    {
      headerName: "Registered",
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
      width: 150,
      valueFormatter: (params: any) => formatMentorDate(params.value)
    },
    {
      headerName: "Actions",
      width: 200,
      sortable: false,
      filter: false,
      pinned: "right",
      cellRenderer: (params: any) => {
        const mentor = params.data;
        if (!mentor) return null;
        return (
          <div className="flex items-center justify-end gap-2 h-full">
            <Link href={`/admin/mentors/${mentor.id}`}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="border border-blue-700 bg-transparent text-blue-300 hover:bg-blue-950/50 hover:text-blue-200 h-8"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                View
              </Button>
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isMovingMentor(mentor.id)}
              onClick={() => void handleMoveToPending(mentor.id)}
              className="border border-rose-700 bg-transparent text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 h-8"
            >
              {isMovingMentor(mentor.id) ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Moving...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </>
              )}
            </Button>
          </div>
        );
      }
    }
  ], [movingMentorIds]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const handleMoveToPending = async (mentorId: number) => {
    setMovingMentorIds((prev) =>
      prev.includes(mentorId) ? prev : [...prev, mentorId],
    );

    try {
      const response = await fetch(`/api/mentor/${mentorId}/pending`, {
        method: "PATCH",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to move mentor to pending.");
      }

      setMentors((prev) => prev.filter((mentor) => mentor.id !== mentorId));
      setMentorRecords((prev) =>
        prev.filter((record) => Number(record.id) !== mentorId),
      );
      setToastVariant("success");
      setToastMessage("Mentor moved to Mentor Requests successfully.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(
        err instanceof Error && err.message
          ? err.message
          : "Unable to move mentor to pending.",
      );
    } finally {
      setMovingMentorIds((prev) => prev.filter((id) => id !== mentorId));
    }
  };

  const handleExport = async () => {
    if (isExporting || isLoading) {
      return;
    }

    let recordsToExport = mentorRecords;

    if (gridRef.current && gridRef.current.api) {
      const selectedNodes = gridRef.current.api.getSelectedNodes();
      if (selectedNodes.length > 0) {
        const selectedIds = new Set(selectedNodes.map(node => node.data.id));
        recordsToExport = mentorRecords.filter(record => selectedIds.has(Number(record.id)));
      }
    }

    if (recordsToExport.length === 0) {
      setError("No mentors selected or available to export.");
      return;
    }

    setError("");
    setIsExporting(true);

    try {
      const XLSX = await import("xlsx");

      const { headers, rows } = buildDynamicExportRows(recordsToExport);

      if (rows.length === 0) {
        setError("No mentors selected or available to export.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      worksheet["!cols"] = headers.map((header) => ({
        wch: Math.max(16, Math.min(42, header.length + 4)),
      }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Mentor List");

      const now = new Date();
      const filename = `mentor-list-export-${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(
        now.getHours(),
      ).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to export mentor list.",
      );
    } finally {
      setIsExporting(false);
    }
  };

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
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Mentor List
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Approved mentors with active status.
          </p>
        </div>

        <Link href="/admin/mentors/requests">
          <Button className="bg-blue-500 border border-blue-700 font-bold text-white hover:bg-blue-700">
            View Mentor Requests
          </Button>
        </Link>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-emerald-100 bg-emerald-950/70 border border-emerald-600 px-3 py-1 rounded-md text-lg flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-emerald-300" />
              Active Mentors
            </CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Search across all columns..."
                value={quickFilterText}
                onChange={(e) => setQuickFilterText(e.target.value)}
                className="w-full sm:w-64 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={isLoading || isExporting || mentors.length === 0}
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
              <span className="text-sm text-zinc-400">Total: {totalMentors}</span>
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
                rowSelection={{ mode: 'multiRow' }}
                overlayNoRowsTemplate='<span class="text-zinc-500">No active mentors found.</span>'
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 20, 50, 100]}
              />
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
