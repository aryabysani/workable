"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Badge, buttonClass } from "@/components/ui";
import { toggleVisibilityAction, deleteStudentAction } from "@/app/school/actions";
import type { Student } from "@/lib/types";

export function StudentCard({ student }: { student: Student }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={student.photo_url ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${student.id}`}
          alt=""
          className="w-14 h-14 rounded-full bg-border object-cover shrink-0"
        />
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{student.name}</h3>
          <p className="text-sm text-muted">
            {student.age ? `${student.age} yrs` : "Age —"}
            {student.preferred_location ? ` · ${student.preferred_location}` : ""}
          </p>
        </div>
        <div className="ml-auto">
          {student.is_visible ? (
            <Badge tone="accent">Visible</Badge>
          ) : (
            <Badge tone="neutral">Hidden</Badge>
          )}
        </div>
      </div>

      {student.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {student.skills.slice(0, 4).map((s) => (
            <span key={s} className="text-xs bg-border/50 text-muted rounded-full px-2 py-0.5">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() => toggleVisibilityAction(student.id, !student.is_visible))
          }
          className={buttonClass("secondary")}
        >
          {student.is_visible ? "Hide" : "Make visible"}
        </button>
        <Link href={`/school/students/${student.id}/edit`} className={buttonClass("ghost")}>
          Edit
        </Link>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm(`Remove ${student.name}? This cannot be undone.`)) {
              startTransition(() => deleteStudentAction(student.id));
            }
          }}
          className={`${buttonClass("danger")} ml-auto`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
