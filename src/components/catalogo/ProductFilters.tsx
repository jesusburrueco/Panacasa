"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export const SORT_OPTIONS = [
  { value: "populares", label: "Más Populares" },
  { value: "precio-asc", label: "Precio: Bajo a Alto" },
  { value: "recientes", label: "Recién Horneados" },
] as const;

export function ProductFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("categoria") ?? "todos";
  const activeSort = searchParams.get("orden") ?? "populares";

  const buildHref = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "todos" || value === "populares") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {["todos", ...categories].map((category) => {
        const active = category === activeCategory;
        return (
          <Link
            key={category}
            href={buildHref({ categoria: category })}
            className={cn(
              "rounded-full px-6 py-2 font-sans text-label-md capitalize transition-all",
              active
                ? "bg-primary text-on-primary"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant"
            )}
          >
            {category === "todos" ? "Todos" : category}
          </Link>
        );
      })}

      <div className="ml-auto flex items-center gap-2 text-outline">
        <span className="font-sans text-label-sm uppercase tracking-wider">
          Ordenar por:
        </span>
        <select
          value={activeSort}
          onChange={(e) => router.push(buildHref({ orden: e.target.value }))}
          className="cursor-pointer border-none bg-transparent font-sans text-label-md text-primary focus:outline-none focus:ring-0"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
