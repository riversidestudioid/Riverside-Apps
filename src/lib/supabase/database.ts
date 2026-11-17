export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Profile = {
  id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};
export type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};
export type Application = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  short_description: string;
  description: string;
  category_id: string | null;
  platform: "web" | "desktop" | "mobile";
  status: "draft" | "published" | "archived";
  is_visible: boolean;
  is_featured: boolean;
  featured_order: number;
  demo_url: string | null;
  launch_url: string | null;
  created_at: string;
  updated_at: string;
  revision: number;
  key_features: string[];
};
export type Plan = {
  id: string;
  app_id: string;
  name: string;
  billing_type: "free" | "one_time" | "monthly" | "yearly";
  price_idr: number | null;
  currency: string;
  license_policy: string;
  features: string[];
  is_active: boolean;
};
export type Media = {
  id: string;
  app_id: string;
  kind: "icon" | "thumbnail" | "screenshot" | "video" | "youtube";
  storage_path: string | null;
  youtube_id: string | null;
  alt_text: string;
  sort_order: number;
};
type Table<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: { id: string; full_name?: string };
        Update: { full_name?: string };
        Relationships: [];
      };
      categories: Table<Category>;
      site_settings: Table<{
        id: string;
        key: string;
        value: string;
        updated_at: string;
        updated_by: string | null;
      }>;
      apps: Table<Application>;
      plans: Table<Plan>;
      app_media: Table<Media>;
      admin_members: Table<{ user_id: string; created_at: string }>;
      audit_logs: Table<{
        id: string;
        actor_id: string | null;
        action: string;
        entity_type: string;
        entity_id: string;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      catalog_apps: {
        Args: {
          p_query?: string;
          p_category?: string;
          p_billing?: string;
          p_sort?: string;
          p_page?: number;
          p_page_size?: number;
          p_featured?: boolean;
        };
        Returns: Json;
      };
      save_site_settings: { Args: { payload: Json }; Returns: undefined };
      save_catalog_media: { Args: { payload: Json }; Returns: string };
      save_catalog_app: { Args: { payload: Json }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
