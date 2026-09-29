"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";
import type { AlbaranSummary } from "@/lib/logistics/types";
import { AlbaranTab } from "./AlbaranTab";
import { RepartidoresTab } from "./RepartidoresTab";
import { RutasTab } from "./RutasTab";
import type { RouteWithJoins } from "./types";

type DeliveryZone = Tables<"delivery_zones">;
type DeliveryWorker = Tables<"delivery_workers">;

type Tab = "albaranes" | "repartidores" | "rutas";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "albaranes", label: "Albaranes del día", icon: "receipt_long" },
  { id: "repartidores", label: "Repartidores", icon: "badge" },
  { id: "rutas", label: "Rutas", icon: "route" },
];

export function LogisticaManager({
  date,
  zones,
  workers,
  routes,
  albaran,
}: {
  date: string;
  zones: DeliveryZone[];
  workers: DeliveryWorker[];
  routes: RouteWithJoins[];
  albaran: AlbaranSummary;
}) {
  const [tab, setTab] = useState<Tab>("albaranes");

  return (
    <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-display-lg-mobile text-primary md:text-display-lg">
            Logística y beneficios
          </h1>
          <p className="mt-1 font-sans text-body-md text-on-surface-variant">
            Genera albaranes, gestiona repartidores y organiza las rutas de reparto.
          </p>
        </div>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto rounded-full bg-surface-container-high p-1 sm:inline-flex sm:w-auto">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 font-sans text-label-md transition-colors",
              tab === item.id
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-variant"
            )}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {tab === "albaranes" && <AlbaranTab date={date} albaran={albaran} routes={routes} />}
      {tab === "repartidores" && <RepartidoresTab workers={workers} />}
      {tab === "rutas" && <RutasTab date={date} routes={routes} zones={zones} workers={workers} />}
    </main>
  );
}
