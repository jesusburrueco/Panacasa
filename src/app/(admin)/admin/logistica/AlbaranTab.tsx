"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { AlbaranDeliveryRow, AlbaranSummary } from "@/lib/logistics/types";
import { formatDateEs, groupDeliveriesByPortal } from "@/lib/logistics/types";
import { buildRouteMessage, buildWhatsAppLink } from "@/lib/logistics/whatsapp";
import {
  downloadAlbaranExcelAction,
  generateAlbaranAction,
  sendAlbaranEmailAction,
  updateDeliveryDetailAction,
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

export function AlbaranTab({
  date,
  albaran,
  routes,
}: {
  date: string;
  albaran: AlbaranSummary;
  routes: RouteWithJoins[];
}) {
  const router = useRouter();
  const [isGenerating, startGenerating] = useTransition();
  const [isDownloading, startDownloading] = useTransition();
  const [isEmailing, startEmailing] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<AlbaranDeliveryRow | null>(null);

  const hasData = albaran.zones.length > 0;
  const dateEs = formatDateEs(date);

  function handleDateChange(newDate: string) {
    router.push(`/admin/logistica?fecha=${newDate}`);
  }

  function handleGenerate() {
    setMessage(null);
    startGenerating(async () => {
      const result = await generateAlbaranAction(date);
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
      } else {
        router.refresh();
      }
    });
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

  const workerRoutes = routes.filter(
    (route) => route.zone_id && route.delivery_workers?.phone
  );

  return (
    <div className="space-y-8">
      {/* Barra de controles */}
      <div className="flex flex-col gap-4 rounded-lg bg-surface-container-lowest p-6 shadow-soft sm:flex-row sm:items-end sm:justify-between">
        <label className="block">
          <span className="font-sans text-label-md text-on-surface-variant">Fecha de reparto</span>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="mt-1 block rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-sans text-label-md text-on-primary shadow-md transition-all hover:scale-105 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            {isGenerating ? "Generando..." : "Generar albarán"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || !hasData}
            className="flex items-center gap-2 rounded-full border border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant disabled:opacity-50"
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
      {workerRoutes.length > 0 && (
        <div className="rounded-lg bg-surface-container-lowest p-6 shadow-soft">
          <h3 className="mb-4 font-serif text-headline-sm text-primary">Enviar por WhatsApp</h3>
          <div className="flex flex-wrap gap-3">
            {workerRoutes.map((route) => {
              const zone = albaran.zones.find((z) => z.zoneId === route.zone_id);
              if (!zone) return null;
              const message = buildRouteMessage({
                dateEs,
                workerName: route.delivery_workers!.name,
                zone,
              });
              const link = buildWhatsAppLink(route.delivery_workers!.phone!, message);
              return (
                <a
                  key={route.id}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 font-sans text-label-md text-white shadow-md transition-all hover:scale-105"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  {route.delivery_workers!.name} — {zone.zoneName}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista previa del albaran */}
      <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-soft">
        <div className="bg-primary px-6 py-5 text-center">
          <h2 className="font-serif text-headline-md text-on-primary">
            ALBARÁN DE PRODUCCIÓN Y REPARTO
          </h2>
          <p className="font-sans text-body-md text-on-primary/80">PANACASA — {dateEs}</p>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-outline">inventory_2</span>
            <p className="font-sans text-body-md text-on-surface-variant">
              Todavía no hay albarán generado para esta fecha.
            </p>
            <p className="font-sans text-label-sm text-on-surface-variant">
              Pulsa &quot;Generar albarán&quot; para recopilar las entregas de las suscripciones activas.
            </p>
          </div>
        ) : (
          <div className="space-y-8 p-6">
            <section>
              <h3 className="mb-3 font-serif text-headline-sm text-primary">Resumen de producción</h3>
              <p className="mb-4 font-sans text-body-lg font-bold text-on-surface">
                Total barras a hornear: {albaran.totalBarras}
              </p>
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
                <div className="mb-3 rounded-lg bg-primary px-4 py-3">
                  <h4 className="font-serif text-headline-sm text-on-primary">
                    Urbanización {zone.zoneName} — Total: {zone.totalBarras} barras
                  </h4>
                </div>
                <div className="overflow-x-auto rounded-lg border border-outline-variant">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-container-high">
                        {["Portal", "Piso", "Cantidad", "Tipo de pan", "Portal total", "Observaciones", ""].map(
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
                    <tbody className="divide-y divide-outline-variant">
                      {zone.deliveries.map((delivery) => {
                        const items =
                          delivery.items.length > 0
                            ? delivery.items
                            : [{ productName: "—", quantity: 0 }];
                        return items.map((item, index) => (
                          <tr key={`${delivery.deliveryId}-${index}`}>
                            <td className="px-4 py-2 font-sans text-body-md">
                              {delivery.portal || "—"}
                            </td>
                            <td className="px-4 py-2 font-sans text-body-md">{delivery.floor || "—"}</td>
                            <td className="px-4 py-2 font-sans text-body-md">{item.quantity}</td>
                            <td className="px-4 py-2 font-sans text-body-md">{item.productName}</td>
                            <td className="px-4 py-2 font-sans text-body-md" />
                            <td className="px-4 py-2 font-sans text-body-md">
                              {index === 0 ? delivery.observaciones : ""}
                            </td>
                            <td className="px-4 py-2">
                              {index === 0 && (
                                <button
                                  type="button"
                                  onClick={() => setEditingDelivery(delivery)}
                                  className="text-outline hover:text-primary"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ));
                      })}
                      {groupDeliveriesByPortal(zone.deliveries).map((portalTotal) => (
                        <tr key={portalTotal.portal} className="bg-surface-container-high font-semibold">
                          <td className="px-4 py-2 font-sans text-body-md">{portalTotal.portal}</td>
                          <td className="px-4 py-2 font-sans text-body-md">TOTAL</td>
                          <td className="px-4 py-2 font-sans text-body-md">{portalTotal.total}</td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2" />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {editingDelivery && (
        <DeliveryEditModal delivery={editingDelivery} onClose={() => setEditingDelivery(null)} />
      )}
    </div>
  );
}

function DeliveryEditModal({
  delivery,
  onClose,
}: {
  delivery: AlbaranDeliveryRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [portal, setPortal] = useState(delivery.portal);
  const [floor, setFloor] = useState(delivery.floor);
  const [notes, setNotes] = useState(delivery.observaciones);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startSaving(async () => {
      const result = await updateDeliveryDetailAction(delivery.deliveryId, { portal, floor, notes });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-surface-container-low shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant p-6">
          <h3 className="font-serif text-headline-sm text-primary">
            Editar entrega — {delivery.customerName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-2 transition-colors hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4 p-6">
          {error && (
            <p
              role="alert"
              className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
            >
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-sans text-label-md text-on-surface-variant">Portal</span>
              <input
                type="text"
                value={portal}
                onChange={(e) => setPortal(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="font-sans text-label-md text-on-surface-variant">Piso</span>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Observaciones</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>
          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-primary px-8 py-3 font-sans text-label-md text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-95"
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
