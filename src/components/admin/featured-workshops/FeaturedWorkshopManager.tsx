"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pencil, PlusCircle, Trash2, ImageIcon } from "lucide-react";

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
import type {
  FeaturedWorkshopCard,
  FeaturedWorkshopSection,
} from "@/types/featuredWorkshop";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_POSITION = 6;

type FeaturedWorkshopApiResponse = {
  data?: unknown;
  message?: unknown;
  error?: unknown;
};

type SectionForm = {
  title: string;
  description: string;
  isActive: boolean;
};

type CardForm = {
  title: string;
  position: string;
  isActive: boolean;
};

function createSectionForm(): SectionForm {
  return {
    title: "",
    description: "",
    isActive: true,
  };
}

function createCardForm(): CardForm {
  return {
    title: "",
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

function toPositiveInt(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
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

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const root = payload as FeaturedWorkshopApiResponse;

  if (typeof root.message === "string" && root.message.trim()) {
    return root.message.trim();
  }

  if (typeof root.error === "string" && root.error.trim()) {
    return root.error.trim();
  }

  return "";
}

function normalizeCard(item: unknown): FeaturedWorkshopCard | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const row = item as Record<string, unknown>;
  const id = toPositiveInt(row.id);
  const title = toText(row.title);
  const imageUrl = toText(row.image_url || row.imageUrl) || null;
  const position = toPositiveInt(row.position);

  if (!id || !title || !position) {
    return null;
  }

  return {
    id,
    title,
    image_url: imageUrl || `/api/featured-workshop-cards/${id}/image`,
    position,
    is_active: toBoolean(row.is_active),
    created_at: toNullableText(row.created_at),
    updated_at: toNullableText(row.updated_at),
  };
}

function normalizeSection(item: unknown): {
  section: FeaturedWorkshopSection | null;
  cards: FeaturedWorkshopCard[];
} {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return { section: null, cards: [] };
  }

  const row = item as Record<string, unknown>;
  const id = toPositiveInt(row.id);
  const title = toText(row.title);

  if (!id || !title) {
    return { section: null, cards: [] };
  }

  const cardsRaw = Array.isArray(row.cards) ? row.cards : [];

  return {
    section: {
      id,
      title,
      description: toNullableText(row.description),
      background_url: toNullableText(row.background_url || row.backgroundUrl),
      is_active: toBoolean(row.is_active),
      created_at: toNullableText(row.created_at),
      updated_at: toNullableText(row.updated_at),
    },
    cards: cardsRaw
      .map(normalizeCard)
      .filter((card): card is FeaturedWorkshopCard => Boolean(card)),
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

function validateImage(file: File | null): string {
  if (!file) {
    return "";
  }

  if (!file.type.toLowerCase().startsWith("image/")) {
    return "Please upload an image file.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "Image file must be 5MB or smaller.";
  }

  return "";
}

export default function FeaturedWorkshopManager() {
  const [section, setSection] = useState<FeaturedWorkshopSection | null>(null);
  const [cards, setCards] = useState<FeaturedWorkshopCard[]>([]);
  const [sectionForm, setSectionForm] = useState<SectionForm>(createSectionForm());
  const [cardForm, setCardForm] = useState<CardForm>(createCardForm());
  const [sectionFile, setSectionFile] = useState<File | null>(null);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSectionSubmitting, setIsSectionSubmitting] = useState(false);
  const [isCardSubmitting, setIsCardSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sectionFileRef = useRef<HTMLInputElement | null>(null);
  const cardFileRef = useRef<HTMLInputElement | null>(null);

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => a.position - b.position || a.id - b.id),
    [cards],
  );

  const resetCardEditor = () => {
    setEditingCardId(null);
    setCardForm(createCardForm());
    setCardFile(null);

    if (cardFileRef.current) {
      cardFileRef.current.value = "";
    }
  };

  const loadSection = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/featured-workshop-section", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to fetch featured workshop section.");
      }

      const root = payload as FeaturedWorkshopApiResponse;
      const { section: normalizedSection, cards: normalizedCards } = normalizeSection(root.data);

      setSection(normalizedSection);
      setCards(normalizedCards);

      if (normalizedSection) {
        setSectionForm({
          title: normalizedSection.title,
          description: normalizedSection.description || "",
          isActive: normalizedSection.is_active,
        });
      } else {
        setSectionForm(createSectionForm());
      }
    } catch (err) {
      setSection(null);
      setCards([]);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to fetch featured workshop section.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSection();
  }, []);

  const handleSectionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!sectionForm.title.trim()) {
      setError("Section title is required.");
      return;
    }

    if (!section && !sectionFile) {
      setError("Background image is required for the first setup.");
      return;
    }

    const fileError = validateImage(sectionFile);
    if (fileError) {
      setError(fileError);
      return;
    }

    setIsSectionSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", sectionForm.title.trim());
      formData.append("description", sectionForm.description.trim());
      formData.append("is_active", sectionForm.isActive ? "true" : "false");

      if (sectionFile) {
        formData.append("background", sectionFile);
      }

      const response = await fetch("/api/admin/featured-workshop-section", {
        method: "PUT",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to update featured workshop section.");
      }

      if (sectionFileRef.current) {
        sectionFileRef.current.value = "";
      }

      setSectionFile(null);
      setSuccess("Featured workshop section updated successfully.");
      await loadSection();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to update featured workshop section.",
      );
    } finally {
      setIsSectionSubmitting(false);
    }
  };

  const startEditCard = (card: FeaturedWorkshopCard) => {
    setError("");
    setSuccess("");
    setEditingCardId(card.id);
    setCardForm({
      title: card.title,
      position: String(card.position),
      isActive: card.is_active,
    });
    setCardFile(null);

    if (cardFileRef.current) {
      cardFileRef.current.value = "";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteCard = async (cardId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this card?");
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingCardId(cardId);

    try {
      const response = await fetch(`/api/admin/featured-workshop-cards/${cardId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(getApiMessage(payload) || "Unable to delete featured workshop card.");
      }

      setCards((prev) => prev.filter((card) => card.id !== cardId));

      if (editingCardId === cardId) {
        resetCardEditor();
      }

      setSuccess("Featured workshop card deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to delete featured workshop card.",
      );
    } finally {
      setDeletingCardId((current) => (current === cardId ? null : current));
    }
  };

  const handleCardSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const positionValue = Number(cardForm.position);

    if (!cardForm.title.trim()) {
      setError("Card title is required.");
      return;
    }

    if (!Number.isInteger(positionValue) || positionValue < 1 || positionValue > MAX_POSITION) {
      setError(`Position must be between 1 and ${MAX_POSITION}.`);
      return;
    }

    if (!editingCardId && !cardFile) {
      setError("Card image is required to create a new card.");
      return;
    }

    const fileError = validateImage(cardFile);
    if (fileError) {
      setError(fileError);
      return;
    }

    setIsCardSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", cardForm.title.trim());
      formData.append("position", String(positionValue));
      formData.append("is_active", cardForm.isActive ? "true" : "false");

      if (cardFile) {
        formData.append("image", cardFile);
      }

      const endpoint = editingCardId
        ? `/api/admin/featured-workshop-cards/${editingCardId}`
        : "/api/admin/featured-workshop-cards";

      const response = await fetch(endpoint, {
        method: editingCardId ? "PUT" : "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload)
          || (editingCardId ? "Unable to update featured workshop card." : "Unable to create featured workshop card."),
        );
      }

      resetCardEditor();
      setSuccess(editingCardId ? "Featured workshop card updated successfully." : "Featured workshop card created successfully.");
      await loadSection();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : (editingCardId ? "Unable to update featured workshop card." : "Unable to create featured workshop card."),
      );
    } finally {
      setIsCardSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-cyan-300" />
            Featured Workshop Section
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSectionSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="featured-section-title" className="text-sm text-zinc-300">Title</label>
                <textarea
                  id="featured-section-title"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  rows={2}
                  value={sectionForm.title}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Main heading"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="featured-section-description" className="text-sm text-zinc-300">Description</label>
                <textarea
                  id="featured-section-description"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  rows={3}
                  value={sectionForm.description}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Supporting text"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="featured-section-background" className="text-sm text-zinc-300">
                  Background Image (max 5MB, recommended 19:6)
                </label>
                <input
                  ref={sectionFileRef}
                  id="featured-section-background"
                  type="file"
                  accept="image/*"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-zinc-100"
                  onChange={(event) => setSectionFile(event.target.files?.[0] || null)}
                />
                {section?.background_url ? (
                  <div className="mt-2 h-20 w-full overflow-hidden rounded-md border border-zinc-800">
                    <img
                      src={section.background_url}
                      alt="Featured workshop background"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={sectionForm.isActive}
                    onChange={(event) => setSectionForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  Section active
                </label>
                <p className="text-xs text-zinc-400">
                  Uploading a new background will replace the existing one in S3.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" className="bg-cyan-500 text-black hover:bg-cyan-400" disabled={isSectionSubmitting}>
                {isSectionSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {section ? "Update Section" : "Create Section"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            {editingCardId ? (
              <Pencil className="h-5 w-5 text-cyan-300" />
            ) : (
              <PlusCircle className="h-5 w-5 text-cyan-300" />
            )}
            {editingCardId ? "Edit Featured Card" : "Create Featured Card"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCardSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label htmlFor="featured-card-title" className="text-sm text-zinc-300">Card Title</label>
                <input
                  id="featured-card-title"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={cardForm.title}
                  onChange={(event) => setCardForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="E.g. AIRCRAFT"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="featured-card-position" className="text-sm text-zinc-300">Position (1-6)</label>
                <input
                  id="featured-card-position"
                  type="number"
                  min={1}
                  max={MAX_POSITION}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={cardForm.position}
                  onChange={(event) => setCardForm((prev) => ({ ...prev, position: event.target.value }))}
                  placeholder="1"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="featured-card-image" className="text-sm text-zinc-300">Card Image (max 5MB)</label>
                <input
                  ref={cardFileRef}
                  id="featured-card-image"
                  type="file"
                  accept="image/*"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-zinc-100"
                  onChange={(event) => setCardFile(event.target.files?.[0] || null)}
                />
                {editingCardId ? (
                  <p className="text-xs text-zinc-500">Leave image empty to keep the existing card image.</p>
                ) : null}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={cardForm.isActive}
                onChange={(event) => setCardForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              Card active
            </label>

            {error ? (
              <p className="rounded-md border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-md border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
                {success}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" className="bg-cyan-500 text-black hover:bg-cyan-400" disabled={isCardSubmitting}>
                {isCardSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingCardId ? "Save Changes" : "Upload Card"}
              </Button>

              {editingCardId ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-zinc-200 hover:bg-zinc-800"
                  onClick={resetCardEditor}
                  disabled={isCardSubmitting}
                >
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-xl">Existing Featured Cards</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-28 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-white min-w-[120px]">Preview</TableHead>
                    <TableHead className="text-white min-w-[180px]">Title</TableHead>
                    <TableHead className="text-white min-w-[80px]">Position</TableHead>
                    <TableHead className="text-white min-w-[90px]">Active</TableHead>
                    <TableHead className="text-white min-w-[150px]">Updated</TableHead>
                    <TableHead className="text-white min-w-[120px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCards.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell colSpan={6} className="py-8 text-center text-zinc-400">
                        No featured cards found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCards.map((card) => (
                      <TableRow key={card.id} className="border-zinc-800">
                        <TableCell>
                          <div className="h-16 w-24 overflow-hidden rounded-md border border-zinc-700 bg-zinc-950">
                            {card.image_url ? (
                              <img
                                src={card.image_url}
                                alt={card.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-100">
                          <div className="space-y-1">
                            <p className="font-medium text-zinc-100">{card.title}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300">{card.position}</TableCell>
                        <TableCell className="text-zinc-300">{card.is_active ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-zinc-400">{formatDateTime(card.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-cyan-300 hover:bg-cyan-900/20"
                              disabled={isCardSubmitting || deletingCardId === card.id}
                              onClick={() => startEditCard(card)}
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              {editingCardId === card.id ? "Editing" : "Edit"}
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              className="text-rose-300 hover:bg-rose-900/20"
                              disabled={isCardSubmitting || deletingCardId === card.id}
                              onClick={() => {
                                void handleDeleteCard(card.id);
                              }}
                            >
                              {deletingCardId === card.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Delete
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
