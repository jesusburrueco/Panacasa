import Link from "next/link";

const footerLinks = [
  { href: "#", label: "Nuestra Historia" },
  { href: "#", label: "Sostenibilidad" },
  { href: "#", label: "Mayoristas" },
  { href: "#", label: "Contacto" },
  { href: "#", label: "Privacidad" },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant/10 bg-surface-container-lowest shadow-inset">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-gutter px-margin-mobile py-12 md:flex-row md:px-margin-desktop">
        <div className="space-y-2 text-center md:text-left">
          <Link href="/" className="font-serif text-headline-sm text-primary">
            PanACasa
          </Link>
          <p className="font-sans text-label-md text-on-surface-variant">
            &copy; {new Date().getFullYear()} PanACasa. Amasado a mano con cariño.
          </p>
        </div>

        <nav className="flex flex-wrap justify-center gap-8">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-sans text-label-md text-on-surface-variant transition-all duration-200 hover:translate-x-1 hover:text-on-surface"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-4">
          <button
            type="button"
            aria-label="Idioma"
            className="rounded-full p-2 text-primary transition-colors hover:bg-primary-fixed"
          >
            <span className="material-symbols-outlined">language</span>
          </button>
          <a
            href="mailto:hola@panacasa.com"
            aria-label="Contacto por correo"
            className="rounded-full p-2 text-primary transition-colors hover:bg-primary-fixed"
          >
            <span className="material-symbols-outlined">alternate_email</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
