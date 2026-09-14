"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signInAction, type AuthActionState } from "@/lib/supabase/actions";

const initialState: AuthActionState = { error: null };

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state.error && (
        <p
          role="alert"
          className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
        >
          {state.error}
        </p>
      )}

      <Input
        label="Correo Electrónico"
        name="email"
        type="email"
        icon="mail"
        placeholder="tu@correo.com"
        autoComplete="email"
        required
      />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <label htmlFor="password" className="font-sans text-label-md text-on-surface-variant">
            Contraseña
          </label>
          <a href="#" className="font-sans text-label-sm text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          icon="lock"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="text-outline transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          }
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
        {!isPending && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
      </Button>
    </form>
  );
}
