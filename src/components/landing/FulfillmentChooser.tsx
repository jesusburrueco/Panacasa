"use client";

import Image from "next/image";
import { useState } from "react";
import { DeliveryChecker } from "@/components/shared/DeliveryChecker";
import { cn } from "@/lib/utils";

type Mode = "envio" | "recogida";

export type PickupPointSummary = {
  id: string;
  name: string;
  address: string;
};

const options: {
  mode: Mode;
  label: string;
  icon: string;
  circle: string;
  thumbnail: string;
  thumbnailAlt: string;
}[] = [
  {
    mode: "envio",
    label: "Envío",
    icon: "local_shipping",
    circle: "bg-primary-fixed",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAB7v3CKUarbllxyx7IxvRUYej4692uvXyXkcb3lXZQzg4lzZA6posxryMkAwMkzNsg_Nov8XyNN02qCsJgjVafibHh8E0sIiIHSK0mFcHDRAd7vGeFaMTojB6dFY8mlUGmi8ZG9ohQIavNMYPN4oPxN3n65UhZjdov9dCpO9NWWi21pIH8Mtbw1DOPOKhCsTAAIQfzK-vsnPmBLLoKpdt_buUz1YEXKnp8LSBx33uoy-lsnejyslU7qC-ADSYqQg1IYPIj47nPBns",
    thumbnailAlt: "Corteza de pan artesanal",
  },
  {
    mode: "recogida",
    label: "Recogida",
    icon: "storefront",
    circle: "bg-tertiary-fixed",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBmLHBE4uDAM9UfVHH2g21TeSLBpFNwe5g4ymHaLQRPvDQmsl3NLPPHJdzauWBaJM3ViiPV0czS5PYKXGvFaG9aK5Ken2eVElU20L7CZNXzYZMniHj56CbgFhLAtByTfLztaGtHDjJIgZhZeMvvBcLQrONHQE_Kh0VLgFZg_gOLR47-4bjCuOrRXHHMwFjptONgXSKX-i8Z6rFN6YtIVF26m8QRqou-GnT5256ufBIWzMRZlFcbTT7KYvSFZVPYB1PGrjCUfz8swdU",
    thumbnailAlt: "Hogaza de pan recién horneada",
  },
];

export function FulfillmentChooser({ pickupPoints }: { pickupPoints: PickupPointSummary[] }) {
  const [mode, setMode] = useState<Mode>("envio");

  return (
    <div className="grid grid-cols-1 items-start gap-gutter md:grid-cols-2 md:gap-16">
      {/* Selector (log_stica_breadly) */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -rotate-2 rounded-xl bg-surface-container-high/60"
        />
        <div
          role="radiogroup"
          aria-label="Modo de entrega"
          className="relative grid grid-cols-2 gap-6 rounded-xl bg-surface-container px-6 py-14 shadow-soft md:py-20"
        >
          {options.map((option) => {
            const selected = mode === option.mode;
            return (
              <button
                key={option.mode}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMode(option.mode)}
                className="group flex flex-col items-center gap-5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span
                  className={cn(
                    "flex h-28 w-28 items-center justify-center rounded-full shadow-soft transition-all duration-300 md:h-36 md:w-36",
                    option.circle,
                    selected
                      ? "scale-105 ring-4 ring-primary ring-offset-4 ring-offset-surface-container"
                      : "opacity-80 group-hover:scale-105 group-hover:opacity-100"
                  )}
                >
                  <span className="material-symbols-outlined text-[44px] text-on-surface">
                    {option.icon}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image
                      src={option.thumbnail}
                      alt={option.thumbnailAlt}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </span>
                  <span
                    className={cn(
                      "font-sans text-label-md transition-colors",
                      selected ? "text-primary" : "text-on-surface-variant"
                    )}
                  >
                    {option.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle segun el modo elegido */}
      <div key={mode} className="animate-fade-up space-y-6 motion-reduce:animate-none">
        {mode === "envio" ? (
          <>
            <p className="font-sans text-body-lg text-on-surface-variant">
              Te lo llevamos a casa antes de las 8:00 para que lo disfrutes aún caliente en el
              desayuno. Comprueba si ya repartimos en tu código postal.
            </p>
            <DeliveryChecker />
          </>
        ) : (
          <>
            <p className="font-sans text-body-lg text-on-surface-variant">
              Disfruta del paseo y recoge tu suscripción en uno de nuestros obradores y puntos
              asociados, sin gastos de envío.
            </p>
            {pickupPoints.length > 0 ? (
              <ul className="space-y-3">
                {pickupPoints.map((point) => (
                  <li
                    key={point.id}
                    className="flex items-start gap-4 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-soft"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                      <span className="material-symbols-outlined">storefront</span>
                    </span>
                    <div>
                      <p className="font-sans text-label-md text-primary">{point.name}</p>
                      <p className="font-sans text-body-md text-on-surface-variant">
                        {point.address}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-outline-variant bg-surface-container-high p-5 font-sans text-body-md text-on-surface-variant">
                Estamos abriendo nuevos puntos de recogida. Mientras tanto, puedes elegir el envío
                a domicilio.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
