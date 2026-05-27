"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Megaphone, Pencil, PlusCircle, Trash2 } from "lucide-react";

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
import type { AnnouncementBanner, AnnouncementSection } from "@/types/announcementBanner";

type AnnouncementBannersApiResponse = {
  data?: unknown;
  message?: unknown;
  error?: unknown;
};

type AnnouncementBannerForm = {
  section: AnnouncementSection;
  title: string;
  link: string;
  position: string;
  isActive: boolean;
};

const SECTION_OPTIONS: Array<{ value: AnnouncementSection; label: string }> = [
  { value: "summer-internship", label: "Summer Internship" },
  { value: "summer-school", label: "Summer School" },
];

function createInitialForm(): AnnouncementBannerForm {
  return {
    section: "summer-internship",
    title: "",
    link: "",
    position: "",
    isActive: true,
  };
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableText(value: unknown): string | null {
  const cleaned = toText(value);
  return cleaned || null;
}

function toPositiveInt(value: unknown): number {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : 0;
}

function toNullablePositiveInt(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }

  return false;
}

function toSection(value: unknown): AnnouncementSection | null {
  const cleaned = toText(value).toLowerCase();

  if (cleaned === "summer-internship" || cleaned === "summer-school") {
    return cleaned;
  }

  return null;
}

function getSectionLabel(section: AnnouncementSection): string {
  const match = SECTION_OPTIONS.find((item) => item.value === section);
  return match ? match.label : section;
}

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const root = payload as AnnouncementBannersApiResponse;

  if (typeof root.message === "string" && root.message.trim()) {
    return root.message.trim();
  }

  if (typeof root.error === "string" && root.error.trim()) {
    return root.error.trim();
  }

  return "";
}

function normalizeAnnouncementBanner(item: unknown): AnnouncementBanner | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const row = item as Record<string, unknown>;
  const id = toPositiveInt(row.id);
  const section = toSection(row.section);
  const title = toText(row.title || row.message || row.text);
  const link = toText(row.link || row.href || row.url);

  if (!id || !section || !title || !link) {
    return null;
  }

  return {
    id,
    section,
    title,
    link,
    is_active: toBoolean(row.is_active),
    position: toNullablePositiveInt(row.position),
    created_at: toNullableText(row.created_at),
    updated_at: toNullableText(row.updated_at),
  };
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const normalizedValue = String(value).includes("T") ? String(value) : String(value).replace(" ", "T");
  const utcValue = normalizedValue.endsWith("Z") ? normalizedValue : `${normalizedValue}Z`;
  const date = new Date(utcValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
  })} ${date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
}

function isExternalUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("http://") || normalized.startsWith("https://");
}

