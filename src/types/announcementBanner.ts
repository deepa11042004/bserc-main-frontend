export type AnnouncementSection = "summer-internship" | "summer-school";

export type AnnouncementBanner = {
  id: number;
  section: AnnouncementSection;
  title: string;
  link: string;
  is_active: boolean;
  position: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};
