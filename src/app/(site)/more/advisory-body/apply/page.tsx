"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Camera,
  Clock3,
  FileCheck2,
  Flag,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Target,
  User2,
} from "lucide-react";

const contributionAreas = [
  "Defence & Space Education",
  "Advanced Drone Technology",
  "Cyber Security & Artificial Intelligence in Defence",
  "UAVs, Robotics & Autonomous Systems",
  "Space Applications & Remote Sensing",
  "Rocketry & Space Technology",
  "Policy & National Technological Development",
  "Innovation, Research & Start-up Ecosystems",
];

const contributionModes = [
  "Curriculum / Programme Advisory",
  "Mentorship for Students & Faculty",
  "Review of Research Projects / Proposals",
  "Resource Person / Speaker for Workshops & Conferences",
  "Strategic Institutional Collaboration",
  "Guidance on Space-Defence Research Directions",
  "Suggest New Courses, Training Modules, or Lab Activities",
  "Support Innovation & Student Project Development",
  "Documentation / Photography of Events & Activities (if applicable)",
];

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  return "";
}

const inputClass =
  "w-full bg-[#10141c] border border-[#2a3342] rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none focus:border-orange-500/60 hover:border-[#3f4e63]";

const checkboxClass =
  "mt-1 h-4 w-4 rounded border-zinc-600 bg-[#10141c] text-orange-500 focus:ring-orange-500/50";

