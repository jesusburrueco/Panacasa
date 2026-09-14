"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";
import { slugifyForFilename } from "@/lib/supabase/storage";
import {
  createProductAction,
  deleteProductAction,
  toggleProductActiveAction,
  updateProductAction,
  type ProductActionState,
} from "@/lib/supabase/product-actions";
import { ImageUploadField } from "./ImageUploadField";

type Product = Tables<"products">;

const initialState: ProductActionState = { error: null };

export function ProductCatalogManager({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [modalProduct, setModalProduct] = useState<Product | null | undefined>(undefined);
  const [isToggling, startToggle] = useTransition();

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))),
    [products]
  );

  const filteredProducts =
    activeCategory === "Todos"
      ? products
      : products.filter((product) => product.category === activeCategory);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {["Todos", ...categories].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "whitespace-nowrap rounded-full px-6 py-2 font-sans text-label-md capitalize transition-colors",
                activeCategory === category
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant"
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setModalProduct(null)}
          className="flex items-center gap-3 rounded-lg bg-primary px-8 py-4 font-sans text-label-md text-on-primary shadow-soft-lg transition-all hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          Añadir Nuevo Pan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="group overflow-hidden rounded-xl bg-surface-container-low shadow-soft-lg transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="relative h-64 overflow-hidden bg-surface-container-high">
              {product.image_url && (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 shadow-sm backdrop-blur-sm">
                <span
                  className={cn("h-2 w-2 rounded-full", product.is_active ? "bg-green-500" : "bg-error")}
                />
                <span className="font-sans text-[10px] uppercase tracking-wider text-on-surface">
                  {product.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  {product.category && (
                    <span className="rounded-full border border-outline-variant bg-surface-container-highest px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-tertiary">
                      {product.category}
                    </span>
                  )}
                  <h4 className="mt-2 font-serif text-headline-sm text-primary">{product.name}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setModalProduct(product)}
                  aria-label={`Editar ${product.name}`}
                  className="rounded-full p-2 transition-colors hover:bg-surface-variant"
                >
                  <span className="material-symbols-outlined text-primary">edit</span>
                </button>
              </div>
              {product.description && (
                <p className="mb-4 line-clamp-2 font-sans text-body-md text-on-surface-variant">
                  {product.description}
                </p>
              )}
              <div className="flex items-center justify-between border-t border-outline-variant pt-4">
                <span className="font-serif text-headline-sm text-primary">
                  {formatPrice(product.price_cents)}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-label-sm text-on-surface-variant">Estado</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={product.is_active}
                      disabled={isToggling}
                      onChange={() =>
                        startToggle(() => {
                          toggleProductActiveAction(product.id, !product.is_active);
                        })
                      }
                    />
                    <div className="h-6 w-11 rounded-full bg-surface-variant transition-colors peer-checked:bg-green-500" />
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg bg-surface-container-low py-24 text-center">
            <span className="material-symbols-outlined text-4xl text-outline">bakery_dining</span>
            <p className="font-sans text-body-md text-on-surface-variant">
              No hay panes en esta categoría todavía.
            </p>
          </div>
        )}
      </div>

      {modalProduct !== undefined && (
        <ProductModal product={modalProduct} onClose={() => setModalProduct(undefined)} />
      )}
    </div>
  );
}

function ProductModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const action = product ? updateProductAction.bind(null, product.id) : createProductAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isDeleting, startDelete] = useTransition();
  const wasPending = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const getSlugBase = () =>
    product?.slug || slugifyForFilename(nameInputRef.current?.value || "pan");

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      onClose();
    }
    wasPending.current = isPending;
  }, [isPending, state.error, onClose]);

  const handleDelete = () => {
    if (!product) return;
    if (!confirm(`¿Eliminar "${product.name}" del catálogo?`)) return;
    startDelete(async () => {
      await deleteProductAction(product.id);
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-lg bg-surface-container-low shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant p-6">
          <h3 className="font-serif text-headline-sm text-primary">
            {product ? "Editar Producto" : "Añadir Nuevo Pan"}
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
        <form action={formAction} className="space-y-6 p-8">
          {state.error && (
            <p
              role="alert"
              className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
            >
              {state.error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ImageUploadField
              name="image_url"
              label="Foto principal"
              variant="principal"
              getSlugBase={getSlugBase}
              defaultValue={product?.image_url}
            />
            <ImageUploadField
              name="detail_image_url"
              label="Foto del corte / detalle"
              variant="detalle"
              getSlugBase={getSlugBase}
              defaultValue={product?.detail_image_url}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <label className="block">
                <span className="font-sans text-label-md text-on-surface-variant">
                  Nombre del Pan
                </span>
                <input
                  ref={nameInputRef}
                  name="name"
                  type="text"
                  required
                  defaultValue={product?.name}
                  className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="font-sans text-label-md text-on-surface-variant">Categoría</span>
                <input
                  name="category"
                  type="text"
                  placeholder="Masa Madre, Integral, Dulce..."
                  defaultValue={product?.category ?? ""}
                  className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="font-sans text-label-md text-on-surface-variant">Precio (€)</span>
                <div className="relative mt-1 rounded-lg shadow-inset">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-on-surface-variant">€</span>
                  </div>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={product ? (product.price_cents / 100).toFixed(2) : undefined}
                    className="block w-full rounded-lg border border-outline-variant bg-surface p-3 pl-8 font-sans text-body-md focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
              </label>
              <label className="block">
                <span className="font-sans text-label-md text-on-surface-variant">
                  Etiquetas (separadas por coma)
                </span>
                <input
                  name="tags"
                  type="text"
                  placeholder="Vegano, Sin gluten..."
                  defaultValue={product?.tags?.join(", ") ?? ""}
                  className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="font-sans text-label-md text-on-surface-variant">
                  Descripción Corta
                </span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={product?.description ?? ""}
                  className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="font-sans text-label-md text-on-surface-variant">
                  Ingredientes (separados por coma)
                </span>
                <textarea
                  name="ingredients"
                  rows={3}
                  defaultValue={product?.ingredients ?? ""}
                  className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 pt-6">
            {product ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="font-sans text-label-md text-error hover:underline"
              >
                {isDeleting ? "Eliminando..." : "Eliminar producto"}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-primary px-8 py-3 font-sans text-label-md text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-95"
              >
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
