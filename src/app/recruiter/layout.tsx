import { NavBar } from "@/components/NavBar";
import { requireRole } from "@/lib/auth";

export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("recruiter");
  return (
    <>
      <NavBar
        role="recruiter"
        name={profile.full_name}
        links={[
          { href: "/recruiter", label: "Find talent" },
          { href: "/recruiter/jobs", label: "My listings" },
          { href: "/recruiter/marketplace", label: "Marketplace" },
          { href: "/recruiter/orders", label: "My orders" },
        ]}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
    </>
  );
}
