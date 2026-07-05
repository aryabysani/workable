"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { studentFields, contactFields } from "@/lib/studentForm";

/** An individual updates their own (single) student profile. */
export async function updateMyProfileAction(studentId: string, formData: FormData) {
  const { userId } = await requireRole("individual");
  const supabase = await createClient();

  const fields = studentFields(formData);
  if (!fields.name) return;

  const { error } = await supabase
    .from("students")
    .update(fields)
    .eq("id", studentId)
    .eq("school_id", userId); // safety: only their own row
  if (error) throw new Error(error.message);

  await supabase
    .from("student_contacts")
    .upsert({ student_id: studentId, ...contactFields(formData) });

  revalidatePath("/individual");
}

export async function toggleMyVisibilityAction(studentId: string, makeVisible: boolean) {
  const { userId } = await requireRole("individual");
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ is_visible: makeVisible })
    .eq("id", studentId)
    .eq("school_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/individual");
}
