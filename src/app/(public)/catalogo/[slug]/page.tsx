import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { MobileNav } from "@/components/layout/MobileNav";
import { formatPrice } from "@/lib/utils";
import { ContactOptions } from "@/components/shared/ContactOptions";
import { AddToSubscriptionControls } from "./AddToSubscriptionControls";

const INGREDIENT_ICONS = ["grass", "water_drop", "bakery_dining"] as const;

export default async function ProductoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const ingredientList = product.ingredients
    ? product.ingredients
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return (
    <>
      <main className="flex flex-1 flex-col pb-20 md:pb-0">
        {/* Hero con circulo de detalle (miga) superpuesto */}
        <section className="relative h-[60vh] w-full overflow-hidden bg-surface-container-low md:h-[70vh]">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          {product.detail_image_url && (
            <div className="group absolute bottom-8 right-8 h-24 w-24 overflow-hidden rounded-full border-4 border-surface shadow-soft-lg transition-transform duration-500 hover:scale-110 md:h-32 md:w-32">
              <Image
                src={product.detail_image_url}
                alt={`Textura de la miga de ${product.name}`}
                fill
                sizes="128px"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="font-sans text-[10px] uppercase tracking-widest text-white">
                  Miga
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Contenido */}
        <section className="px-margin-mobile pb-16 pt-8 md:px-margin-desktop">
          <div className="mx-auto w-full max-w-4xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                {product.category && (
                  <Badge variant="neutral" className="mb-2 capitalize">
                    {product.category}
                  </Badge>
                )}
                <h1 className="font-serif text-display-lg-mobile leading-tight text-primary md:text-display-lg">
                  {product.name}
                </h1>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-headline-sm text-on-surface-variant">
                  {formatPrice(product.price_cents)}
                </span>
                <span className="font-sans text-label-md text-outline">/ unidad</span>
              </div>
            </div>

            {product.description && (
              <p className="mt-6 max-w-2xl font-sans text-body-lg leading-relaxed text-on-surface-variant">
                {product.description}
              </p>
            )}

            {ingredientList.length > 0 && (
              <div className="mt-10 rounded-lg border border-outline-variant/30 bg-surface-container-low p-6">
                <h3 className="mb-4 font-sans text-label-md uppercase tracking-widest text-primary">
                  Ingredientes
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {ingredientList.map((ingredient, index) => (
                    <div key={ingredient} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-tertiary">
                        {INGREDIENT_ICONS[index % INGREDIENT_ICONS.length]}
                      </span>
                      <span className="font-sans text-body-md text-on-surface">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sugerencia de maridaje */}
            <div className="mt-12 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div className="order-2 md:order-1">
                <h3 className="mb-4 font-serif text-headline-sm text-primary">
                  Sugerencia de maridaje
                </h3>
                <p className="mb-4 font-sans text-body-md text-on-surface-variant">
                  Disfrútalo recién horneado. Combina especialmente bien con aceites de
                  oliva virgen extra y quesos curados, que realzan su fermentación lenta.
                </p>
                {product.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {product.image_url && (
                <div className="order-1 h-48 overflow-hidden rounded-lg shadow-soft md:order-2">
                  <Image
                    src={product.image_url}
                    alt={`Maridaje sugerido para ${product.name}`}
                    width={600}
                    height={400}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>

            <AddToSubscriptionControls productSlug={product.slug} />
            <p className="mt-6 text-center font-sans text-label-sm italic text-on-surface-variant/70 sm:text-left">
              * Entrega a domicilio los días que elijas en tu perfil.
            </p>

            <div className="mt-12 flex flex-col gap-6 rounded-lg bg-surface-container p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between md:p-8">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  support_agent
                </span>
                <div>
                  <h3 className="font-serif text-headline-sm text-primary">
                    ¿Dudas sobre este pan? Contáctanos
                  </h3>
                  <p className="mt-1 font-sans text-body-md text-on-surface-variant">
                    Alérgenos, conservación o pedidos especiales: te respondemos encantados.
                  </p>
                </div>
              </div>
              <ContactOptions
                className="lg:shrink-0"
                subject={`Consulta sobre ${product.name}`}
                message={`Hola, tengo una duda sobre el pan "${product.name}".`}
              />
            </div>
          </div>
        </section>
      </main>
      <MobileNav />
    </>
  );
}
