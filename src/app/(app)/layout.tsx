import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartRoot } from "@/components/cart/CartRoot";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartRoot>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col pb-20 md:pb-0">{children}</div>
        <MobileNav />
      </div>
    </CartRoot>
  );
}
