import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui";

export default async function IndividualViewers() {
  const { userId } = await requireRole("individual");
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students").select("id").eq("school_id", userId).maybeSingle();

  const rows = student
    ? (
        await supabase
          .from("contact_unlocks")
          .select("id, created_at, recruiters(company_name, industry, location, contact_person, phone)")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })
      ).data ?? []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Who viewed me</h1>
        <p className="text-muted">Recruiters who unlocked your contact details.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No views yet"
          hint="When a recruiter accesses your contact details, they'll appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((r) => {
            const rec = r.recruiters as unknown as {
              company_name: string; industry: string | null; location: string | null;
              contact_person: string | null; phone: string | null;
            } | null;
            return (
              <Card key={r.id}>
                <h3 className="font-semibold text-foreground">{rec?.company_name ?? "—"}</h3>
                <p className="text-sm text-muted">
                  {rec?.industry ?? ""}{rec?.location ? ` · ${rec.location}` : ""}
                </p>
                <p className="text-sm text-foreground mt-2">
                  {rec?.contact_person ?? "—"}{rec?.phone ? ` · ${rec.phone}` : ""}
                </p>
                <p className="text-xs text-muted mt-2">
                  {new Date(r.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
