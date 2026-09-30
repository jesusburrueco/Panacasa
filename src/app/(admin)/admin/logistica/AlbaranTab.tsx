"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK } from "@/lib/constants";
import {
  addDaysIso,
  formatDateEs,
  weekdayNameEs,
  type AlbaranSummary,
  type WeeklyDaySummary,
} from "@/lib/logistics/types";
import { buildRouteMessage, buildWhatsAppLink } from "@/lib/logistics/whatsapp";
import {
  downloadAlbaranExcelAction,
  sendAlbaranEmailAction,
} from "@/lib/supabase/logistics-actions";
import type { RouteWithJoins } from "./types";

function downloadBase64File(base64: string, filename: string) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Fecha del mismo lunes-domingo que `dateIso` que cae en `day`. */
function dateForWeekdayInWeek(dateIso: string, day: string): string {
  const mondayBased = (iso: string) => DAYS_OF_WEEK.findIndex((d) => d.value === weekdayNameEs(iso));
  const target = DAYS_OF_WEEK.findIndex((d) => d.value === day);
  return addDaysIso(dateIso, target - mondayBased(dateIso));
}

function dayLabel(day: string) {
  return DAYS_OF_WEEK.find((d) => d.value === day)?.label ?? day;
}

export function AlbaranTab({
  date,
  albaran,
  weekly,
  routes,
}: {
  date: string;
  albaran: AlbaranSummary;
  weekly: WeeklyDaySummary[];
  routes: RouteWithJoins[];
}) {
  const router = useRouter();
  const [isNavigating, startNavigating] = useTransition();
  const [isDownloading, startDownloading] = useTransition();
  const [isEmailing, startEmailing] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const hasData = albaran.zones.length > 0;
  const dateEs = formatDateEs(date);
  const weekdayLabel = dayLabel(albaran.weekday);
  const weeklyMax = Math.max(1, ...weekly.map((d) => d.totalBarras));
  const weeklyTotal = weekly.reduce((sum, d) => sum + d.totalBarras, 0);

  function goToDate(newDate: string) {
    if (!newDate) return;
    setMessage(null);
    startNavigating(() => router.push(`/admin/logistica?fecha=${newDate}`));
  }

  function handleDownload() {
    setMessage(null);
    startDownloading(async () => {
      const result = await downloadAlbaranExcelAction(date);
      if (result.error || !result.base64 || !result.filename) {
        setMessage({ kind: "error", text: result.error ?? "No se pudo generar el Excel." });
        return;
      }
      downloadBase64File(result.base64, result.filename);
    });
  }

  function handleSendEmail() {
    setMessage(null);
    startEmailing(async () => {
      const result = await sendAlbaranEmailAction(date);
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      const parts: string[] = [];
      if (result.sentTo.length > 0) parts.push(`Enviado a: ${result.sentTo.join(", ")}.`);
      if (result.skipped.length > 0) parts.push(`No enviado a: ${result.skipped.join(", ")}.`);
      setMessage({
        kind: result.skipped.length > 0 && result.sentTo.length === 0 ? "error" : "success",
        text: parts.join(" ") || "No había repartidores a los que enviar el albarán.",
      });
    });
  }

  // Un boton de WhatsApp por ruta (repartidor + zona) que tenga telefono y
  // entregas ese dia. El mensaje se construye con los datos recien calculados.
  const whatsappRoutes = routes.flatMap((route) => {
    const worker = route.delivery_workers;
    const zone = albaran.zones.find((z) => z.zoneId === route.zone_id);
    if (!worker?.phone || !zone) return [];
    const text = buildRouteMessage({ dateEs, workerName: worker.name, zone });
    return [{ id: route.id, workerName: worker.name, zoneName: zone.zoneName, link: buildWhatsAppLink(worker.phone, text) }];
  });

  return (
    <div className="space-y-8">
      {/* Resumen semanal */}
      <section className="rounded-lg bg-surface-container-lowest p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-serif text-headline-sm text-primary">Resumen semanal</h3>
          <p className="font-sans text-label-sm text-on-surface-variant">
            {weeklyTotal} barras/semana con las suscripciones activas · pulsa un día para ver su
            albarán
          </p>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekly.map((day) => {
            const selected = day.day === albaran.weekday;
            return (
              <button
                key={day.day}
                type="button"
                onClick={() => goToDate(dateForWeekdayInWeek(date, day.day))}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-DEFAULT px-1 py-3 transition-all",
                  selected
                    ? "bg-primary text-on-primary shadow-soft"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
                )}
              >
                <span className="font-sans text-label-sm">
                  <span className="sm:hidden">{dayLabel(day.day).slice(0, 3)}</span>
                  <span className="hidden sm:inline">{dayLabel(day.day)}</span>
                </span>
                <span className="flex h-16 w-3 items-end overflow-hidden rounded-full bg-black/5">
                  <span
                    className={cn("w-full rounded-full", selected ? "bg-on-primary" : "bg-tertiary")}
                    style={{ height: `${(day.totalBarras / weeklyMax) * 100}%` }}
                  />
                </span>
                <span className="font-serif text-headline-sm leading-none">{day.totalBarras}</span>
                <span className={cn("font-sans text-[11px]", selected ? "opacity-80" : "text-on-surface-variant")}>
                  {day.totalClientes} cli.
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Barra de controles */}
      <div className="flex flex-col gap-4 rounded-lg bg-surface-container-lowest p-6 shadow-soft lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="font-sans text-label-md text-on-surface-variant">Fecha de reparto</span>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToDate(addDaysIso(date, -1))}
              aria-label="Día anterior"
              className="rounded-full p-2 text-primary transition-colors hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => goToDate(e.target.value)}
              className="block rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => goToDate(addDaysIso(date, 1))}
              aria-label="Día siguiente"
              className="rounded-full p-2 text-primary transition-colors hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <p className="mt-2 font-sans text-label-sm text-on-surface-variant">
            {isNavigating
              ? "Calculando…"
              : `${weekdayLabel}: clientes activos con entrega los ${weekdayLabel.toLowerCase()}.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => startNavigating(() => router.refresh())}
            disabled={isNavigating}
            className="flex items-center gap-2 rounded-full border border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            Recalcular
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || !hasData}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-sans text-label-md text-on-primary shadow-md transition-all hover:scale-105 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            {isDownloading ? "Generando Excel..." : "Descargar Excel"}
          </button>
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={isEmailing || !hasData}
            className="flex items-center gap-2 rounded-full border border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">mail</span>
            {isEmailing ? "Enviando..." : "Enviar por email"}
          </button>
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={cn(
            "rounded-lg px-4 py-3 font-sans text-label-md",
            message.kind === "success"
              ? "bg-green-500/10 text-green-800"
              : "bg-error-container text-on-error-container"
          )}
        >
          {message.text}
        </p>
      )}

      {/* WhatsApp por repartidor */}
      {hasData && (
        <div className="rounded-lg bg-surface-container-lowest p-6 shadow-soft">
          <h3 className="mb-4 font-serif text-headline-sm text-primary">Enviar WhatsApp</h3>
          {whatsappRoutes.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {whatsappRoutes.map((route) => (
                <a
                  key={route.id}
                  href={route.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 font-sans text-label-md text-white shadow-md transition-all hover:scale-105"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  {route.workerName} — {route.zoneName}
                </a>
              ))}
            </div>
          ) : (
            <p className="font-sans text-body-md text-on-surface-variant">
              No hay repartidores con teléfono asignados a las zonas de este día. Asígnalos en la
              pestaña <strong>Rutas</strong> para enviarles el resumen.
            </p>
          )}
        </div>
      )}

      {/* Albaran */}
      <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-soft">
        <div className="bg-primary px-6 py-5 text-center">
          <h2 className="font-serif text-headline-md text-on-primary">
            ALBARÁN DE PRODUCCIÓN Y REPARTO
          </h2>
          <p className="font-sans text-body-md text-on-primary/80">
            PANACASA — {weekdayLabel} {dateEs}
          </p>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-outline">inventory_2</span>
            <p className="font-sans text-body-md text-on-surface-variant">
              Ningún cliente activo tiene entrega los {weekdayLabel.toLowerCase()}.
            </p>
            <p className="font-sans text-label-sm text-on-surface-variant">
              El albarán se calcula en tiempo real a partir de las suscripciones activas y los
              días de entrega de cada cliente.
            </p>
          </div>
        ) : (
          <div className="space-y-8 p-6">
            <section>
              <h3 className="mb-3 font-serif text-headline-sm text-primary">Resumen de producción</h3>
              <div className="mb-4 flex flex-wrap gap-6">
                <p className="font-sans text-body-lg text-on-surface">
                  Barras a hornear: <strong>{albaran.totalBarras}</strong>
                </p>
                <p className="font-sans text-body-lg text-on-surface">
                  Clientes con entrega: <strong>{albaran.totalClientes}</strong>
                </p>
              </div>
              <div className="overflow-hidden rounded-lg border border-outline-variant">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-high">
                      <th className="px-4 py-2 font-sans text-label-md text-on-surface-variant">
                        Tipo de pan
                      </th>
                      <th className="px-4 py-2 text-right font-sans text-label-md text-on-surface-variant">
                        Cantidad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {albaran.breakdownByProduct.map((item) => (
                      <tr key={item.productName}>
                        <td className="px-4 py-2 font-sans text-body-md">{item.productName}</td>
                        <td className="px-4 py-2 text-right font-sans text-body-md">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {albaran.zones.map((zone) => (
              <section key={zone.zoneId}>
                <div className="mb-3 flex flex-col gap-1 rounded-lg bg-primary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="font-serif text-headline-sm text-on-primary">
                    Zona {zone.zoneName} — {zone.totalBarras} barras
                  </h4>
                  <p className="font-sans text-label-sm text-on-primary/80">
                    {zone.totalClientes} {zone.totalClientes === 1 ? "cliente" : "clientes"} ·{" "}
                    {zone.routes.length > 0
                      ? `Repartidor: ${zone.routes.map((r) => r.workerName).join(", ")}`
                      : "Sin repartidor asignado"}
                  </p>
                </div>
                <div className="overflow-x-auto rounded-lg border border-outline-variant">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-container-high">
                        {["Dirección", "Cliente", "Cantidad", "Tipo de pan", "Total dirección"].map(
                          (label) => (
                            <th
                              key={label}
                              className="px-4 py-2 font-sans text-label-md text-on-surface-variant"
                            >
                              {label}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    {zone.addresses.map((group) => {
                      const rows = group.customers.flatMap((customer) =>
                        (customer.items.length > 0
                          ? customer.items
                          : [{ productName: "—", quantity: 0 }]
                        ).map((item, index) => ({ customer, item, firstOfCustomer: index === 0 }))
                      );
                      return (
                        <tbody
                          key={group.address}
                          className="border-t-2 border-outline-variant [&>tr+tr]:border-t [&>tr+tr]:border-outline-variant/40"
                        >
                          {rows.map(({ customer, item, firstOfCustomer }, index) => (
                            <tr key={`${customer.subscriptionId}-${item.productName}-${index}`}>
                              {index === 0 && (
                                <td
                                  rowSpan={rows.length}
                                  className="max-w-[240px] bg-surface-container-low px-4 py-2 align-top font-sans text-label-md text-on-surface"
                                >
                                  {group.address}
                                </td>
                              )}
                              <td className="px-4 py-2 font-sans text-body-md">
                                {firstOfCustomer ? customer.customerName : ""}
                              </td>
                              <td className="px-4 py-2 font-sans text-body-md">{item.quantity}</td>
                              <td className="px-4 py-2 font-sans text-body-md">{item.productName}</td>
                              {index === 0 && (
                                <td
                                  rowSpan={rows.length}
                                  className="bg-surface-container-low px-4 py-2 align-top font-serif text-headline-sm text-primary"
                                >
                                  {group.totalBarras}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      );
                    })}
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
