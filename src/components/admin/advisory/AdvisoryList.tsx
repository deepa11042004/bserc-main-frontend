"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Trash2, UsersRound } from "lucide-react";

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

type ToastVariant = "success" | "error" | "info";

export default function AdvisoryList() {
  const [advisories, setAdvisories] = useState<AdvisoryProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [movingIds, setMovingIds] = useState<number[]>([]);
  const [removingIds, setRemovingIds] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("info");

  useEffect(() => {
    let isMounted = true;

    const loadAdvisoryList = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/advisory/list", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          throw new Error(getApiMessage(payload) || "Unable to fetch advisory list.");
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
            : "Unable to fetch advisory list.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAdvisoryList();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalAdvisories = useMemo(() => advisories.length, [advisories]);
  const isMoving = (id: number) => movingIds.includes(id);
  const isRemoving = (id: number) => removingIds.includes(id);

  const handleMoveToPending = async (id: number) => {
    setMovingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    try {
      const response = await fetch(`/api/advisory/${id}/pending`, {
        method: "PATCH",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to move advisory to pending.");
      }

      setAdvisories((prev) => prev.filter((item) => item.id !== id));
      setToastVariant("success");
      setToastMessage("Advisory member moved to pending requests.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(
        err instanceof Error && err.message
          ? err.message
          : "Unable to move advisory to pending.",
      );
    } finally {
      setMovingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleRemove = async (id: number) => {
    setRemovingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    try {
      const response = await fetch(`/api/advisory/${id}/reject`, {
        method: "DELETE",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to remove advisory member.");
      }

      setAdvisories((prev) => prev.filter((item) => item.id !== id));
      setToastVariant("success");
      setToastMessage("Advisory member removed successfully.");
    } catch (err) {
      setToastVariant("error");
      setToastMessage(
        err instanceof Error && err.message
          ? err.message
          : "Unable to remove advisory member.",
      );
    } finally {
      setRemovingIds((prev) => prev.filter((item) => item !== id));
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
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-emerald-100 bg-emerald-950/70 border border-emerald-600 px-3 py-1 rounded-md text-lg flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-emerald-300" />
                Active Advisory Members
              </CardTitle>
              <span className="text-sm text-zinc-400">Total: {totalAdvisories}</span>
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
                    <TableHead className="text-white">Advisory Member</TableHead>
                    <TableHead className="text-white">Designation</TableHead>
                    <TableHead className="text-white">Organisation</TableHead>
                    <TableHead className="text-white">Expertise</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Added</TableHead>
                    <TableHead className="text-right text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advisories.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                        No active advisory members found.
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
                        <TableCell className="text-zinc-300 max-w-xs">
                          <p className="line-clamp-2">{advisory.professional_expertise || "-"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClasses(advisory.status)}>
                            {advisory.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-300">{formatAdvisoryDate(advisory.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isMoving(advisory.id) || isRemoving(advisory.id)}
                              onClick={() => void handleMoveToPending(advisory.id)}
                              className="border border-blue-700 bg-transparent text-blue-300 hover:bg-blue-950/50 hover:text-blue-200"
                            >
                              {isMoving(advisory.id) ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  Moving...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                  Move to Pending
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isMoving(advisory.id) || isRemoving(advisory.id)}
                              onClick={() => void handleRemove(advisory.id)}
                              className="border border-rose-700 bg-transparent text-rose-300 hover:bg-rose-950/50 hover:text-rose-200"
                            >
                              {isRemoving(advisory.id) ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  Removing...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                  Remove
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
