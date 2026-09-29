import type { Tables } from "@/lib/supabase/types";

export type RouteWithJoins = Tables<"delivery_routes"> & {
  delivery_workers: { name: string; phone: string | null; email: string | null } | null;
  delivery_zones: { name: string } | null;
};
