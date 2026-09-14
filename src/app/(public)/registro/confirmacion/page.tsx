import Link from "next/link";

export default function RegistroConfirmacionPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-margin-mobile py-24 text-center md:px-margin-desktop">
      <span className="material-symbols-outlined rounded-full bg-primary-fixed p-4 text-4xl text-primary">
        mark_email_read
      </span>
      <h1 className="font-serif text-headline-md text-primary">Revisa tu correo</h1>
      <p className="max-w-md font-sans text-body-lg text-on-surface-variant">
        Te enviamos un enlace de confirmación. Ábrelo desde tu bandeja de
        entrada para activar tu cuenta y empezar a elegir tus panes.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-primary px-8 py-4 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110 active:scale-95"
      >
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
