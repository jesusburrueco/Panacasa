import Image from "next/image";
import Link from "next/link";

const heroMobileImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDg0tWBQOPDc23k2ibEiJcJz47qfhVIpXIICR1DMmm1nYyH9h34UlzYFVXKpre3eKqIDrwy-eM80EDGTGbic9KorE-QcBWdkAWAKUrpM89q3OpEoeWC978_BOnTXq2b03dORNl7NlfsXxpiFYua7ZkgVIaRqEkMHSLA2mUGpz1HeawH81HACyCxRsmL6x8bDz0B_sMy3sIBBTVqS87N_B-3hNM-31iJfRbnppGgrOaPfTHTTkw3oEcW77lkGANG5h3rXolCeyav2dA";

const heroDesktopImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDrfxjOzkX61x2Cl1TRH33i3zZVnQjyV74RJiyP6ZNJZIzyCRdQlpXbfUySher_t8DLe1PsmsamkeiwtOQl9xbXK8zHaZz8Jy2cmJcMQVBFuqQkCOVICPfI3-Tz6wFnuQ6EUPFvmlsH-bTxmvyMjheJCnvayDbytJeuHorY7try9K3vcyIoo30Xppgbtd-RpDr9WE3IjM3PZ3fmag3JlEyAI28Ckj3HygqDKMw4t_4vVVJ4_wwxjEHX";

const heroTextureImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAAqYN-d0wPgNTcMZiTTDn5WLKrzuryvH3iFQrp6CnHI6Pg4Z_bFY769KzDNJpNjkxbvqC3xYu-vJhZunnDOMkW5jfyYU9wE1X3g7UiADmhwiY9_AnLHFeda-5eihMH341VHEJ26X9iZjJmnil6x8on6eiIQp7rclRGOGOwmA08EpSNT0lsamYc7mNX02MVJzNrK4ZQrc5PFLHm_TdRZ-pMMcioL-HP138EPB14dyUBbHTZ9v9c0NHr";

const pillars = [
  {
    icon: "timer",
    title: "Fermentación Lenta",
    description:
      "Dejamos que la masa respire y desarrolle sabor natural durante 24 a 48 horas. Sin prisas, solo sabor puro.",
  },
  {
    icon: "local_shipping",
    title: "Entrega Matutina",
    description:
      "Horneamos en la madrugada para que el olor a pan fresco te despierte. Entrega directa en tu puerta antes de las 8:00 AM.",
  },
  {
    icon: "eco",
    title: "Ingredientes Reales",
    description:
      "Solo tres ingredientes: harina orgánica, agua y sal de mar. Sin conservadores, sin azúcares añadidos.",
  },
];

