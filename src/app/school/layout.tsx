import { NavBar } from "@/components/NavBar";
import { requireRole } from "@/lib/auth";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("school");
  return (
    <>
      <NavBar
        role="school"
        name={profile.full_name}
        links={[
          { href: "/school", label: "Students" },
          { href: "/school/jobs", label: "Open roles" },
          { href: "/school/merch", label: "Merchandise" },
          { href: "/school/orders", label: "Orders" },
          { href: "/school/viewers", label: "Who viewed" },
        ]}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
    </>
  );
}
