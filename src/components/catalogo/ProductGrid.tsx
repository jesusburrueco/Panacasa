import { ProductCard, type Product } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-surface-container-low py-24 text-center">
        <span className="material-symbols-outlined text-4xl text-outline">bakery_dining</span>
        <p className="font-sans text-body-md text-on-surface-variant">
          No hay panes en esta categoría todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
