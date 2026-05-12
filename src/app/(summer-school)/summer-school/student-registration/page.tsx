"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import FormResponseOverlay from "@/components/ui/FormResponseOverlay";

interface EngagementPlan {
  titleEn: string;
  titleHi: string;
  benefit: string;
  name: string;
}

interface InputFieldProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  name?: string;
  min?: string | number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  name?: string;
  options: string[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  infoText?: string;
  helperText?: string;
}

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: RazorpayFailureResponse) => void,
  ) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

type CreateSummerSchoolOrderResponse = {
  requires_payment: boolean;
  already_registered?: boolean;
  key_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  registration_fee?: number;
  message?: string;
};

type SummerSchoolSettingsResponse = {
  indian_fee_amount?: number;
  ews_fee_amount?: number;
  other_fee_amount?: number;
  batch_options?: string[];
  message?: string;
  error?: string;
};

const DEFAULT_BATCH_OPTIONS = [
  "Batch 1: 15th May - 30th June",
  "Batch 2: 19th June - 30th July",
];
const EWS_CATEGORY_VALUE = "EWS(Economically weaker section)";

function getRazorpayConstructor(): RazorpayConstructor | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
}

function createInitialFormData() {
  return {
    fullName: "",
    dob: "",
    email: "",
    category: "",
    altEmail: "",
    grade: "",
    school: "",
    board: "",
    nationality: "",
    gender: "",
    guardianName: "",
    relationship: "",
    guardianEmail: "",
    guardianPhone: "",
    altPhone: "",
    batch: "",
    experience: "",
  };
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  const razorpayConstructor = getRazorpayConstructor();

  if (razorpayConstructor) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const typedPayload = payload as { message?: unknown; error?: unknown };
  if (typeof typedPayload.message === "string" && typedPayload.message.trim()) {
    return typedPayload.message.trim();
  }

  if (typeof typedPayload.error === "string" && typedPayload.error.trim()) {
    return typedPayload.error.trim();
  }

  return "";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isRetryableVerificationError(error: unknown): boolean {
  const message =
    error instanceof Error && error.message
      ? error.message.toLowerCase()
      : "";

  return (
    message.includes("payment is not successful yet")
    || message.includes("unable to validate payment with razorpay")
  );
}

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-[#181818] rounded-xl border border-[#262626] p-6 mb-8 shadow-2xl">
    <h3 className="text-white text-lg font-serif font-medium tracking-wide border-b border-[#2a2a2a] pb-4 mb-8 uppercase">
      {title}
    </h3>
    {children}
  </div>
);

const FormLabel = ({
  label,
  required,
  infoText,
}: {
  label: string;
  required?: boolean;
  infoText?: string;
}) => (
  <label className="block text-zinc-100 text-[13px] font-semibold mb-2.5">
    <span className="inline-flex items-center gap-2">
      <span>
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {infoText && (
        <span className="relative inline-flex items-center group">
          <button
            type="button"
            aria-label={`${label} information`}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-500 text-[10px] leading-none text-zinc-200 transition-colors hover:border-orange-500 hover:text-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
          >
            i
          </button>
          <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 rounded-md border border-zinc-700 bg-[#0f0f0f] px-3 py-2 text-xs font-normal leading-relaxed text-zinc-300 shadow-xl group-hover:block group-focus-within:block">
            {infoText}
          </span>
        </span>
      )}
    </span>
  </label>
);

const InputField: React.FC<InputFieldProps> = ({
  label,
  required,
  placeholder,
  type = "text",
  name,
  min,
  value,
  onChange,
}) => (
  <div className="mb-6 w-full">
    <FormLabel label={label} required={required} />
    <input
      type={type}
      name={name}
      value={value}
      placeholder={placeholder}
      min={min}
      onChange={onChange}
      className="w-full px-4 py-3 rounded-md bg-[#111111] border border-[#2a2a2a] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
    />
  </div>
);

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  required,
  name,
  options,
  value,
  onChange,
  placeholder = "--Select--",
  infoText,
  helperText,
}) => (
  <div className="w-full mb-6">
    <FormLabel label={label} required={required} infoText={infoText} />
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-md bg-[#111111] border border-[#2a2a2a] text-zinc-100 text-sm focus:outline-none appearance-none focus:border-orange-500/50 transition-colors"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
    {helperText && (
      <p className="mt-1.5 text-[11px] font-normal leading-relaxed text-zinc-400">
        {helperText}
      </p>
    )}
  </div>
);

export default function Page() {
  const [guidelinesAccepted, setGuidelinesAccepted] = useState<boolean>(false);
  const [conductAccepted, setConductAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [showPaymentIncompletePrompt, setShowPaymentIncompletePrompt] =
    useState<boolean>(false);
  const [retryPaymentAction, setRetryPaymentAction] =
    useState<null | (() => void)>(null);
  const [batchOptions, setBatchOptions] = useState<string[]>(DEFAULT_BATCH_OPTIONS);
  
  // Form state
  const [formData, setFormData] = useState(createInitialFormData());

  const isFormReady = guidelinesAccepted && conductAccepted;
  
  const plans: EngagementPlan[] = [
    {
      name: "bundle5",
      titleEn: "Intensive 5-Session Bundle ",
      titleHi: "5-सत्र बंडल",
      benefit: "Bulk discount applicable",
    },
    {
      name: "plan10",
      titleEn: "Comprehensive 10-Session Plan ",
      titleHi: "10-सत्र योजना",
      benefit: "20% savings on per-session rate",
    },
    {
      name: "extended",
      titleEn: "Extended Mentorship Program ",
      titleHi: "विस्तारित कार्यक्रम",
      benefit: "Ongoing support & guidance",
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSuccessfulRegistration = (message: string) => {
    setSubmitMessage(message);
    setFormData(createInitialFormData());
    setGuidelinesAccepted(false);
    setConductAccepted(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadRegistrationSettings = async () => {
      try {
        const response = await fetch(
          "/api/summer-school/student-registration/settings",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const payload =
          (await response.json().catch(() => ({}))) as SummerSchoolSettingsResponse;

        if (!response.ok || !isMounted) {
          return;
        }

        const dynamicBatchOptions = Array.isArray(payload.batch_options)
          ? payload.batch_options
              .map((option) => option.trim())
              .filter(Boolean)
          : [];

        if (dynamicBatchOptions.length === 0) {
          return;
        }

        setBatchOptions(dynamicBatchOptions);
        setFormData((prev) =>
          prev.batch && !dynamicBatchOptions.includes(prev.batch)
            ? { ...prev, batch: "" }
            : prev,
        );
      } catch {
        // Keep defaults if settings endpoint is unavailable.
      }
    };

    void loadRegistrationSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isFormReady || isSubmitting) {
      return;
    }

    const requiredFields: Array<[keyof typeof formData, string]> = [
      ["fullName", "Full Name"],
      ["dob", "Date of Birth"],
      ["email", "Email Address"],
      ["category", "Category"],
      ["altEmail", "Alternative Email Address"],
      ["grade", "Current Class / Grade"],
      ["school", "School / Institution Name"],
      ["board", "Board of Education"],
      ["nationality", "Nationality"],
      ["guardianName", "Parent / Guardian Full Name"],
      ["relationship", "Relationship with Student"],
      ["guardianEmail", "Parent / Guardian Email Address"],
      ["guardianPhone", "Parent / Guardian Mobile Number"],
      ["batch", "Batch"],
    ];

    const missingField = requiredFields.find(([key]) => !formData[key].trim());
    if (missingField) {
      setSubmitMessage("");
      setSubmitError(`${missingField[1]} is required.`);
      return;
    }

    setSubmitError("");
    setSubmitMessage("");
    setShowPaymentIncompletePrompt(false);
    setRetryPaymentAction(null);
    setIsSubmitting(true);

    const registrationPayload = {
      fullName: formData.fullName,
      dob: formData.dob,
      email: formData.email,
      category: formData.category,
      alternativeEmail: formData.altEmail,
      grade: formData.grade,
      school: formData.school,
      board: formData.board,
      nationality: formData.nationality,
      gender: formData.gender,
      guardianName: formData.guardianName,
      relationship: formData.relationship,
      guardianEmail: formData.guardianEmail,
      guardianPhone: formData.guardianPhone,
      altPhone: formData.altPhone,
      batch: formData.batch,
      experience: formData.experience,
      guidelinesAccepted,
      conductAccepted,
    };

    try {
      const createOrderResponse = await fetch(
        "/api/summer-school/student-registration/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            nationality: formData.nationality,
            category: formData.category,
          }),
        },
      );

      const createOrderPayload = (await createOrderResponse
        .json()
        .catch(() => ({}))) as CreateSummerSchoolOrderResponse & {
        error?: string;
      };

      if (!createOrderResponse.ok) {
        throw new Error(
          getApiMessage(createOrderPayload)
            || "Unable to initialize payment for student registration.",
        );
      }

      if (createOrderPayload.already_registered) {
        setSubmitMessage(
          createOrderPayload.message
            || "Email already registered for summer school.",
        );
        setIsSubmitting(false);
        return;
      }

      if (!createOrderPayload.requires_payment) {
        const response = await fetch("/api/summer-school/student-registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registrationPayload),
        });

        const responsePayload = await response.json().catch(() => ({}));
        const responseMessage = getApiMessage(responsePayload);

        if (!response.ok) {
          throw new Error(
            responseMessage || "Unable to submit student registration.",
          );
        }

        handleSuccessfulRegistration(
          responseMessage || "Application submitted successfully!",
        );
        setIsSubmitting(false);
        return;
      }

      if (
        !createOrderPayload.key_id
        || !createOrderPayload.order_id
        || !createOrderPayload.amount
        || !createOrderPayload.currency
      ) {
        throw new Error(
          createOrderPayload.message
            || "Payment initialization failed. Please try again.",
        );
      }

      const resolvedRegistrationFee =
        createOrderPayload.registration_fee !== undefined
          ? Number(createOrderPayload.registration_fee)
          : Number(createOrderPayload.amount) / 100;

      let hasFinalPaymentOutcome = false;
      let hasPendingPaymentAttemptLogged = false;
      let hasFinalPaymentAttemptLogged = false;
      let hasVerificationStarted = false;

      const logPaymentAttempt = async (
        paymentStatus: "failed" | "pending",
        options?: {
          razorpayOrderId?: string;
          razorpayPaymentId?: string;
          paymentMode?: string;
        },
      ) => {
        if (paymentStatus === "pending" && hasPendingPaymentAttemptLogged) {
          return;
        }

        if (paymentStatus === "failed" && hasFinalPaymentAttemptLogged) {
          return;
        }

        if (paymentStatus === "pending") {
          hasPendingPaymentAttemptLogged = true;
        } else {
          hasFinalPaymentAttemptLogged = true;
        }

        try {
          const response = await fetch(
            "/api/summer-school/student-registration/log-payment-attempt",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...registrationPayload,
                payment_status: paymentStatus,
                payment_amount: resolvedRegistrationFee,
                payment_currency: createOrderPayload.currency,
                razorpay_order_id:
                  options?.razorpayOrderId || createOrderPayload.order_id,
                razorpay_payment_id: options?.razorpayPaymentId || "",
                payment_mode:
                  options?.paymentMode
                  || "gateway_failed",
              }),
            },
          );

          if (!response.ok) {
            if (paymentStatus === "pending") {
              hasPendingPaymentAttemptLogged = false;
            } else {
              hasFinalPaymentAttemptLogged = false;
            }
          }
        } catch {
          if (paymentStatus === "pending") {
            hasPendingPaymentAttemptLogged = false;
          } else {
            hasFinalPaymentAttemptLogged = false;
          }
          // Do not block UX if payment-attempt logging fails.
        }
      };

      const loaded = await loadRazorpayScript();
      const razorpayConstructor = getRazorpayConstructor();

      if (!loaded || !razorpayConstructor) {
        throw new Error("Unable to load Razorpay checkout. Please try again.");
      }

      await logPaymentAttempt("pending", {
        razorpayOrderId: createOrderPayload.order_id,
        paymentMode: "order_created",
      });

      const amountDisplayCurrency =
        createOrderPayload.currency === "USD" ? "$" : "₹";
      const amountDisplay =
        createOrderPayload.registration_fee !== undefined
          ? `${amountDisplayCurrency}${createOrderPayload.registration_fee}`
          : `${amountDisplayCurrency}${(
              createOrderPayload.amount / 100
            ).toFixed(2)}`;

      const razorpay = new razorpayConstructor({
        key: createOrderPayload.key_id,
        amount: createOrderPayload.amount,
        currency: createOrderPayload.currency,
        name: "BSERC",
        description: `Summer School Student Registration (${amountDisplay})`,
        order_id: createOrderPayload.order_id,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.guardianPhone,
        },
        theme: {
          color: "#f97316",
        },
        handler: async (paymentResponse) => {
          hasFinalPaymentOutcome = true;
          hasVerificationStarted = true;

          try {
            const verifyPayload = {
              ...registrationPayload,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            };

            let verifyMessage = "";
            let lastError: unknown = null;

            for (let attempt = 1; attempt <= 3; attempt += 1) {
              try {
                const verifyResponse = await fetch(
                  "/api/summer-school/student-registration/verify-payment",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(verifyPayload),
                  },
                );

                const verifyResponsePayload = await verifyResponse
                  .json()
                  .catch(() => ({}));

                verifyMessage = getApiMessage(verifyResponsePayload);

                if (!verifyResponse.ok) {
                  throw new Error(
                    verifyMessage || "Unable to complete student registration.",
                  );
                }

                lastError = null;
                break;
              } catch (error) {
                lastError = error;

                if (!isRetryableVerificationError(error) || attempt === 3) {
                  break;
                }

                await wait(1500);
              }
            }

            if (lastError) {
              await logPaymentAttempt("failed", {
                razorpayOrderId:
                  paymentResponse.razorpay_order_id || createOrderPayload.order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                paymentMode: "verification_failed",
              });

              throw lastError;
            }

            handleSuccessfulRegistration(
              verifyMessage
                || "Payment successful and student registration completed.",
            );
          } catch (error) {
            setSubmitError(
              error instanceof Error && error.message
                ? error.message
                : "Unable to complete student registration.",
            );
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            if (!hasFinalPaymentOutcome && !hasVerificationStarted) {
              void logPaymentAttempt("failed", {
                razorpayOrderId: createOrderPayload.order_id,
                paymentMode: "gateway_dismissed",
              });

              setRetryPaymentAction(() => () => {
                setShowPaymentIncompletePrompt(false);
                setSubmitError("");
                setSubmitMessage("");
                setIsSubmitting(true);
                razorpay.open();
              });
              setShowPaymentIncompletePrompt(true);
            }

            setIsSubmitting(false);
          },
        },
      });

      razorpay.on("payment.failed", (paymentFailure) => {
        if (hasVerificationStarted || hasFinalPaymentOutcome) {
          return;
        }

        hasFinalPaymentOutcome = true;

        void logPaymentAttempt("failed", {
          razorpayOrderId:
            paymentFailure.error?.metadata?.order_id
            || createOrderPayload.order_id,
          razorpayPaymentId: paymentFailure.error?.metadata?.payment_id || "",
          paymentMode: paymentFailure.error?.reason || "gateway_failed",
        });

        setSubmitError(
          paymentFailure.error?.description || "Payment failed. Please try again.",
        );
        setIsSubmitting(false);
      });

      razorpay.open();
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to submit student registration.",
      );
      setIsSubmitting(false);
    }
  };

  const gradeOptions = ["Class VI", "Class VII", "Class VIII", "Class IX", "Class X", "Class XI", "Class XII"];
  const boardOptions = ["CBSE", "ICSE", "State Board", "International", "Other"];
  const nationalityOptions = ["Indian", "Other"];
  const categoryOptions = ["General Category", EWS_CATEGORY_VALUE];
  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
  const relationshipOptions = ["Father", "Mother", "Guardian", "Other"];

  const activeResponse = submitError
    ? { type: "error" as const, message: submitError }
    : submitMessage
      ? { type: "success" as const, message: submitMessage }
      : null;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-300 py-16 px-4 selection:bg-orange-500 selection:text-black">
      <FormResponseOverlay
        visible={Boolean(activeResponse)}
        type={activeResponse?.type ?? "info"}
        message={activeResponse?.message ?? ""}
        onClose={() => {
          setSubmitError("");
          setSubmitMessage("");
        }}
      />

      {showPaymentIncompletePrompt && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />

          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg rounded-xl border border-amber-400/60 bg-amber-500/10 px-5 py-4 shadow-2xl"
          >
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/90">
                Payment Incomplete
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-100">
                Payment does not complete. Would you like to retry payment?
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (retryPaymentAction) {
                    retryPaymentAction();
                  }
                }}
                className="rounded-md border border-orange-400/50 bg-orange-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-orange-200 transition hover:bg-orange-500/30"
              >
                Repayment
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentIncompletePrompt(false);
                  setRetryPaymentAction(null);
                  setIsSubmitting(false);
                  setSubmitError("");
                  setSubmitMessage("");
                  setFormData(createInitialFormData());
                  setGuidelinesAccepted(false);
                  setConductAccepted(false);
                }}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-12 md:mb-16">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-orange-500 text-xs font-bold tracking-[0.2em] uppercase">
                STUDENT PORTAL
              </span>
              <div className="h-px w-16 bg-orange-500/40"></div>
            </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight mb-4">
              

              DEF-SPACE SUMMER
            <br />
            SCHOOL APPLICATION FORM
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Register for Def-Space Summer School 2026. Fill in your details
              accurately. Fields marked * are required.
            </p>
          </div>

          <SectionCard title="Complete Your Registration / अपनी पंजीकरण पूरी करें">
            {/* Registration Guidelines Box */}
            <div className="bg-[#111111] border border-[#2d3023] rounded-3xl p-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-300 flex items-center justify-center">
                  <Check className="text-orange-500 w-6 h-6" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    Enroll in the{" "}
                    <span className="text-orange-500 font-bold">
                      Def-Space Summer School 2026
                    </span>{" "}
                    — a comprehensive 6-week online programme designed for
                    passionate learners ready to explore careers in space,
                    defence, and advanced technology.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="1. PERSONAL INFORMATION / व्यक्तिगत जानकारी">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InputField
                label="Full Name / पूरा नाम"
                placeholder="Dr./Prof./Your Name"
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
              />
              <InputField
                label="Email Address / ईमेल पता"
                placeholder="yourname@domain.com"
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
              <InputField
                label="Date of Birth / जन्म दिनांक"
                type="date"
                required
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
              />
              <SelectField
                label="Category"
                required
                name="category"
                options={categoryOptions}
                value={formData.category}
                onChange={handleInputChange}
                placeholder="--Select Category--"
                infoText="Economically Weaker Section candidates (whose family annual income is less than ₹7 lakh) can apply under the Weaker Section. The registration fee for this category is ₹750."
                helperText="EWS (family income below ₹7 lakh): Registration fee ₹750"
              />
              <InputField
                label="Alternative Email Address / वैकल्पिक ईमेल पता"
                placeholder="alternate@domain.com"
                required
                type="email"
                name="altEmail"
                value={formData.altEmail}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField
                label={`Current Class / Grade (2026-27) / वर्तमान कक्षा / ग्रेड (2026-27)`}
                required
                name="grade"
                options={gradeOptions}
                value={formData.grade}
                onChange={handleInputChange}
                placeholder="--Select Grade--"
              />

              <InputField
                label="School / Institution Name / स्कूल / संस्थान का नाम"
                placeholder="Enter School/Institution Name"
                required
                name="school"
                value={formData.school}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SelectField
                label="Board of Education"
                required
                name="board"
                options={boardOptions}
                value={formData.board}
                onChange={handleInputChange}
                placeholder="--Select Board--"
              />

              <SelectField
                label="Nationality"
                required
                name="nationality"
                options={nationalityOptions}
                value={formData.nationality}
                onChange={handleInputChange}
                placeholder="--Select Nationality--"
              />

              <SelectField
                label="Gender (Optional)"
                name="gender"
                options={genderOptions}
                value={formData.gender}
                onChange={handleInputChange}
                placeholder="--Select Gender--"
              />
            </div>
          </SectionCard>

          <SectionCard title="2. Parent / Guardian Details">
            <InputField
              label="Parent / Guardian Full Name"
              placeholder="Enter parent/guardian name"
              required
              name="guardianName"
              value={formData.guardianName}
              onChange={handleInputChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <SelectField
                label="Relationship with Student"
                required
                name="relationship"
                options={relationshipOptions}
                value={formData.relationship}
                onChange={handleInputChange}
                placeholder="--Select Relationship--"
              />

              <InputField
                label="Parent / Guardian Email Address"
                placeholder="guardian@example.com"
                required
                type="email"
                name="guardianEmail"
                value={formData.guardianEmail}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InputField
                label="Parent / Guardian Mobile Number"
                placeholder="Enter parent or guardian mobile number"
                type="tel"
                required
                name="guardianPhone"
                value={formData.guardianPhone}
                onChange={handleInputChange}
              />
              <InputField
                label="Alternative Contact Number (Optional)"
                placeholder="Enter alternative contact number"
                type="tel"
                name="altPhone"
                value={formData.altPhone}
                onChange={handleInputChange}
              />
            </div>
          </SectionCard>

          <SectionCard title="3. Programme Selection">
            <SelectField
              label="Batch"
              required
              name="batch"
              options={batchOptions}
              value={formData.batch}
              onChange={handleInputChange}
              placeholder="--Select Batch--"
            />
          </SectionCard>

          <SectionCard title="4. Additional Information">
            <div className="mb-2">
              <FormLabel label="Any prior experience in STEM or specific expectations from the programme? (Optional)" />
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 rounded-md bg-[#111111] border border-[#2a2a2a] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                placeholder="Share your STEM experience and expectations..."
              />
            </div>
            <div className="text-sm text-gray-500 text-right">
              {formData.experience.length}/500 characters
            </div>
          </SectionCard>

          <SectionCard title="5. Declaration">
            {/* Guidelines Acceptance */}
            <div className="bg-[#111111] border border-[#262620] rounded-2xl p-6 mb-6">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div className="relative flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={guidelinesAccepted}
                    onChange={() => setGuidelinesAccepted(!guidelinesAccepted)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-zinc-600 bg-transparent checked:bg-orange-500 checked:border-orange-500 transition-all"
                  />
                  <Check
                    className="absolute h-4 w-4 text-black opacity-0 peer-checked:opacity-100 pointer-events-none left-[2px] top-[2px]"
                    strokeWidth={4}
                  />
                </div>
                <span className="text-zinc-100 text-sm font-medium">
                  I have read and agree to the programme guidelines
                </span>
              </label>
            </div>

            {/* Code of Conduct Box */}
            <div className="bg-[#111111] border border-[#262620] rounded-2xl p-6 mb-10">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div className="relative flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={conductAccepted}
                    onChange={() => setConductAccepted(!conductAccepted)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-zinc-600 bg-transparent checked:bg-orange-500 checked:border-orange-500 transition-all"
                  />
                  <Check
                    className="absolute h-4 w-4 text-black opacity-0 peer-checked:opacity-100 pointer-events-none left-[2px] top-[2px]"
                    strokeWidth={4}
                  />
                </div>
                <div className="text-zinc-100 text-sm leading-relaxed">
                  <p className="text-gray-400">
                    I confirm that all the information provided above is true and
                    correct. I agree to abide by the rules and guidelines of the
                    Def-Space Summer School Programme 2026 organized by Bharat
                    Space Education Research Centre (BSERC). I consent to receive
                    programme-related communications via email and phone.
                  </p>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col items-center">
              <div className="w-full h-px bg-zinc-800/50 mb-12"></div>
              <button
                type="submit"
                disabled={!isFormReady || isSubmitting}
                className={`
                  flex items-center gap-2 px-10 py-4 rounded-full font-bold transition-all active:scale-95
                  ${
                    isFormReady && !isSubmitting
                      ? "bg-orange-500 hover:bg-orange-600 text-black shadow-lg shadow-[#ccf15a]/10"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }
                `}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </SectionCard>
        </form>
      </main>
    </div>
  );
}