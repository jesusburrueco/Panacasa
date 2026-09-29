// Tipos generados a partir de supabase/migrations/*.sql
// Reemplazar por la salida real de `supabase gen types typescript` una vez
// que el proyecto Supabase este provisionado y las migraciones aplicadas.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      delivery_zones: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          postal_codes: string[];
          delivery_days: string[];
          is_active: boolean;
          center_lat: number | null;
          center_lng: number | null;
          radius_meters: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          postal_codes?: string[];
          delivery_days?: string[];
          is_active?: boolean;
          center_lat?: number | null;
          center_lng?: number | null;
          radius_meters?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          postal_codes?: string[];
          delivery_days?: string[];
          is_active?: boolean;
          center_lat?: number | null;
          center_lng?: number | null;
          radius_meters?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      pickup_points: {
        Row: {
          id: string;
          name: string;
          address: string;
          lat: number;
          lng: number;
          zone_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          lat: number;
          lng: number;
          zone_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          lat?: number;
          lng?: number;
          zone_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pickup_points_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          delivery_zone_id: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          delivery_zone_id?: string | null;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          delivery_zone_id?: string | null;
          role?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_delivery_zone_id_fkey";
            columns: ["delivery_zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          ingredients: string | null;
          nutritional_info: Json | null;
          category: string | null;
          tags: string[];
          price_cents: number;
          image_url: string | null;
          detail_image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          ingredients?: string | null;
          nutritional_info?: Json | null;
          category?: string | null;
          tags?: string[];
          price_cents: number;
          image_url?: string | null;
          detail_image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          ingredients?: string | null;
          nutritional_info?: Json | null;
          category?: string | null;
          tags?: string[];
          price_cents?: number;
          image_url?: string | null;
          detail_image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          max_breads: number;
          delivery_frequency: string;
          price_cents: number;
          stripe_price_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          max_breads: number;
          delivery_frequency: string;
          price_cents: number;
          stripe_price_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          max_breads?: number;
          delivery_frequency?: string;
          price_cents?: number;
          stripe_price_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          stripe_subscription_id: string | null;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_items: {
        Row: {
          id: string;
          subscription_id: string;
          product_id: string;
          quantity: number;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          product_id: string;
          quantity?: number;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          product_id?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_items_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      deliveries: {
        Row: {
          id: string;
          subscription_id: string;
          delivery_zone_id: string;
          scheduled_date: string;
          status: string;
          notes: string | null;
          route_id: string | null;
          address_detail: string | null;
          portal: string | null;
          floor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          delivery_zone_id: string;
          scheduled_date: string;
          status?: string;
          notes?: string | null;
          route_id?: string | null;
          address_detail?: string | null;
          portal?: string | null;
          floor?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          delivery_zone_id?: string;
          scheduled_date?: string;
          status?: string;
          notes?: string | null;
          route_id?: string | null;
          address_detail?: string | null;
          portal?: string | null;
          floor?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deliveries_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliveries_delivery_zone_id_fkey";
            columns: ["delivery_zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliveries_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "delivery_routes";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_workers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      delivery_routes: {
        Row: {
          id: string;
          name: string;
          worker_id: string | null;
          zone_id: string | null;
          delivery_date: string;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          worker_id?: string | null;
          zone_id?: string | null;
          delivery_date: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          worker_id?: string | null;
          zone_id?: string | null;
          delivery_date?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_routes_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "delivery_workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_routes_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Helpers de conveniencia para consumir el esquema sin repetir la ruta completa.
// Uso: type Product = Tables<'products'>; type NewProduct = TablesInsert<'products'>;
type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
