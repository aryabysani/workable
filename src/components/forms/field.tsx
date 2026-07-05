import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-3 text-foreground placeholder:text-muted/50 focus:border-accent min-h-[46px]";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-danger bg-danger-soft rounded-xl px-3.5 py-2.5" role="alert">
      {message}
    </p>
  );
}
