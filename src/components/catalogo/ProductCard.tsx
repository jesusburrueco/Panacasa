import Image from "next/image";
import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";
import { AddToCartControls } from "@/components/cart/AddToCartControls";

export type Product = Tables<"products">;

export function ProductCard({ product }: { product: Product }) {
  return (
    // El enlace al detalle cubre la tarjeta (::after) para que los controles
    // del carrito no queden anidados dentro de un <a>.
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-soft transition-transform duration-300 hover:scale-[1.02]">
      <div className="relative h-64 overflow-hidden bg-surface-container-high">
        {product.image_url && (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        {product.category && (
          <span className="absolute left-4 top-4 rounded-full bg-surface-container-highest px-3 py-1 font-sans text-label-sm capitalize text-primary shadow-sm">
            {product.category}
          </span>
        )}
      </div>

      <div className="flex flex-grow flex-col p-6">
        <h3 className="font-serif text-headline-sm text-primary">
          <Link href={`/catalogo/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        {product.tags?.length > 0 && (
          <span className="mt-1 font-sans text-label-sm text-on-surface-variant">
            {product.tags[0]}
          </span>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          <span className="font-sans text-body-lg font-bold text-primary">
            {formatPrice(product.price_cents)}
          </span>
          <div className="relative z-10">
            <AddToCartControls
              product={{
                productId: product.id,
                name: product.name,
                slug: product.slug,
                priceCents: product.price_cents,
                imageUrl: product.image_url,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
