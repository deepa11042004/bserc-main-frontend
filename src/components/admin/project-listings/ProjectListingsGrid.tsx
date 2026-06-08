"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { Download, Eye, Loader2, Trash2, LibraryBig } from "lucide-react";

import { AdminToast } from "@/components/admin/AdminToast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import type { ColDef } from "ag-grid-community";
import { ProjectListing, ProjectListingListResponse } from "@/types/project-listing";

ModuleRegistry.registerModules([AllCommunityModule]);

const agTheme = themeQuartz.withParams({
  backgroundColor: "#18181b",
  foregroundColor: "#e4e4e7",
  headerBackgroundColor: "#18181b",
  rowHoverColor: "#27272a",
  borderColor: "#27272a",
  headerTextColor: "#ffffff",
});

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  return typeof record.message === "string" ? record.message : "";
}

function toExportCellValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  try { return JSON.stringify(value); } catch { return String(value); }
}

function buildDynamicExportRows(records: ProjectListing[]) {
  const headers: string[] = [];
  records.forEach((record) => {
    Object.keys(record).forEach((key) => {
      if (!headers.includes(key)) headers.push(key);
    });
  });

  const rows = records.map((record) => {
    const row: Record<string, string | number | boolean> = {};
    headers.forEach((header) => {
      row[header] = toExportCellValue((record as any)[header]);
    });
    return row;
  });

  return { headers, rows };
}

