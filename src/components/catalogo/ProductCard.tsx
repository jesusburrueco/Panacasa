import Image from "next/image";
import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";

export type Product = Tables<"products">;

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/catalogo/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-soft transition-transform duration-300 hover:scale-[1.02]"
    >
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
        <h3 className="font-serif text-headline-sm text-primary">{product.name}</h3>
        {product.tags?.length > 0 && (
          <span className="mt-1 font-sans text-label-sm text-on-surface-variant">
            {product.tags[0]}
          </span>
        )}

        <div className="mt-auto flex items-center justify-between pt-6">
          <span className="font-sans text-body-lg font-bold text-primary">
            {formatPrice(product.price_cents)}
          </span>
          <span className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-sans text-label-md text-on-primary transition-colors group-hover:bg-primary-container">
            <span className="material-symbols-outlined text-[20px]">shopping_basket</span>
            Añadir
          </span>
        </div>
      </div>
    </Link>
  );
}
