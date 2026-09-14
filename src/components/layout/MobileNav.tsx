"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/catalogo", label: "Catalogo", icon: "bakery_dining" },
  { href: "/plan", label: "Mi Plan", icon: "calendar_today" },
  { href: "/perfil", label: "Perfil", icon: "person" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-lg bg-surface-container px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(139,69,19,0.08)] md:hidden">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-1 transition-all",
              active
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-secondary-container/50"
            )}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            <span className="font-sans text-label-sm">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