export default function ProjectListingsGrid() {
  const [projects, setProjects] = useState<ProjectListing[]>([]);
  const gridRef = useRef<AgGridReact>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");
  const [error, setError] = useState("");
  const [quickFilterText, setQuickFilterText] = useState("");

  const loadProjects = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/project-listing/list?pageSize=1000", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to fetch project listings.");
      }

      const listResponse = payload as ProjectListingListResponse;
      setProjects(listResponse.data || []);
    } catch (err) {
      setProjects([]);
      setError(err instanceof Error && err.message ? err.message : "Unable to fetch project listings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const totalProjects = useMemo(() => projects.length, [projects]);
  const isDeleting = (id: number) => deletingIds.includes(id);

  const colDefs = useMemo<ColDef<ProjectListing>[]>(() => [
    {
      headerName: "Student Info",
      field: "full_name",
      filterValueGetter: (p: any) => p.data ? `${p.data.full_name} ${p.data.primary_email} ${p.data.enrolment_number}` : "",
      flex: 1.5,
      minWidth: 220,
      cellRenderer: (params: any) => {
        const project = params.data;
        if (!project) return null;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="text-zinc-100 font-medium">{project.full_name}</span>
            <span className="text-zinc-400 text-xs">{project.primary_email}</span>
            <span className="text-zinc-500 text-xs">ENR: {project.enrolment_number}</span>
          </div>
        );
      }
    },
    {
      headerName: "Contact & Location",
      field: "whatsapp_number",
      filterValueGetter: (p: any) => p.data ? `${p.data.whatsapp_number} ${p.data.city} ${p.data.state}` : "",
      flex: 1.2,
      minWidth: 180,
      cellRenderer: (params: any) => {
        const project = params.data;
        if (!project) return null;
        return (
          <div className="flex flex-col text-zinc-300 text-sm h-full justify-center">
            <span>{project.whatsapp_number || "-"}</span>
            <span className="text-zinc-500 text-xs truncate" title={`${project.city}, ${project.state}`}>
              {project.city}, {project.state}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Institution / Prog.",
      field: "institution",
      filterValueGetter: (p: any) => p.data ? `${p.data.institution} ${p.data.programme} ${p.data.department}` : "",
      flex: 1.5,
      minWidth: 200,
      cellRenderer: (params: any) => {
        const project = params.data;
        if (!project) return null;
        return (
          <div className="flex flex-col text-zinc-300 text-sm h-full justify-center">
            <span className="truncate" title={project.institution}>{project.institution}</span>
            <span className="text-zinc-500 truncate text-xs" title={`${project.department} - ${project.programme}`}>
              {project.department} • {project.programme === 'other' ? project.programme_other : project.programme?.toUpperCase()}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Project Details",
      field: "project_title",
      filterValueGetter: (p: any) => p.data ? `${p.data.project_title} ${p.data.project_theme} ${p.data.project_level}` : "",
      flex: 2,
      minWidth: 250,
      cellRenderer: (params: any) => {
        const project = params.data;
        if (!project) return null;
        return (
          <div className="flex flex-col text-zinc-300 text-sm h-full justify-center">
            <span className="font-medium truncate text-emerald-400" title={project.project_title}>
              {project.project_title}
            </span>
            <div className="flex gap-2 text-xs mt-1">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-wider text-[10px]">
                {project.project_theme === 'other' ? project.project_theme_other : project.project_theme?.replace('-', ' ')}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800 uppercase tracking-wider text-[10px]">
                {project.project_level}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      headerName: "Project Timeline",
      field: "project_start_date",
      filterValueGetter: (p: any) => p.data ? `${p.data.project_start_date} ${p.data.project_end_date}` : "",
      flex: 1.2,
      minWidth: 160,
      cellRenderer: (params: any) => {
        const project = params.data;
        if (!project) return null;
        const start = project.project_start_date ? new Date(project.project_start_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : "-";
        const end = project.project_end_date ? new Date(project.project_end_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : "Ongoing";
        return (
          <div className="flex flex-col text-zinc-300 text-sm h-full justify-center">
            <span>Start: {start}</span>
            <span className="text-zinc-500 text-xs">End: {end}</span>
          </div>
        );
      }
    },

    {
      headerName: "Submitted",
      field: "created_at",
      filter: 'agDateColumnFilter',
      width: 140,
      valueFormatter: (params: any) => {
        if (!params.value) return "-";
        const date = new Date(params.value);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    },
    {
      headerName: "Actions",
      width: 200,
      sortable: false,
      filter: false,
      pinned: "right",
      cellRenderer: (params: any) => {
        const project = params.data;
        if (!project) return null;
        return (
          <div className="flex items-center justify-end gap-2 h-full">
            <Link href={`/admin/project-listings/${project.id}`}>
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
              disabled={isDeleting(project.id)}
              onClick={() => void handleDelete(project.id)}
              className="border border-rose-700 bg-transparent text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 h-8"
            >
              {isDeleting(project.id) ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Wait...
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
  ], [deletingIds]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project listing? This action cannot be undone.")) {
      return;
    }

    setDeletingIds((prev) => [...prev, id]);

    try {
      const response = await fetch(`/api/project-listing/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to delete project listing.");
      }

      setProjects((prev) => prev.filter((project) => project.id !== id));
      setToastVariant("success");
      setToastMessage("Project listing deleted successfully.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(err instanceof Error && err.message ? err.message : "Unable to delete project listing.");
    } finally {
      setDeletingIds((prev) => prev.filter((did) => did !== id));
    }
  };

  const handleExport = async () => {
    if (isExporting || isLoading) return;

    let recordsToExport = projects;

    if (gridRef.current && gridRef.current.api) {
      const selectedNodes = gridRef.current.api.getSelectedNodes();
      if (selectedNodes.length > 0) {
        const selectedIds = new Set(selectedNodes.map(node => node.data.id));
        recordsToExport = projects.filter(record => selectedIds.has(Number(record.id)));
      }
    }

    if (recordsToExport.length === 0) {
      setError("No projects selected or available to export.");
      return;
    }

    setError("");
    setIsExporting(true);

    try {
      const XLSX = await import("xlsx");
      const { headers, rows } = buildDynamicExportRows(recordsToExport);

      if (rows.length === 0) {
        setError("No data to export.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      worksheet["!cols"] = headers.map((header) => ({
        wch: Math.max(16, Math.min(42, header.length + 4)),
      }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Project Listings");

      const now = new Date();
      const filename = `project-listings-export-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to export data.");
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
              Project Listings
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage and review submitted summer internship project listings.
            </p>
          </div>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-emerald-100 bg-emerald-950/70 border border-emerald-600 px-3 py-1.5 rounded-md text-lg flex items-center gap-2 shadow-sm">
                <LibraryBig className="h-4 w-4 text-emerald-400" />
                Submitted Projects
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={quickFilterText}
                  onChange={(e) => setQuickFilterText(e.target.value)}
                  className="w-full sm:w-64 rounded-md border border-zinc-700 bg-zinc-950/50 px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  disabled={isLoading || isExporting || projects.length === 0}
                  className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 border border-zinc-800"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Excel
                    </>
                  )}
                </Button>
                <span className="text-sm font-medium text-zinc-400 bg-zinc-800/50 px-2.5 py-1 rounded-md border border-zinc-800">
                  Total: {totalProjects}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 bg-zinc-950/20 rounded-lg border border-zinc-800/50">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-sm text-zinc-400 animate-pulse">Loading project data...</p>
              </div>
            ) : (
              <div className="h-[650px] w-full rounded-lg overflow-hidden border border-zinc-800 shadow-inner">
                <AgGridReact
                  ref={gridRef}
                  theme={agTheme}
                  rowData={projects}
                  columnDefs={colDefs}
                  defaultColDef={defaultColDef}
                  rowHeight={72}
                  headerHeight={48}
                  suppressCellFocus={true}
                  enableCellTextSelection={true}
                  quickFilterText={quickFilterText}
                  rowSelection={{ mode: 'multiRow' }}
                  overlayNoRowsTemplate='<div class="flex flex-col items-center justify-center h-full gap-2"><span class="text-zinc-500 font-medium">No project listings found.</span><span class="text-xs text-zinc-600">Waiting for submissions...</span></div>'
                  pagination={true}
                  paginationPageSize={15}
                  paginationPageSizeSelector={[15, 30, 50, 100]}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
