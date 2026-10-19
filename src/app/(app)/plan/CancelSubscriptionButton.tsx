"use client";

import { cancelSubscriptionAction } from "@/lib/supabase/subscription-actions";

export function CancelSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  return (
    <form
      action={cancelSubscriptionAction.bind(null, subscriptionId)}
      onSubmit={(event) => {
        if (!confirm("¿Seguro que quieres cancelar tu suscripción? Dejarás de recibir pan.")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-2 rounded-full px-6 py-3 font-sans text-label-md text-error transition-all hover:bg-error-container active:scale-95"
      >
        <span className="material-symbols-outlined text-[20px]">cancel</span>
        Cancelar suscripción
      </button>
    </form>
  );
}
