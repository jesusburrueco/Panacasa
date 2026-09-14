"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProductActionState {
  error: string | null;
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `pan-${Date.now()}`
  );
}

function readProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const priceEuros = parseFloat(String(formData.get("price") ?? "0"));
  const description = String(formData.get("description") ?? "").trim();
  const ingredients = String(formData.get("ingredients") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const detailImageUrl = String(formData.get("detail_image_url") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return { name, category, priceEuros, description, ingredients, imageUrl, detailImageUrl, tags };
}

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { name, category, priceEuros, description, ingredients, imageUrl, detailImageUrl, tags } =
    readProductForm(formData);

  if (!name) {
    return { error: "El nombre del pan es obligatorio." };
  }
  if (Number.isNaN(priceEuros) || priceEuros < 0) {
    return { error: "Introduce un precio válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    name,
    slug: slugify(name),
    category: category || null,
    price_cents: Math.round(priceEuros * 100),
    description: description || null,
    ingredients: ingredients || null,
    image_url: imageUrl || null,
    detail_image_url: detailImageUrl || null,
    tags,
    is_active: true,
  });

  if (error) {
    console.error("[createProductAction] Error de Supabase al insertar el producto:", error);
    if (error.code === "23505") {
      return { error: "Ya existe un producto con un nombre muy similar." };
    }
    return { error: "No se pudo crear el producto. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
  return { error: null };
}

export async function updateProductAction(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { name, category, priceEuros, description, ingredients, imageUrl, detailImageUrl, tags } =
    readProductForm(formData);

  if (!name) {
    return { error: "El nombre del pan es obligatorio." };
  }
  if (Number.isNaN(priceEuros) || priceEuros < 0) {
    return { error: "Introduce un precio válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name,
      category: category || null,
      price_cents: Math.round(priceEuros * 100),
      description: description || null,
      ingredients: ingredients || null,
      image_url: imageUrl || null,
      detail_image_url: detailImageUrl || null,
      tags,
    })
    .eq("id", productId);

  if (error) {
    console.error("[updateProductAction] Error de Supabase al actualizar el producto:", error);
    return { error: "No se pudo actualizar el producto. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
  return { error: null };
}

export async function deleteProductAction(productId: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
}

export async function toggleProductActiveAction(productId: string, nextActive: boolean) {
  const supabase = await createClient();
  await supabase.from("products").update({ is_active: nextActive }).eq("id", productId);
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
}
