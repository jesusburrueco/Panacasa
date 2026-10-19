"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { cartSubtotalCents } from "@/lib/cart";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";

function formatDeliveryDate(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00Z`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function CartDrawer() {
  const { lines, isOpen, close, setQuantity, confirmOrder, isConfirming, error, confirmedDate } =
    useCart();
  const subtotal = cartSubtotalCents(lines);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  return (
    <div
      className={cn("fixed inset-0 z-[2000]", isOpen ? "visible" : "invisible")}
      aria-hidden={!isOpen}
    >
      <div
        onClick={close}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface shadow-soft-lg transition-transform duration-300 sm:rounded-l-lg",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="flex items-center justify-between border-b border-outline-variant px-6 py-5">
          <h2 id="cart-drawer-title" className="font-serif text-headline-sm text-primary">
            Tu cesta
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar carrito"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {confirmedDate ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="material-symbols-outlined rounded-full bg-primary-fixed p-4 text-4xl text-primary">
              task_alt
            </span>
            <h3 className="font-serif text-headline-sm text-primary">¡Pedido confirmado!</h3>
            <p className="font-sans text-body-md text-on-surface-variant">
              Llegará con tu entrega del{" "}
              <strong className="text-on-surface">{formatDeliveryDate(confirmedDate)}</strong>.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-2 rounded-full border-2 border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-primary/5"
            >
              Seguir comprando
            </button>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="material-symbols-outlined text-5xl text-outline">shopping_basket</span>
            <p className="font-sans text-body-md text-on-surface-variant">
              Tu cesta está vacía. Añade panes sueltos del catálogo y te los llevamos con tu
              próxima entrega.
            </p>
            {error && <ErrorMessage message={error} />}
            <Link
              href="/catalogo"
              onClick={close}
              className="rounded-full bg-primary px-6 py-3 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-outline-variant/50 overflow-y-auto px-6">
              {lines.map((line) => {
                const product = line;
                return (
                  <li key={line.productId} className="flex gap-4 py-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-DEFAULT bg-surface-container-high">
                      {line.imageUrl ? (
                        <Image
                          src={line.imageUrl}
                          alt={line.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined absolute inset-0 m-auto h-fit w-fit text-outline">
                          bakery_dining
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/catalogo/${line.slug}`}
                            onClick={close}
                            className="block truncate font-serif text-body-lg text-primary hover:underline"
                          >
                            {line.name}
                          </Link>
                          <p className="font-sans text-label-sm text-on-surface-variant">
                            {formatPrice(line.priceCents)} / ud.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuantity(product, 0)}
                          aria-label={`Eliminar ${line.name}`}
                          className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <QuantityStepper
                          size="sm"
                          quantity={line.quantity}
                          label={line.name}
                          onChange={(next) => setQuantity(product, next)}
                        />
                        <span className="font-sans text-label-md font-bold text-on-surface">
                          {formatPrice(line.priceCents * line.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="space-y-4 border-t border-outline-variant bg-surface-container-low px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="font-sans text-label-md text-on-surface-variant">Subtotal</span>
                <span className="font-serif text-headline-sm text-primary">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="flex items-start gap-2 font-sans text-label-sm text-tertiary">
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                Estos productos se añadirán a tu próxima entrega.
              </p>
              {error && <ErrorMessage message={error} />}
              <button
                type="button"
                onClick={confirmOrder}
                disabled={isConfirming}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {isConfirming ? "Confirmando..." : "Confirmar pedido extra"}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
    >
      {message}
    </p>
  );
}
