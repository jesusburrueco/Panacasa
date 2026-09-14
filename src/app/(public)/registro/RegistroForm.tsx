"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { signUpAction, type AuthActionState } from "@/lib/supabase/actions";

const initialState: AuthActionState = { error: null };

export function RegistroForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <p
          role="alert"
          className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
        >
          {state.error}
        </p>
      )}

      <Input
        label="Nombre Completo"
        name="fullName"
        type="text"
        icon="person"
        placeholder="Tu nombre"
        autoComplete="name"
        required
      />

      <Input
        label="Correo Electrónico"
        name="email"
        type="email"
        icon="mail"
        placeholder="ejemplo@correo.com"
        autoComplete="email"
        required
      />

      <Input
        label="Contraseña"
        name="password"
        type={showPassword ? "text" : "password"}
        icon="lock"
        placeholder="Mínimo 8 caracteres"
        autoComplete="new-password"
        minLength={8}
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

      <Checkbox
        name="terms"
        required
        label={
          <>
            Acepto los{" "}
            <a href="#" className="text-primary hover:underline">
              Términos de Servicio
            </a>{" "}
            y la{" "}
            <a href="#" className="text-primary hover:underline">
              Política de Privacidad
            </a>
            .
          </>
        }
      />

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={isPending}>
        {isPending ? "Creando cuenta..." : "Crear Cuenta"}
      </Button>
    </form>
  );
}
