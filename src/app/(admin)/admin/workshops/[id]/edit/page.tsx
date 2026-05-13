"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Clock,
  ImagePlus,
  IndianRupee,
  Loader2,
  Rocket,
  Save,
  Timer,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { AdminToast } from "@/components/admin/AdminToast";

type WorkshopResponse = {
  id?: number;
  title?: string;
  description?: string | null;
  eligibility?: string | null;
  mode?: string | null;
  workshop_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration?: string | null;
  certificate?: boolean;
  fee?: number | null;
  message?: string;
};

type WorkshopFormState = {
  title: string;
  description: string;
  eligibility: string;
  mode: string;
  workshop_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  certificate: boolean;
  fee: string;
};

const EMPTY_FORM: WorkshopFormState = {
  title: "",
  description: "",
  eligibility: "",
  mode: "",
  workshop_date: "",
  start_time: "",
  end_time: "",
  duration: "",
  certificate: true,
  fee: "",
};

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
    <p className="mt-1 text-xs text-rose-400" role="alert">
      {message}
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
  type?: "text" | "url" | "number" | "date" | "time";
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
  placeholder = "Select...",
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
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="text-zinc-100 bg-zinc-900"
            >
              {option.label}
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
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-zinc-300">{label}</p>
        {helperText && <p className="text-xs text-zinc-500 mt-0.5">{helperText}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={name}
        onClick={() => onChange(!checked)}
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
  fileName,
  onFileSelect,
}: {
  name: string;
  label: string;
  accept?: string;
  hint?: string;
  icon?: React.ReactNode;
  fileName?: string;
  onFileSelect?: (file: File | null) => void;
}) {
  return (
    <div>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <div className="relative border-2 border-dashed rounded-md transition-colors cursor-pointer group border-zinc-700 bg-zinc-800/40 hover:border-blue-500 hover:bg-zinc-800">
        <input
          id={name}
          name={name}
          type="file"
          accept={accept}
          onChange={(event) => onFileSelect?.(event.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2 py-5 px-4 text-center">
          <span className="text-zinc-500 group-hover:text-blue-400 transition-colors">
            {icon}
          </span>
          <div>
            <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
              {fileName ? (
                <span className="text-green-400 font-medium block truncate max-w-[250px]">
                  {fileName}
                </span>
              ) : (
                <>
                  <span className="text-blue-400 font-medium">Click to upload</span> or drag & drop
                </>
              )}
            </p>
            {hint && <p className="text-xs text-zinc-600 mt-0.5">{hint}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function getWorkshopIdParam(value: string | string[] | undefined): string {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

function normalizeTimeForInput(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

function normalizeTimeForApi(value: string): string {
  if (!value) {
    return "";
  }

  return value.length === 5 ? `${value}:00` : value;
}

export default function EditWorkshopPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workshopId = getWorkshopIdParam(params?.id);

  const [form, setForm] = useState<WorkshopFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedEligibilityOption, setSelectedEligibilityOption] = useState("");
  const [customEligibility, setCustomEligibility] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadWorkshop = async () => {
      if (!workshopId) {
        setError("Invalid workshop id");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/workshop-list/${encodeURIComponent(workshopId)}`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as WorkshopResponse;

        if (!response.ok) {
          throw new Error(payload.message || "Unable to fetch workshop");
        }

        if (!isMounted) {
          return;
        }

        setForm({
          title: payload.title || "",
          description: payload.description || "",
          eligibility: payload.eligibility || "",
          mode: payload.mode || "",
          workshop_date: payload.workshop_date || "",
          start_time: normalizeTimeForInput(payload.start_time),
          end_time: normalizeTimeForInput(payload.end_time),
          duration: payload.duration || "",
          certificate: payload.certificate !== false,
          fee:
            payload.fee === null || payload.fee === undefined
              ? ""
              : String(payload.fee),
        });

        const savedEligibility = (payload.eligibility || "").trim();
        const matchedEligibility = ELIGIBILITY_OPTIONS.find(
          (option) => option.value !== "custom" && option.label === savedEligibility,
        );

        if (matchedEligibility) {
          setSelectedEligibilityOption(matchedEligibility.value);
          setCustomEligibility("");
        } else if (savedEligibility) {
          setSelectedEligibilityOption("custom");
          setCustomEligibility(savedEligibility);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(
          err instanceof Error && err.message
            ? err.message
            : "Unable to fetch workshop",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWorkshop();

    return () => {
      isMounted = false;
    };
  }, [workshopId]);

  const canSubmit = useMemo(() => {
    return !isSubmitting && !isLoading;
  }, [isLoading, isSubmitting]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!form.title.trim()) nextErrors.title = "Title is required.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";
    if (!form.eligibility.trim()) nextErrors.eligibility = "Eligibility is required.";
    if (!form.mode.trim()) nextErrors.mode = "Please select a mode.";
    if (!form.workshop_date) nextErrors.workshop_date = "Workshop date is required.";
    if (!form.start_time) nextErrors.start_time = "Start time is required.";
    if (!form.end_time) nextErrors.end_time = "End time is required.";
    if (!form.duration.trim()) nextErrors.duration = "Please select a duration.";
    if (form.fee.trim() && Number(form.fee) < 0) nextErrors.fee = "Fee cannot be negative.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = <K extends keyof WorkshopFormState>(
    field: K,
    value: WorkshopFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccessMessage("");
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleEligibilitySelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedEligibilityOption(value);
    setErrors((prev) => ({ ...prev, eligibility: "" }));

    if (value === "custom") {
      updateField("eligibility", customEligibility);
      return;
    }

    const option = ELIGIBILITY_OPTIONS.find((item) => item.value === value);
    setCustomEligibility("");
    updateField("eligibility", option?.label ?? "");
  };

  const handleCustomEligibilityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomEligibility(value);
    setSelectedEligibilityOption("custom");
    updateField("eligibility", value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !validate()) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const endpoint = `/api/workshop-list/${encodeURIComponent(workshopId)}`;
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        eligibility: form.eligibility.trim(),
        mode: form.mode.trim(),
        workshop_date: form.workshop_date || null,
        start_time: normalizeTimeForApi(form.start_time),
        end_time: normalizeTimeForApi(form.end_time),
        duration: form.duration.trim(),
        certificate: form.certificate,
        fee: form.fee.trim() === "" ? null : Number(form.fee),
      };

      const hasNewUpload = Boolean(thumbnailFile);
      let response: Response;

      if (hasNewUpload) {
        const formData = new FormData();
        formData.append("title", payload.title);
        formData.append("description", payload.description);
        formData.append("eligibility", payload.eligibility);
        formData.append("mode", payload.mode);
        formData.append("workshop_date", payload.workshop_date ?? "");
        formData.append("start_time", payload.start_time);
        formData.append("end_time", payload.end_time);
        formData.append("duration", payload.duration);
        formData.append("certificate", String(payload.certificate));
        formData.append("fee", payload.fee === null ? "" : String(payload.fee));

        if (thumbnailFile) {
          formData.append("thumbnail", thumbnailFile);
        }

        response = await fetch(endpoint, {
          method: "PUT",
          body: formData,
        });
      } else {
        response = await fetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const responsePayload = (await response.json().catch(() => ({}))) as WorkshopResponse;

      if (!response.ok) {
        throw new Error(responsePayload.message || "Unable to update workshop");
      }

      setSuccessMessage("Workshop updated successfully");
      setToastMessage("Workshop updated successfully");
      setThumbnailFile(null);
      window.setTimeout(() => {
        router.push("/admin/workshops");
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to update workshop",
      );
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 pb-5 mb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Edit Workshop
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Update workshop details using the same structure as workshop creation
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

      {error && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-md bg-rose-950/50 border border-rose-800 text-rose-300 text-sm">
          <span className="mt-0.5">⚠</span>
          <p className="flex-1">{error}</p>
          <button
            onClick={() => setError("")}
            className="hover:text-rose-100 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-blue-400" />
                    <CardTitle className="text-base text-zinc-100">Basic Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormInput
                    name="title"
                    label="Title"
                    required
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    error={errors.title}
                  />
                  <FormTextarea
                    name="description"
                    label="Description"
                    rows={4}
                    required
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    error={errors.description}
                  />
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-blue-400" />
                    <CardTitle className="text-base text-zinc-100">Schedule</CardTitle>
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
                      onChange={(event) => updateField("workshop_date", event.target.value)}
                      error={errors.workshop_date}
                    />
                    <FormSelect
                      name="duration"
                      label="Duration"
                      options={DURATION_OPTIONS}
                      placeholder="Select Duration"
                      required
                      value={form.duration}
                      onChange={(event) => updateField("duration", event.target.value)}
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
                      onChange={(event) => updateField("start_time", event.target.value)}
                      error={errors.start_time}
                    />
                    <FormInput
                      name="end_time"
                      label="End Time"
                      type="time"
                      icon={<Clock className="w-4 h-4" />}
                      required
                      value={form.end_time}
                      onChange={(event) => updateField("end_time", event.target.value)}
                      error={errors.end_time}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4 text-blue-400" />
                    <CardTitle className="text-base text-zinc-100">Assets</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-zinc-500">
                    Keep existing images by leaving upload fields empty, or upload new files to replace them.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormFileUpload
                      name="thumbnail"
                      label="Upload New Thumbnail"
                      accept="image/png,image/jpeg,image/webp"
                      hint="PNG, JPG, WEBP · Max 2MB"
                      icon={<ImagePlus className="w-8 h-8" />}
                      fileName={thumbnailFile?.name}
                      onFileSelect={setThumbnailFile}
                    />
                  </div>

                  {workshopId && (
                    <div className="grid grid-cols-1 gap-3 text-xs">
                      <a
                        href={`/api/workshop-list/${encodeURIComponent(workshopId)}/thumbnail`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                      >
                        View current thumbnail
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-zinc-100">Settings</CardTitle>
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
                    onChange={(event) => updateField("mode", event.target.value)}
                    error={errors.mode}
                  />

                  <FormInput
                    name="fee"
                    label="Registration Fee (₹)"
                    type="number"
                    icon={<IndianRupee className="w-4 h-4" />}
                    value={form.fee}
                    onChange={(event) => updateField("fee", event.target.value)}
                    error={errors.fee}
                  />
                  <p className="text-xs text-zinc-500 -mt-3">Set 0 for a free workshop</p>

                  <Separator className="bg-zinc-800" />

                  <FormToggle
                    name="certificate"
                    label="Issue Certificate"
                    helperText="Participants receive a certificate on completion"
                    checked={form.certificate}
                    onChange={(value) => updateField("certificate", value)}
                  />

                  {form.mode && (
                    <>
                      <Separator className="bg-zinc-800" />
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Preview</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-300">
                            <Timer className="w-3 h-3 text-blue-400" /> {form.duration || "—"}
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
                            {form.fee.trim() === "" || Number(form.fee) === 0 ? "Free" : `₹${form.fee}`}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-4 space-y-2">
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full bg-blue-500 border border-blue-700 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>

                  <Link href="/admin/workshops" className="block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      Cancel
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
