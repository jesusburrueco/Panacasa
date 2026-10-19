import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartRoot } from "@/components/cart/CartRoot";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartRoot>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </div>
    </CartRoot>
  );
}
