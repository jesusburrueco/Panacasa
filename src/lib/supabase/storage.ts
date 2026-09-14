"use client";

import { createClient } from "@/lib/supabase/client";

const PRODUCTS_BUCKET = "products";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type ProductImageVariant = "principal" | "detalle";

export function slugifyForFilename(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "pan"
  );
}

export type UploadProductImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadProductImage(
  file: File,
  slugBase: string,
  variant: ProductImageVariant
): Promise<UploadProductImageResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Formato no soportado. Usa JPG, PNG, WEBP o AVIF." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "La imagen no puede superar los 5 MB." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${slugifyForFilename(slugBase)}-${variant}-${Date.now()}.${extension}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from(PRODUCTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error(
      `[uploadProductImage] Error de Supabase Storage al subir "${path}" al bucket "${PRODUCTS_BUCKET}":`,
      error
    );
    return { ok: false, error: "No se pudo subir la imagen. Inténtalo de nuevo." };
  }

  const { data } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
