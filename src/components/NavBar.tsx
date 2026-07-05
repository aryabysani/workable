import Link from "next/link";
import { signOutAction } from "@/app/auth-actions";
import { buttonClass } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { RotaryByline } from "@/components/RotaryByline";
import type { Role } from "@/lib/types";

const roleLabel: Record<Role, string> = {
  school: "School / Training Centre",
  recruiter: "Recruiter",
  admin: "Rotary Admin",
  individual: "Individual",
};

export function NavBar({
  role,
  name,
  links,
}: {
  role: Role;
  name: string;
  links: { href: string; label: string }[];
}) {
  return (
    <header className="bg-surface border-b border-border sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
        <Link href="/" aria-label="WorkAble home">
          <Logo textSize="text-lg" />
        </Link>
        <RotaryByline className="hidden lg:inline-flex" />
        <span className="hidden sm:inline text-xs font-medium text-muted bg-clay-soft/60 border border-border rounded-full px-2.5 py-1">
          {roleLabel[role]}
        </span>
        <nav className="flex items-center gap-1 ml-auto flex-wrap">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-muted hover:text-foreground px-3 py-2 rounded-lg hover:bg-border/40"
            >
              {l.label}
            </Link>
          ))}
          <span className="hidden md:inline text-sm text-muted px-2 truncate max-w-[180px]">
            {name}
          </span>
          <form action={signOutAction}>
            <button type="submit" className={buttonClass("ghost")}>
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
