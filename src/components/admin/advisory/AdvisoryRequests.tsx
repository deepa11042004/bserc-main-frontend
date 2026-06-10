"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Eye, Loader2, UserCheck, X, XCircle } from "lucide-react";

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

type ToastVariant = "success" | "error" | "info";

function presentText(value: string | null | undefined): string {
  return (value || "").trim() || "-";
}
function presentNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "-";
}
function presentBoolean(value: boolean | null | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "-";
}
function presentList(values: string[] | null | undefined): string {
  if (!Array.isArray(values) || values.length === 0) return "-";
  const norm = values.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean);
  return norm.length === 0 ? "-" : norm.join(", ");
}

function DetailItem({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={`rounded-md border border-zinc-800 bg-zinc-900/50 p-3 ${fullWidth ? "md:col-span-2" : ""}`}>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-200">{value}</p>
    </div>
  );
}

export default function AdvisoryRequests() {
  const [advisories, setAdvisories] = useState<AdvisoryProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAdvisory, setSelectedAdvisory] = useState<AdvisoryProfile | null>(null);
  const [approvingIds, setApprovingIds] = useState<number[]>([]);
  const [rejectingIds, setRejectingIds] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("info");
  const [quickFilterText, setQuickFilterText] = useState("");
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    let isMounted = true;
    const loadRequests = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/advisory/requests", { method: "GET", cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as unknown;
        if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to fetch advisory requests.");
        if (!isMounted) return;
        setAdvisories(extractAdvisories(payload));
      } catch (err) {
        if (!isMounted) return;
        setAdvisories([]);
        setError(err instanceof Error && err.message ? err.message : "Unable to fetch advisory requests.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadRequests();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedAdvisory) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedAdvisory(null); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedAdvisory]);

  const pendingCount = useMemo(() => advisories.length, [advisories]);

  const handleApprove = async (id: number) => {
    setApprovingIds((prev) => prev.includes(id) ? prev : [...prev, id]);
    try {
      const response = await fetch(`/api/advisory/${id}/approve`, { method: "PATCH", cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to approve advisory member.");
      setAdvisories((prev) => prev.filter((item) => item.id !== id));
      setSelectedAdvisory((cur) => (cur?.id === id ? null : cur));
      setToastVariant("success");
      setToastMessage("Advisory member approved successfully.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(err instanceof Error && err.message ? err.message : "Unable to approve advisory member.");
    } finally {
      setApprovingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleReject = async (id: number) => {
    setRejectingIds((prev) => prev.includes(id) ? prev : [...prev, id]);
    try {
      const response = await fetch(`/api/advisory/${id}/reject`, { method: "DELETE", cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) throw new Error(getApiMessage(payload) || "Unable to reject advisory request.");
      setAdvisories((prev) => prev.filter((item) => item.id !== id));
      setSelectedAdvisory((cur) => (cur?.id === id ? null : cur));
      setToastVariant("success");
      setToastMessage("Advisory request rejected and removed successfully.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(err instanceof Error && err.message ? err.message : "Unable to reject advisory request.");
    } finally {
      setRejectingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const colDefs = useMemo<ColDef<AdvisoryProfile>[]>(() => [
    {
      headerName: "Applicant",
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
      headerName: "Primary Contribution",
      field: "preferred_contributions",
      flex: 1.3,
      minWidth: 180,
      cellRenderer: (params: any) => {
        const a = params.data;
        if (!a) return null;
        const val = (a.preferred_contributions?.[0] || a.preferred_contribution_other || "-");
        return (
          <div className="flex items-center h-full">
            <span className="text-zinc-300 text-sm">{val}</span>
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
      headerName: "Applied",
      field: "created_at",
      width: 130,
      valueFormatter: (params: any) => formatAdvisoryDate(params.value),
    },
    {
      headerName: "Actions",
      sortable: false,
      filter: false,
      pinned: "right",
      width: 270,
      cellRenderer: (params: any) => {
        const a = params.data;
        if (!a) return null;
        const approving = approvingIds.includes(a.id);
        const rejecting = rejectingIds.includes(a.id);
        const pending = approving || rejecting;
        return (
          <div className="flex items-center gap-1.5 h-full">
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setSelectedAdvisory(a)}
              className="border border-blue-700 bg-transparent text-blue-300 hover:bg-blue-950/50 hover:text-blue-200 h-8">
              <Eye className="mr-1.5 h-3.5 w-3.5" />View
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => void handleApprove(a.id)}
              className="border border-emerald-700 bg-transparent text-emerald-300 hover:bg-emerald-950/50 hover:text-emerald-200 h-8">
              {approving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Approving...</> : <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Accept</>}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => void handleReject(a.id)}
              className="border border-rose-700 bg-transparent text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 h-8">
              {rejecting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Rejecting...</> : <><XCircle className="mr-1.5 h-3.5 w-3.5" />Reject</>}
            </Button>
          </div>
        );
      },
    },
  ], [approvingIds, rejectingIds]);

  const defaultColDef = useMemo<ColDef>(() => ({ sortable: true, filter: true, resizable: true }), []);

  return (
    <>
      <AdminToast open={Boolean(toastMessage)} message={toastMessage || ""} onClose={() => setToastMessage(null)} variant={toastVariant} />

      {selectedAdvisory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedAdvisory(null)} />
          <div className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Advisory Request Details</h2>
                <p className="text-xs text-zinc-400">Application ID: {selectedAdvisory.id} • Status: {selectedAdvisory.status}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedAdvisory(null)} className="border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[82vh] overflow-y-auto p-5 md:p-6 space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Personal and Contact</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem label="Full Name" value={presentText(selectedAdvisory.full_name)} />
                  <DetailItem label="Designation" value={presentText(selectedAdvisory.designation)} />
                  <DetailItem label="Organisation / Institution" value={presentText(selectedAdvisory.organization_institution)} />
                  <DetailItem label="Department / Specialisation" value={presentText(selectedAdvisory.department_specialisation)} />
                  <DetailItem label="Official Email" value={presentText(selectedAdvisory.official_email)} />
                  <DetailItem label="Alternative Email" value={presentText(selectedAdvisory.alternative_email)} />
                  <DetailItem label="Mobile Number" value={presentText(selectedAdvisory.mobile_number)} />
                  <DetailItem label="Location" value={presentText(selectedAdvisory.location_text)} />
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Academic and Professional</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem label="Highest Qualification" value={presentText(selectedAdvisory.highest_qualification)} />
                  <DetailItem label="Qualification Year" value={presentText(selectedAdvisory.qualification_year)} />
                  <DetailItem label="Experience (Years)" value={presentNumber(selectedAdvisory.experience_years)} />
                  <DetailItem label="Professional Expertise" value={presentText(selectedAdvisory.professional_expertise)} fullWidth />
                  <DetailItem label="Key Research Areas" value={presentText(selectedAdvisory.key_research_areas)} fullWidth />
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Contribution Preferences</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem label="Preferred Contributions" value={presentList(selectedAdvisory.preferred_contributions)} fullWidth />
                  <DetailItem label="Preferred Contribution (Other)" value={presentText(selectedAdvisory.preferred_contribution_other)} />
                  <DetailItem label="Contribution Modes" value={presentList(selectedAdvisory.contribution_modes)} fullWidth />
                  <DetailItem label="Contribution Mode (Other)" value={presentText(selectedAdvisory.contribution_mode_other)} />
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Availability and Support</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem label="Monthly Hours" value={presentNumber(selectedAdvisory.monthly_hours)} />
                  <DetailItem label="Availability Period" value={presentText(selectedAdvisory.availability_period)} />
                  <DetailItem label="Interaction Modes" value={presentList(selectedAdvisory.interaction_modes)} fullWidth />
                  <DetailItem label="Suggestions" value={presentList(selectedAdvisory.suggestions)} fullWidth />
                  <DetailItem label="Viksit Bharat Contribution" value={presentText(selectedAdvisory.viksit_bharat_contribution)} fullWidth />
                  <DetailItem label="Media Support" value={presentBoolean(selectedAdvisory.media_support)} />
                  <DetailItem label="Media Tools" value={presentText(selectedAdvisory.media_tools)} />
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Review Metadata</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem label="Declaration Accepted" value={presentBoolean(selectedAdvisory.declaration_accepted)} />
                  <DetailItem label="Current Status" value={presentText(selectedAdvisory.status)} />
                  <DetailItem label="Created At" value={formatDateTime(selectedAdvisory.created_at)} />
                  <DetailItem label="Updated At" value={formatDateTime(selectedAdvisory.updated_at)} />
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen container mx-auto max-w-8xl text-zinc-100">
        <div className="flex flex-col gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Advisory Board Requests</h1>
            <p className="mt-1 text-sm text-zinc-400">Review and moderate pending advisory applications.</p>
          </div>
          <Link href="/admin/advisory-board">
            <Button className="bg-blue-500 border border-blue-700 font-bold text-white hover:bg-blue-700">View Advisory Board</Button>
          </Link>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-400" />
                Pending Advisory Applications
              </CardTitle>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={quickFilterText}
                  onChange={(e) => setQuickFilterText(e.target.value)}
                  className="w-full sm:w-64 rounded-md border border-zinc-700 bg-zinc-950/50 px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                />
                <span className="text-sm text-zinc-400">Total: {pendingCount}</span>
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
                  overlayNoRowsTemplate='<span class="text-zinc-500">No pending advisory requests.</span>'
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
