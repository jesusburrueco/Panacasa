import Image from "next/image";
import Link from "next/link";
import { RegistroForm } from "./RegistroForm";

const promoImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDyk_YzYjHCyBWCoYQ1w_YyOljQhXhMP6YrdoNyvagdDG4r_Vv-r6xx2WWhNsW-_3vQeCm8HyvBGT3C6V8cO7uXM781Lu3fzKlFe_y1BSYaQ89JF1-yqoXs9BzPYOlZznwWzWPxktfN5LVw-Wg9mikBTqE_wcv2RJS_6zm68WXW6G1vdYI9tmK6c7HGEtYJGusjv-KC14ezeWTzMVekSWEhcT3kKC5kpfKADWQAl2cKlnX3Z1IdELX4";

export default function RegistroPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-margin-mobile py-16 md:px-margin-desktop">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-xl bg-surface-container-lowest shadow-soft-lg md:grid-cols-2">
        {/* Formulario */}
        <section className="flex flex-col justify-center p-8 md:p-16">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="space-y-2 text-center md:text-left">
              <h1 className="font-serif text-headline-md text-primary">
                Crea tu cuenta
              </h1>
              <p className="font-sans text-body-md text-on-surface-variant">
                Empieza tu ritual de sabor hoy.
              </p>
            </div>

            <RegistroForm />

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-outline-variant" />
              <span className="font-sans text-label-sm uppercase tracking-widest text-outline">
                o continúa con
              </span>
              <div className="h-px flex-1 bg-outline-variant" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-3 rounded-DEFAULT border-2 border-outline-variant py-3.5 font-sans text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low active:scale-[0.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-3 rounded-DEFAULT border-2 border-outline-variant py-3.5 font-sans text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low active:scale-[0.98]"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  apps
                </span>
                Apple
              </button>
            </div>

            <p className="text-center font-sans text-body-md text-on-surface-variant">
              ¿Ya tengo cuenta?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Iniciar Sesión
              </Link>
            </p>

            <p className="text-center font-sans text-label-sm text-outline-variant/80">
              Al registrarte, aceptas nuestros Términos de Servicio y Política
              de Privacidad.
            </p>
          </div>
        </section>

        {/* Panel promocional */}
        <section className="relative hidden overflow-hidden border-l border-outline-variant md:block">
          <Image
            src={promoImage}
            alt="Pan de masa madre artesanal recien horneado"
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end gap-6 p-12">
            <div className="space-y-3">
              <h2 className="font-serif text-headline-md text-white">
                Bienvenido de nuevo
              </h2>
              <p className="font-sans text-body-md text-white/80">
                El aroma del pan recién horneado te espera.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-fit items-center justify-center rounded-full border-2 border-white px-8 py-3.5 font-sans text-label-md text-white transition-all hover:bg-white hover:text-primary"
            >
              Iniciar sesión
            </Link>
            <p className="font-sans text-label-md italic text-white/70">
              Hecho a mano, entregado fresco.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
