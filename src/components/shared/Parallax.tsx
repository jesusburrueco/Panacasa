"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Desplaza su contenido verticalmente a una fraccion de la velocidad del scroll
 * (parallax ligero). Pensado para envolver imagenes con `fill` dentro de un
 * contenedor relative + overflow-hidden. Se desactiva con prefers-reduced-motion.
 */
export function Parallax({
  children,
  className,
  speed = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.parentElement?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) return;
      node.style.transform = `translate3d(0, ${(-rect.top * speed).toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    // Sobredimensionado un 15% arriba y abajo para que el desplazamiento no deje huecos.
    <div
      ref={ref}
      className={cn("absolute inset-x-0 -top-[15%] h-[130%] will-change-transform", className)}
    >
      {children}
    </div>
  );
}
