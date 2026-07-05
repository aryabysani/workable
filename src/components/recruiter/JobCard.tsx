"use client";

import { useTransition } from "react";
import { Badge, buttonClass } from "@/components/ui";
import { toggleJobActiveAction, deleteJobAction } from "@/app/recruiter/actions";
import { formatINR } from "@/lib/format";
import type { JobListing } from "@/lib/types";

export function JobCard({ job }: { job: JobListing }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">{job.title}</h3>
          <p className="text-sm text-muted">
            {job.location ?? "—"}{job.work_timing ? ` · ${job.work_timing}` : ""}
          </p>
        </div>
        <div className="ml-auto">
          {job.is_active ? <Badge tone="accent">Active</Badge> : <Badge tone="neutral">Paused</Badge>}
        </div>
      </div>

      <div className="rounded-xl bg-accent-soft px-3 py-2">
        <p className="text-xs text-muted">Pay range (±30% of {formatINR(job.base_pay)})</p>
        <p className="font-semibold text-foreground">
          {formatINR(job.min_pay)} – {formatINR(job.max_pay)}
        </p>
      </div>

      {job.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.required_skills.map((s) => (
            <span key={s} className="text-xs bg-border/50 text-muted rounded-full px-2 py-0.5">{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-2">
        <button
          disabled={pending}
          onClick={() => startTransition(() => toggleJobActiveAction(job.id, !job.is_active))}
          className={buttonClass("secondary")}
        >
          {job.is_active ? "Pause" : "Activate"}
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete "${job.title}"?`)) startTransition(() => deleteJobAction(job.id));
          }}
          className={`${buttonClass("danger")} ml-auto`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
