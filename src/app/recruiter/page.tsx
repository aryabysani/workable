import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState, buttonClass } from "@/components/ui";
import { PendingBanner } from "@/components/PendingBanner";
import { inputClass } from "@/components/forms/field";
import { SKILL_OPTIONS, TIMING_OPTIONS, type Student } from "@/lib/types";

export default async function RecruiterBrowse({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { profile } = await requireRole("recruiter");
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("students").select("*").eq("is_visible", true);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);
  if (sp.skill) query = query.contains("skills", [sp.skill]);
  if (sp.location) query = query.ilike("preferred_location", `%${sp.location}%`);
  if (sp.timing) query = query.eq("preferred_timing", sp.timing);
  if (sp.age_min) query = query.gte("age", Number(sp.age_min));
  if (sp.age_max) query = query.lte("age", Number(sp.age_max));

  const { data } = await query.order("created_at", { ascending: false });
  const students = (data ?? []) as Student[];

  return (
    <div className="space-y-6">
      <PendingBanner status={profile.approval_status} />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Find talent</h1>
        <p className="text-muted">
          Browse job-ready candidates. Open a profile to view contact details.
        </p>
      </div>

      <Card>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end" method="get">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Name</span>
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name" className={inputClass} />
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
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Min age</span>
            <input name="age_min" type="number" min={14} max={99} defaultValue={sp.age_min ?? ""} className={inputClass} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Max age</span>
            <input name="age_max" type="number" min={14} max={99} defaultValue={sp.age_max ?? ""} className={inputClass} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass("primary")}>Search</button>
            <Link href="/recruiter" className={buttonClass("ghost")}>Reset</Link>
          </div>
        </form>
      </Card>

      <p className="text-sm text-muted">{students.length} candidate{students.length === 1 ? "" : "s"} found</p>

      {students.length === 0 ? (
        <EmptyState title="No matching candidates" hint="Try widening your filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <Link
              key={s.id}
              href={`/recruiter/students/${s.id}`}
              className="bg-surface border border-border rounded-2xl shadow-sm p-5 hover:border-accent transition-colors flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.photo_url ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${s.id}`}
                  alt=""
                  className="w-14 h-14 rounded-full bg-border object-cover"
                />
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{s.name}</h3>
                  <p className="text-sm text-muted">
                    {s.age ? `${s.age} yrs` : "Age —"}
                    {s.preferred_location ? ` · ${s.preferred_location}` : ""}
                  </p>
                </div>
              </div>
              {s.bio && <p className="text-sm text-muted line-clamp-2">{s.bio}</p>}
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {s.skills.slice(0, 4).map((sk) => (
                  <span key={sk} className="text-xs bg-accent-soft text-accent rounded-full px-2 py-0.5">
                    {sk}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
