"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Loader2, UserCheck, X, XCircle } from "lucide-react";

import { AdminToast } from "@/components/admin/AdminToast";
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
import type { AdvisoryProfile } from "@/types/advisory";
import {
  extractAdvisories,
  formatAdvisoryDate,
  getApiMessage,
  getStatusBadgeClasses,
} from "@/components/admin/advisory/advisoryUtils";
import { formatDateTime } from "@/lib/formatDate";

type ToastVariant = "success" | "error" | "info";

function presentText(value: string | null | undefined): string {
  const normalized = (value || "").trim();
  return normalized || "-";
}

function presentNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "-";
}

function presentBoolean(value: boolean | null | undefined): string {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "-";
}

function presentList(values: string[] | null | undefined): string {
  if (!Array.isArray(values) || values.length === 0) {
    return "-";
  }

  const normalized = values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => Boolean(value));

  if (normalized.length === 0) {
    return "-";
  }

  return normalized.join(", ");
}

function DetailItem({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
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

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/advisory/requests", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          throw new Error(getApiMessage(payload) || "Unable to fetch advisory requests.");
        }

        if (!isMounted) {
          return;
        }

        setAdvisories(extractAdvisories(payload));
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setAdvisories([]);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Unable to fetch advisory requests.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAdvisory) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAdvisory(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedAdvisory]);

  const pendingCount = useMemo(() => advisories.length, [advisories]);

  const isApproving = (id: number) => approvingIds.includes(id);
  const isRejecting = (id: number) => rejectingIds.includes(id);
  const isActionPending = (id: number) => isApproving(id) || isRejecting(id);

  const handleApprove = async (id: number) => {
    setApprovingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    try {
      const response = await fetch(`/api/advisory/${id}/approve`, {
        method: "PATCH",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to approve advisory member.");
      }

      setAdvisories((prev) => prev.filter((item) => item.id !== id));
      setSelectedAdvisory((current) => (current?.id === id ? null : current));
      setToastVariant("success");
      setToastMessage("Advisory member approved successfully.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(
        err instanceof Error && err.message
          ? err.message
          : "Unable to approve advisory member.",
      );
    } finally {
      setApprovingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleReject = async (id: number) => {
    setRejectingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    try {
      const response = await fetch(`/api/advisory/${id}/reject`, {
        method: "DELETE",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to reject advisory request.");
      }

      setAdvisories((prev) => prev.filter((item) => item.id !== id));
      setSelectedAdvisory((current) => (current?.id === id ? null : current));
      setToastVariant("success");
      setToastMessage("Advisory request rejected and removed successfully.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(
        err instanceof Error && err.message
          ? err.message
          : "Unable to reject advisory request.",
      );
    } finally {
      setRejectingIds((prev) => prev.filter((item) => item !== id));
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

      {selectedAdvisory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedAdvisory(null)}
          />

          <div className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Advisory Request Details</h2>
                <p className="text-xs text-zinc-400">
                  Application ID: {selectedAdvisory.id} • Status: {selectedAdvisory.status}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAdvisory(null)}
                className="border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[82vh] overflow-y-auto p-5 md:p-6 space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Personal and Contact</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem label="Full Name" value={presentText(selectedAdvisory.full_name)} />
                  <DetailItem label="Designation" value={presentText(selectedAdvisory.designation)} />
                  <DetailItem
                    label="Organisation / Institution"
                    value={presentText(selectedAdvisory.organization_institution)}
                  />
                  <DetailItem
                    label="Department / Specialisation"
                    value={presentText(selectedAdvisory.department_specialisation)}
                  />
                  <DetailItem label="Official Email" value={presentText(selectedAdvisory.official_email)} />
                  <DetailItem
                    label="Alternative Email"
                    value={presentText(selectedAdvisory.alternative_email)}
                  />
                  <DetailItem label="Mobile Number" value={presentText(selectedAdvisory.mobile_number)} />
                  <DetailItem label="Location" value={presentText(selectedAdvisory.location_text)} />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Academic and Professional</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem
                    label="Highest Qualification"
                    value={presentText(selectedAdvisory.highest_qualification)}
                  />
                  <DetailItem
                    label="Qualification Year"
                    value={presentText(selectedAdvisory.qualification_year)}
                  />
                  <DetailItem
                    label="Experience (Years)"
                    value={presentNumber(selectedAdvisory.experience_years)}
                  />
                  <DetailItem
                    label="Professional Expertise"
                    value={presentText(selectedAdvisory.professional_expertise)}
                    fullWidth
                  />
                  <DetailItem
                    label="Key Research Areas"
                    value={presentText(selectedAdvisory.key_research_areas)}
                    fullWidth
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Contribution Preferences</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem
                    label="Preferred Contributions"
                    value={presentList(selectedAdvisory.preferred_contributions)}
                    fullWidth
                  />
                  <DetailItem
                    label="Preferred Contribution (Other)"
                    value={presentText(selectedAdvisory.preferred_contribution_other)}
                  />
                  <DetailItem
                    label="Contribution Modes"
                    value={presentList(selectedAdvisory.contribution_modes)}
                    fullWidth
                  />
                  <DetailItem
                    label="Contribution Mode (Other)"
                    value={presentText(selectedAdvisory.contribution_mode_other)}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Availability and Support</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem
                    label="Monthly Hours"
                    value={presentNumber(selectedAdvisory.monthly_hours)}
                  />
                  <DetailItem
                    label="Availability Period"
                    value={presentText(selectedAdvisory.availability_period)}
                  />
                  <DetailItem
                    label="Interaction Modes"
                    value={presentList(selectedAdvisory.interaction_modes)}
                    fullWidth
                  />
                  <DetailItem
                    label="Suggestions"
                    value={presentList(selectedAdvisory.suggestions)}
                    fullWidth
                  />
                  <DetailItem
                    label="Viksit Bharat Contribution"
                    value={presentText(selectedAdvisory.viksit_bharat_contribution)}
                    fullWidth
                  />
                  <DetailItem
                    label="Media Support"
                    value={presentBoolean(selectedAdvisory.media_support)}
                  />
                  <DetailItem
                    label="Media Tools"
                    value={presentText(selectedAdvisory.media_tools)}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Review Metadata</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem
                    label="Declaration Accepted"
                    value={presentBoolean(selectedAdvisory.declaration_accepted)}
                  />
                  <DetailItem label="Current Status" value={presentText(selectedAdvisory.status)} />
                  <DetailItem
                    label="Created At"
                    value={formatDateTime(selectedAdvisory.created_at)}
                  />
                  <DetailItem
                    label="Updated At"
                    value={formatDateTime(selectedAdvisory.updated_at)}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen container mx-auto max-w-8xl text-zinc-100">
        <div className="flex flex-col gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Advisory Board Requests
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Review and moderate pending advisory applications.
            </p>
          </div>

          <Link href="/admin/advisory-board">
            <Button className="bg-blue-500 border border-blue-700 font-bold text-white hover:bg-blue-700">
              View Advisory Board
            </Button>
          </Link>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-400" />
                Pending Advisory Applications
              </CardTitle>
              <span className="text-sm text-zinc-400">Total: {pendingCount}</span>
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
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-white">Applicant</TableHead>
                    <TableHead className="text-white">Designation</TableHead>
                    <TableHead className="text-white">Organisation</TableHead>
                    <TableHead className="text-white">Primary Contribution</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Applied</TableHead>
                    <TableHead className="text-right text-white">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advisories.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                        No pending advisory requests.
                      </TableCell>
                    </TableRow>
                  ) : (
                    advisories.map((advisory) => (
                      <TableRow key={advisory.id} className="border-zinc-800 align-top">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-zinc-100 font-medium">{advisory.full_name}</span>
                            <span className="text-zinc-400 text-xs">{advisory.official_email}</span>
                            <span className="text-zinc-500 text-xs">{advisory.mobile_number}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300">{advisory.designation || "-"}</TableCell>
                        <TableCell className="text-zinc-300">{advisory.organization_institution || "-"}</TableCell>
                        <TableCell className="text-zinc-300">
                          {advisory.preferred_contributions[0]
                            || advisory.preferred_contribution_other
                            || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClasses(advisory.status)}>
                            {advisory.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {formatAdvisoryDate(advisory.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isActionPending(advisory.id)}
                              onClick={() => setSelectedAdvisory(advisory)}
                              className="border border-blue-700 bg-transparent text-blue-300 hover:bg-blue-950/50 hover:text-blue-200"
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              View
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isActionPending(advisory.id)}
                              onClick={() => void handleApprove(advisory.id)}
                              className="border border-emerald-700 bg-transparent text-emerald-300 hover:bg-emerald-950/50 hover:text-emerald-200"
                            >
                              {isApproving(advisory.id) ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                  Accept
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isActionPending(advisory.id)}
                              onClick={() => void handleReject(advisory.id)}
                              className="border border-rose-700 bg-transparent text-rose-300 hover:bg-rose-950/50 hover:text-rose-200"
                            >
                              {isRejecting(advisory.id) ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
