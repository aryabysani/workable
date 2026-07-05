import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { StudentForm } from "@/components/school/StudentForm";
import { updateStudentAction } from "@/app/school/actions";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Student, StudentContact } from "@/lib/types";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await requireRole("school");
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .eq("school_id", userId)
    .single();
  if (!student) notFound();

  const { data: contact } = await supabase
    .from("student_contacts")
    .select("*")
    .eq("student_id", id)
    .maybeSingle();

  const action = updateStudentAction.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Edit {(student as Student).name}</h1>
      <Card>
        <StudentForm
          action={action}
          student={student as Student}
          contact={contact as StudentContact | null}
        />
      </Card>
    </div>
  );
}
