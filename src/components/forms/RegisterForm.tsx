"use client";

import { useActionState, useState } from "react";
import { registerAction, type AuthState } from "@/app/auth-actions";
import { buttonClass } from "@/components/ui";
import { Field, FormError, inputClass } from "./field";

const initial: AuthState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);
  const [role, setRole] = useState<"school" | "recruiter" | "individual">("school");

  const orgLabel =
    role === "school" ? "School / Centre name"
      : role === "recruiter" ? "Company name"
        : "Your full name";

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <fieldset>
        <legend className="text-sm font-medium text-foreground mb-1.5">I am a…</legend>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "individual", label: "Individual" },
            { v: "school", label: "School / Centre" },
            { v: "recruiter", label: "Recruiter" },
          ].map((opt) => (
            <label
              key={opt.v}
              className={`cursor-pointer rounded-xl border px-2 py-3 text-center text-sm font-medium ${
                role === opt.v
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-muted"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={opt.v}
                checked={role === opt.v}
                onChange={() => setRole(opt.v as "school" | "recruiter" | "individual")}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={orgLabel}>
        <input name="org_name" type="text" required className={inputClass} />
      </Field>
      <Field label={role === "individual" ? "Guardian / contact person (optional)" : "Contact person"}>
        <input name="contact_person" type="text" className={inputClass} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Phone">
          <input name="phone" type="tel" className={inputClass} />
        </Field>
        <Field label="Location / City">
          <input name="location" type="text" className={inputClass} />
        </Field>
      </div>
      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>
      <Field label="Password" hint="At least 6 characters.">
        <input name="password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
      </Field>

      <button type="submit" disabled={pending} className={`${buttonClass("primary")} w-full`}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-xs text-muted text-center">
        New accounts are reviewed by a Rotary admin before going live.
      </p>
    </form>
  );
}
