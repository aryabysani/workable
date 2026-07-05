import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, Badge, EmptyState } from "@/components/ui";
import type { Student } from "@/lib/types";

export default async function AdminStudents() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });
  const students = (data ?? []) as Student[];

  // students.school_id references profiles(id), which may be a school OR an
  // individual (who owns their own row), so resolve names separately.
  const ownerIds = [...new Set(students.map((s) => s.school_id))];
  const { data: schoolRows } = ownerIds.length
    ? await supabase.from("schools").select("id, name").in("id", ownerIds)
    : { data: [] };
  const schoolName = new Map((schoolRows ?? []).map((r) => [r.id, r.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All students</h1>
        <p className="text-muted">Every student profile across all schools.</p>
      </div>

      {students.length === 0 ? (
        <EmptyState title="No students yet" />
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-border/30 text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">School</th>
                <th className="px-4 py-3 font-medium">Skills</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted">{s.age ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{schoolName.get(s.school_id) ?? "Individual"}</td>
                  <td className="px-4 py-3 text-muted">{s.skills.slice(0, 3).join(", ")}</td>
                  <td className="px-4 py-3">
                    {s.is_visible ? <Badge tone="accent">Visible</Badge> : <Badge tone="neutral">Hidden</Badge>}
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
