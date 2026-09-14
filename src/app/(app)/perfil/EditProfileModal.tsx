"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Tables } from "@/lib/supabase/types";
import {
  updateProfileAction,
  type ProfileActionState,
} from "@/lib/supabase/profile-actions";

type Profile = Tables<"profiles">;
type DeliveryZone = Tables<"delivery_zones">;

const initialState: ProfileActionState = { error: null };

export function EditProfileModal({
  profile,
  deliveryZones,
}: {
  profile: Profile;
  deliveryZones: DeliveryZone[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  return (
    <>
      <Button variant="outline" type="button" onClick={() => setOpen(true)}>
        Editar Perfil
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg bg-surface-container-low shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant p-6">
              <h3 className="font-serif text-headline-sm text-primary">Editar Perfil</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="rounded-full p-2 transition-colors hover:bg-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form action={formAction} className="space-y-4 p-6">
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
                defaultValue={profile.full_name ?? ""}
                required
              />
              <Input label="Teléfono" name="phone" defaultValue={profile.phone ?? ""} />
              <Input label="Dirección" name="address" defaultValue={profile.address ?? ""} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Ciudad" name="city" defaultValue={profile.city ?? ""} />
                <Input
                  label="Código Postal"
                  name="postalCode"
                  defaultValue={profile.postal_code ?? ""}
                />
              </div>
              <Select
                label="Zona de reparto"
                name="deliveryZoneId"
                defaultValue={profile.delivery_zone_id ?? ""}
              >
                <option value="">Sin definir</option>
                {deliveryZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </Select>

              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant"
                >
                  Cancelar
                </button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
