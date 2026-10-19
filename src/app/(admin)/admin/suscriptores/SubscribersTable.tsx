"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { SubscriberSummary } from "@/lib/supabase/subscriber-directory";
import {
  bulkSetSubscriptionStatusAction,
  deleteSubscribersAction,
} from "@/lib/supabase/subscriber-admin-actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const statusClasses: Record<string, { chip: string; dot: string; label: string }> = {
  active: { chip: "bg-green-100 text-green-800", dot: "bg-green-600", label: "Activo" },
  paused: { chip: "bg-orange-100 text-orange-800", dot: "bg-orange-600", label: "Pausado" },
  cancelled: { chip: "bg-gray-100 text-gray-600", dot: "bg-gray-400", label: "Cancelado" },
  past_due: { chip: "bg-red-100 text-red-700", dot: "bg-red-500", label: "Pago pendiente" },
};

type BulkStatus = "active" | "paused" | "cancelled";

type OptimisticChange =
  | { type: "status"; profileIds: string[]; status: BulkStatus }
  | { type: "delete"; profileIds: string[]; deleteProfiles: boolean };

/** Peticion de borrado pendiente de confirmar en el modal. */
type DeleteRequest = { profileIds: string[]; allowProfileDeletion: boolean };

function applyChange(rows: SubscriberSummary[], change: OptimisticChange): SubscriberSummary[] {
  const ids = new Set(change.profileIds);
  if (change.type === "delete" && change.deleteProfiles) {
    return rows.filter((row) => !ids.has(row.id));
  }
  return rows.map((row) => {
    if (!ids.has(row.id) || !row.currentSubscription) return row;
    return change.type === "delete"
      ? { ...row, currentSubscription: null }
      : { ...row, currentSubscription: { ...row.currentSubscription, status: change.status } };
  });
}

