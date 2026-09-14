import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente con la service role key: ignora RLS y expone la API de
 * administracion de auth (listar usuarios, ver email, etc).
 *
 * SOLO debe importarse desde codigo que corre en el servidor (Server
 * Components, Server Actions, Route Handlers) y nunca en un componente con
 * "use client". No cachear ni exponer el resultado directamente al cliente.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son necesarias para el cliente admin de Supabase."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
