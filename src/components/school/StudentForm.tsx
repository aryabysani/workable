"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { Field, inputClass } from "@/components/forms/field";
import { SKILL_OPTIONS, TIMING_OPTIONS, type Student, type StudentContact } from "@/lib/types";

export function StudentForm({
  action,
  student,
  contact,
  cancelHref = "/school",
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  student?: Student;
  contact?: StudentContact | null;
  cancelHref?: string;
  submitLabel?: string;
}) {
  const [selected, setSelected] = useState<string[]>(student?.skills ?? []);

  function toggle(skill: string) {
    setSelected((cur) =>
      cur.includes(skill) ? cur.filter((s) => s !== skill) : [...cur, skill],
    );
  }

  return (
    <form action={action} className="space-y-5">
      {selected.map((s) => (
        <input key={s} type="hidden" name="skills" value={s} />
      ))}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name">
          <input name="name" defaultValue={student?.name} required className={inputClass} />
        </Field>
        <Field label="Age">
          <input name="age" type="number" min={14} max={99} defaultValue={student?.age ?? ""} className={inputClass} />
        </Field>
      </div>

      <Field label="Photo URL" hint="Optional. Leave blank to use a friendly avatar.">
        <input name="photo_url" type="url" defaultValue={student?.photo_url ?? ""} className={inputClass} />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-foreground mb-2">Skills</legend>
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
        <Field label="Preferred work location">
          <input name="preferred_location" defaultValue={student?.preferred_location ?? ""} className={inputClass} />
        </Field>
        <Field label="Preferred timing">
          <select name="preferred_timing" defaultValue={student?.preferred_timing ?? ""} className={inputClass}>
            <option value="">Select…</option>
            {TIMING_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Bio / strengths">
        <textarea name="bio" rows={3} defaultValue={student?.bio ?? ""} className={inputClass} />
      </Field>
      <Field label="Training completed">
        <input name="training_completed" defaultValue={student?.training_completed ?? ""} className={inputClass} />
      </Field>
      <Field label="Internal notes" hint="Private — never shown to recruiters.">
        <textarea name="notes" rows={2} defaultValue={student?.notes ?? ""} className={inputClass} />
      </Field>

      <div className="border-t border-border pt-5">
        <h3 className="font-semibold text-foreground mb-1">Contact details</h3>
        <p className="text-sm text-muted mb-4">
          Only revealed to a recruiter after they unlock this student.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Guardian name">
            <input name="guardian_name" defaultValue={contact?.guardian_name ?? ""} className={inputClass} />
          </Field>
          <Field label="Contact phone">
            <input name="contact_phone" defaultValue={contact?.contact_phone ?? ""} className={inputClass} />
          </Field>
        </div>
        <Field label="Contact email">
          <input name="contact_email" type="email" defaultValue={contact?.contact_email ?? ""} className={inputClass} />
        </Field>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="is_visible"
          defaultChecked={student ? student.is_visible : true}
          className="w-5 h-5 accent-[var(--accent)]"
        />
        <span className="text-sm font-medium text-foreground">
          Visible to recruiters
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className={buttonClass("primary")}>
          {submitLabel ?? (student ? "Save changes" : "Add student")}
        </button>
        <Link href={cancelHref} className={buttonClass("ghost")}>Cancel</Link>
      </div>
    </form>
  );
}
