export type FooterNewsUpdate = {
  id: number;
  title: string;
  link: string;
  is_active: boolean;
  position: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};
