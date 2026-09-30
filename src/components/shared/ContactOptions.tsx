import { cn } from "@/lib/utils";
import {
  CONTACT,
  CONTACT_PHONE_DISPLAY,
  contactMailto,
  contactTel,
  contactWhatsapp,
} from "@/lib/constants";

export interface ContactOptionsProps {
  /** Asunto del email y mensaje inicial de WhatsApp. */
  subject?: string;
  message?: string;
  /** "buttons": pildoras en fila; "list": filas con icono y dato visible. */
  variant?: "buttons" | "list";
  className?: string;
}

/** Enlaces de contacto (email, telefono, WhatsApp) a partir de CONTACT. */
export function ContactOptions({
  subject,
  message,
  variant = "buttons",
  className,
}: ContactOptionsProps) {
  const options = [
    {
      href: contactWhatsapp(message),
      label: "WhatsApp",
      value: CONTACT_PHONE_DISPLAY,
      icon: "chat",
      external: true,
    },
    {
      href: contactTel(),
      label: "Llamar",
      value: CONTACT_PHONE_DISPLAY,
      icon: "call",
      external: false,
    },
    {
      href: contactMailto(subject),
      label: "Email",
      value: CONTACT.email,
      icon: "mail",
      external: false,
    },
  ];

  if (variant === "list") {
    return (
      <ul className={cn("space-y-3", className)}>
        {options.map((option) => (
          <li key={option.label}>
            <a
              href={option.href}
              {...(option.external && { target: "_blank", rel: "noopener noreferrer" })}
              className="flex items-center gap-4 rounded-lg bg-surface p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed text-primary">
                {option.icon}
              </span>
              <span className="flex flex-col">
                <span className="font-sans text-label-md text-on-surface">{option.label}</span>
                <span className="font-sans text-label-sm text-on-surface-variant">
                  {option.value}
                </span>
              </span>
              <span className="material-symbols-outlined ml-auto text-outline">
                arrow_forward
              </span>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {options.map((option, index) => (
        <a
          key={option.label}
          href={option.href}
          {...(option.external && { target: "_blank", rel: "noopener noreferrer" })}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-6 py-3 font-sans text-label-md transition-all active:scale-95",
            index === 0
              ? "bg-primary text-on-primary shadow-soft hover:brightness-110"
              : "border-2 border-primary text-primary hover:bg-primary-fixed"
          )}
        >
          <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
          {option.label}
        </a>
      ))}
    </div>
  );
}
