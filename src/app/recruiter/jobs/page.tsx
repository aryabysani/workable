import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ButtonLink, EmptyState } from "@/components/ui";
import { JobCard } from "@/components/recruiter/JobCard";
import type { JobListing } from "@/lib/types";

export default async function MyJobsPage() {
  const { userId } = await requireRole("recruiter");
  const supabase = await createClient();

  const { data } = await supabase
    .from("job_listings")
    .select("*")
    .eq("recruiter_id", userId)
    .order("created_at", { ascending: false });
  const jobs = (data ?? []) as JobListing[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My job listings</h1>
          <p className="text-muted">Manage the roles you&apos;ve posted.</p>
        </div>
        <ButtonLink href="/recruiter/jobs/new">+ Post a job</ButtonLink>
      </div>

      {jobs.length === 0 ? (
        <EmptyState title="No listings yet" hint="Post your first role to start matching." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}
    </div>
  );
}
