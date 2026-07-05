import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui";
import { PendingBanner } from "@/components/PendingBanner";
import { StudentForm } from "@/components/school/StudentForm";
import { VisibilityToggle } from "@/components/individual/VisibilityToggle";
import { updateMyProfileAction } from "@/app/individual/actions";
import type { Student, StudentContact } from "@/lib/types";

export default async function IndividualHome() {
  const { userId, profile } = await requireRole("individual");
  const supabase = await createClient();

  // An individual owns exactly one student row (created at sign-up). Self-heal
  // if it's somehow missing.
  let { data: student } = await supabase
    .from("students").select("*").eq("school_id", userId).maybeSingle();
  if (!student) {
    const { data: created } = await supabase
      .from("students")
      .insert({ school_id: userId, name: profile.full_name, is_visible: false })
      .select("*")
      .single();
    student = created;
  }
  const s = student as Student;

  const { data: contact } = await supabase
    .from("student_contacts").select("*").eq("student_id", s.id).maybeSingle();

  const action = updateMyProfileAction.bind(null, s.id);

  return (
    <div className="space-y-6">
      <PendingBanner status={profile.approval_status} />

      <div>
        <h1 className="text-2xl font-bold text-foreground">My profile</h1>
        <p className="text-muted">
          Fill out your profile and make it visible so recruiters can find you.
        </p>
      </div>

      <Card>
        <VisibilityToggle studentId={s.id} isVisible={s.is_visible} />
      </Card>

      <Card>
        <StudentForm
          action={action}
          student={s}
          contact={(contact as StudentContact | null) ?? null}
          cancelHref="/individual"
          submitLabel="Save my profile"
        />
      </Card>
    </div>
  );
}
