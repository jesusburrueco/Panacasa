import { MAX_BREADS_PER_DAY } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ContactOptions } from "./ContactOptions";

/** Seccion para clientes que superan el limite de barras diarias. */
export function CustomPlanContact({ className }: { className?: string }) {
  return (
    <section
      id="plan-personalizado"
      className={cn(
        "flex flex-col gap-6 rounded-lg border border-outline-variant/40 bg-surface-container p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between md:p-10",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <span className="material-symbols-outlined flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
          storefront
        </span>
        <div>
          <h2 className="font-serif text-headline-sm text-primary">
            ¿Necesitas más de {MAX_BREADS_PER_DAY} barras al día?
          </h2>
          <p className="mt-1 max-w-md font-sans text-body-md text-on-surface-variant">
            Contáctanos para un plan personalizado: restaurantes, oficinas o familias numerosas.
          </p>
        </div>
      </div>
      <ContactOptions
        className="lg:shrink-0"
        subject="Plan personalizado PanACasa"
        message={`Hola, me interesa un plan personalizado de más de ${MAX_BREADS_PER_DAY} barras al día.`}
      />
    </section>
  );
}
