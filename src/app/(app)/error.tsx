"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-mobile py-24 text-center md:px-margin-desktop">
      <span className="material-symbols-outlined text-4xl text-error">error</span>
      <h1 className="font-serif text-headline-md text-primary">Algo salió mal</h1>
      <p className="max-w-md font-sans text-body-md text-on-surface-variant">
        No pudimos cargar esta página. Si el proyecto Supabase todavía no está
        conectado, revisa las credenciales en tu archivo <code>.env.local</code>.
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="max-w-md font-sans text-label-sm text-error">{error.message}</p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-full bg-primary px-6 py-3 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110 active:scale-95"
      >
        Reintentar
      </button>
    </main>
  );
}
