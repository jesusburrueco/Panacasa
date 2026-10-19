import { cn, formatPrice } from "@/lib/utils";
import type { PlanPrice } from "@/lib/plan-pricing";

/**
 * Precio semanal de un plan. Con promo activa muestra el regular tachado y
 * el promocional al lado; debajo, la lectura comercial por dia.
 */
export function PlanPriceTag({
  price,
  className,
  size = "md",
}: {
  price: PlanPrice;
  className?: string;
  size?: "md" | "lg";
}) {
  const { regularCents, promoCents, dayRegularCents, dayPromoCents } = price;

  if (regularCents == null && promoCents == null) {
    return (
      <p className={cn("font-sans text-label-md text-on-surface-variant", className)}>
        No disponible en esta modalidad
      </p>
    );
  }

  const mainSize = size === "lg" ? "text-display-lg-mobile" : "text-headline-md";

  return (
    <div className={cn("space-y-1", className)}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        {promoCents != null ? (
          <>
            <span className={cn("font-serif text-tertiary", mainSize)}>
              {formatPrice(promoCents)}
            </span>
            {regularCents != null && (
              <s className="font-sans text-body-md text-on-surface-variant">
                {formatPrice(regularCents)}
              </s>
            )}
          </>
        ) : (
          <span className={cn("font-serif text-on-surface", mainSize)}>
            {formatPrice(regularCents ?? 0)}
          </span>
        )}
        <span className="font-sans text-label-md text-on-surface-variant">/ semana</span>
        {promoCents != null && (
          <span className="rounded-full bg-tertiary-container px-2 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-on-tertiary-container">
            Promo
          </span>
        )}
      </p>
      {dayRegularCents != null && (
        <p className="font-sans text-label-sm text-on-surface-variant">
          {dayPromoCents != null ? (
            <>
              Solo {formatPrice(dayPromoCents)} al día{" "}
              <s className="opacity-70">{formatPrice(dayRegularCents)}</s>
            </>
          ) : (
            <>Solo {formatPrice(dayRegularCents)} al día</>
          )}
        </p>
      )}
    </div>
  );
}
