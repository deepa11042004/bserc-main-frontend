export type FeaturedWorkshopSection = {
  id: number;
  title: string;
  description: string | null;
  background_url: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type FeaturedWorkshopCard = {
  id: number;
  title: string;
  image_url: string | null;
  position: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};
