"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RotateCcw, Trash2, UsersRound } from "lucide-react";

import { AdminToast } from "@/components/admin/AdminToast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdvisoryProfile } from "@/types/advisory";
import {
  extractAdvisories,
  formatAdvisoryDate,
  getApiMessage,
  getStatusBadgeClasses,
} from "@/components/admin/advisory/advisoryUtils";
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

export default function AdvisoryList() {
  const [advisories, setAdvisories] = useState<AdvisoryProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [movingIds, setMovingIds] = useState<number[]>([]);
  const [removingIds, setRemovingIds] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("info");
  const [quickFilterText, setQuickFilterText] = useState("");
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAdvisoryList = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/advisory/list", { method: "GET", cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as unknown;
        if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to fetch advisory list.");
        if (!isMounted) return;
        setAdvisories(extractAdvisories(payload));
      } catch (err) {
        if (!isMounted) return;
        setAdvisories([]);
        setError(err instanceof Error && err.message ? err.message : "Unable to fetch advisory list.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadAdvisoryList();
    return () => { isMounted = false; };
  }, []);

  const totalAdvisories = useMemo(() => advisories.length, [advisories]);

  const handleMoveToPending = async (id: number) => {
    setMovingIds((prev) => prev.includes(id) ? prev : [...prev, id]);
    try {
      const response = await fetch(`/api/advisory/${id}/pending`, { method: "PATCH", cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to move advisory to pending.");
      setAdvisories((prev) => prev.filter((item) => item.id !== id));
      setToastVariant("success");
      setToastMessage("Advisory member moved to pending requests.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(err instanceof Error && err.message ? err.message : "Unable to move advisory to pending.");
    } finally {
      setMovingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleRemove = async (id: number) => {
    setRemovingIds((prev) => prev.includes(id) ? prev : [...prev, id]);
    try {
      const response = await fetch(`/api/advisory/${id}/reject`, { method: "DELETE", cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to remove advisory member.");
      setAdvisories((prev) => prev.filter((item) => item.id !== id));
      setToastVariant("success");
      setToastMessage("Advisory member removed successfully.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(err instanceof Error && err.message ? err.message : "Unable to remove advisory member.");
    } finally {
      setRemovingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const colDefs = useMemo<ColDef<AdvisoryProfile>[]>(() => [
    {
      headerName: "Advisory Member",
      field: "full_name",
      flex: 1.5,
      minWidth: 200,
      filterValueGetter: (p: any) => p.data ? `${p.data.full_name} ${p.data.official_email} ${p.data.mobile_number}` : "",
      cellRenderer: (params: any) => {
        const a = params.data;
        if (!a) return null;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="text-zinc-100 font-medium">{a.full_name}</span>
            <span className="text-zinc-400 text-xs">{a.official_email}</span>
            <span className="text-zinc-500 text-xs">{a.mobile_number}</span>
          </div>
        );
      },
    },
    {
      headerName: "Designation",
      field: "designation",
      flex: 1.2,
      minWidth: 160,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <span className="text-zinc-300 text-sm">{params.value || "-"}</span>
        </div>
      ),
    },
    {
      headerName: "Organisation",
      field: "organization_institution",
      flex: 1.5,
      minWidth: 180,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <span className="text-zinc-300 text-sm">{params.value || "-"}</span>
        </div>
      ),
    },
    {
      headerName: "Expertise",
      field: "professional_expertise",
      flex: 2,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <span className="text-zinc-300 text-sm line-clamp-2">{params.value || "-"}</span>
        </div>
      ),
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
      headerName: "Added",
      field: "created_at",
      width: 130,
      valueFormatter: (params: any) => formatAdvisoryDate(params.value),
    },
    {
      headerName: "Actions",
      sortable: false,
      filter: false,
      pinned: "right",
      width: 250,
      cellRenderer: (params: any) => {
        const a = params.data;
        if (!a) return null;
        const moving = movingIds.includes(a.id);
        const removing = removingIds.includes(a.id);
        const busy = moving || removing;
        return (
          <div className="flex items-center gap-2 h-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void handleMoveToPending(a.id)}
              className="border border-blue-700 bg-transparent text-blue-300 hover:bg-blue-950/50 hover:text-blue-200 h-8"
            >
              {moving ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Moving...</>
              ) : (
                <><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Move to Pending</>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void handleRemove(a.id)}
              className="border border-rose-700 bg-transparent text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 h-8"
            >
              {removing ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Removing...</>
              ) : (
                <><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove</>
              )}
            </Button>
          </div>
        );
      },
    },
  ], [movingIds, removingIds]);

  const defaultColDef = useMemo<ColDef>(() => ({ sortable: true, filter: true, resizable: true }), []);

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
            <h1 className="text-4xl font-bold tracking-tight text-white">Advisory Board</h1>
            <p className="mt-1 text-sm text-zinc-400">Approved advisory members with active status.</p>
          </div>
          <Link href="/admin/advisory-board/request">
            <Button className="bg-blue-500 border border-blue-700 font-bold text-white hover:bg-blue-700">
              View Advisory Requests
            </Button>
          </Link>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-emerald-100 bg-emerald-950/70 border border-emerald-600 px-3 py-1 rounded-md text-lg flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-emerald-300" />
                Active Advisory Members
              </CardTitle>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={quickFilterText}
                  onChange={(e) => setQuickFilterText(e.target.value)}
                  className="w-full sm:w-64 rounded-md border border-zinc-700 bg-zinc-950/50 px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-sm text-zinc-400">Total: {totalAdvisories}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{error}</div>
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
                  rowData={advisories}
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
                  overlayNoRowsTemplate='<span class="text-zinc-500">No active advisory members found.</span>'
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
