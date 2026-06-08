"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { submitProjectListing } from "@/services/projectListing";
import {
  Check,
  ArrowRight,
  AlertCircle,
  User,
  FileText,
  Link2,
  GraduationCap,
  Users,
  DollarSign,
  Upload,
  Shield,
  Bookmark,
  MapPin,
  Phone,
  HelpCircle,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────

type ProgrammeType = "ug" | "pg" | "phd" | "faculty" | "other" | "";
type ProjectLevel = "concept" | "proposal" | "ongoing" | "completed" | "";
type ProjectTheme =
  | "defence-space"
  | "ai-ml"
  | "aerospace"
  | "drone-uav"
  | "remote-sensing"
  | "robotics"
  | "satellite"
  | "other"
  | "";

interface ProjectFormData {
  // Section 1
  enrolmentNumber: string;
  fullName: string;
  primaryEmail: string;
  alternativeEmail: string;
  whatsappNumber: string;
  institution: string;
  department: string;
  programme: ProgrammeType;
  programmeOther: string;
  // Section 2
  isRegistered: boolean | null;
  portalName: string;
  registrationNumber: string;
  registrationDate: string;
  isPublished: boolean | null;
  publicationType: string[];
  publicationTitle: string;
  publicationVenue: string;
  publicationDate: string;
  publicationLink: string;
  addressLine1: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  // Section 3
  projectTitle: string;
  projectTheme: ProjectTheme;
  projectThemeOther: string;
  projectLevel: ProjectLevel;
  projectStartDate: string;
  projectEndDate: string;
  // Section 4
  projectObjective: string;
  projectMethodology: string;
  projectOutcome: string;
  // Section 5
  isThesisLinked: boolean | null;
  thesisTitle: string;
  thesisDegree: string;
  thesisSupervisor: string;
  thesisInstitution: string;
  // Section 6
  seekingCollaborators: boolean | null;
  collaboratorTypes: string[];
  collaborationTypes: string[];
  collaborationOther: string;
  // Section 7
  openToFunding: boolean | null;
  fundingSources: string[];
  fundingOther: string;
  estimatedBudget: string;
  currentSupport: string;
  // Section 8
  synopsisLink: string;
  githubLink: string;
  driveLink: string;
  demoLink: string;
  supportingFile: File | null;
  // Section 9
  preferredContact: string[];
  collaborationRequirements: string;
  additionalRemarks: string;
  // Section 10
  declarationAccepted: boolean;
}

type FormErrors = Partial<Record<keyof ProjectFormData, string>>;

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const typed = payload as { message?: unknown; error?: unknown };
  if (typeof typed.message === "string" && typed.message.trim())
    return typed.message.trim();
  if (typeof typed.error === "string" && typed.error.trim())
    return typed.error.trim();
  return "";
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePinCode(pin: string): boolean {
  return pin === "" || /^[0-9]{6}$/.test(pin);
}

function validateURL(url: string): boolean {
  return url === "" || /^https?:\/\/.+/.test(url);
}

// ─────────────────────────────────────────────────────────────
// ✅ SQUARE CHOICE COMPONENTS - Def-Space Design System
// ─────────────────────────────────────────────────────────────

// Square Checkbox with Check Icon
const SquareCheckbox: React.FC<{
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean, value: string) => void;
  label: string;
}> = ({ id, name, value, checked, onChange, label }) => (
  <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
    <div className="relative flex items-center justify-center mt-0.5">
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked, value)}
        className="peer h-5 w-5 appearance-none rounded-md border-2 border-[#2a2a2a] 
          bg-[#111111] checked:bg-orange-500 checked:border-orange-500 
          focus:outline-none focus:ring-2 focus:ring-orange-500/30 
          transition-all duration-150 touch-manipulation"
      />
      <Check
        className="absolute h-4 w-4 text-black opacity-0 peer-checked:opacity-100 
        pointer-events-none transition-opacity duration-150"
        strokeWidth={3}
      />
    </div>
    <span className="text-zinc-300 text-sm group-hover:text-zinc-100 transition-colors select-none">
      {label}
    </span>
  </label>
);

