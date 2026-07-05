import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui";

export default async function ViewersPage() {
  const { userId } = await requireRole("school");
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, name")
    .eq("school_id", userId);
  const idToName = new Map((students ?? []).map((s) => [s.id, s.name]));
  const ids = (students ?? []).map((s) => s.id);

  const rows = ids.length
    ? (
        await supabase
          .from("contact_unlocks")
          .select("id, created_at, student_id, recruiters(company_name, industry, location, contact_person, phone)")
          .in("student_id", ids)
          .order("created_at", { ascending: false })
      ).data ?? []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Who viewed your students</h1>
        <p className="text-muted">
          Recruiters who unlocked a student&apos;s contact details.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No views yet"
          hint="When a recruiter accesses a student's contact details, they'll appear here."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-border/30 text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Recruiter</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Contact</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                // recruiters relation comes back as an object (one-to-one)
                const rec = r.recruiters as unknown as {
                  company_name: string; industry: string | null;
                  location: string | null; contact_person: string | null; phone: string | null;
                } | null;
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {idToName.get(r.student_id) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {rec?.company_name ?? "—"}
                      {rec?.location ? <span className="text-muted"> · {rec.location}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-muted hidden sm:table-cell">
                      {rec?.contact_person ?? "—"}
                      {rec?.phone ? ` · ${rec.phone}` : ""}
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
