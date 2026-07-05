"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { Field, inputClass } from "@/components/forms/field";
import { createJobAction } from "@/app/recruiter/actions";
import { formatINR, payRange } from "@/lib/format";
import { SKILL_OPTIONS, TIMING_OPTIONS } from "@/lib/types";

export function JobForm() {
  const [selected, setSelected] = useState<string[]>([]);
  const [basePay, setBasePay] = useState<number>(0);

  function toggle(skill: string) {
    setSelected((cur) =>
      cur.includes(skill) ? cur.filter((s) => s !== skill) : [...cur, skill],
    );
  }

  const valid = Number.isFinite(basePay) && basePay > 0;
  const { min, max } = payRange(basePay || 0);

  return (
    <form action={createJobAction} className="space-y-5">
      {selected.map((s) => (
        <input key={s} type="hidden" name="required_skills" value={s} />
      ))}

      <Field label="Job title">
        <input name="title" required className={inputClass} />
      </Field>

      <Field label="Description">
        <textarea name="description" rows={4} className={inputClass} />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-foreground mb-2">Required skills</legend>
        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((skill) => {
            const on = selected.includes(skill);
            return (
              <button
                type="button"
                key={skill}
                onClick={() => toggle(skill)}
                aria-pressed={on}
                className={`rounded-full px-3 py-2 text-sm border min-h-[40px] ${
                  on ? "border-accent bg-accent-soft text-accent" : "border-border text-muted"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Location">
          <input name="location" className={inputClass} />
        </Field>
        <Field label="Work timing">
          <select name="work_timing" className={inputClass} defaultValue="">
            <option value="">Select…</option>
            {TIMING_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Base pay (₹ / month)" hint="The offered range is automatically set to ±30% of this.">
        <input
          name="base_pay"
          type="number"
          min={1}
          required
          className={inputClass}
          onChange={(e) => setBasePay(Number(e.target.value))}
        />
      </Field>

      <div className={`rounded-xl px-4 py-3 ${valid ? "bg-accent-soft" : "bg-border/40"}`}>
        <p className="text-sm text-muted">Offered pay range (±30%)</p>
        <p className="text-lg font-semibold text-foreground">
          {valid ? `${formatINR(min)} – ${formatINR(max)}` : "Enter a base pay to preview"}
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={!valid} className={buttonClass("primary")}>
          Post job
        </button>
        <Link href="/recruiter/jobs" className={buttonClass("ghost")}>Cancel</Link>
      </div>
    </form>
  );
}