const radioClass =
  "h-4 w-4 border-zinc-600 bg-[#10141c] text-orange-500 focus:ring-orange-500/50";

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#262626] bg-[#181818] p-6 md:p-8 mb-6 sm:mb-8 shadow-2xl shadow-black/30">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white md:text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function AdvisoryBoardApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const getTextValue = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value.trim() : "";
    };

    const getArrayValues = (key: string) => {
      return formData
        .getAll(key)
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => Boolean(value));
    };

    const declarationAccepted = formData.get("declaration_accepted") !== null;
    const officialEmail = getTextValue("official_email").toLowerCase();
    const alternativeEmail = getTextValue("alternative_email").toLowerCase();
    const mediaSupportRaw = getTextValue("media_support").toLowerCase();

    const suggestions = [
      getTextValue("suggestion_1"),
      getTextValue("suggestion_2"),
      getTextValue("suggestion_3"),
      getTextValue("suggestion_4"),
      getTextValue("suggestion_5"),
    ].filter((value) => Boolean(value));

    const payload = {
      full_name: getTextValue("full_name"),
      designation: getTextValue("designation"),
      organization_institution: getTextValue("organization_institution"),
      department_specialisation: getTextValue("department_specialisation"),
      official_email: officialEmail,
      alternative_email: alternativeEmail,
      mobile_number: getTextValue("mobile_number"),
      location_text: getTextValue("location_text"),
      highest_qualification: getTextValue("highest_qualification"),
      qualification_year: getTextValue("qualification_year"),
      experience_years: getTextValue("experience_years"),
      key_research_areas: getTextValue("key_research_areas"),
      professional_expertise: getTextValue("professional_expertise"),
      preferred_contributions: getArrayValues("preferred_contributions"),
      preferred_contribution_other: getTextValue("preferred_contribution_other"),
      contribution_modes: getArrayValues("contribution_modes"),
      contribution_mode_other: getTextValue("contribution_mode_other"),
      monthly_hours: getTextValue("monthly_hours"),
      interaction_modes: getArrayValues("interaction_modes"),
      availability_period: getTextValue("availability_period"),
      suggestions,
      viksit_bharat_contribution: getTextValue("viksit_bharat_contribution"),
      media_support: mediaSupportRaw ? mediaSupportRaw === "yes" : null,
      media_tools: getTextValue("media_tools"),
      declaration_accepted: declarationAccepted,
    };

    if (
      !payload.full_name
      || !payload.designation
      || !payload.organization_institution
      || !payload.official_email
      || !payload.mobile_number
    ) {
      setSubmitSuccess("");
      setSubmitError(
        "Please fill all required fields: full name, designation, organisation, official email, and mobile number.",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.official_email)) {
      setSubmitSuccess("");
      setSubmitError("Please enter a valid official email address.");
      return;
    }

    if (payload.alternative_email && !emailRegex.test(payload.alternative_email)) {
      setSubmitSuccess("");
      setSubmitError("Please enter a valid alternative email address.");
      return;
    }

    if (!payload.declaration_accepted) {
      setSubmitSuccess("");
      setSubmitError("Please accept the declaration before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const response = await fetch("/api/advisory/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(
          getApiMessage(responsePayload)
          || "Unable to submit advisory application. Please try again.",
        );
      }

      setSubmitSuccess(
        getApiMessage(responsePayload)
        || "Application submitted successfully. It is now pending for admin review.",
      );
      form.reset();
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to submit advisory application. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-300 py-8 sm:py-12 md:py-16 px-4 sm:px-6 selection:bg-orange-500 selection:text-black">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-8 sm:mb-12 md:mb-16 text-center md:text-left">
          <div className="mb-4 flex items-center justify-center gap-3 sm:gap-4 md:justify-start">
            <span className="text-orange-500 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase whitespace-nowrap">
              Advisory Board Application
            </span>
            <div className="h-px w-12 sm:w-16 bg-orange-500 flex-shrink-0" />
          </div>
          <h1 className="mb-4 text-2xl font-serif font-bold text-white sm:text-3xl md:text-5xl leading-tight">
            Advisory Member <span className="text-orange-500">Application</span>
          </h1>
          <p className="max-w-3xl text-sm text-zinc-400 sm:text-base leading-relaxed">
            Submit your interest to join the BSERC Advisory Body. Your application will be stored with pending status and reviewed by the admin team.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#262626] bg-[#111111] shadow-2xl shadow-black/30">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4 sm:space-y-6 px-5 py-6 md:px-8 md:py-8"
          >
            {submitError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
                {submitSuccess}
              </div>
            )}

            <SectionCard
              title="About the Advisory Body"
              subtitle="Strategic guidance from academia, research, industry, and innovation leaders"
              icon={<Target className="h-5 w-5" />}
            >
              <p className="leading-relaxed text-zinc-300">
                The Bharat Space Education Research Centre Advisory Body
                comprises distinguished experts from academia, space research
                organisations, defence technology institutions, industry,
                startup and innovation ecosystems. Their guidance supports
                strategic growth, academic excellence, research innovation, and
                youth-centric technological development aligned with the vision
                of Viksit Bharat @2047.
              </p>
            </SectionCard>

            <SectionCard title="Section 1: Personal Details" icon={<User2 className="h-5 w-5" />}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input name="full_name" required className={inputClass} placeholder="Full Name" />
                <input name="designation" required className={inputClass} placeholder="Designation" />
                <input
                  name="organization_institution"
                  required
                  className={inputClass}
                  placeholder="Organisation / Institution"
                />
                <input
                  name="department_specialisation"
                  className={inputClass}
                  placeholder="Department / Specialisation"
                />
                <input
                  name="official_email"
                  type="email"
                  required
                  className={inputClass}
                  placeholder="Official Email"
                />
                <input
                  name="alternative_email"
                  type="email"
                  className={inputClass}
                  placeholder="Alternative Email"
                />
                <input
                  name="mobile_number"
                  required
                  className={inputClass}
                  placeholder="Mobile Number (with Country Code)"
                />
                <input
                  name="location_text"
                  className={inputClass}
                  placeholder="Present City / State / Country"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Section 2: Academic & Professional Background"
              icon={<GraduationCap className="h-5 w-5" />}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <input
                  name="highest_qualification"
                  className={inputClass}
                  placeholder="Highest Qualification"
                />
                <input
                  name="qualification_year"
                  className={inputClass}
                  placeholder="Year of Qualification"
                />
                <input
                  name="experience_years"
                  className={inputClass}
                  placeholder="Relevant Experience (in Years)"
                />
              </div>
              <textarea
                name="key_research_areas"
                rows={3}
                className={`${inputClass} mt-4`}
                placeholder="Key Research / Professional Areas"
              />
              <div className="mt-4">
                <p className="mb-2 text-sm text-zinc-300">Brief Professional Expertise (Maximum 100 Words)</p>
                <textarea
                  name="professional_expertise"
                  rows={4}
                  className={inputClass}
                  placeholder="Please briefly describe your expertise in defence-space technologies, drones, rocketry, UAVs, artificial intelligence, cybersecurity, remote sensing, innovation, or related domains."
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Section 3: Areas of Interest for Bharat Space Education Research Centre Advisory Role"
              icon={<Target className="h-5 w-5" />}
            >
              <div>
                <p className="mb-3 font-medium text-zinc-200">Preferred Areas of Contribution</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {contributionAreas.map((item) => (
                    <label key={item} className="flex items-start gap-3 text-zinc-200">
                      <input
                        name="preferred_contributions"
                        value={item}
                        type="checkbox"
                        className={checkboxClass}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                  <div className="flex items-center gap-3 md:col-span-2">
                    <input
                      name="preferred_contributions"
                      value="Others"
                      type="checkbox"
                      className={checkboxClass}
                    />
                    <input
                      name="preferred_contribution_other"
                      className={inputClass}
                      placeholder="Others (Specify)"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 font-medium text-zinc-200">How Would You Like to Contribute?</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {contributionModes.map((item) => (
                    <label key={item} className="flex items-start gap-3 text-zinc-200">
                      <input
                        name="contribution_modes"
                        value={item}
                        type="checkbox"
                        className={checkboxClass}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                  <div className="flex items-center gap-3 md:col-span-2">
                    <input
                      name="contribution_modes"
                      value="Other"
                      type="checkbox"
                      className={checkboxClass}
                    />
                    <input
                      name="contribution_mode_other"
                      className={inputClass}
                      placeholder="Other (Specify)"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Section 4: Availability & Commitment"
              icon={<Clock3 className="h-5 w-5" />}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  name="monthly_hours"
                  className={inputClass}
                  placeholder="Average Time You Can Devote Per Month (in Hours)"
                />
                <input
                  name="availability_period"
                  className={inputClass}
                  placeholder="Availability Period (Start - End)"
                />
              </div>
              <div className="mt-4 space-y-2">
                <p className="font-medium text-zinc-200">Preferred Mode of Interaction</p>
                <label className="flex items-center gap-3 text-zinc-200">
                  <input
                    name="interaction_modes"
                    value="Online (Virtual Meetings / Webinars)"
                    type="checkbox"
                    className={checkboxClass}
                  />
                  <span>Online (Virtual Meetings / Webinars)</span>
                </label>
                <label className="flex items-center gap-3 text-zinc-200">
                  <input
                    name="interaction_modes"
                    value="Hybrid (Online + Occasional In-Person Interaction)"
                    type="checkbox"
                    className={checkboxClass}
                  />
                  <span>Hybrid (Online + Occasional In-Person Interaction)</span>
                </label>
              </div>
            </SectionCard>

            <SectionCard
              title="Section 5: Suggestions for Strengthening Space-Defence Education"
              subtitle="Provide 3-5 practical suggestions (2-3 lines each)"
              icon={<Lightbulb className="h-5 w-5" />}
            >
              <p className="mb-3 text-sm text-zinc-300">
                Kindly provide 3-5 practical suggestions on how BSERC can
                strengthen defence-space education, innovation, and research
                initiatives.
              </p>
              <div className="space-y-3">
                <textarea name="suggestion_1" rows={3} className={inputClass} placeholder="Suggestion 1" />
                <textarea name="suggestion_2" rows={3} className={inputClass} placeholder="Suggestion 2" />
                <textarea name="suggestion_3" rows={3} className={inputClass} placeholder="Suggestion 3" />
                <textarea name="suggestion_4" rows={3} className={inputClass} placeholder="Suggestion 4 (Optional)" />
                <textarea name="suggestion_5" rows={3} className={inputClass} placeholder="Suggestion 5 (Optional)" />
              </div>
            </SectionCard>

            <SectionCard
              title="Section 6: Contribution Towards Viksit Bharat @2047"
              icon={<Flag className="h-5 w-5" />}
            >
              <textarea
                name="viksit_bharat_contribution"
                rows={5}
                className={inputClass}
                placeholder="In 100-150 words, describe how your expertise, experience, and vision can contribute towards Viksit Bharat @2047 and support BSERC's youth-centric defence-space initiatives."
              />
            </SectionCard>

            <SectionCard
              title="Section 7: Media, Outreach & Documentation"
              icon={<Camera className="h-5 w-5" />}
            >
              <div className="space-y-2 text-zinc-200">
                <p>
                  Are you willing to participate in and support documentation,
                  photography, or videography of BSERC activities?
                </p>
                <label className="flex items-center gap-3">
                  <input type="radio" name="media_support" value="yes" className={radioClass} />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="media_support" value="no" className={radioClass} />
                  <span>No</span>
                </label>
              </div>
              <textarea
                name="media_tools"
                rows={3}
                className={`${inputClass} mt-4`}
                placeholder="If yes, mention tools/software/platforms you are comfortable using (DSLR, smartphone photography, Canva, Adobe tools, video editing software, etc.)"
              />
            </SectionCard>

            <SectionCard title="Section 8: Declaration" icon={<FileCheck2 className="h-5 w-5" />}>
              <p className="leading-relaxed text-zinc-300">
                I hereby declare that the information provided above is true and
                correct to the best of my knowledge. I express my willingness to
                serve as an Advisory Member of the Bharat Space Education
                Research Centre and contribute towards its mission in
                defence-space education, research, innovation, skill
                development, outreach, and national technological advancement.
              </p>
              <p className="mt-3 font-medium text-orange-300">
                Advancing Defence, Space, Innovation & Research for Viksit Bharat @2047.
              </p>
              <label className="mt-4 flex items-start gap-3 text-zinc-200">
                <input
                  name="declaration_accepted"
                  value="true"
                  type="checkbox"
                  className={`${checkboxClass} mt-1`}
                />
                <span>I agree to the declaration above.</span>
              </label>
            </SectionCard>

            <div className="flex justify-center rounded-2xl p-4 md:p-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full max-w-xs rounded-full bg-orange-500 px-6 py-3 font-semibold text-black shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-400 disabled:bg-zinc-700 disabled:text-zinc-300 sm:w-auto"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