export function SubscribersTable({
  subscribers,
  totalCount,
}: {
  subscribers: SubscriberSummary[];
  totalCount: number;
}) {
  const [rows, applyOptimistic] = useOptimistic(subscribers, applyChange);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
  const [deleteProfiles, setDeleteProfiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const headerCheckbox = useRef<HTMLInputElement>(null);

  // La seleccion solo conserva filas que siguen visibles (filtros, borrados).
  const visibleIds = new Set(rows.map((row) => row.id));
  const selectedIds = [...selected].filter((id) => visibleIds.has(id));
  const selectedRows = rows.filter((row) => selected.has(row.id));
  const selectedSubscriptionIds = selectedRows.flatMap((row) =>
    row.currentSubscription ? [row.currentSubscription.id] : []
  );
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  useEffect(() => {
    if (headerCheckbox.current) {
      headerCheckbox.current.indeterminate = selectedIds.length > 0 && !allSelected;
    }
  }, [selectedIds.length, allSelected]);

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)));

  function runStatus(status: BulkStatus) {
    const profileIds = selectedRows.filter((row) => row.currentSubscription).map((row) => row.id);
    const subscriptionIds = selectedSubscriptionIds;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "status", profileIds, status });
      const result = await bulkSetSubscriptionStatusAction(subscriptionIds, status);
      if (result.error) setError(result.error);
      else setSelected(new Set());
    });
  }

  function runDelete() {
    if (!deleteRequest) return;
    const { profileIds } = deleteRequest;
    const withProfiles = deleteRequest.allowProfileDeletion && deleteProfiles;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "delete", profileIds, deleteProfiles: withProfiles });
      const result = await deleteSubscribersAction(profileIds, withProfiles);
      if (result.error) setError(result.error);
      setSelected((prev) => {
        const next = new Set(prev);
        profileIds.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteRequest(null);
      setDeleteProfiles(false);
    });
  }

  const deleteCount = deleteRequest
    ? rows.filter((row) => deleteRequest.profileIds.includes(row.id) && row.currentSubscription)
        .length
    : 0;

  return (
    <>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
        >
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container">
                <th className="w-12 py-4 pl-6 pr-2">
                  <input
                    ref={headerCheckbox}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={rows.length === 0}
                    aria-label="Seleccionar todos los suscriptores"
                    className="h-5 w-5 cursor-pointer rounded border-outline text-primary focus:ring-primary"
                  />
                </th>
                {[
                  "Suscriptor",
                  "Plan",
                  "Estado",
                  "Próxima entrega",
                  "Método de entrega",
                  "Miembro desde",
                  "Acciones",
                ].map((label) => (
                  <th
                    key={label}
                    className="px-6 py-4 font-sans text-label-md text-on-surface-variant"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {rows.map((subscriber) => {
                const status = subscriber.currentSubscription
                  ? statusClasses[subscriber.currentSubscription.status]
                  : null;
                const isSelected = selected.has(subscriber.id);
                return (
                  <tr
                    key={subscriber.id}
                    className={cn(
                      "transition-colors",
                      isSelected ? "bg-primary-fixed/40" : "hover:bg-surface-container-low"
                    )}
                  >
                    <td className="py-5 pl-6 pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(subscriber.id)}
                        aria-label={`Seleccionar ${subscriber.fullName ?? "suscriptor"}`}
                        className="h-5 w-5 cursor-pointer rounded border-outline text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        href={`/admin/suscriptores/${subscriber.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <div>
                          <p className="font-sans font-semibold text-on-surface">
                            {subscriber.fullName ?? "Sin nombre"}
                          </p>
                          <p className="font-sans text-label-sm text-on-surface-variant">
                            {subscriber.email ?? "—"}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      {subscriber.currentSubscription?.planName ? (
                        <span className="rounded-full border border-outline-variant bg-surface-container-highest px-3 py-1 font-sans text-label-sm font-medium capitalize text-tertiary">
                          {subscriber.currentSubscription.planName}
                        </span>
                      ) : (
                        <span className="font-sans text-label-sm text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {status ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-label-sm font-semibold ${status.chip}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      ) : (
                        <span className="font-sans text-label-sm text-on-surface-variant">
                          Sin suscripción
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 font-sans text-body-md text-on-surface-variant">
                      {subscriber.currentSubscription?.nextDeliveryDate
                        ? new Date(
                            subscriber.currentSubscription.nextDeliveryDate
                          ).toLocaleDateString("es-ES")
                        : "—"}
                    </td>
                    <td className="px-6 py-5 font-sans text-body-md text-on-surface-variant">
                      {subscriber.address ?? "—"}
                    </td>
                    <td className="px-6 py-5 font-sans text-body-md text-on-surface-variant">
                      {new Date(subscriber.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-5">
                      <RowMenu
                        subscriber={subscriber}
                        onDelete={() =>
                          setDeleteRequest({
                            profileIds: [subscriber.id],
                            allowProfileDeletion: false,
                          })
                        }
                      />
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center font-sans text-body-md text-on-surface-variant"
                  >
                    No se encontraron suscriptores con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-6 py-4">
          <span className="font-sans text-label-sm text-on-surface-variant">
            Mostrando {rows.length} de {totalCount} suscriptores
          </span>
        </div>
      </div>

      {/* Hueco para que la barra fija no tape la ultima fila. */}
      {selectedIds.length > 0 && <div className="h-28" aria-hidden />}

      {selectedIds.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 md:pl-64">
          <div
            role="toolbar"
            aria-label="Acciones en masa"
            className="pointer-events-auto flex w-full max-w-4xl flex-col gap-3 rounded-lg bg-inverse-surface px-5 py-4 text-inverse-on-surface shadow-soft-lg lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                aria-label="Quitar selección"
                className="rounded-full p-1 transition-colors hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <span className="font-sans text-label-md">
                {selectedIds.length} {selectedIds.length === 1 ? "seleccionado" : "seleccionados"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <BulkButton
                icon="pause_circle"
                label="Pausar seleccionados"
                disabled={isPending || selectedSubscriptionIds.length === 0}
                onClick={() => runStatus("paused")}
              />
              <BulkButton
                icon="play_circle"
                label="Activar seleccionados"
                disabled={isPending || selectedSubscriptionIds.length === 0}
                onClick={() => runStatus("active")}
              />
              <BulkButton
                icon="cancel"
                label="Cancelar seleccionados"
                disabled={isPending || selectedSubscriptionIds.length === 0}
                onClick={() => runStatus("cancelled")}
              />
              <BulkButton
                icon="delete"
                label="Eliminar seleccionados"
                destructive
                disabled={isPending}
                onClick={() =>
                  setDeleteRequest({ profileIds: selectedIds, allowProfileDeletion: true })
                }
              />
            </div>
          </div>
        </div>
      )}

      {deleteRequest && (
        <ConfirmDialog
          title="¿Estás seguro?"
          confirmLabel="Eliminar"
          pending={isPending}
          onConfirm={runDelete}
          onCancel={() => {
            setDeleteRequest(null);
            setDeleteProfiles(false);
          }}
        >
          <p>
            Esta acción no se puede deshacer. Se eliminarán {deleteCount}{" "}
            {deleteCount === 1 ? "suscripción" : "suscripciones"}, con sus panes y entregas
            programadas.
          </p>
          {deleteRequest.allowProfileDeletion ? (
            <label className="flex items-start gap-3 rounded-lg border border-outline-variant p-4">
              <input
                type="checkbox"
                checked={deleteProfiles}
                onChange={(event) => setDeleteProfiles(event.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-outline text-error focus:ring-error"
              />
              <span>
                <span className="block font-semibold text-on-surface">
                  Eliminar también {deleteRequest.profileIds.length === 1 ? "el perfil" : `los ${deleteRequest.profileIds.length} perfiles`}
                </span>
                Borra la cuenta completa del usuario (acceso, datos y pedidos).
              </span>
            </label>
          ) : (
            <p>El perfil del cliente se mantiene.</p>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}

function BulkButton({
  icon,
  label,
  onClick,
  disabled,
  destructive = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-2 font-sans text-label-md transition-all active:scale-95 disabled:opacity-40",
        destructive
          ? "bg-error text-on-error hover:brightness-110"
          : "bg-white/10 hover:bg-white/20"
      )}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  );
}

/**
 * Menu de los tres puntos. Se posiciona con `fixed` para que el
 * `overflow-x-auto` de la tabla no lo recorte.
 */
function RowMenu({ subscriber, onDelete }: { subscriber: SubscriberSummary; onDelete: () => void }) {
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);

  const toggle = () => {
    if (position) return setPosition(null);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  };

  const name = subscriber.fullName ?? "suscriptor";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        aria-label={`Acciones de ${name}`}
        className="rounded-full p-1 text-outline transition-colors hover:bg-surface-variant hover:text-primary"
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>
      {position && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: position.top, right: position.right }}
          className="fixed z-[60] min-w-[200px] overflow-hidden rounded-lg bg-surface-container-lowest py-1 shadow-soft-lg ring-1 ring-outline-variant/50"
        >
          <Link
            role="menuitem"
            href={`/admin/suscriptores/${subscriber.id}`}
            className="flex items-center gap-3 px-4 py-2.5 font-sans text-label-md text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">visibility</span>
            Ver detalle
          </Link>
          <button
            role="menuitem"
            type="button"
            disabled={!subscriber.currentSubscription}
            title={subscriber.currentSubscription ? undefined : "No tiene suscripción"}
            onClick={() => {
              setPosition(null);
              onDelete();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-sans text-label-md text-error hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
            Eliminar
          </button>
        </div>
      )}
    </>
  );
}
