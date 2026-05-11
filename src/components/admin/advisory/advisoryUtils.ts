import { formatDate as sharedFormatDate } from "@/lib/formatDate";
import type { AdvisoryProfile } from "@/types/advisory";

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  return cleaned || null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => Boolean(item));
  }

  if (typeof value !== "string") {
    return [];
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return [];
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => Boolean(item));
  } catch {
    return [];
  }
}

function toAdvisoryProfile(value: unknown): AdvisoryProfile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = Number(record.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return {
    id,
    full_name: toNullableString(record.full_name) || `Advisor ${id}`,
    designation: toNullableString(record.designation) || "-",
    organization_institution: toNullableString(record.organization_institution) || "-",
    department_specialisation: toNullableString(record.department_specialisation),
    official_email: toNullableString(record.official_email) || "-",
    alternative_email: toNullableString(record.alternative_email),
    mobile_number: toNullableString(record.mobile_number) || "-",
    location_text: toNullableString(record.location_text),
    highest_qualification: toNullableString(record.highest_qualification),
    qualification_year: toNullableString(record.qualification_year),
    experience_years: toNullableNumber(record.experience_years),
    key_research_areas: toNullableString(record.key_research_areas),
    professional_expertise: toNullableString(record.professional_expertise),
    preferred_contributions: toStringArray(record.preferred_contributions),
    preferred_contribution_other: toNullableString(record.preferred_contribution_other),
    contribution_modes: toStringArray(record.contribution_modes),
    contribution_mode_other: toNullableString(record.contribution_mode_other),
    monthly_hours: toNullableNumber(record.monthly_hours),
    interaction_modes: toStringArray(record.interaction_modes),
    availability_period: toNullableString(record.availability_period),
    suggestions: toStringArray(record.suggestions),
    viksit_bharat_contribution: toNullableString(record.viksit_bharat_contribution),
    media_support:
      record.media_support === null || record.media_support === undefined
        ? null
        : toBoolean(record.media_support),
    media_tools: toNullableString(record.media_tools),
    declaration_accepted: toBoolean(record.declaration_accepted),
    status: (toNullableString(record.status) || "pending").toLowerCase(),
    created_at: toNullableString(record.created_at),
    updated_at: toNullableString(record.updated_at),
  };
}

export function extractAdvisories(payload: unknown): AdvisoryProfile[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.advisories)) {
    return [];
  }

  return record.advisories
    .map(toAdvisoryProfile)
    .filter((advisory): advisory is AdvisoryProfile => advisory !== null);
}

export function getApiMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  return null;
}

export function formatAdvisoryDate(value: string | null): string {
  return sharedFormatDate(value);
}

export function getStatusBadgeClasses(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized === "active") {
    return "bg-emerald-950 text-emerald-200 border border-emerald-900";
  }

  if (normalized === "pending") {
    return "bg-amber-950 text-amber-200 border border-amber-900";
  }

  return "bg-zinc-800 text-zinc-200 border border-zinc-700";
}
