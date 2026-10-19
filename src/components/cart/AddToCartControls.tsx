"use client";

import { useCart, type CartProduct } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";

/** Boton "Añadir al carrito" que pasa a controles +/- cuando ya esta en el carrito. */
export function AddToCartControls({ product }: { product: CartProduct }) {
  const { quantityOf, setQuantity } = useCart();
  const quantity = quantityOf(product.productId);

  if (quantity > 0) {
    return (
      <QuantityStepper
        quantity={quantity}
        label={product.name}
        onChange={(next) => setQuantity(product, next)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setQuantity(product, 1)}
      className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-sans text-label-md text-on-primary shadow-soft transition-all hover:bg-primary-container active:scale-95"
    >
      <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
      Añadir al carrito
    </button>
  );
}
