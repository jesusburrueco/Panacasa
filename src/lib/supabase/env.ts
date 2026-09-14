// Valores de respaldo para cuando el proyecto Supabase todavia no esta
// configurado (sin .env.local). Usar el puerto local por defecto de
// `supabase start` hace que las llamadas fallen rapido (conexion rechazada)
// en vez de colgarse resolviendo un dominio inventado, y ademas significa
// que si el usuario levanta Supabase local, la app empieza a funcionar sin
// tocar nada mas.
//
// Con esto la CREACION del cliente nunca lanza un error de forma sincrona;
// las queries fallan de forma controlada devolviendo { data: null, error },
// que es como el resto del codigo ya maneja los errores de Supabase.
const FALLBACK_SUPABASE_URL = "http://127.0.0.1:54321";
const FALLBACK_SUPABASE_ANON_KEY = "public-anon-key-not-configured";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;
