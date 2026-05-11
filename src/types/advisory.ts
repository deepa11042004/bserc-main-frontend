export type AdvisoryStatus = "pending" | "active" | string;

export interface AdvisoryProfile {
  id: number;
  full_name: string;
  designation: string;
  organization_institution: string;
  department_specialisation: string | null;
  official_email: string;
  alternative_email: string | null;
  mobile_number: string;
  location_text: string | null;
  highest_qualification: string | null;
  qualification_year: string | null;
  experience_years: number | null;
  key_research_areas: string | null;
  professional_expertise: string | null;
  preferred_contributions: string[];
  preferred_contribution_other: string | null;
  contribution_modes: string[];
  contribution_mode_other: string | null;
  monthly_hours: number | null;
  interaction_modes: string[];
  availability_period: string | null;
  suggestions: string[];
  viksit_bharat_contribution: string | null;
  media_support: boolean | null;
  media_tools: string | null;
  declaration_accepted: boolean;
  status: AdvisoryStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdvisoryCollectionResponse {
  advisories?: AdvisoryProfile[];
  message?: string;
  error?: string;
}
