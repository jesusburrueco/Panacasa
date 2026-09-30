"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type CoverageResult =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "covered"; zoneName: string }
  | { status: "not-covered" }
  | { status: "error" };

export function DeliveryChecker({ className }: { className?: string }) {
  const [postalCode, setPostalCode] = useState("");
  const [result, setResult] = useState<CoverageResult>({ status: "idle" });

  async function handleCheck(event: React.FormEvent) {
    event.preventDefault();
    const code = postalCode.trim();
    if (!code) return;

    setResult({ status: "checking" });

    const supabase = createClient();
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("name")
      .eq("is_active", true)
      .contains("postal_codes", [code])
      .limit(1)
      .maybeSingle();

    if (error) {
      setResult({ status: "error" });
      return;
    }

    if (data) {
      setResult({ status: "covered", zoneName: data.name });
    } else {
      setResult({ status: "not-covered" });
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-outline-variant/30 bg-surface-container p-6 shadow-soft md:p-8",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <span className="material-symbols-outlined">location_on</span>
        </div>
        <div>
          <h3 className="font-serif text-headline-sm text-primary">¿Llegamos a tu zona?</h3>
          <p className="font-sans text-body-md text-on-surface-variant">
            Comprueba si repartimos en tu código postal.
          </p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          inputMode="numeric"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="Ej. 28004"
          aria-label="Código postal"
          className="flex-1 rounded-full border border-outline-variant bg-surface px-6 py-3 font-sans text-body-md text-on-surface shadow-inset focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={result.status === "checking" || !postalCode.trim()}
          className="rounded-full bg-primary px-8 py-3 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {result.status === "checking" ? "Comprobando..." : "Comprobar"}
        </button>
      </form>

      {result.status === "covered" && (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-lg border border-green-600/30 bg-green-600/10 p-4"
        >
          <span className="material-symbols-outlined text-green-700">check_circle</span>
          <p className="font-sans text-body-md text-green-800">
            ¡Buenas noticias! Repartimos a domicilio en <strong>{result.zoneName}</strong> todos
            los días. Tú eliges qué días recibir tu pan.
          </p>
        </div>
      )}

      {result.status === "not-covered" && (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container-high p-4"
        >
          <span className="material-symbols-outlined text-tertiary">info</span>
          <p className="font-sans text-body-md text-on-surface-variant">
            Todavía no llegamos a esa zona, pero estamos ampliando nuestra cobertura. ¡Vuelve a
            comprobarlo pronto!
          </p>
        </div>
      )}

      {result.status === "error" && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-lg border border-error/30 bg-error-container p-4"
        >
          <span className="material-symbols-outlined text-on-error-container">error</span>
          <p className="font-sans text-body-md text-on-error-container">
            No se pudo comprobar la cobertura. Inténtalo de nuevo.
          </p>
        </div>
      )}
    </div>
  );
}
