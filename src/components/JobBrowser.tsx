import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, Badge, buttonClass } from "@/components/ui";
import { inputClass } from "@/components/forms/field";
import { formatINR } from "@/lib/format";
import { SKILL_OPTIONS, TIMING_OPTIONS, type JobListing } from "@/lib/types";

type JobWithRecruiter = JobListing & {
  recruiters: {
    company_name: string;
    industry: string | null;
    location: string | null;
  } | null;
};

/**
 * Read-only browser of live recruiter requirements (active job listings).
 * Shared by individuals and schools. RLS already exposes active listings and
 * recruiter company info to both roles.
 */
export async function JobBrowser({
  searchParams,
  basePath,
}: {
  searchParams: Record<string, string | undefined>;
  basePath: string;
}) {
  const sp = searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("job_listings")
    .select("*, recruiters(company_name, industry, location)")
    .eq("is_active", true);
  if (sp.q) query = query.ilike("title", `%${sp.q}%`);
  if (sp.skill) query = query.contains("required_skills", [sp.skill]);
  if (sp.location) query = query.ilike("location", `%${sp.location}%`);
  if (sp.timing) query = query.eq("work_timing", sp.timing);

  const { data } = await query.order("created_at", { ascending: false });
  const jobs = (data ?? []) as unknown as JobWithRecruiter[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Open roles</h1>
        <p className="text-muted">
          Live requirements posted by inclusive employers. New roles appear here
          as recruiters post them.
        </p>
      </div>

      <Card>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end" method="get">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Role</span>
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Search title" className={inputClass} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Skill</span>
            <select name="skill" defaultValue={sp.skill ?? ""} className={inputClass}>
              <option value="">Any skill</option>
              {SKILL_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Location</span>
            <input name="location" defaultValue={sp.location ?? ""} placeholder="City" className={inputClass} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Timing</span>
            <select name="timing" defaultValue={sp.timing ?? ""} className={inputClass}>
              <option value="">Any timing</option>
              {TIMING_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass("primary")}>Search</button>
            <Link href={basePath} className={buttonClass("ghost")}>Reset</Link>
          </div>
        </form>
      </Card>

      <p className="text-sm text-muted">
        {jobs.length} open role{jobs.length === 1 ? "" : "s"}
      </p>

      {jobs.length === 0 ? (
        <EmptyState title="No open roles right now" hint="Try widening your filters, or check back soon." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <article
              key={j.id}
              className="bg-surface border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{j.title}</h3>
                  <p className="text-sm text-accent font-medium">
                    {j.recruiters?.company_name ?? "An employer"}
                  </p>
                  <p className="text-sm text-muted">
                    {j.location ?? "—"}{j.work_timing ? ` · ${j.work_timing}` : ""}
                  </p>
                </div>
                <span className="ml-auto"><Badge tone="accent">Hiring</Badge></span>
              </div>

              {j.description && (
                <p className="text-sm text-muted line-clamp-2">{j.description}</p>
              )}

              <div className="rounded-xl bg-accent-soft px-3 py-2">
                <p className="text-xs text-muted">Pay range</p>
                <p className="font-semibold text-foreground">
                  {formatINR(j.min_pay)} – {formatINR(j.max_pay)}
                </p>
              </div>

              {j.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {j.required_skills.map((s) => (
                    <span key={s} className="text-xs bg-border/50 text-muted rounded-full px-2 py-0.5">{s}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
