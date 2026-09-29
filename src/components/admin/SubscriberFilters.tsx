"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SubscriberFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const estado = searchParams.get("estado") ?? "todos";
  const plan = searchParams.get("plan") ?? "todos";

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "todos") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <section className="mb-8 flex flex-wrap items-end gap-4 rounded-lg bg-surface-container-lowest p-6 shadow-soft">
      <div className="min-w-[220px] flex-1">
        <label className="mb-2 block font-sans text-label-sm text-on-surface-variant">
          Buscar suscriptor
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            type="text"
            defaultValue={q}
            placeholder="Nombre o correo..."
            onChange={(e) => updateParams({ q: e.target.value })}
            className="w-full rounded-lg border-none bg-surface-container py-3 pl-10 pr-4 font-sans text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="min-w-[200px] flex-1">
        <label className="mb-2 block font-sans text-label-sm text-on-surface-variant">
          Filtrar por Estado
        </label>
        <select
          value={estado}
          onChange={(e) => updateParams({ estado: e.target.value })}
          className="w-full cursor-pointer rounded-lg border-none bg-surface-container p-3 font-sans text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="todos">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="paused">Pausado</option>
          <option value="cancelled">Cancelado</option>
          <option value="past_due">Pago pendiente</option>
        </select>
      </div>

      <div className="min-w-[200px] flex-1">
        <label className="mb-2 block font-sans text-label-sm text-on-surface-variant">
          Tipo de Plan
        </label>
        <select
          value={plan}
          onChange={(e) => updateParams({ plan: e.target.value })}
          className="w-full cursor-pointer rounded-lg border-none bg-surface-container p-3 font-sans text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="todos">Cualquier plan</option>
          <option value="semanal">Semanal</option>
          <option value="quincenal">Quincenal</option>
        </select>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 rounded-lg bg-secondary-container px-6 py-3 font-sans text-label-md text-on-secondary-container"
      >
        <span className="material-symbols-outlined">filter_list</span>
        Más filtros
      </button>
    </section>
  );
}
