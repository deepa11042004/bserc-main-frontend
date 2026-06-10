"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Eye, Inbox, Loader2, Trash2 } from "lucide-react";

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

type ContactQuery = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  is_solved: boolean;
  created_at: string | null;
};

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as { message?: unknown; error?: unknown };
  if (typeof p.message === "string" && p.message.trim()) return p.message.trim();
  if (typeof p.error === "string" && p.error.trim()) return p.error.trim();
  return "";
}

function toText(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function toNullableText(value: unknown): string | null { const c = toText(value); return c || null; }
function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") { const p = Number(value); if (Number.isFinite(p)) return p; }
  return null;
}
function toPositiveInt(value: unknown): number {
  const n = toNumberOrNull(value);
  if (n === null || !Number.isInteger(n) || n < 0) return 0;
  return n;
}
function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") { const v = value.trim().toLowerCase(); return v === "1" || v === "true" || v === "yes"; }
  return false;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const norm = String(value).includes("T") ? String(value) : String(value).replace(" ", "T");
  const utc = norm.endsWith("Z") ? norm : `${norm}Z`;
  const date = new Date(utc);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "short", day: "2-digit" });
}

function formatTime(value: string | null): string {
  if (!value) return "-";
  const norm = String(value).includes("T") ? String(value) : String(value).replace(" ", "T");
  const utc = norm.endsWith("Z") ? norm : `${norm}Z`;
  const date = new Date(utc);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
}

function mapContactQuery(record: Record<string, unknown>): ContactQuery {
  return {
    id: toPositiveInt(record.id),
    full_name: toText(record.full_name || record.organization_name),
    email: toText(record.email),
    phone: toNullableText(record.phone),
    subject: toText(record.subject || record.subject_name),
    is_solved: toBoolean(record.is_solved),
    created_at: toNullableText(record.created_at),
  };
}

function extractContactQueries(payload: unknown): ContactQuery[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  if (!Array.isArray(root.data)) return [];
  return root.data
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map(mapContactQuery);
}

export default function ContactQueries() {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingQueryId, setDeletingQueryId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [quickFilterText, setQuickFilterText] = useState("");
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    let isMounted = true;
    const loadQueries = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/contact-queries", { method: "GET", cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as unknown;
        if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to fetch contact queries.");
        if (!isMounted) return;
        setQueries(extractContactQueries(payload));
      } catch (err) {
        if (!isMounted) return;
        setQueries([]);
        setError(err instanceof Error && err.message ? err.message : "Unable to fetch contact queries.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadQueries();
    return () => { isMounted = false; };
  }, []);

  const handleDeleteQuery = async (queryId: number) => {
    if (!window.confirm("Are you sure you want to delete this contact query? This action cannot be undone.")) return;
    setError("");
    setDeletingQueryId(queryId);
    try {
      const response = await fetch(`/api/contact-queries/${queryId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to delete contact query.");
      setQueries((prev) => prev.filter((q) => q.id !== queryId));
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to delete contact query.");
    } finally {
      setDeletingQueryId((cur) => (cur === queryId ? null : cur));
    }
  };

  const totalQueries = useMemo(() => queries.length, [queries]);

  const colDefs = useMemo<ColDef<ContactQuery>[]>(() => [
    {
      headerName: "Name",
      field: "full_name",
      flex: 1.5,
      minWidth: 200,
      filterValueGetter: (p: any) => p.data ? `${p.data.full_name} ${p.data.email}` : "",
      cellRenderer: (params: any) => {
        const q = params.data;
        if (!q) return null;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="text-zinc-200 text-sm font-medium">{q.full_name || "-"}</span>
            <span className="text-zinc-400 text-xs break-words">{q.email || "-"}</span>
          </div>
        );
      },
    },
    {
      headerName: "Phone",
      field: "phone",
      flex: 1,
      minWidth: 140,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <span className="text-zinc-300 text-sm">{params.value || "-"}</span>
        </div>
      ),
    },
    {
      headerName: "Subject",
      field: "subject",
      flex: 2,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <span className="text-zinc-300 text-sm">{params.value || "-"}</span>
        </div>
      ),
    },
    {
      headerName: "Submitted",
      field: "created_at",
      width: 150,
      filter: "agDateColumnFilter",
      cellRenderer: (params: any) => {
        if (!params.data) return null;
        return (
          <div className="flex flex-col justify-center h-full">
            <span className="text-zinc-300 text-sm">{formatDate(params.value)}</span>
            <span className="text-zinc-500 text-xs">{formatTime(params.value)}</span>
          </div>
        );
      },
    },
    {
      headerName: "Actions",
      sortable: false,
      filter: false,
      pinned: "right",
      width: 170,
      cellRenderer: (params: any) => {
        const q = params.data;
        if (!q) return null;
        const deleting = deletingQueryId === q.id;
        return (
          <div className="flex items-center gap-2 h-full">
            <span
              title={q.is_solved ? "Solved" : "Pending"}
              className={`inline-flex items-center justify-center rounded-md border px-2 py-1 ${q.is_solved ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" : "border-amber-500/50 bg-amber-500/15 text-amber-300"}`}
            >
              {q.is_solved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            </span>
            <Link
              href={`/admin/contact-queries/${q.id}`}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Link>
            <button
              type="button"
              onClick={() => void handleDeleteQuery(q.id)}
              disabled={deleting}
              aria-label={`Delete query ${q.id}`}
              className="inline-flex items-center justify-center rounded-md bg-rose-600 px-2 py-1 text-white hover:bg-rose-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        );
      },
    },
  ], [deletingQueryId]);

  const defaultColDef = useMemo<ColDef>(() => ({ sortable: true, filter: true, resizable: true }), []);

  return (
    <div className="min-h-screen container mx-auto max-w-8xl text-zinc-100">
      <div className="flex flex-col gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Contact Queries</h1>
          <p className="mt-1 text-sm text-zinc-400">Messages submitted through the Contact Us form.</p>
        </div>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
              <Inbox className="h-4 w-4 text-blue-400" />
              Query List
            </CardTitle>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search queries..."
                value={quickFilterText}
                onChange={(e) => setQuickFilterText(e.target.value)}
                className="w-full sm:w-64 rounded-md border border-zinc-700 bg-zinc-950/50 px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
              />
              <span className="text-sm text-zinc-400">Total: {totalQueries}</span>
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
                rowData={queries}
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
                overlayNoRowsTemplate='<span class="text-zinc-500">No contact queries found.</span>'
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
