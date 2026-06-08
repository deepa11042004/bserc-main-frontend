export interface ProjectListing {
  id: number;
  enrolment_number: string;
  full_name: string;
  primary_email: string;
  alternative_email?: string | null;
  whatsapp_number?: string | null;
  institution: string;
  department: string;
  programme: string;
  programme_other?: string | null;

  is_registered?: boolean | null;
  portal_name?: string | null;
  registration_number?: string | null;
  registration_date?: string | null;

  is_published?: boolean | null;
  publication_type?: string[];
  publication_title?: string | null;
  publication_venue?: string | null;
  publication_date?: string | null;
  publication_link?: string | null;

  address_line1: string;
  city: string;
  state: string;
  pin_code: string;
  country: string;

  project_title: string;
  project_theme: string;
  project_theme_other?: string | null;
  project_level: string;
  project_start_date: string;
  project_end_date?: string | null;

  project_objective: string;
  project_methodology: string;
  project_outcome: string;

  is_thesis_linked?: boolean | null;
  thesis_title?: string | null;
  thesis_degree?: string | null;
  thesis_supervisor?: string | null;
  thesis_institution?: string | null;

  seeking_collaborators?: boolean | null;
  collaborator_types?: string[];
  collaboration_types?: string[];
  collaboration_other?: string | null;

  open_to_funding?: boolean | null;
  funding_sources?: string[];
  funding_other?: string | null;
  estimated_budget?: string | null;
  current_support?: string | null;

  synopsis_link?: string | null;
  github_link?: string | null;
  drive_link?: string | null;
  demo_link?: string | null;
  supporting_doc_path?: string | null;
  supporting_doc_mime_type?: string | null;
  supporting_doc_file_name?: string | null;

  preferred_contact?: string[];
  collaboration_requirements?: string | null;
  additional_remarks?: string | null;

  declaration_accepted: boolean;
  submission_type: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectListingListResponse {
  data: ProjectListing[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectListingDetailResponse {
  data: ProjectListing;
}
