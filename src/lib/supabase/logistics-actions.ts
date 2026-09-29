"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureDeliveriesForDate, getAlbaranData } from "@/lib/supabase/logistics-queries";
import { albaranWorkbookToBase64 } from "@/lib/logistics/excel";
import { buildRouteMessage } from "@/lib/logistics/whatsapp";
import { formatDateEs } from "@/lib/logistics/types";
import { sendMail } from "@/lib/logistics/mailer";

export interface GenerateAlbaranResult {
  error: string | null;
}

export async function generateAlbaranAction(date: string): Promise<GenerateAlbaranResult> {
  if (!date) return { error: "Selecciona una fecha." };

  try {
    await ensureDeliveriesForDate(date);
    revalidatePath("/admin/logistica");
    return { error: null };
  } catch {
    return { error: "No se pudo generar el albarán. Inténtalo de nuevo." };
  }
}

export interface UpdateDeliveryDetailResult {
  error: string | null;
}

export async function updateDeliveryDetailAction(
  deliveryId: string,
  data: { portal: string; floor: string; notes: string }
): Promise<UpdateDeliveryDetailResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("deliveries")
    .update({
      portal: data.portal || null,
      floor: data.floor || null,
      notes: data.notes || null,
    })
    .eq("id", deliveryId);

  if (error) {
    return { error: "No se pudo guardar el cambio." };
  }

  revalidatePath("/admin/logistica");
  return { error: null };
}

export interface DownloadAlbaranResult {
  error: string | null;
  base64?: string;
  filename?: string;
}

export async function downloadAlbaranExcelAction(date: string): Promise<DownloadAlbaranResult> {
  if (!date) return { error: "Selecciona una fecha." };

  const summary = await getAlbaranData(date);
  const base64 = await albaranWorkbookToBase64(summary);

  return {
    error: null,
    base64,
    filename: `Albaran_PanACasa_${date}.xlsx`,
  };
}

export interface SendAlbaranEmailResult {
  error: string | null;
  sentTo: string[];
  skipped: string[];
}

export async function sendAlbaranEmailAction(date: string): Promise<SendAlbaranEmailResult> {
  if (!date) return { error: "Selecciona una fecha.", sentTo: [], skipped: [] };

  const supabase = await createClient();
  const summary = await getAlbaranData(date);

  const { data: routes } = await supabase
    .from("delivery_routes")
    .select("zone_id, delivery_workers ( name, email )")
    .eq("delivery_date", date);

  const workerZones = new Map<string, { name: string; zoneIds: Set<string> }>();
  for (const route of routes ?? []) {
    const worker = route.delivery_workers;
    if (!worker?.email || !route.zone_id) continue;
    if (!workerZones.has(worker.email)) {
      workerZones.set(worker.email, { name: worker.name, zoneIds: new Set() });
    }
    workerZones.get(worker.email)!.zoneIds.add(route.zone_id);
  }

  if (workerZones.size === 0) {
    return {
      error:
        "No hay repartidores con email asignados a una ruta para esta fecha. Asígnalos en la pestaña Rutas.",
      sentTo: [],
      skipped: [],
    };
  }

  const base64 = await albaranWorkbookToBase64(summary);
  const filename = `Albaran_PanACasa_${date}.xlsx`;
  const dateEs = formatDateEs(date);

  const sentTo: string[] = [];
  const skipped: string[] = [];

  for (const [email, worker] of workerZones) {
    const zones = summary.zones.filter((zone) => worker.zoneIds.has(zone.zoneId));
    const body =
      zones.length > 0
        ? zones.map((zone) => buildRouteMessage({ dateEs, workerName: worker.name, zone })).join("\n\n")
        : `RUTA ${dateEs} - ${worker.name}\nNo hay entregas programadas para tus zonas asignadas.`;

    const { error } = await sendMail({
      to: email,
      subject: `Albarán de reparto PanACasa - ${dateEs}`,
      text: body,
      attachment: { filename, base64 },
    });

    if (error) {
      skipped.push(`${worker.name} (${error})`);
    } else {
      sentTo.push(worker.name);
    }
  }

  return { error: null, sentTo, skipped };
}
