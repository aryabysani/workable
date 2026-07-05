import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { StatCard, ButtonLink, EmptyState } from "@/components/ui";
import { PendingBanner } from "@/components/PendingBanner";
import { StudentCard } from "@/components/school/StudentCard";
import type { Student } from "@/lib/types";

export default async function SchoolHome() {
  const { userId, profile } = await requireRole("school");
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("school_id", userId)
    .order("created_at", { ascending: false });

  const list = (students ?? []) as Student[];
  const visible = list.filter((s) => s.is_visible).length;

  // How many distinct unlocks across this school's students
  const ids = list.map((s) => s.id);
  let unlocks = 0;
  if (ids.length) {
    const { count } = await supabase
      .from("contact_unlocks")
      .select("id", { count: "exact", head: true })
      .in("student_id", ids);
    unlocks = count ?? 0;
  }

  return (
    <div className="space-y-6">
      <PendingBanner status={profile.approval_status} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
          <p className="text-muted">Manage your students and their visibility.</p>
        </div>
        <ButtonLink href="/school/students/new">+ Add student</ButtonLink>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Total students" value={list.length} />
        <StatCard label="Visible to recruiters" value={visible} />
        <StatCard label="Contact views" value={unlocks} />
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No students yet"
          hint="Add your first student profile to get started."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
      )}
    </div>
  );
}
