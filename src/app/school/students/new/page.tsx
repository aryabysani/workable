import { Card } from "@/components/ui";
import { StudentForm } from "@/components/school/StudentForm";
import { createStudentAction } from "@/app/school/actions";
import { requireRole } from "@/lib/auth";

export default async function NewStudentPage() {
  await requireRole("school");
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Add a student</h1>
      <Card>
        <StudentForm action={createStudentAction} />
      </Card>
    </div>
  );
}
