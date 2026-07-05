import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, Badge, EmptyState } from "@/components/ui";
import { formatINR } from "@/lib/format";
import type { JobListing } from "@/lib/types";

export default async function AdminListings() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("job_listings")
    .select("*, recruiters(company_name)")
    .order("created_at", { ascending: false });
  const jobs = (data ?? []) as (JobListing & { recruiters: { company_name: string } | null })[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All job listings</h1>
        <p className="text-muted">Every role posted on the platform.</p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState title="No listings yet" />
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-border/30 text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Recruiter</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Pay range (±30%)</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{j.title}</td>
                  <td className="px-4 py-3 text-muted">{j.recruiters?.company_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{j.location ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">
                    {formatINR(j.min_pay)} – {formatINR(j.max_pay)}
                  </td>
                  <td className="px-4 py-3">
                    {j.is_active ? <Badge tone="accent">Active</Badge> : <Badge tone="neutral">Paused</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
