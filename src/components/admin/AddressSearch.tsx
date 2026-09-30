"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface AddressResult {
  lat: number;
  lng: number;
  /** Direccion completa devuelta por Nominatim. */
  label: string;
  /** Nombre corto del lugar (primer tramo de la direccion). */
  name: string;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
}

// Sesgo hacia Madrid sin limitar la busqueda (bounded=0).
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const MADRID_VIEWBOX = "-4.05,40.65,-3.35,40.20";

/**
 * Buscador de direcciones con Nominatim (OpenStreetMap, sin API key). Busca
 * solo al enviar (Enter o boton), no en cada tecla, para respetar la politica
 * de uso de Nominatim (max. 1 peticion/segundo).
 */
export function AddressSearch({
  onSelect,
  className,
}: {
  onSelect: (result: AddressResult) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressResult[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const abortRef = useRef<AbortController | null>(null);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 3) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");

    const params = new URLSearchParams({
      q,
      format: "json",
      limit: "6",
      countrycodes: "es",
      "accept-language": "es",
      viewbox: MADRID_VIEWBOX,
      bounded: "0",
    });

    try {
      const response = await fetch(`${NOMINATIM_URL}?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Nominatim ${response.status}`);
      const data: NominatimResult[] = await response.json();
      setResults(
        data.map((item) => ({
          lat: Number(item.lat),
          lng: Number(item.lon),
          label: item.display_name,
          name: item.name || item.display_name.split(",")[0].trim(),
        }))
      );
      setStatus("idle");
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      console.error("[AddressSearch]", error);
      setResults(null);
      setStatus("error");
    }
  }

  function choose(result: AddressResult) {
    setResults(null);
    setQuery(result.name);
    onSelect(result);
  }

  return (
    <div className={cn("relative", className)}>
      <form
        onSubmit={search}
        role="search"
        className="flex items-center gap-2 rounded-full bg-surface p-1.5 pl-4 shadow-soft-lg"
      >
        <span className="material-symbols-outlined text-outline">search</span>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) setResults(null);
          }}
          onKeyDown={(e) => e.key === "Escape" && setResults(null)}
          placeholder="Buscar dirección o urbanización…"
          aria-label="Buscar dirección"
          className="min-w-0 flex-1 border-none bg-transparent p-1 font-sans text-body-md text-on-surface focus:outline-none focus:ring-0"
        />
        <button
          type="submit"
          disabled={status === "loading" || query.trim().length < 3}
          className="rounded-full bg-primary px-4 py-2 font-sans text-label-md text-on-primary transition-all hover:brightness-110 disabled:opacity-50"
        >
          {status === "loading" ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {(results || status === "error") && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto rounded-lg bg-surface shadow-soft-lg">
          {status === "error" ? (
            <p className="p-4 font-sans text-label-md text-error">
              No se pudo buscar la dirección. Inténtalo de nuevo en unos segundos.
            </p>
          ) : results && results.length === 0 ? (
            <p className="p-4 font-sans text-label-md text-on-surface-variant">
              Sin resultados. Prueba con calle y municipio, p. ej. &quot;Calle General Ricardos,
              Madrid&quot;.
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant/40">
              {results?.map((result) => (
                <li key={`${result.lat},${result.lng},${result.label}`}>
                  <button
                    type="button"
                    onClick={() => choose(result)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      location_on
                    </span>
                    <span>
                      <span className="block font-sans text-label-md text-on-surface">
                        {result.name}
                      </span>
                      <span className="line-clamp-2 font-sans text-label-sm text-on-surface-variant">
                        {result.label}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-outline-variant/40 px-4 py-2 text-right font-sans text-[11px] text-outline">
            Datos © OpenStreetMap
          </p>
        </div>
      )}
    </div>
  );
}
