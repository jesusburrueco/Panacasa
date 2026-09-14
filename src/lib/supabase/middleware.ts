import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

// /catalogo y /plan son publicos: se pueden ver y configurar sin sesion,
// solo el paso de checkout (/pedido) y el perfil exigen login.
const PROTECTED_ROUTE_PREFIXES = ["/pedido", "/perfil"];
const ADMIN_ROUTE_PREFIX = "/admin";
const AUTH_ROUTES = ["/login", "/registro"];

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

let warnedMissingEnv = false;

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin proyecto Supabase configurado (aun no hay .env.local con credenciales
  // reales) dejamos pasar la request sin proteger rutas, en vez de tumbar
  // toda la app. En produccion estas variables siempre deben estar definidas.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!warnedMissingEnv) {
      console.warn(
        "[proxy] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY no estan definidas: la proteccion de rutas esta desactivada."
      );
      warnedMissingEnv = true;
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAdminRoute =
    pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(`${ADMIN_ROUTE_PREFIX}/`);
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Rutas protegidas sin sesion: mandar a login conservando a donde iba.
  if (!user && (isProtectedRoute || isAdminRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return redirectWithCookies(loginUrl, response);
  }

  // Ya autenticado: no tiene sentido volver a mostrar login/registro.
  if (user && isAuthRoute) {
    return redirectWithCookies(new URL("/catalogo", request.url), response);
  }

  // Panel de administracion: exige ademas rol admin en profiles.
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return redirectWithCookies(new URL("/catalogo", request.url), response);
    }
  }

  return response;
}