const plans = [
  {
    name: "El Ritual Diario",
    description: "1 pan grande + 2 baguettes",
    price: "29.00€ /sem",
    badge: "Popular",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCFrB4f4VWKAZhOrQ5y38-i-NnrBLdj-By0lyMakhwxX1DPzkBvepc2tngLK4mP4SKwzm79BVmhAlWEI-hlTnmRxVPLsR5ae-2RnjDGzSr0UfKIHIjGPbXMQCbEj8lW-Tanug3RT2Y5Td06G2KsfXewa0cbP4jBlOxBK_nubB-nzwoArJQ9olgUUJLGbEUpzRoHv6zE-9MD7Z4Tm1yoJ634w0aCRCncEA_iWvuHT1-uxNCdfmGl-DAF",
  },
  {
    name: "Pack Saludable",
    description: "2 panes de semillas y centeno",
    price: "35.00€ /sem",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAOulUjNvsTRLoQT3CAETBELgmAt5ltVCTIOKLeEhqhvHVjqLwd6DmWBTaHIctGB88Of9WyaiDZY4nBBEC9X35YlAtAxInSOc3ojm3CwdM_SCp0FoBx04xNj5hNJUwRkkpb1V0OFB3eLthWjmcXYquDrQI8oCdRQtzztZz7jH6oJ0QLHkh6tlmsaQV9KC5NilYLvGqlL_oR4xRmPTZi2dY8pnzOi9rD6El30UJSYoYSNhlcA9Hg6IaY",
  },
  {
    name: "Dulce Despertar",
    description: "4 croissants + 1 pan brioche",
    price: "25.00€ /sem",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDpGiLnJhA840uKDOh1PRozyy5WhvlMa4LYCApU2ppEGpofCVAfoeWPi8wMwW57ZwRAxFg-2ceAirNdypr_VWFXNA4HVfR-wkD9czDpmjggqtfaFI0mdK3-zQxeyBzaQX5oXfri5tr7Al7E5jDBY6fWldJU_xj0w1LZp1Xb6FSY4ytsFPEd3Tt6a51lErlGPmuA25nNokVb6qlx6RzCHm76PZ3mwx1azHZeTLdDVZXeiBc2eKdbR8oM",
  },
  {
    name: "Familiar",
    description: "Canasta mixta personalizada",
    price: "45.00€ /sem",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1uoNJtW00rrX80kZ-sxELY7w65sbCFgo3HB-fYSJtOnaGFin6_DAG3mybDVUCdpyEEfI7rGM8o4TwCgmxbY7xXh5YLt_zk1UypT8-E7tJgsQ9idLT9UDmLwUA8fN49GRQBlyJYoBJh4cCYCM0GDENE3HXM-u1VX-bJLU-8J6rTFOKPT7hTPcy9IdE8_YqQfMmlaQV7m6-aKzGzzki5a-EGFUOkQ3mEJkNFjgUOmJkadumT2ZRp3Pm",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero - mobile: foto a sangre completa (onboarding_breadly) */}
      <section className="relative flex h-[calc(100dvh-64px)] min-h-[560px] w-full flex-col overflow-hidden md:hidden">
        <Image
          src={heroMobileImage}
          alt="Pan de masa madre recien horneado sobre una mesa de madera"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent" />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-end gap-8 px-margin-mobile pb-16 text-center">
          <p className="font-serif text-display-lg-mobile text-white">
            El aroma del pan recién horneado, cada mañana en tu puerta.
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center rounded-full bg-primary-container px-10 py-5 font-sans text-label-md text-white shadow-soft-lg transition-all active:scale-95"
          >
            Empezar
          </Link>
        </div>
      </section>

      {/* Hero - desktop: dos columnas (onboarding_desktop) */}
      <section className="relative hidden min-h-[720px] items-center overflow-hidden bg-surface-container-low md:flex">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-12 items-center gap-gutter px-margin-desktop py-section-gap">
          <div className="col-span-6 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-1 font-sans text-label-md uppercase tracking-widest text-on-primary-fixed">
              <span className="material-symbols-outlined text-[18px]">bakery_dining</span>
              Desde el horno
            </div>
            <h1 className="max-w-lg font-serif text-display-lg leading-tight text-primary">
              Pan artesanal por suscripción, recién horneado y entregado en tu
              puerta
            </h1>
            <p className="max-w-md font-sans text-body-lg text-on-surface-variant">
              Recupera el ritual del desayuno con panes de fermentación lenta,
              harinas orgánicas y cortezas crujientes. Suscríbete y recíbelo
              cada mañana.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/registro"
                className="rounded-full bg-primary px-10 py-5 font-sans text-label-md text-on-primary shadow-soft-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                Empezar Suscripción
              </Link>
              <Link
                href="/catalogo"
                className="rounded-full border-2 border-primary px-10 py-5 font-sans text-label-md text-primary transition-all duration-300 hover:bg-primary/5"
              >
                Ver Catálogo
              </Link>
            </div>
          </div>

          <div className="relative col-span-6 h-[600px]">
            <div className="absolute right-0 top-0 h-full w-full rotate-1 overflow-hidden rounded-xl shadow-soft-lg">
              <Image
                src={heroDesktopImage}
                alt="Pan de masa madre cortado mostrando la miga aireada"
                fill
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 max-w-xs -rotate-2 space-y-3 rounded-lg border border-outline-variant/30 bg-surface p-6 shadow-soft-lg">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                  <Image
                    src={heroTextureImage}
                    alt="Textura de la miga del pan"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-sans text-label-md text-primary">Sourdough Classic</p>
                  <p className="font-sans text-label-sm text-on-surface-variant">
                    Fermentado 24h
                  </p>
                </div>
              </div>
              <div className="flex gap-1 text-tertiary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pilares de valor / Como funciona */}
      <section
        id="como-funciona"
        className="mx-auto w-full max-w-[1440px] scroll-mt-20 px-margin-mobile py-section-gap md:px-margin-desktop"
      >
        <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
          <h2 className="font-serif text-headline-md text-primary">
            Por qué elegir PanACasa
          </h2>
          <p className="font-sans text-body-md text-on-surface-variant">
            Combinamos técnicas ancestrales con la comodidad de tu hogar para
            ofrecerte el mejor pan de la ciudad.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-soft-lg transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
                <span className="material-symbols-outlined text-[32px] text-primary">
                  {pillar.icon}
                </span>
              </div>
              <h3 className="mb-4 font-serif text-headline-sm text-primary">
                {pillar.title}
              </h3>
              <p className="font-sans text-body-md text-on-surface-variant">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Suscripciones destacadas */}
      <section className="bg-surface-variant/30 py-section-gap">
        <div className="mx-auto w-full max-w-[1440px] px-margin-mobile md:px-margin-desktop">
          <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-xl">
              <h2 className="mb-4 font-serif text-headline-md text-primary">
                Encuentra tu suscripción ideal
              </h2>
              <p className="font-sans text-body-md text-on-surface-variant">
                Planes flexibles que se adaptan a tu ritmo de vida. Cambia,
                pausa o cancela cuando quieras.
              </p>
            </div>
            <div className="flex gap-2 rounded-full bg-surface-container-high p-1">
              <span className="rounded-full bg-primary px-6 py-2 font-sans text-label-md text-on-primary shadow-sm">
                Semanal
              </span>
              <span className="rounded-full px-6 py-2 font-sans text-label-md text-on-surface-variant">
                Mensual
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div key={plan.name} className="group rounded-lg bg-surface p-4 shadow-soft-lg">
                <div className="relative mb-6 h-64 overflow-hidden rounded-md">
                  <Image
                    src={plan.image}
                    alt={plan.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {plan.badge && (
                    <span className="absolute right-4 top-4 rounded-full bg-tertiary-container px-3 py-1 font-sans text-label-sm text-on-tertiary-container">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <h4 className="mb-1 font-serif text-headline-sm text-primary">
                  {plan.name}
                </h4>
                <p className="mb-4 font-sans text-body-md text-on-surface-variant">
                  {plan.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-body-lg font-bold text-primary">
                    {plan.price}
                  </span>
                  <Link
                    href="/registro"
                    aria-label={`Anadir ${plan.name}`}
                    className="rounded-full bg-surface-container-highest p-2 text-primary transition-all hover:bg-primary hover:text-on-primary"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto w-full max-w-[1440px] px-margin-mobile py-section-gap md:px-margin-desktop">
        <div className="relative overflow-hidden rounded-xl bg-primary px-6 py-16 text-center md:px-20">
          <div className="relative z-10 space-y-6">
            <h2 className="font-serif text-display-lg-mobile text-on-primary md:text-display-lg">
              Únete al club del buen pan
            </h2>
            <p className="mx-auto max-w-xl font-sans text-body-lg text-on-primary/80">
              Suscríbete a nuestro boletín para recibir recetas, consejos de
              conservación y un 10% de descuento en tu primer mes.
            </p>
            <div className="mx-auto flex max-w-lg flex-col gap-4 pt-4 md:flex-row">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="flex-grow rounded-full border border-on-primary/20 bg-surface/10 px-6 py-4 font-sans text-on-primary placeholder:text-on-primary/50 focus:outline-none focus:ring-2 focus:ring-on-primary"
              />
              <button
                type="button"
                className="rounded-full bg-surface px-10 py-4 font-sans text-label-md text-primary shadow-soft-lg transition-colors hover:bg-white"
              >
                Suscribirme
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
