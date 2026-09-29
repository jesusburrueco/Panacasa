import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FadeIn } from "@/components/shared/FadeIn";
import { Parallax } from "@/components/shared/Parallax";
import {
  FulfillmentChooser,
  type PickupPointSummary,
} from "@/components/landing/FulfillmentChooser";

const heroMobileImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDg0tWBQOPDc23k2ibEiJcJz47qfhVIpXIICR1DMmm1nYyH9h34UlzYFVXKpre3eKqIDrwy-eM80EDGTGbic9KorE-QcBWdkAWAKUrpM89q3OpEoeWC978_BOnTXq2b03dORNl7NlfsXxpiFYua7ZkgVIaRqEkMHSLA2mUGpz1HeawH81HACyCxRsmL6x8bDz0B_sMy3sIBBTVqS87N_B-3hNM-31iJfRbnppGgrOaPfTHTTkw3oEcW77lkGANG5h3rXolCeyav2dA";

const heroDesktopImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD7HfED-o7VBF4qi8-W9X2Nocd4NoQmZSNpDmCBYdqoMcwpr7GbwDiHAVSG6dQwCOmJjo-UlSsZD9VXhYGSvU_W3CXcza9PfAiNyU5kbcax1GnWKz7ZeHN72bXEVt0zvzwuYO8uBq86gqUkq2WrENiQok4M9N3Z-4boJep7Br2y74ELhRURnO6crB03bh7wZHnRyF_IcXztjOb0g8yM1pm-gE1Up06pp4V10wyCir3BXrMagyJ5nnY8";

const heroTextureImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDs-vIZXU440aX40D_kVLEJwmXRZW-dFjAHOy17Kqbtlv4jqdYov-9aAo_XIo3kAhtiKDV3VX1Fm4MCowHi42Km5_vRf6vBmH48WXlzUp2opaehQspV5wit0dkj3reFNUqMVtT4d9PE48ZDCc7wbOR9AT2NWJ42u_kp5HTtIuxsIBpStlhv_5FCDfsT1n4nDoCi5KYsJEfQgstveSTkyU73FN4e4QdT7I5Xdwi01ufNk8sNGjGw0yTo";

// Imagenes de respaldo para el mosaico si el catalogo aun no tiene fotos.
const fallbackMosaic = [
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBL5QXdblWcP9HOwpezeChYlJaEuQ4AXRt2uhwJ-swGXlclmt3-2ELjfrnVJlXaENAw3q-KQlm-L_7yxYR_SZO-tnRoDhLnVKsc-Xnwb1Wz93AxZWVIMOJoLFSgS2aNG-K6wbhAxCzDc3fjF3hQpNEa0rWhEkTY76xQp9rinS1uiYeeNCfuRs_m9_Hgr4x1B1tvdpkQVts-Csr5TvYkZ3XlBae3I_EymDhCAocsNnCKSWuEYyDd_MO7",
    alt: "Hogaza dorada partida a mano con la miga humeante",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNL93Ms4uzZr_PxF_aPp8ymQ8ePCH6sARDln9ggh7nYc84iDXe94AAhBINnU5-YMHpg_3TB-qD-g8hou7HQkdDyrmYi8KeO-BkOanjAYwz1yexQF-Xxer2bKJTeXCI1ZOChAL-9kWEQS9WfccfFE3oTQEnMWBwhuBwUDATxHSCHqoqUX7wnRaArnw05cK8VYUCl-8yxqC2VXRV5MagsXCX36TNlynixKzdcON1L2ADtzQv83iZq2gJ",
    alt: "Mesa de desayuno con pan de centeno, miel, mantequilla y café",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGDIxMeG62OkjQdJfVFlzeX0EA2RZZoR_JNXSDyP8r5A3rxYdsIIRGmRdHBtCH0U8qQ28XdBJae5IfgU_9pty6IryNyMny1IBzYYta7vfxlwIo61SvQvdNdYUqpw2vUexq4QPcow446T5UoBhdkCFQGk7aiW-rJOth51KxlPx2YrfOgMUCjbPdk9hbywb8WOHZg9POTT52g0SM3pf2dxLXnGupkJsMhWcpq-dLucf70IIlR1UMrKUv",
    alt: "Corteza crujiente y enharinada de una baguette artesanal",
  },
];

const differentiators = [
  {
    icon: "bakery_dining",
    title: "Pan artesanal recién horneado",
    description:
      "Trigos antiguos y fermentación natural de 24 horas. Cada hogaza se forma a mano por maestros panaderos: corteza crujiente e interior aireado.",
    checks: ["Sin aditivos ni conservantes", "Masa madre de fermentación lenta"],
  },
  {
    icon: "calendar_month",
    title: "Suscripción flexible",
    description:
      "Tú tienes el control. Recibe tu pack semanal o quincenalmente. ¿Te vas de viaje? Pausa o cancela desde tu perfil con un solo clic, sin compromisos.",
    checks: ["Semanal o quincenal", "Pausa o cancela cuando quieras"],
  },
  {
    icon: "local_shipping",
    title: "Logística inteligente",
    description:
      "Envío a domicilio antes de las 8:00 para que desayunes con pan caliente, o recogida local en nuestros puntos asociados sin gastos de envío.",
    checks: ["Envío a domicilio", "Recogida en punto local"],
  },
];

