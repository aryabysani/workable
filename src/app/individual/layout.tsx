import { NavBar } from "@/components/NavBar";
import { requireRole } from "@/lib/auth";

export default async function IndividualLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("individual");
  return (
    <>
      <NavBar
        role="individual"
        name={profile.full_name}
        links={[
          { href: "/individual", label: "My profile" },
          { href: "/individual/jobs", label: "Open roles" },
          { href: "/individual/viewers", label: "Who viewed me" },
        ]}
      />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
    </>
  );
}
