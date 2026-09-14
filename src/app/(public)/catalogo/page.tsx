import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductFilters } from "@/components/catalogo/ProductFilters";
import { ProductGrid } from "@/components/catalogo/ProductGrid";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; orden?: string }>;
}) {
  const { categoria, orden } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("products").select("*").eq("is_active", true);

  if (categoria && categoria !== "todos") {
    query = query.eq("category", categoria);
  }

  if (orden === "precio-asc") {
    query = query.order("price_cents", { ascending: true });
  } else if (orden === "recientes") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("name", { ascending: true });
  }

  const [{ data: products, error }, { data: categoryRows }] = await Promise.all([
    query,
    supabase.from("products").select("category").eq("is_active", true),
  ]);

  const categories = Array.from(
    new Set(
      (categoryRows ?? [])
        .map((row) => row.category)
        .filter((category): category is string => Boolean(category))
    )
  ).sort();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-margin-mobile py-section-gap md:px-margin-desktop">
      <header className="mb-12">
        <h1 className="mb-8 font-serif text-display-lg-mobile text-primary md:text-display-lg">
          Nuestros Panes Artesanales
        </h1>
        <Suspense fallback={<div className="h-11" />}>
          <ProductFilters categories={categories} />
        </Suspense>
      </header>

      {error ? (
        <p className="rounded-lg bg-error-container px-6 py-4 font-sans text-body-md text-on-error-container">
          No se pudo cargar el catálogo. Inténtalo de nuevo más tarde.
        </p>
      ) : (
        <ProductGrid products={products ?? []} />
      )}
    </main>
  );
}