const secretPoints = [
  {
    icon: "eco",
    title: "Ingredientes locales",
    description: "Harinas de molino de piedra, agua filtrada y sal marina. Nada más.",
  },
  {
    icon: "schedule",
    title: "24h de fermentación",
    description: "El tiempo es nuestro ingrediente más caro y el más importante.",
  },
];

async function getLandingData() {
  const supabase = await createClient();

  const [{ data: products }, { data: pickupPoints }] = await Promise.all([
    supabase
      .from("products")
      .select("name, image_url")
      .eq("is_active", true)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("pickup_points")
      .select("id, name, address")
      .eq("status", "abierto")
      .order("name"),
  ]);

  // Rellena el mosaico con fotos del catalogo y completa con las de respaldo.
  const mosaic = fallbackMosaic.map((fallback, i) => {
    const product = products?.[i];
    return product?.image_url ? { src: product.image_url, alt: product.name } : fallback;
  });

  return {
    mosaic,
    pickupPoints: (pickupPoints ?? []) satisfies PickupPointSummary[],
  };
}

const ctaBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 font-sans text-label-md transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";

export default async function LandingPage() {
  const { mosaic, pickupPoints } = await getLandingData();

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero mobile: foto a pantalla completa con logo superpuesto (onboarding_breadly) */}
      <section className="relative flex h-[calc(100dvh-80px)] min-h-[560px] w-full flex-col overflow-hidden md:hidden">
        <Parallax speed={0.2}>
          <Image
            src={heroMobileImage}
            alt="Pan de masa madre recién horneado con la corteza enharinada"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/30 to-inverse-surface/40" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-margin-mobile pb-12 pt-10 text-center">
          <Image
            src="/images/logo-panacasa.png"
            alt="PanACasa"
            width={640}
            height={640}
            priority
            className="h-28 w-28 animate-fade-up drop-shadow-xl"
          />
          <div className="flex animate-fade-up flex-col items-center gap-8">
            <h1 className="font-serif text-display-lg-mobile text-white">
              Pan que sabe a tiempo, fermento y calma.
            </h1>
            <Link
              href="/catalogo"
              className={`${ctaBase} w-full max-w-xs bg-primary-container py-5 text-on-primary shadow-soft-lg hover:brightness-110`}
            >
              Empezar
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Hero desktop: split layout (onboarding_desktop) */}
      <section className="hidden bg-surface-container-low md:block">
        <div className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-[1440px] grid-cols-2 items-center gap-16 px-margin-desktop py-section-gap">
          <div className="animate-fade-up space-y-8">
            <Image
              src="/images/logo-panacasa.png"
              alt="PanACasa"
              width={640}
              height={640}
              priority
              className="h-24 w-24 drop-shadow-md"
            />
            <span className="block font-sans text-label-md uppercase tracking-widest text-primary-container">
              El ritual de la mañana
            </span>
            <h1 className="max-w-xl font-serif text-display-lg text-primary lg:text-[56px] lg:leading-[64px]">
              Pan que sabe a tiempo, fermento y calma.
            </h1>
            <p className="max-w-md font-sans text-body-lg text-on-surface-variant">
              Panes de fermentación lenta, harinas de molino de piedra y cortezas crujientes.
              De nuestro horno a tu mesa, sin intermediarios.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/catalogo"
                className={`${ctaBase} bg-primary py-5 text-on-primary shadow-soft-lg hover:shadow-soft-lg hover:brightness-110`}
              >
                Empezar
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <a
                href="#como-funciona"
                className={`${ctaBase} border-2 border-primary py-5 text-primary hover:bg-primary/5`}
              >
                Cómo funciona
              </a>
            </div>
          </div>

          <div className="relative h-[600px]">
            <div className="absolute inset-0 rotate-1 overflow-hidden rounded-xl shadow-soft-lg">
              <Parallax>
                <Image
                  src={heroDesktopImage}
                  alt="Panadero espolvoreando harina sobre una hogaza rústica"
                  fill
                  priority
                  sizes="50vw"
                  className="object-cover"
                />
              </Parallax>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
            <div className="absolute -bottom-8 -left-10 max-w-xs -rotate-2 space-y-2 rounded-lg border border-outline-variant/30 bg-surface p-6 shadow-soft-lg">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={heroTextureImage}
                    alt="Miga aireada de pan de masa madre"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-serif text-headline-sm text-primary">Masa madre de 50 años</p>
                  <p className="font-sans text-label-sm text-on-surface-variant">
                    Horneado cada madrugada
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Que nos hace diferentes */}
      <section
        id="como-funciona"
        className="mx-auto w-full max-w-[1440px] scroll-mt-20 px-margin-mobile py-section-gap md:px-margin-desktop md:py-24"
      >
        <FadeIn className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <h2 className="font-serif text-headline-md text-primary">¿Qué nos hace diferentes?</h2>
        </FadeIn>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          {differentiators.map((item, i) => (
            <FadeIn key={item.title} delay={i * 120} className="h-full">
              <article className="flex h-full flex-col rounded-lg border border-primary/5 bg-surface-container-lowest p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg md:p-10">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
                  <span className="material-symbols-outlined text-[32px] text-primary">
                    {item.icon}
                  </span>
                </div>
                <h3 className="mb-4 font-serif text-headline-sm text-primary">{item.title}</h3>
                <p className="mb-6 flex-grow font-sans text-body-md text-on-surface-variant">
                  {item.description}
                </p>
                <ul className="space-y-3">
                  {item.checks.map((check) => (
                    <li
                      key={check}
                      className="flex items-center gap-2 font-sans text-label-md text-on-secondary-fixed-variant"
                    >
                      <span
                        className="material-symbols-outlined text-[18px] text-primary-container"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      {check}
                    </li>
                  ))}
                </ul>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* El secreto esta en la pausa */}
      <section className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-margin-mobile py-section-gap md:grid-cols-12 md:gap-gutter md:px-margin-desktop">
        <FadeIn className="md:col-span-5 md:pr-8">
          <h2 className="mb-6 font-serif text-display-lg-mobile text-primary md:text-display-lg">
            El secreto está en la pausa.
          </h2>
          <p className="mb-8 font-sans text-body-lg text-on-surface-variant">
            Mientras el mundo corre, nosotros nos detenemos. Dejamos que las bacterias naturales
            hagan su magia, rompiendo los glútenes difíciles y creando un sabor complejo y una
            digestibilidad superior.
          </p>
          <div className="flex flex-col gap-6">
            {secretPoints.map((point) => (
              <div key={point.title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="material-symbols-outlined text-primary">{point.icon}</span>
                </div>
                <div>
                  <h3 className="font-sans text-label-md text-primary">{point.title}</h3>
                  <p className="font-sans text-body-md text-on-surface-variant">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={150} className="grid grid-cols-2 gap-4 md:col-span-7">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-soft">
            <Image
              src={mosaic[0].src}
              alt={mosaic[0].alt}
              fill
              sizes="(min-width: 768px) 30vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="relative min-h-[96px] flex-grow overflow-hidden rounded-xl shadow-soft">
              <Image
                src={mosaic[1].src}
                alt={mosaic[1].alt}
                fill
                sizes="(min-width: 768px) 30vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-xl shadow-soft">
              <Image
                src={mosaic[2].src}
                alt={mosaic[2].alt}
                fill
                sizes="(min-width: 768px) 30vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Recogida o Envio */}
      <section id="entrega" className="bg-surface-container-low py-section-gap md:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-margin-mobile md:px-margin-desktop">
          <FadeIn className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 font-serif text-headline-md text-primary">Recogida o Envío</h2>
            <p className="font-sans text-body-lg text-on-surface-variant">
              Elige la comodidad de recibir pan recién horneado en tu puerta o disfruta del paseo
              recogiendo tu suscripción en tu obrador de confianza.
            </p>
          </FadeIn>
          <FadeIn delay={120}>
            <FulfillmentChooser pickupPoints={pickupPoints} />
          </FadeIn>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile py-section-gap md:px-margin-desktop">
        <FadeIn>
          <div className="relative overflow-hidden rounded-xl bg-primary-container px-6 py-16 text-center shadow-soft-lg md:p-16">
            <span
              aria-hidden
              className="material-symbols-outlined pointer-events-none absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 text-[300px] text-on-primary opacity-10"
            >
              bakery_dining
            </span>
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="mb-6 font-serif text-display-lg-mobile text-on-primary-container md:text-display-lg">
                Empieza tu ritual hoy.
              </h2>
              <p className="mb-10 font-sans text-body-lg text-primary-fixed">
                Únete a nuestra comunidad de amantes del buen pan y recibe cada semana panes
                recién salidos del horno.
              </p>
              <div className="flex flex-col justify-center gap-4 md:flex-row">
                <Link
                  href="/plan"
                  className={`${ctaBase} bg-surface text-primary shadow-soft-lg hover:scale-105`}
                >
                  Ver Planes de Suscripción
                </Link>
                <Link
                  href="/catalogo"
                  className={`${ctaBase} border-2 border-surface text-surface hover:bg-surface/10`}
                >
                  Explorar el Catálogo
                </Link>
              </div>
              <p className="mt-8 font-sans text-label-sm italic text-on-primary-container/80">
                Pruébalo sin riesgo. Sin cargos por cancelación.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
