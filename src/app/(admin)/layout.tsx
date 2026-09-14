import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col">
      <AdminSidebar />
      <main className="flex flex-1 flex-col md:ml-64">{children}</main>
    </div>
  );
}
