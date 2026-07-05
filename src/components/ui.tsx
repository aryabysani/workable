import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-[20px] p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "clay" | "danger" | "neutral";
}) {
  const tones: Record<string, string> = {
    accent: "bg-accent-soft text-accent border border-accent-soft-border",
    clay: "bg-clay-soft text-clay border border-clay/20",
    danger: "bg-danger-soft text-danger border border-danger/20",
    neutral: "bg-clay-soft/60 text-muted border border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      <span className="text-sm text-muted">{label}</span>
      <span className="font-serif text-4xl font-semibold text-foreground tracking-[-0.02em]">{value}</span>
      {sub != null && <span className="text-xs text-muted mt-0.5">{sub}</span>}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="bg-surface border border-border rounded-[20px] p-6 flex flex-col gap-1 transition-colors hover:border-accent/40 hover:bg-accent-soft/20"
      >
        {inner}
      </Link>
    );
  }
  return <Card className="flex flex-col gap-1">{inner}</Card>;
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed";

const btnTones: Record<string, string> = {
  primary: "bg-accent text-white border border-accent-hover hover:bg-accent-hover",
  secondary: "bg-accent-soft text-accent border border-accent-soft-border hover:bg-accent-soft/60",
  ghost: "text-muted hover:text-foreground hover:bg-border/40",
  danger: "bg-danger-soft text-danger border border-danger/20 hover:bg-danger-soft/70",
};

export function buttonClass(tone: keyof typeof btnTones = "primary") {
  return `${btnBase} ${btnTones[tone]}`;
}

export function ButtonLink({
  href,
  children,
  tone = "primary",
}: {
  href: string;
  children: ReactNode;
  tone?: keyof typeof btnTones;
}) {
  return (
    <Link href={href} className={buttonClass(tone)}>
      {children}
    </Link>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="text-center py-12">
      <p className="font-serif text-xl font-semibold text-foreground">{title}</p>
      {hint && <p className="text-sm text-muted mt-1.5">{hint}</p>}
    </Card>
  );
}
