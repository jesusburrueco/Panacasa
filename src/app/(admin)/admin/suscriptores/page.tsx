import { Suspense } from "react";
import { SubscriberFilters } from "@/components/admin/SubscriberFilters";
import { getSubscriberDirectory } from "@/lib/supabase/subscriber-directory";
import { SubscribersTable } from "./SubscribersTable";

export default async function SuscriptoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; plan?: string }>;
}) {
  const { q, estado, plan } = await searchParams;

  const allSubscribers = await getSubscriberDirectory();

  let subscribers = allSubscribers;

  if (q) {
    const query = q.toLowerCase();
    subscribers = subscribers.filter(
      (subscriber) =>
        subscriber.fullName?.toLowerCase().includes(query) ||
        subscriber.email?.toLowerCase().includes(query)
    );
  }
  if (estado && estado !== "todos") {
    subscribers = subscribers.filter(
      (subscriber) => subscriber.currentSubscription?.status === estado
    );
  }
  if (plan && plan !== "todos") {
    subscribers = subscribers.filter(
      (subscriber) => subscriber.currentSubscription?.frequency === plan
    );
  }

  return (
    <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="font-serif text-display-lg-mobile text-primary md:text-display-lg">
          Gestión de Suscriptores
        </h1>
      </div>

      <Suspense fallback={<div className="mb-8 h-[92px] rounded-lg bg-surface-container-lowest" />}>
        <SubscriberFilters />
      </Suspense>

      <SubscribersTable subscribers={subscribers} totalCount={allSubscribers.length} />
    </main>
  );
}
