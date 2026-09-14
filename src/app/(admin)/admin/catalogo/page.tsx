import { createClient } from "@/lib/supabase/server";
import { ProductCatalogManager } from "./ProductCatalogManager";

export default async function AdminCatalogoPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mb-12">
        <h1 className="mb-2 font-serif text-display-lg-mobile text-primary md:text-display-lg">
          Nuestra Hornada Diaria
        </h1>
        <p className="max-w-xl font-sans text-body-lg text-on-surface-variant">
          Administra los productos disponibles, ajusta precios y mantén el inventario
          actualizado para tus suscriptores.
        </p>
      </div>

      <ProductCatalogManager products={products ?? []} />
    </main>
  );
}