// Square Radio with Dot Icon
const SquareRadio: React.FC<{
  id: string;
  name: string;
  value: string | boolean;
  checked: boolean;
  onChange: (value: string | boolean) => void;
  label: string;
}> = ({ id, name, value, checked, onChange, label }) => (
  <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
    <div className="relative flex items-center justify-center mt-0.5">
      <input
        type="radio"
        id={id}
        name={name}
        value={String(value)}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer h-5 w-5 appearance-none rounded-md border-2 border-[#2a2a2a] 
          bg-[#111111] checked:bg-orange-500 checked:border-orange-500 
          focus:outline-none focus:ring-2 focus:ring-orange-500/30 
          transition-all duration-150 touch-manipulation"
      />
     <Check
                    className="absolute h-4 w-4 text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-150"
                    strokeWidth={3}
                  />
    </div>
    <span className="text-zinc-300 text-sm group-hover:text-zinc-100 transition-colors select-none">
      {label}
    </span>
  </label>
);

// Checkbox Group with Square Options
const SquareCheckboxGroup: React.FC<{
  label: string;
  name: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  error?: string;
  columns?: 1 | 2 | 3;
}> = ({
  label,
  name,
  options,
  selected,
  onChange,
  required,
  error,
  columns = 1,
}) => (
  <div className="mb-5">
    <label className="block text-zinc-100 text-[13px] font-semibold mb-3">
      {label} {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div
      className={`grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : columns === 3 ? "sm:grid-cols-3" : ""}`}
    >
      {options.map((opt) => (
        <SquareCheckbox
          key={opt.value}
          id={`${name}-${opt.value}`}
          name={name}
          value={opt.value}
          checked={selected.includes(opt.value)}
          onChange={(checked, val) => {
            const newValues = checked
              ? [...selected, val]
              : selected.filter((v) => v !== val);
            onChange(newValues);
          }}
          label={opt.label}
        />
      ))}
    </div>
    {error && (
      <p
        className="mt-2 text-xs text-red-400 flex items-start gap-1.5"
        role="alert"
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span className="break-words">{error}</span>
      </p>
    )}
  </div>
);

// Radio Group with Square Options
const SquareRadioGroup: React.FC<{
  label: string;
  name: string;
  options: { value: string | boolean; label: string }[];
  value: string | boolean | null;
  onChange: (value: string | boolean) => void;
  required?: boolean;
  error?: string;
}> = ({ label, name, options, value, onChange, required, error }) => (
  <div className="mb-5">
    <label className="block text-zinc-100 text-[13px] font-semibold mb-3">
      {label} {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="flex flex-wrap gap-3 sm:gap-4">
      {options.map((opt) => (
        <SquareRadio
          key={String(opt.value)}
          id={`${name}-${String(opt.value)}`}
          name={name}
          value={opt.value}
          checked={value === opt.value}
          onChange={onChange}
          label={opt.label}
        />
      ))}
    </div>
    {error && (
      <p
        className="mt-2 text-xs text-red-400 flex items-start gap-1.5"
        role="alert"
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span className="break-words">{error}</span>
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Standard Form Components (Responsive)
// ─────────────────────────────────────────────────────────────

interface InputProps {
  id: string;
  name: keyof ProjectFormData;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  prefix?: string;
  suffix?: string;
}

const FormInput: React.FC<InputProps> = ({
  id,
  name,
  label,
  type = "text",
  placeholder,
  required,
  value,
  onChange,
  error,
  helperText,
  prefix,
  suffix,
}) => (
  <div className="mb-4 sm:mb-5 w-full">
    <label
      htmlFor={id}
      className="block text-zinc-100 text-[13px] font-semibold mb-2"
    >
      {label} {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
          {prefix}
        </span>
      )}
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 rounded-md bg-[#111111] border text-zinc-100 placeholder-zinc-600 
          focus:outline-none focus:border-orange-500/50 transition-colors text-sm touch-manipulation
          ${prefix ? "pl-10" : ""} ${suffix ? "pr-12" : ""}
          ${error ? "border-red-500 focus:border-red-500/50" : "border-[#2a2a2a] hover:border-[#3a3a3a]"}`}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
          {suffix}
        </span>
      )}
    </div>
    {helperText && !error && (
      <p className="mt-1.5 text-xs text-zinc-500 break-words">{helperText}</p>
    )}
    {error && (
      <p
        className="mt-2 text-xs text-red-400 flex items-start gap-1.5"
        role="alert"
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span className="break-words">{error}</span>
      </p>
    )}
  </div>
);

interface TextareaProps {
  id: string;
  name: keyof ProjectFormData;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

const FormTextarea: React.FC<TextareaProps> = ({
  id,
  name,
  label,
  placeholder,
  rows = 4,
  required,
  value,
  onChange,
  error,
  helperText,
  maxLength,
}) => (
  <div className="mb-4 sm:mb-5 w-full">
    <label
      htmlFor={id}
      className="block text-zinc-100 text-[13px] font-semibold mb-2"
    >
      {label} {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <textarea
      id={id}
      name={name}
      rows={rows}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      className={`w-full px-4 py-3 rounded-md bg-[#111111] border text-zinc-100 placeholder-zinc-600 
        focus:outline-none focus:border-orange-500/50 transition-colors text-sm resize-y touch-manipulation
        ${error ? "border-red-500 focus:border-red-500/50" : "border-[#2a2a2a] hover:border-[#3a3a3a]"}`}
    />
    <div className="flex justify-between items-center mt-1.5">
      {helperText && !error && (
        <p className="text-xs text-zinc-500 break-words">{helperText}</p>
      )}
      {maxLength && (
        <p className="text-xs text-zinc-600 ml-auto">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
    {error && (
      <p
        className="mt-2 text-xs text-red-400 flex items-start gap-1.5"
        role="alert"
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span className="break-words">{error}</span>
      </p>
    )}
  </div>
);

interface SelectProps {
  id: string;
  name: keyof ProjectFormData;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}

const FormSelect: React.FC<SelectProps> = ({
  id,
  name,
  label,
  options,
  placeholder = "--Select--",
  required,
  value,
  onChange,
  error,
}) => (
  <div className="mb-4 sm:mb-5 w-full">
    <label
      htmlFor={id}
      className="block text-zinc-100 text-[13px] font-semibold mb-2"
    >
      {label} {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3 rounded-md bg-[#111111] border text-zinc-100 
          focus:outline-none focus:border-orange-500/50 transition-colors text-sm appearance-none touch-manipulation
          ${error ? "border-red-500 focus:border-red-500/50" : "border-[#2a2a2a] hover:border-[#3a3a3a]"}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
    {error && (
      <p
        className="mt-2 text-xs text-red-400 flex items-start gap-1.5"
        role="alert"
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span className="break-words">{error}</span>
      </p>
    )}
  </div>
);

const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  id?: string;
}> = ({ title, subtitle, children, icon: Icon, id }) => (
  <div
    id={id}
    className="bg-[#181818] rounded-xl border border-[#262626] p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-2xl"
  >
    <div className="mb-5 sm:mb-6 flex items-start gap-3">
      {Icon && (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
        </div>
      )}
      <div className="min-w-0">
        <h3 className="text-white text-base sm:text-lg font-serif font-medium tracking-wide uppercase break-words">
          {title}
        </h3>
        {subtitle && (
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 break-words">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {children}
  </div>
);

const SubmitButton: React.FC<{ isSubmitting: boolean; label?: string }> = ({
  isSubmitting,
  label = "Submit Project",
}) => {
  const baseStyles =
    "flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold transition-all active:scale-95 touch-manipulation min-h-[48px]";
  const variant = isSubmitting
    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
    : "bg-orange-500 hover:bg-orange-600 text-black shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20";

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`${baseStyles} ${variant} w-full sm:w-auto`}
    >
      {isSubmitting ? (
        <>
          <svg
            className="animate-spin h-5 w-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
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
          <span className="truncate">Processing...</span>
        </>
      ) : (
        <>
          <span className="truncate">{label}</span>
          <ArrowRight className="w-5 h-5 flex-shrink-0" />
        </>
      )}
    </button>
  );
};

const FileUpload: React.FC<{
  id: string;
  name: string;
  label: string;
  accept: string;
  maxSizeMB: number;
  helperText?: string;
  onFileSelect: (file: File | null) => void;
  error?: string;
  fileName: string;
}> = ({
  id,
  name,
  label,
  accept,
  maxSizeMB,
  helperText,
  onFileSelect,
  error,
  fileName,
}) => (
  <div className="mb-4 sm:mb-5 w-full">
    <label className="block text-zinc-100 text-[13px] font-semibold mb-2">
      {label}
    </label>
    <label
      htmlFor={id}
      className={`relative border-2 border-dashed rounded-xl py-8 sm:py-10 px-4 flex flex-col items-center justify-center 
        cursor-pointer transition-all text-center min-h-[140px] touch-manipulation
        ${error ? "border-red-500/50 bg-red-500/5" : "border-[#333] bg-[#111111]/50 hover:border-orange-500/40 hover:bg-[#161616]"}`}
    >
      <input
        type="file"
        id={id}
        name={name}
        accept={accept}
        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <div className="mb-3 text-zinc-500 group-hover:text-orange-500 transition-colors">
        <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <p className="text-zinc-400 text-sm font-medium mb-1 px-2">
        Click to upload or drag & drop
      </p>
      <p className="text-zinc-600 text-xs px-2 break-words">
        {accept.replace(/\./g, "").replace(/,/g, " • ").toUpperCase()} • Max{" "}
        {maxSizeMB}MB
      </p>
      {fileName && (
        <p className="mt-3 text-xs text-orange-400 font-medium break-all px-2">
          Selected: {fileName}
        </p>
      )}
      {helperText && !error && !fileName && (
        <p className="mt-3 text-xs text-zinc-500 px-2 break-words">
          {helperText}
        </p>
      )}
    </label>
    {error && (
      <p
        className="mt-2 text-xs text-red-400 flex items-start gap-1.5"
        role="alert"
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span className="break-words">{error}</span>
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────

function createInitialFormData(): ProjectFormData {
  return {
    enrolmentNumber: "",
    fullName: "",
    primaryEmail: "",
    alternativeEmail: "",
    whatsappNumber: "",
    institution: "",
    department: "",
    programme: "",
    programmeOther: "",
    isRegistered: null,
    portalName: "",
    registrationNumber: "",
    registrationDate: "",
    isPublished: null,
    publicationType: [],
    publicationTitle: "",
    publicationVenue: "",
    publicationDate: "",
    publicationLink: "",
    addressLine1: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    projectTitle: "",
    projectTheme: "",
    projectThemeOther: "",
    projectLevel: "",
    projectStartDate: "",
    projectEndDate: "",
    projectObjective: "",
    projectMethodology: "",
    projectOutcome: "",
    isThesisLinked: null,
    thesisTitle: "",
    thesisDegree: "",
    thesisSupervisor: "",
    thesisInstitution: "",
    seekingCollaborators: null,
    collaboratorTypes: [],
    collaborationTypes: [],
    collaborationOther: "",
    openToFunding: null,
    fundingSources: [],
    fundingOther: "",
    estimatedBudget: "",
    currentSupport: "",
    synopsisLink: "",
    githubLink: "",
    driveLink: "",
    demoLink: "",
    supportingFile: null,
    preferredContact: [],
    collaborationRequirements: "",
    additionalRemarks: "",
    declarationAccepted: false,
  };
}

export default function ProjectListingForm() {
  const [formData, setFormData] = useState<ProjectFormData>(
    createInitialFormData(),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error" | null
  >(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [fileName, setFileName] = useState("");

  const programmeOptions = [
    { value: "ug", label: "Undergraduate (UG)" },
    { value: "pg", label: "Postgraduate (PG)" },
    { value: "phd", label: "Research Scholar / PhD" },
    { value: "faculty", label: "Faculty" },
    { value: "other", label: "Professional / Other" },
  ];

  const themeOptions = [
    { value: "defence-space", label: "Defence Space Technology" },
    { value: "ai-ml", label: "Artificial Intelligence / Machine Learning" },
    { value: "aerospace", label: "Aerospace / Rocketry" },
    { value: "drone-uav", label: "Drone / UAV Systems" },
    {
      value: "remote-sensing",
      label: "Remote Sensing / GIS / Space Applications",
    },
    { value: "robotics", label: "Robotics / Automation" },
    { value: "satellite", label: "Satellite / CubeSat / CanSat" },
    { value: "other", label: "Others" },
  ];

  const levelOptions = [
    { value: "concept", label: "Concept / Idea stage" },
    { value: "proposal", label: "Proposal / Proposal sanctioned" },
    { value: "ongoing", label: "Ongoing / In-progress" },
    { value: "completed", label: "Completed / Demonstrated" },
  ];

  const publicationOptions = [
    { value: "paper", label: "Research paper / journal article" },
    { value: "conference", label: "Conference / seminar / exhibition" },
    { value: "hackathon", label: "Hackathon / innovation challenge" },
    {
      value: "internal",
      label: "University / institutional internal showcase",
    },
    { value: "none", label: "Not yet published / presented" },
  ];

  const collaboratorOptions = [
    { value: "students", label: "Fellow students" },
    { value: "faculty", label: "Faculty" },
    { value: "scholars", label: "Research scholars / PhD candidates" },
    { value: "institution", label: "Institution / Department" },
    {
      value: "industry",
      label: "Industry / Defence / Space-tech organisation",
    },
  ];

  const collaborationModeOptions = [
    { value: "supervision", label: "Co-supervision / Mentoring" },
    { value: "joint-design", label: "Joint design / implementation" },
    { value: "sharing", label: "Data / software / hardware sharing" },
    { value: "publication", label: "Joint publication / conference paper" },
    { value: "testing", label: "Field testing / demonstration support" },
    { value: "internship", label: "Internship / hands-on project" },
    { value: "other", label: "Other" },
  ];

  const fundingOptions = [
    { value: "internal", label: "University / Institute internal grant" },
    { value: "government", label: "Government / scheme-based funding" },
    { value: "industry", label: "Industry / corporate CSR / R&D partnership" },
    {
      value: "defence",
      label: "Defence / Space / PSUs / research organisations",
    },
    { value: "crowd", label: "Crowdfunding / student-innovation schemes" },
    { value: "other", label: "Others" },
  ];

  const contactOptions = [
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone / WhatsApp" },
  ];

  // ───────── Handlers ─────────

  const handleChange = (
    name: keyof ProjectFormData,
    value: string | boolean | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (submitStatus) {
      setSubmitStatus(null);
      setSubmitMessage("");
    }
  };

  const handleFileSelect = (file: File | null) => {
    setFormData((prev) => ({ ...prev, supportingFile: file }));
    setFileName(file?.name || "");
    if (errors.supportingFile)
      setErrors((prev) => ({ ...prev, supportingFile: undefined }));
  };

  const validateForm = (): FormErrors => {
    const e: FormErrors = {};
    if (!formData.enrolmentNumber.trim())
      e.enrolmentNumber = "Enrolment number is required";
    if (!formData.fullName.trim()) e.fullName = "Full name is required";
    if (!formData.primaryEmail.trim())
      e.primaryEmail = "Primary email is required";
    else if (!validateEmail(formData.primaryEmail))
      e.primaryEmail = "Invalid email format";
    if (formData.alternativeEmail && !validateEmail(formData.alternativeEmail))
      e.alternativeEmail = "Invalid email format";
    if (!formData.institution.trim())
      e.institution = "Institution name is required";
    if (!formData.department.trim()) e.department = "Department is required";
    if (!formData.programme) e.programme = "Please select your programme";
    if (formData.programme === "other" && !formData.programmeOther.trim())
      e.programmeOther = "Please specify";
    if (formData.isRegistered === true) {
      if (!formData.portalName.trim()) e.portalName = "Portal name is required";
      if (!formData.registrationNumber.trim())
        e.registrationNumber = "Registration number is required";
      if (!formData.registrationDate)
        e.registrationDate = "Registration date is required";
    }
    if (formData.isPublished === true) {
      if (formData.publicationType.length === 0)
        e.publicationType = "Please select at least one";
      if (!formData.publicationTitle.trim())
        e.publicationTitle = "Title is required";
      if (!formData.publicationVenue.trim())
        e.publicationVenue = "Organisation/venue is required";
      if (!formData.publicationDate) e.publicationDate = "Date is required";
      if (formData.publicationLink && !validateURL(formData.publicationLink))
        e.publicationLink = "Invalid URL";
    }
    if (!formData.addressLine1.trim())
      e.addressLine1 = "Address line is required";
    if (!formData.city.trim()) e.city = "City is required";
    if (!formData.state.trim()) e.state = "State is required";
    if (!formData.pinCode.trim()) e.pinCode = "PIN code is required";
    else if (!validatePinCode(formData.pinCode))
      e.pinCode = "Invalid 6-digit PIN";
    if (!formData.country.trim()) e.country = "Country is required";
    if (!formData.projectTitle.trim())
      e.projectTitle = "Project title is required";
    if (!formData.projectTheme) e.projectTheme = "Please select a theme";
    if (formData.projectTheme === "other" && !formData.projectThemeOther.trim())
      e.projectThemeOther = "Please specify";
    if (!formData.projectLevel) e.projectLevel = "Please select project level";
    if (!formData.projectStartDate)
      e.projectStartDate = "Start date is required";
    if (!formData.projectObjective.trim())
      e.projectObjective = "Objective is required";
    if (!formData.projectMethodology.trim())
      e.projectMethodology = "Methodology is required";
    if (!formData.projectOutcome.trim())
      e.projectOutcome = "Expected outcome is required";
    if (formData.isThesisLinked === true) {
      if (!formData.thesisTitle.trim())
        e.thesisTitle = "Thesis title is required";
      if (!formData.thesisDegree.trim())
        e.thesisDegree = "Degree programme is required";
      if (!formData.thesisSupervisor.trim())
        e.thesisSupervisor = "Supervisor name is required";
      if (!formData.thesisInstitution.trim())
        e.thesisInstitution = "Institution is required";
    }
    if (formData.seekingCollaborators === true) {
      if (formData.collaboratorTypes.length === 0)
        e.collaboratorTypes = "Please select at least one";
      if (formData.collaborationTypes.length === 0)
        e.collaborationTypes = "Please select at least one";
      if (
        formData.collaborationTypes.includes("other") &&
        !formData.collaborationOther.trim()
      )
        e.collaborationOther = "Please specify";
    }
    if (formData.openToFunding === true) {
      if (formData.fundingSources.length === 0)
        e.fundingSources = "Please select at least one";
      if (
        formData.fundingSources.includes("other") &&
        !formData.fundingOther.trim()
      )
        e.fundingOther = "Please specify";
    }
    if (formData.synopsisLink && !validateURL(formData.synopsisLink))
      e.synopsisLink = "Invalid URL";
    if (formData.githubLink && !validateURL(formData.githubLink))
      e.githubLink = "Invalid URL";
    if (formData.driveLink && !validateURL(formData.driveLink))
      e.driveLink = "Invalid URL";
    if (formData.demoLink && !validateURL(formData.demoLink))
      e.demoLink = "Invalid URL";
    if (
      formData.supportingFile &&
      formData.supportingFile.size > 10 * 1024 * 1024
    )
      e.supportingFile = "File size exceeds 10MB limit";
    if (formData.preferredContact.length === 0)
      e.preferredContact = "Please select at least one contact method";
    if (!formData.declarationAccepted)
      e.declarationAccepted = "You must accept the declaration to submit";
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitStatus("error");
      setSubmitMessage("Please fix the highlighted errors before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");
    setErrors({});
    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "supportingFile") return;
        if (Array.isArray(value))
          value.forEach((v) => formDataObj.append(key, v));
        else if (value !== null && value !== "")
          formDataObj.append(key, String(value));
      });
      if (formData.supportingFile)
        formDataObj.append("supportingDocument", formData.supportingFile);
      formDataObj.append("submissionType", "project_listing");
      formDataObj.append("timestamp", new Date().toISOString());
      const result = await submitProjectListing(formDataObj);
      setSubmitStatus("success");
      setSubmitMessage(
        result.message ||
          "Project submitted successfully! Review within 5-7 business days.",
      );
      setFormData(createInitialFormData());
      setFileName("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitStatus("error");
      setSubmitMessage(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ───────── Render ─────────

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-300 py-8 sm:py-12 md:py-16 px-4 sm:px-6 selection:bg-orange-500 selection:text-black">
      {/* Notification */}
      {submitStatus && (
        <div className="fixed left-1/2 top-4 sm:top-5 z-[80] w-[calc(100%-2rem)] sm:w-auto sm:max-w-2xl -translate-x-1/2">
          <div
            className={`rounded-xl border p-4 shadow-2xl flex items-start justify-between gap-3 sm:gap-4 ${
              submitStatus === "success"
                ? "border-[#2d3023] bg-[#111111]"
                : "border-red-900/30 bg-red-900/10"
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  submitStatus === "success"
                    ? "bg-orange-500/20"
                    : "bg-red-500/20"
                }`}
              >
                {submitStatus === "success" ? (
                  <Check
                    className="text-orange-500 w-5 h-5"
                    strokeWidth={2.5}
                  />
                ) : (
                  <AlertCircle
                    className="text-red-400 w-5 h-5"
                    strokeWidth={2.5}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`font-semibold truncate ${submitStatus === "success" ? "text-white" : "text-red-300"}`}
                >
                  {submitStatus === "success"
                    ? "Project Submitted!"
                    : "Submission Error"}
                </p>
                <p
                  className={`text-sm mt-1 break-words ${submitStatus === "success" ? "text-zinc-400" : "text-red-200"}`}
                >
                  {submitMessage}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmitStatus(null);
                setSubmitMessage("");
              }}
              className="ml-auto rounded-full p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 sm:mb-12 md:mb-16 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 mb-4">
            <span className="text-orange-500 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase whitespace-nowrap">
              Def-Space Programme
            </span>
            <div className="h-px w-12 sm:w-16 bg-orange-500 flex-shrink-0"></div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white mb-4 sm:mb-5 leading-tight break-words">
            Project Listing &{" "}
            <span className="text-orange-500">Collaboration Form</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-3xl mx-auto md:mx-0 leading-relaxed break-words">
            List your project on our official website for collaboration and
            funding opportunities.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 sm:space-y-6"
        >
          {/* Section 1 */}
          <SectionCard
            title="1. Personal and Institutional Details"
            icon={User}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                id="enrolmentNumber"
                name="enrolmentNumber"
                label="Enrolment Number"
                required
                value={formData.enrolmentNumber}
                onChange={(e) =>
                  handleChange("enrolmentNumber", e.target.value)
                }
                error={errors.enrolmentNumber}
              />
              <FormInput
                id="fullName"
                name="fullName"
                label="Full Name"
                required
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                error={errors.fullName}
              />
              <FormInput
                id="primaryEmail"
                name="primaryEmail"
                label="Email ID (Primary)"
                type="email"
                required
                value={formData.primaryEmail}
                onChange={(e) => handleChange("primaryEmail", e.target.value)}
                error={errors.primaryEmail}
              />
              <FormInput
                id="alternativeEmail"
                name="alternativeEmail"
                label="Alternative Email ID"
                required
                type="email"
                value={formData.alternativeEmail}
                onChange={(e) =>
                  handleChange("alternativeEmail", e.target.value)
                }
                error={errors.alternativeEmail}
              />
              <FormInput
                id="whatsappNumber"
                name="whatsappNumber"
                label="Mobile / WhatsApp Number (optional)"
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => handleChange("whatsappNumber", e.target.value)}
                error={errors.whatsappNumber}
               
              />
              <FormInput
                id="institution"
                name="institution"
                label="Institution / University / College"
                required
                value={formData.institution}
                onChange={(e) => handleChange("institution", e.target.value)}
                error={errors.institution}
              />
              <FormInput
                id="department"
                name="department"
                label="Department / School / Stream"
                required
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                error={errors.department}
              />
              
                <FormSelect
                  id="programme"
                  name="programme"
                  label="Programme"
                  required
                  options={programmeOptions}
                  value={formData.programme}
                  onChange={(e) =>
                    handleChange("programme", e.target.value as ProgrammeType)
                  }
                  error={errors.programme}
                />
                {formData.programme === "other" && (
                  <FormInput
                    id="programmeOther"
                    name="programmeOther"
                    label="Please specify"
                    value={formData.programmeOther}
                    onChange={(e) =>
                      handleChange("programmeOther", e.target.value)
                    }
                    error={errors.programmeOther}
                  />
                )}
              </div>
             
          </SectionCard>

          {/* Section 2 */}
          <SectionCard
            title="2. Registration, Publication, and Address Details"
            icon={Bookmark}
          >
            <div className="space-y-6">
              <div className="p-4 bg-[#111111] rounded-lg border border-[#2a2a2a]">
                <SquareRadioGroup
                  label="Is this project registered on any official portal?"
                  name="isRegistered"
                  required
                  options={[
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                  ]}
                  value={formData.isRegistered}
                  onChange={(v) => handleChange("isRegistered", v)}
                  error={errors.isRegistered}
                />
                {formData.isRegistered === true && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a2a] grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      id="portalName"
                      name="portalName"
                      label="Name of portal"
                      required
                      value={formData.portalName}
                      onChange={(e) =>
                        handleChange("portalName", e.target.value)
                      }
                      error={errors.portalName}
                    />
                    <FormInput
                      id="registrationNumber"
                      name="registrationNumber"
                      label="Registration number / reference ID"
                      required
                      value={formData.registrationNumber}
                      onChange={(e) =>
                        handleChange("registrationNumber", e.target.value)
                      }
                      error={errors.registrationNumber}
                    />
                    <FormInput
                      id="registrationDate"
                      name="registrationDate"
                      label="Date of registration"
                      type="date"
                      required
                      value={formData.registrationDate}
                      onChange={(e) =>
                        handleChange("registrationDate", e.target.value)
                      }
                      error={errors.registrationDate}
                    />
                  </div>
                )}
              </div>
              <div className="p-4 bg-[#111111] rounded-lg border border-[#2a2a2a]">
                <SquareRadioGroup
                  label="Has this project been published, presented, or showcased anywhere?"
                  name="isPublished"
                  required
                  options={[
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                  ]}
                  value={formData.isPublished}
                  onChange={(v) => handleChange("isPublished", v)}
                  error={errors.isPublished}
                />
                {formData.isPublished === true && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-4">
                    <SquareCheckboxGroup
                      label="Publication type"
                      name="publicationType"
                      options={publicationOptions}
                      selected={formData.publicationType}
                      onChange={(v) => handleChange("publicationType", v)}
                      required
                      error={errors.publicationType}
                      columns={1}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormInput
                        id="publicationTitle"
                        name="publicationTitle"
                        label="Title of paper / event"
                        required
                        value={formData.publicationTitle}
                        onChange={(e) =>
                          handleChange("publicationTitle", e.target.value)
                        }
                        error={errors.publicationTitle}
                      />
                      <FormInput
                        id="publicationVenue"
                        name="publicationVenue"
                        label="Organisation / venue"
                        required
                        value={formData.publicationVenue}
                        onChange={(e) =>
                          handleChange("publicationVenue", e.target.value)
                        }
                        error={errors.publicationVenue}
                      />
                      <FormInput
                        id="publicationDate"
                        name="publicationDate"
                        label="Date"
                        type="date"
                        required
                        value={formData.publicationDate}
                        onChange={(e) =>
                          handleChange("publicationDate", e.target.value)
                        }
                        error={errors.publicationDate}
                      />
                      <FormInput
                        id="publicationLink"
                        name="publicationLink"
                        label="Link (if any)"
                        type="url"
                        value={formData.publicationLink}
                        onChange={(e) =>
                          handleChange("publicationLink", e.target.value)
                        }
                        error={errors.publicationLink}
                       
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <h4 className="text-zinc-100 text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" /> Permanent /
                  Correspondence Address
                </h4>
                <FormTextarea
                  id="addressLine1"
                  name="addressLine1"
                  label="Plot / House No., Street / Road"
                  required
                  rows={2}
                  value={formData.addressLine1}
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                  error={errors.addressLine1}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    id="city"
                    name="city"
                    label="City / Town"
                    required
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    error={errors.city}
                  />
                  <FormInput
                    id="state"
                    name="state"
                    label="State"
                    required
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    error={errors.state}
                  />
                  <FormInput
                    id="pinCode"
                    name="pinCode"
                    label="PIN Code"
                    required
                    value={formData.pinCode}
                    onChange={(e) => handleChange("pinCode", e.target.value)}
                    error={errors.pinCode}
                  />
                  <FormInput
                    id="country"
                    name="country"
                    label="Country"
                    required
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    error={errors.country}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section 3 */}
          <SectionCard title="3. Project Basic Information" icon={FileText}>
            <div className="space-y-4">
              <FormInput
                id="projectTitle"
                name="projectTitle"
                label="Project Title"
                required
                value={formData.projectTitle}
                onChange={(e) => handleChange("projectTitle", e.target.value)}
                error={errors.projectTitle}
              />
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSelect
                  id="projectTheme"
                  name="projectTheme"
                  label="Project Theme / Domain"
                  required
                  options={themeOptions}
                  value={formData.projectTheme}
                  onChange={(e) =>
                    handleChange("projectTheme", e.target.value as ProjectTheme)
                  }
                  error={errors.projectTheme}
                />
                {formData.projectTheme === "other" && (
                  <FormInput
                    id="projectThemeOther"
                    name="projectThemeOther"
                    label="Please specify theme"
                    value={formData.projectThemeOther}
                    onChange={(e) =>
                      handleChange("projectThemeOther", e.target.value)
                    }
                    error={errors.projectThemeOther}
                  />
                )}

                 <FormSelect
                id="projectLevel"
                name="projectLevel"
                label="Level of Project"
                required
                options={levelOptions}
                value={formData.projectLevel}
                onChange={(e) =>
                  handleChange("projectLevel", e.target.value as ProjectLevel)
                }
                error={errors.projectLevel}
              />
              </div>
             
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  id="projectStartDate"
                  name="projectStartDate"
                  label="Start Date"
                  type="date"
                  required
                  value={formData.projectStartDate}
                  onChange={(e) =>
                    handleChange("projectStartDate", e.target.value)
                  }
                  error={errors.projectStartDate}
                />
                <FormInput
                  id="projectEndDate"
                  name="projectEndDate"
                  label="End Date (if applicable)"
                  type="date"
                  value={formData.projectEndDate}
                  onChange={(e) =>
                    handleChange("projectEndDate", e.target.value)
                  }
                />
              </div>
            </div>
          </SectionCard>

          {/* Section 4 */}
          <SectionCard title="4. Project Description" icon={HelpCircle}>
            <FormTextarea
              id="projectObjective"
              name="projectObjective"
              label="Objective"
              required
              rows={4}
              maxLength={500}
              value={formData.projectObjective}
              onChange={(e) => handleChange("projectObjective", e.target.value)}
              error={errors.projectObjective}
              helperText="Clearly state the primary goal (max 500 characters)"
            />
            <FormTextarea
              id="projectMethodology"
              name="projectMethodology"
              label="Methodology / Approach"
              required
              rows={4}
              maxLength={500}
              value={formData.projectMethodology}
              onChange={(e) =>
                handleChange("projectMethodology", e.target.value)
              }
              error={errors.projectMethodology}
              helperText="Tools, software, hardware, platforms (max 500 characters)"
            />
            <FormTextarea
              id="projectOutcome"
              name="projectOutcome"
              label="Expected Outcome / Impact"
              required
              rows={4}
              maxLength={500}
              value={formData.projectOutcome}
              onChange={(e) => handleChange("projectOutcome", e.target.value)}
              error={errors.projectOutcome}
              helperText="What impact do you expect? (max 500 characters)"
            />
          </SectionCard>

          {/* Section 5 */}
          <SectionCard
            title="5. Thesis / Dissertation / Academic Link"
            icon={GraduationCap}
          >
            <SquareRadioGroup
              label="Is this project linked to a thesis, dissertation, or course project?"
              name="isThesisLinked"
              required
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
              value={formData.isThesisLinked}
              onChange={(v) => handleChange("isThesisLinked", v)}
              error={errors.isThesisLinked}
            />
            {formData.isThesisLinked === true && (
              <div className="mt-4 pt-4 border-t border-[#2a2a2a] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  id="thesisTitle"
                  name="thesisTitle"
                  label="Thesis / Dissertation Title"
                  required
                  value={formData.thesisTitle}
                  onChange={(e) => handleChange("thesisTitle", e.target.value)}
                  error={errors.thesisTitle}
                />
                <FormInput
                  id="thesisDegree"
                  name="thesisDegree"
                  label="Degree Programme"
                  required
                  value={formData.thesisDegree}
                  onChange={(e) => handleChange("thesisDegree", e.target.value)}
                  error={errors.thesisDegree}
                />
                <FormInput
                  id="thesisSupervisor"
                  name="thesisSupervisor"
                  label="Supervisor / Faculty Guide Name"
                  required
                  value={formData.thesisSupervisor}
                  onChange={(e) =>
                    handleChange("thesisSupervisor", e.target.value)
                  }
                  error={errors.thesisSupervisor}
                />
                <FormInput
                  id="thesisInstitution"
                  name="thesisInstitution"
                  label="Department & Institution"
                  required
                  value={formData.thesisInstitution}
                  onChange={(e) =>
                    handleChange("thesisInstitution", e.target.value)
                  }
                  error={errors.thesisInstitution}
                />
              </div>
            )}
          </SectionCard>

          {/* Section 6 - ✅ SQUARE CHOICES WITH ICONS */}
          <SectionCard title="6. Collaboration Preferences" icon={Users}>
            <SquareRadioGroup
              label="Are you looking for collaborators for this project?"
              name="seekingCollaborators"
              required
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
              value={formData.seekingCollaborators}
              onChange={(v) => handleChange("seekingCollaborators", v)}
              error={errors.seekingCollaborators}
            />
            {formData.seekingCollaborators === true && (
              <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-6">
                <SquareCheckboxGroup
                  label="Who are you looking to collaborate with?"
                  name="collaboratorTypes"
                  options={collaboratorOptions}
                  selected={formData.collaboratorTypes}
                  onChange={(v) => handleChange("collaboratorTypes", v)}
                  required
                  error={errors.collaboratorTypes}
                  columns={2}
                />
                <SquareCheckboxGroup
                  label="Type of collaboration you are open to:"
                  name="collaborationTypes"
                  options={collaborationModeOptions}
                  selected={formData.collaborationTypes}
                  onChange={(v) => handleChange("collaborationTypes", v)}
                  required
                  error={errors.collaborationTypes}
                  columns={2}
                />
                {formData.collaborationTypes.includes("other") && (
                  <FormInput
                    id="collaborationOther"
                    name="collaborationOther"
                    label="Please specify collaboration type"
                    value={formData.collaborationOther}
                    onChange={(e) =>
                      handleChange("collaborationOther", e.target.value)
                    }
                    error={errors.collaborationOther}
                  />
                )}
              </div>
            )}
          </SectionCard>

          {/* Section 7 */}
          <SectionCard
            title="7. Funding and Institutional Support"
            icon={DollarSign}
          >
            <SquareRadioGroup
              label="Is this project open to external funding or institutional sponsorship?"
              name="openToFunding"
              required
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
              value={formData.openToFunding}
              onChange={(v) => handleChange("openToFunding", v)}
              error={errors.openToFunding}
            />
            {formData.openToFunding === true && (
              <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-4">
                <SquareCheckboxGroup
                  label="Preferred funding modes / sources:"
                  name="fundingSources"
                  options={fundingOptions}
                  selected={formData.fundingSources}
                  onChange={(v) => handleChange("fundingSources", v)}
                  required
                  error={errors.fundingSources}
                  columns={2}
                />
                {formData.fundingSources.includes("other") && (
                  <FormInput
                    id="fundingOther"
                    name="fundingOther"
                    label="Please specify funding source"
                    value={formData.fundingOther}
                    onChange={(e) =>
                      handleChange("fundingOther", e.target.value)
                    }
                    error={errors.fundingOther}
                  />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    id="estimatedBudget"
                    name="estimatedBudget"
                    label="Estimated budget requirement"
                    type="text"
                    prefix="₹"
                    value={formData.estimatedBudget}
                    onChange={(e) =>
                      handleChange("estimatedBudget", e.target.value)
                    }
                    helperText="Approximate amount"
                  />
                  <FormTextarea
                    id="currentSupport"
                    name="currentSupport"
                    label="Current support received (if any)"
                    rows={2}
                    value={formData.currentSupport}
                    onChange={(e) =>
                      handleChange("currentSupport", e.target.value)
                    }
                    helperText="Institution, department, lab, or sponsor"
                  />
                </div>
              </div>
            )}
          </SectionCard>

          {/* Section 8 */}
          <SectionCard title="8. Document and Link Details" icon={Link2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                id="synopsisLink"
                name="synopsisLink"
                label="Project Synopsis / Report / Proposal link"
                type="url"
                value={formData.synopsisLink}
                onChange={(e) => handleChange("synopsisLink", e.target.value)}
                error={errors.synopsisLink}
                helperText="https://..."
              />
              <FormInput
                id="githubLink"
                name="githubLink"
                label="GitHub / Repository / Code link"
                type="url"
                value={formData.githubLink}
                onChange={(e) => handleChange("githubLink", e.target.value)}
                error={errors.githubLink}
                helperText="https://github.com/..."
              />
              <FormInput
                id="driveLink"
                name="driveLink"
                label="Google Drive / shared folder link"
                type="url"
                value={formData.driveLink}
                onChange={(e) => handleChange("driveLink", e.target.value)}
                error={errors.driveLink}
                helperText="https://drive.google.com/..."
              />
              <FormInput
                id="demoLink"
                name="demoLink"
                label="Demo / Video / Presentation link"
                type="url"
                value={formData.demoLink}
                onChange={(e) => handleChange("demoLink", e.target.value)}
                error={errors.demoLink}
                helperText="YouTube, Vimeo, etc."
              />
            </div>
            <FileUpload
              id="supportingDocument"
              name="supportingDocument"
              label="Any other supporting document"
              accept=".pdf,.doc,.docx,.zip"
              maxSizeMB={10}
              helperText="PDF, DOC, DOCX, ZIP • Max 10MB"
              onFileSelect={handleFileSelect}
              error={errors.supportingFile}
              fileName={fileName}
            />
          </SectionCard>

          {/* Section 9 */}
          <SectionCard
            title="9. Contact and Additional Information"
            icon={Phone}
          >
            <SquareCheckboxGroup
              label="Preferred mode of contact"
              name="preferredContact"
              options={contactOptions}
              selected={formData.preferredContact}
              onChange={(v) => handleChange("preferredContact", v)}
              required
              error={errors.preferredContact}
              columns={2}
            />
            <FormTextarea
              id="collaborationRequirements"
              name="collaborationRequirements"
              label="Any specific requirement for collaboration"
              rows={3}
              value={formData.collaborationRequirements}
              onChange={(e) =>
                handleChange("collaborationRequirements", e.target.value)
              }
            />
            <FormTextarea
              id="additionalRemarks"
              name="additionalRemarks"
              label="Additional remarks (optional)"
              rows={3}
              value={formData.additionalRemarks}
              onChange={(e) =>
                handleChange("additionalRemarks", e.target.value)
              }
            />
          </SectionCard>

          {/* Section 10 - Declaration */}
          <SectionCard title="10. Declaration and Consent" icon={Shield}>
            <div className="space-y-4 text-sm text-zinc-300">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={formData.declarationAccepted}
                    onChange={(e) =>
                      handleChange("declarationAccepted", e.target.checked)
                    }
                    className="peer h-5 w-5 appearance-none rounded-md border-2 border-[#2a2a2a] bg-[#111111] 
                      checked:bg-orange-500 checked:border-orange-500 focus:outline-none focus:ring-2 
                      focus:ring-orange-500/30 transition-all duration-150 touch-manipulation"
                  />
                  <Check
                    className="absolute h-4 w-4 text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-150"
                    strokeWidth={3}
                  />
                </div>
                <span className="break-words">
                  <strong>I hereby declare that:</strong> I am the authorised
                  person to submit and publish this project on behalf of the
                  team or institution, and I have the right to share these
                  details publicly.
                </span>
              </label>
              <p className="pl-8 text-zinc-400 break-words">
                This project/concept has been developed by me or my team, and
                there is no third‑party arbitrary claim over this work.
              </p>
              <p className="pl-8 text-zinc-400 break-words">
                If any dispute, objection, or third‑party claim is found
                regarding the ownership or authenticity of this project, Bharat
                Space Education Research Centre (BSERC) reserves the right to
                remove or delete this project listing and all associated details
                from its platform without further notice.
              </p>
              <p className="pl-8 text-zinc-400 break-words">
                All the information and documents provided in this form are
                true, accurate, and correct to the best of my knowledge.
              </p>
              <p className="pl-8 text-zinc-400 break-words">
                I understand that Bharat Space Education Research Centre (BSERC)
                shall not be held liable for any consequences arising from the
                publication, use, or collaboration related to this project on
                its platform.
              </p>
            </div>
            {errors.declarationAccepted && (
              <p
                className="mt-3 text-xs text-red-400 flex items-start gap-1.5"
                role="alert"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{errors.declarationAccepted}</span>
              </p>
            )}
          </SectionCard>

          {/* Submit */}
          <div className="flex flex-col items-center gap-4 pt-4 sm:pt-6 ">
            <SubmitButton isSubmitting={isSubmitting} />
            <p className="text-xs text-zinc-500 text-center max-w-sm break-words">
              By submitting, you agree to our{" "}
              <a href="/bserc-policies/privacy-policy" className="text-orange-400 hover:underline">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="/bserc-policies/terms-and-conditions" className="text-orange-400 hover:underline">
                Terms of Service
              </a>
              .
            </p>
          </div>
        </form>

        {/* Footer Notice */}
        <div className="mt-8 sm:mt-12 bg-[#111111] border border-[#262626] rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed break-words text-center sm:text-left">
              <span className="text-zinc-300 font-semibold">
                Data Protection:
              </span>{" "}
              Your submission is encrypted and processed in compliance with
              applicable data protection regulations. Project listings are
              reviewed within 5-7 business days. For queries:{" "}
              <a
                href="mailto:projects@bserc.org"
                className="text-orange-400 hover:text-orange-300 underline underline-offset-2 break-all"
              >
                projects@bserc.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