export default function AnnouncementBannersManager() {
  const [banners, setBanners] = useState<AnnouncementBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AnnouncementBannerForm>(createInitialForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sortedItems = useMemo(
    () =>
      [...banners].sort((a, b) => {
        const aPosition = a.position ?? Number.MAX_SAFE_INTEGER;
        const bPosition = b.position ?? Number.MAX_SAFE_INTEGER;

        if (aPosition !== bPosition) {
          return aPosition - bPosition;
        }

        return b.id - a.id;
      }),
    [banners],
  );

  const resetEditorState = () => {
    setEditingId(null);
    setForm(createInitialForm());
  };

  const loadBanners = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/announcement-banners", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to fetch announcement banners.");
      }

      const root = payload as AnnouncementBannersApiResponse;
      const rows = Array.isArray(root?.data) ? root.data : [];
      const normalized = rows
        .map(normalizeAnnouncementBanner)
        .filter((item): item is AnnouncementBanner => Boolean(item));

      setBanners(normalized);
    } catch (err) {
      setBanners([]);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to fetch announcement banners.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBanners();
  }, []);

  const handleEdit = (item: AnnouncementBanner) => {
    setError("");
    setSuccess("");
    setEditingId(item.id);
    setForm({
      section: item.section,
      title: item.title,
      link: item.link,
      position: item.position ? String(item.position) : "",
      isActive: item.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (itemId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this announcement banner?");

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(itemId);

    try {
      const response = await fetch(`/api/admin/announcement-banners/${itemId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to delete announcement banner.");
      }

      setBanners((prev) => prev.filter((item) => item.id !== itemId));

      if (editingId === itemId) {
        resetEditorState();
      }

      setSuccess("Announcement banner deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to delete announcement banner.",
      );
    } finally {
      setDeletingId((current) => (current === itemId ? null : current));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const title = form.title.trim();
    const link = form.link.trim();

    if (!title) {
      setError("Title is required.");
      return;
    }

    if (!link) {
      setError("Link is required.");
      return;
    }

    let parsedPosition: number | undefined;

    if (form.position.trim()) {
      const numericPosition = Number.parseInt(form.position, 10);
      if (!Number.isInteger(numericPosition) || numericPosition <= 0) {
        setError("Position must be a positive integer.");
        return;
      }

      parsedPosition = numericPosition;
    }

    setIsSubmitting(true);

    try {
      const isEditMode = editingId !== null;
      const endpoint = isEditMode
        ? `/api/admin/announcement-banners/${editingId}`
        : "/api/admin/announcement-banners";

      const payload: Record<string, unknown> = {
        section: form.section,
        title,
        link,
        is_active: form.isActive,
      };

      if (typeof parsedPosition === "number") {
        payload.position = parsedPosition;
      }

      const response = await fetch(endpoint, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(
          getApiMessage(responsePayload)
          || (isEditMode
            ? "Unable to update announcement banner."
            : "Unable to create announcement banner."),
        );
      }

      resetEditorState();
      setSuccess(
        isEditMode
          ? "Announcement banner updated successfully."
          : "Announcement banner created successfully.",
      );

      await loadBanners();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : (editingId !== null
            ? "Unable to update announcement banner."
            : "Unable to create announcement banner."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            {editingId ? (
              <Pencil className="h-5 w-5 text-cyan-300" />
            ) : (
              <PlusCircle className="h-5 w-5 text-cyan-300" />
            )}
            {editingId ? "Edit Announcement Banner" : "Create Announcement Banner"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label htmlFor="announcement-section" className="text-sm text-zinc-300">
                  Section
                </label>
                <select
                  id="announcement-section"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={form.section}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      section: event.target.value as AnnouncementSection,
                    }))
                  }
                >
                  {SECTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label htmlFor="announcement-title" className="text-sm text-zinc-300">
                  Banner Text
                </label>
                <input
                  id="announcement-title"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="E.g. Summer Internship registrations close May 27, 2026"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="announcement-link" className="text-sm text-zinc-300">
                  Link
                </label>
                <input
                  id="announcement-link"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={form.link}
                  onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
                  placeholder="https://... or /path"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="announcement-position" className="text-sm text-zinc-300">
                  Position (Optional)
                </label>
                <input
                  id="announcement-position"
                  type="number"
                  min={1}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={form.position}
                  onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
                  placeholder="Smaller number appears first"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
                />
                Active (show on site)
              </label>
            </div>

            {error && (
              <div className="rounded-md border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
                {success}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {editingId ? "Update Banner" : "Create Banner"}
              </Button>

              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetEditorState}
                  disabled={isSubmitting}
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-400" />
              Announcement Banners
            </CardTitle>
            <span className="text-sm text-zinc-400">Total: {sortedItems.length}</span>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-white min-w-[220px]">Banner Text</TableHead>
                    <TableHead className="text-white min-w-[150px]">Section</TableHead>
                    <TableHead className="text-white min-w-[220px]">Link</TableHead>
                    <TableHead className="text-white min-w-[90px]">Position</TableHead>
                    <TableHead className="text-white min-w-[90px]">Status</TableHead>
                    <TableHead className="text-white min-w-[170px]">Updated</TableHead>
                    <TableHead className="text-white min-w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell colSpan={7} className="text-center text-zinc-400 py-8">
                        No announcement banners found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedItems.map((item) => (
                      <TableRow key={item.id} className="border-zinc-800">
                        <TableCell className="align-top text-zinc-200 text-sm font-medium">
                          <span
                            className="block max-w-[48ch] truncate"
                            title={item.title}
                          >
                            {item.title}
                          </span>
                        </TableCell>
                        <TableCell className="align-top text-zinc-300 text-xs sm:text-sm">
                          {getSectionLabel(item.section)}
                        </TableCell>
                        <TableCell className="align-top text-zinc-300 text-xs sm:text-sm break-all">
                          <a
                            href={item.link}
                            className="hover:underline"
                            target={isExternalUrl(item.link) ? "_blank" : undefined}
                            rel={isExternalUrl(item.link) ? "noopener noreferrer" : undefined}
                          >
                            {item.link}
                          </a>
                        </TableCell>
                        <TableCell className="align-top text-zinc-300 text-xs sm:text-sm">
                          {item.position ?? "-"}
                        </TableCell>
                        <TableCell className="align-top text-xs sm:text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.is_active
                                ? "bg-emerald-500/20 text-emerald-200"
                                : "bg-zinc-700 text-zinc-200"
                            }`}
                          >
                            {item.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="align-top text-zinc-400 text-xs sm:text-sm">
                          {formatDateTime(item.updated_at)}
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                              className="text-zinc-400 hover:text-white"
                              aria-label={`Edit announcement banner ${item.title}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="text-rose-400 hover:text-rose-200"
                              aria-label={`Delete announcement banner ${item.title}`}
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
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
    </div>
  );
}
