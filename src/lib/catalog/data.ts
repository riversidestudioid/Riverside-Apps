import type { Plan } from "@/lib/supabase/database";
export type CategoryOption = { slug: string; name: string; icon: string };
export const allCategory: CategoryOption = {
  slug: "semua",
  name: "Semua",
  icon: "grid",
};
export type AppProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  icon: string;
  status: "published";
  isVisible: true;
  featured: boolean;
  createdAt: string;
  demoUrl: string | null;
  launchUrl: string | null;
  thumbnailId: string | null;
  iconId: string | null;
  plans: Plan[];
};
