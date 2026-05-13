"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  ImagePlus,
  ChevronDown,
  CalendarDays,
  Clock,
  Timer,
  BadgeCheck,
  IndianRupee,
  Rocket,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { AdminToast } from "@/components/admin/AdminToast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WorkshopPayload {
  title: string;
  description: string;
  eligibility: string;
  mode: string;
  workshop_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  certificate: boolean;
  fee: number;
  thumbnail: string;
}

// ─── Themed Field Primitives ──────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-zinc-300 mb-1.5"
    >
      {children}
      {required && <span className="text-rose-400 ml-1">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="mt-1 text-xs text-rose-400 flex items-center gap-1"
      role="alert"
    >
      <span aria-hidden>⚠</span> {message}
    </p>
  );
}

function FormInput({
  name,
  label,
  placeholder,
  type = "text",
  icon,
  required,
  disabled,
  error,
  value,
  onChange,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "url" | "number" | "date" | "time";
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          className={`w-full py-2 rounded-md bg-zinc-800 border text-sm text-zinc-100
            placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            focus:border-blue-500 transition-colors
            ${icon ? "pl-9 pr-3" : "px-3"}
            ${error ? "border-rose-500" : "border-zinc-700 hover:border-zinc-600"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            [color-scheme:dark]
          `}
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function FormTextarea({
  name,
  label,
  placeholder,
  rows = 4,
  required,
  disabled,
  error,
  value,
  onChange,
}: {
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div>
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-md bg-zinc-800 border text-sm text-zinc-100
          placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500
          focus:border-blue-500 transition-colors resize-vertical
          ${error ? "border-rose-500" : "border-zinc-700 hover:border-zinc-600"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      />
      <FieldError message={error} />
    </div>
  );
}

function FormSelect({
  name,
  label,
  options,
  placeholder = "Select…",
  required,
  disabled,
  error,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div>
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-9 rounded-md bg-zinc-800 border text-sm
            appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500
            focus:border-blue-500 transition-colors
            ${error ? "border-rose-500" : "border-zinc-700 hover:border-zinc-600"}
            ${!value ? "text-zinc-500" : "text-zinc-100"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <option value="" disabled className="text-zinc-500 bg-zinc-900">
            {placeholder}
          </option>
          {options.map((o) => (
            <option
              key={o.value}
              value={o.value}
              className="text-zinc-100 bg-zinc-900"
            >
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function FormToggle({
  name,
  label,
  helperText,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  helperText?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-zinc-300">{label}</p>
        {helperText && (
          <p className="text-xs text-zinc-500 mt-0.5">{helperText}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        id={name}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          focus:ring-offset-zinc-900 cursor-pointer
          ${checked ? "bg-blue-500" : "bg-zinc-700"}
        `}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow
          transition duration-200
          ${checked ? "translate-x-5" : "translate-x-0"}
        `}
        />
      </button>
    </div>
  );
}

function FormFileUpload({
  name,
  label,
  accept,
  hint,
  icon,
  required,
  error,
  fileName,
  onFileSelect,
}: {
  name: string;
  label: string;
  accept?: string;
  hint?: string;
  icon?: React.ReactNode;
  required?: boolean;
  error?: string;
  fileName?: string;
  onFileSelect?: (file: File | null) => void;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div
        className={`relative border-2 border-dashed rounded-md transition-colors cursor-pointer group
        ${error
            ? "border-rose-500 bg-rose-900/10"
            : "border-zinc-700 bg-zinc-800/40 hover:border-blue-500 hover:bg-zinc-800"
          }
      `}
      >
        <input
          type="file"
          id={name}
          name={name}
          accept={accept}
          onChange={(e) => onFileSelect?.(e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2 py-5 px-4 text-center">
          <span
            className={`${error ? "text-rose-400" : "text-zinc-500 group-hover:text-blue-400"} transition-colors`}
          >
            {icon}
          </span>
          <div>
            <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
              {fileName ? (
                <span className="text-green-400 font-medium block truncate max-w-[200px]">
                  {fileName}
                </span>
              ) : (
                <>
                  <span className="text-blue-400 font-medium">
                    Click to upload
                  </span>{" "}
                  or drag & drop
                </>
              )}
            </p>
            {hint && <p className="text-xs text-zinc-600 mt-0.5">{hint}</p>}
          </div>
        </div>
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODE_OPTIONS = [
  { value: "Online", label: "Online" },
  { value: "Offline", label: "Offline" },
  { value: "Hybrid", label: "Hybrid" },
];

const DURATION_OPTIONS = [
  { value: "1 hour", label: "1 Hour" },
  { value: "2 hours", label: "2 Hours" },
  { value: "3 hours", label: "3 Hours" },
  { value: "4 hours", label: "4 Hours" },
  { value: "6 hours", label: "6 Hours" },
  { value: "8 hours", label: "Full Day (8 Hours)" },
  { value: "2 days", label: "2 Days" },
  { value: "3 days", label: "3 Days" },
  { value: "1 week", label: "1 Week" },
];


const ELIGIBILITY_OPTIONS = [
  { value: "all", label: "All Students and Professionals" },
  { value: "students", label: "Only Students" },
  { value: "professionals", label: "Only Professionals" },
  { value: "custom", label: "Other (enter custom eligibility)" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddNewWorkshopPage() {
  const [form, setForm] = useState<
    Omit<WorkshopPayload, "thumbnail">
  >({
    title: "",
    description: "",
    eligibility: "",
    mode: "",
    workshop_date: "",
    start_time: "",
    end_time: "",
    duration: "",
    certificate: false,
    fee: 0,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedEligibilityOption, setSelectedEligibilityOption] = useState<string>("");
  const [customEligibility, setCustomEligibility] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fileInputResetKey, setFileInputResetKey] = useState(0);

  const setField =
    (field: keyof typeof form) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => {
        const val =
          e.target.type === "number" ? Number(e.target.value) : e.target.value;
        setForm((f) => ({ ...f, [field]: val }));
        setErrors((er) => ({ ...er, [field]: "" }));
      };

  const handleEligibilitySelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedEligibilityOption(value);
    setErrors((er) => ({ ...er, eligibility: "" }));

    if (value === "custom") {
      setForm((f) => ({ ...f, eligibility: customEligibility }));
      return;
    }

    const option = ELIGIBILITY_OPTIONS.find((o) => o.value === value);
    setCustomEligibility("");
    setForm((f) => ({ ...f, eligibility: option?.label ?? "" }));
  };

  const handleCustomEligibilityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomEligibility(value);
    setSelectedEligibilityOption("custom");
    setForm((f) => ({ ...f, eligibility: value }));
    setErrors((er) => ({ ...er, eligibility: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (!form.eligibility.trim()) e.eligibility = "Eligibility is required.";
    if (!form.mode) e.mode = "Please select a mode.";
    if (!form.workshop_date) e.workshop_date = "Workshop date is required.";
    if (!form.start_time) e.start_time = "Start time is required.";
    if (!form.end_time) e.end_time = "End time is required.";
    if (!form.duration) e.duration = "Please select a duration.";
    if (form.fee < 0) e.fee = "Fee cannot be negative.";
    if (!thumbnailFile) e.thumbnail = "Thumbnail image is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        const base64 = dataUrl.split(",")[1]; // ✅ REMOVE PREFIX
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });

  const normalizeTimeForApi = (value: string) =>
    /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;

  const clearForm = () => {
    setForm({
      title: "",
      description: "",
      eligibility: "",
      mode: "",
      workshop_date: "",
      start_time: "",
      end_time: "",
      duration: "",
      certificate: false,
      fee: 0,
    });
    setThumbnailFile(null);
    setErrors({});
    setSelectedEligibilityOption("");
    setCustomEligibility("");
    setApiError("");
    setSubmitStatus("idle");
    setFileInputResetKey((current) => current + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!thumbnailFile) {
      setApiError("Thumbnail required");
      return;
    }

    setIsSubmitting(true);
    setApiError("");
    setSubmitStatus("idle");

    try {
      const candidateEndpoints = ["/api/workshop-list/create"];
      const formForApi = {
        ...form,
        start_time: normalizeTimeForApi(form.start_time),
        end_time: normalizeTimeForApi(form.end_time),
      };

      const thumbnailBase64 = await fileToBase64(thumbnailFile);

      const payload: WorkshopPayload = {
        ...formForApi,
        thumbnail: thumbnailBase64,
      };

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken") || localStorage.getItem("token")
          : null;

      const jsonHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        jsonHeaders.Authorization = `Bearer ${token}`;
      }

      const multipartHeaders: Record<string, string> = {};
      if (token) {
        multipartHeaders.Authorization = `Bearer ${token}`;
      }

      let success = false;
      let lastErrorMessage = "Failed to create workshop.";

      for (const endpoint of candidateEndpoints) {
        // Most file upload APIs expect multipart form data, so try this first.
        const formData = new FormData();
        Object.entries(formForApi).forEach(([key, val]) => {
          formData.append(key, String(val));
        });
        formData.append("thumbnail", thumbnailFile!);

        const multipartRes = await fetch(endpoint, {
          method: "POST",
          headers: multipartHeaders,
          credentials: "include",
          body: formData,
        });

        const multipartRaw = await multipartRes.text();
        let multipartData: Record<string, unknown> = {};
        try {
          multipartData = multipartRaw
            ? (JSON.parse(multipartRaw) as Record<string, unknown>)
            : {};
        } catch {
          multipartData = {};
        }

        if (multipartRes.ok) {
          success = true;
          break;
        }

        if ([401, 403].includes(multipartRes.status)) {
          throw new Error(
            (typeof multipartData.detail === "string" ? multipartData.detail :
              typeof multipartData.message === "string" ? multipartData.message :
                null) ||
            "Unauthorized request. Please log in again as admin.",
          );
        }

        if (multipartRes.status === 404) {
          continue;
        }

        // Fallback for APIs that accept base64 JSON instead of multipart.
        const jsonRes = await fetch(endpoint, {
          method: "POST",
          headers: jsonHeaders,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const jsonRaw = await jsonRes.text();
        let jsonData: Record<string, unknown> = {};
        try {
          jsonData = jsonRaw ? (JSON.parse(jsonRaw) as Record<string, unknown>) : {};
        } catch {
          jsonData = {};
        }

        if (jsonRes.ok) {
          success = true;
          break;
        }

        if ([401, 403].includes(jsonRes.status)) {
          throw new Error(
            (typeof jsonData.detail === "string" ? jsonData.detail :
              typeof jsonData.message === "string" ? jsonData.message :
                null) ||
            "Unauthorized request. Please log in again as admin.",
          );
        }

        if (jsonRes.status === 404) {
          continue;
        }

        lastErrorMessage =
          (typeof jsonData.detail === "string" ? jsonData.detail :
            typeof jsonData.message === "string" ? jsonData.message :
              null) || lastErrorMessage;
      }

      if (!success) {
        throw new Error(lastErrorMessage);
      }

      clearForm();
      setSubmitStatus("success");
      setToastMessage("Workshop added successfully");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

    return (
      <div className="min-h-screen text-zinc-100 container mx-auto max-w-8xl">
        <AdminToast
          open={Boolean(toastMessage)}
          message={toastMessage ?? ""}
          variant="success"
          onClose={() => setToastMessage(null)}
        />

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Add New Workshop
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Fill in the details to publish a new workshop
            </p>
          </div>
          <Link href="/admin/workshops">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </Link>
        </div>

        <Separator className="my-6 bg-zinc-800" />

        {/* ── API error banner ── */}
        {apiError && (
          <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-md bg-rose-950/50 border border-rose-800 text-rose-300 text-sm">
            <span className="mt-0.5">⚠</span>
            <p className="flex-1">{apiError}</p>
            <button
              onClick={() => setApiError("")}
              className="hover:text-rose-100 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* ── Left: main details ── */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-blue-400" />
                    <CardTitle className="text-base text-zinc-100">
                      Basic Information
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormInput
                    name="title"
                    label="Title"
                    placeholder="e.g. Advanced AI Workshop"
                    required
                    value={form.title}
                    onChange={setField("title")}
                    error={errors.title}
                  />
                  <FormTextarea
                    name="description"
                    label="Description"
                    placeholder="Hands-on workshop on practical AI use cases…"
                    rows={4}
                    required
                    value={form.description}
                    onChange={setField("description")}
                    error={errors.description}
                  />
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-blue-400" />
                    <CardTitle className="text-base text-zinc-100">
                      Schedule
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      name="workshop_date"
                      label="Workshop Date"
                      type="date"
                      icon={<CalendarDays className="w-4 h-4" />}
                      required
                      value={form.workshop_date}
                      onChange={setField("workshop_date")}
                      error={errors.workshop_date}
                    />
                    <FormSelect
                      name="duration"
                      label="Duration"
                      options={DURATION_OPTIONS}
                      placeholder="Select Duration"
                      required
                      value={form.duration}
                      onChange={setField("duration")}
                      error={errors.duration}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      name="start_time"
                      label="Start Time"
                      type="time"
                      icon={<Clock className="w-4 h-4" />}
                      required
                      value={form.start_time}
                      onChange={setField("start_time")}
                      error={errors.start_time}
                    />
                    <FormInput
                      name="end_time"
                      label="End Time"
                      type="time"
                      icon={<Clock className="w-4 h-4" />}
                      required
                      value={form.end_time}
                      onChange={setField("end_time")}
                      error={errors.end_time}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Assets */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4 text-blue-400" />
                    <CardTitle className="text-base text-zinc-100">
                      Assets
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormFileUpload
                    key={`thumbnail-upload-${fileInputResetKey}`}
                    name="thumbnail"
                    label="Thumbnail Image"
                    accept="image/png,image/jpeg,image/webp"
                    hint="PNG, JPG, WEBP · Recommended 1200×630px · Max 5MB"
                    icon={<ImagePlus className="w-8 h-8" />}
                    required
                    fileName={thumbnailFile?.name}
                    onFileSelect={setThumbnailFile}
                    error={errors.thumbnail}
                  />
                </CardContent>
              </Card>
            </div>

            {/* ── Right: settings + actions ── */}
            <div className="space-y-6">
              {/* Settings */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-zinc-100">
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <FormSelect
                      name="eligibility"
                      label="Eligibility"
                      options={ELIGIBILITY_OPTIONS}
                      placeholder="Choose eligibility"
                      required
                      value={selectedEligibilityOption}
                      onChange={handleEligibilitySelect}
                      error={selectedEligibilityOption === "custom" ? undefined : errors.eligibility}
                    />
                    {selectedEligibilityOption === "custom" && (
                      <FormInput
                        name="eligibility_custom"
                        label="Custom Eligibility"
                        placeholder="Describe who can access this workshop"
                        required
                        value={customEligibility}
                        onChange={handleCustomEligibilityChange}
                        error={errors.eligibility}
                      />
                    )}
                  </div>
                  <FormSelect
                    name="mode"
                    label="Mode"
                    options={MODE_OPTIONS}
                    placeholder="Select Mode"
                    required
                    value={form.mode}
                    onChange={setField("mode")}
                    error={errors.mode}
                  />

                  <FormInput
                    name="fee"
                    label="Registration Fee (₹)"
                    type="number"
                    placeholder="0"
                    icon={<IndianRupee className="w-4 h-4" />}
                    value={form.fee}
                    onChange={setField("fee")}
                    error={errors.fee}
                  />
                  <p className="text-xs text-zinc-500 -mt-3">
                    Set 0 for a free workshop
                  </p>

                  <Separator className="bg-zinc-800" />

                  <FormToggle
                    name="certificate"
                    label="Issue Certificate"
                    helperText="Participants receive a certificate on completion"
                    checked={form.certificate}
                    onChange={(val) =>
                      setForm((f) => ({ ...f, certificate: val }))
                    }
                  />

                  {/* Live preview pill */}
                  {form.mode && (
                    <>
                      <Separator className="bg-zinc-800" />
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">
                          Preview
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-300">
                            <Timer className="w-3 h-3 text-blue-400" />{" "}
                            {form.duration || "—"}
                          </span>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-300">
                            {form.mode}
                          </span>
                          {form.certificate && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-green-950 border border-green-900 text-green-300">
                              <BadgeCheck className="w-3 h-3" /> Certificate
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-300">
                            <IndianRupee className="w-3 h-3 text-blue-400" />
                            {form.fee === 0 ? "Free" : `₹${form.fee}`}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-4 space-y-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full font-bold border transition-all
                    ${submitStatus === "success"
                        ? "bg-green-600 hover:bg-green-700 border-green-700 text-white"
                        : submitStatus === "error"
                          ? "bg-rose-600 hover:bg-rose-700 border-rose-700 text-white"
                          : "bg-blue-500 hover:bg-blue-700 border-blue-700 text-white"
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin mr-2 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Publishing…
                      </>
                    ) : submitStatus === "success" ? (
                      <>
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Workshop Created!
                      </>
                    ) : submitStatus === "error" ? (
                      <>
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Try Again
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Workshop
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearForm}
                    className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    Clear Form
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    );
  }
