"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { CartLine } from "@/lib/cart";
import { confirmExtraOrderAction, setCartQuantityAction } from "@/lib/supabase/cart-actions";
import { CartDrawer } from "./CartDrawer";

export type CartProduct = Omit<CartLine, "quantity">;

interface CartContextValue {
  lines: CartLine[];
  isAuthenticated: boolean;
  isOpen: boolean;
  error: string | null;
  isConfirming: boolean;
  confirmedDate: string | null;
  open: () => void;
  close: () => void;
  quantityOf: (productId: string) => number;
  setQuantity: (product: CartProduct, quantity: number) => void;
  confirmOrder: () => void;
  /** Sustituye el carrito por el que devuelve el servidor (p. ej. al cancelar un pedido). */
  replaceLines: (lines: CartLine[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de <CartProvider>.");
  return context;
}

export function CartProvider({
  initialLines,
  isAuthenticated,
  children,
}: {
  initialLines: CartLine[];
  isAuthenticated: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [lines, setLines] = useState(initialLines);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedDate, setConfirmedDate] = useState<string | null>(null);
  const [isConfirming, startConfirm] = useTransition();
  // Solo la ultima respuesta del servidor reconcilia el estado: si el
  // usuario pulsa +/- varias veces seguidas no se "rebobina" la cantidad.
  const requestId = useRef(0);

  const quantityOf = useCallback(
    (productId: string) => lines.find((line) => line.productId === productId)?.quantity ?? 0,
    [lines]
  );

  const setQuantity = useCallback(
    (product: CartProduct, quantity: number) => {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      setError(null);
      setConfirmedDate(null);
      setLines((prev) => {
        if (quantity <= 0) return prev.filter((line) => line.productId !== product.productId);
        const exists = prev.some((line) => line.productId === product.productId);
        return exists
          ? prev.map((line) => (line.productId === product.productId ? { ...line, quantity } : line))
          : [...prev, { ...product, quantity }];
      });

      const id = ++requestId.current;
      setCartQuantityAction(product.productId, quantity).then((result) => {
        if (id !== requestId.current) return;
        setLines(result.lines);
        if (result.error) setError(result.error);
      });
    },
    [isAuthenticated, pathname, router]
  );

  const confirmOrder = useCallback(() => {
    setError(null);
    startConfirm(async () => {
      const result = await confirmExtraOrderAction();
      setLines(result.lines);
      setError(result.error);
      setConfirmedDate(result.deliveryDate);
    });
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const replaceLines = useCallback((next: CartLine[]) => {
    requestId.current++;
    setLines(next);
    setConfirmedDate(null);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
    setConfirmedDate(null);
  }, []);

  const value: CartContextValue = {
    lines,
    isAuthenticated,
    isOpen,
    error,
    isConfirming,
    confirmedDate,
    open,
    close,
    quantityOf,
    setQuantity,
    confirmOrder,
    replaceLines,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}
