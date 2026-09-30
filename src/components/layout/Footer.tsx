import Link from "next/link";
import {
  CONTACT,
  CONTACT_PHONE_DISPLAY,
  contactMailto,
  contactTel,
  contactWhatsapp,
} from "@/lib/constants";

const footerLinks = [
  { href: "#", label: "Nuestra Historia" },
  { href: "#", label: "Sostenibilidad" },
  { href: "#", label: "Mayoristas" },
  { href: "#contacto", label: "Contacto" },
  { href: "#", label: "Privacidad" },
];

const contactLinks = [
  { href: contactTel(), label: CONTACT_PHONE_DISPLAY, icon: "call", external: false },
  { href: contactMailto(), label: CONTACT.email, icon: "mail", external: false },
  { href: contactWhatsapp(), label: "WhatsApp", icon: "chat", external: true },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant/10 bg-surface-container-lowest shadow-inset">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-gutter px-margin-mobile py-12 md:flex-row md:items-start md:px-margin-desktop">
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

        <address id="contacto" className="flex flex-col items-center gap-3 not-italic md:items-start">
          <span className="font-sans text-label-sm uppercase tracking-widest text-primary">
            Contacto
          </span>
          {contactLinks.map((link) => (
            <a
              key={link.icon}
              href={link.href}
              {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
              className="group flex items-center gap-2 font-sans text-label-md text-on-surface-variant transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined rounded-full p-1 text-[20px] text-primary transition-colors group-hover:bg-primary-fixed">
                {link.icon}
              </span>
              {link.label}
            </a>
          ))}
          <span className="flex items-center gap-2 font-sans text-label-sm text-outline">
            <span className="material-symbols-outlined p-1 text-[20px]">location_on</span>
            {CONTACT.address}
          </span>
        </address>
      </div>
    </footer>
  );
}
