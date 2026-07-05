import { NavBar } from "@/components/NavBar";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("admin");
  return (
    <>
      <NavBar
        role="admin"
        name={profile.full_name}
        links={[
          { href: "/admin", label: "Overview" },
          { href: "/admin/users", label: "Approvals" },
          { href: "/admin/students", label: "Students" },
          { href: "/admin/listings", label: "Listings" },
          { href: "/admin/products", label: "Products" },
          { href: "/admin/orders", label: "Orders" },
        ]}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
    </>
  );
}
