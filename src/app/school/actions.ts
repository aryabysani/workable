"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

function parseSkills(formData: FormData): string[] {
  return formData.getAll("skills").map((s) => String(s)).filter(Boolean);
}

function studentFields(formData: FormData) {
  const ageRaw = String(formData.get("age") ?? "").trim();
  return {
    name: String(formData.get("name") ?? "").trim(),
    age: ageRaw ? Number(ageRaw) : null,
    skills: parseSkills(formData),
    preferred_location: String(formData.get("preferred_location") ?? "").trim() || null,
    preferred_timing: String(formData.get("preferred_timing") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    training_completed: String(formData.get("training_completed") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    photo_url: String(formData.get("photo_url") ?? "").trim() || null,
    is_visible: formData.get("is_visible") === "on",
  };
}

export async function createStudentAction(formData: FormData) {
  const { userId } = await requireRole("school");
  const supabase = await createClient();
  const fields = studentFields(formData);
  if (!fields.name) return;

  const { data: student, error } = await supabase
    .from("students")
    .insert({ ...fields, school_id: userId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("student_contacts").insert({
    student_id: student.id,
    contact_email: String(formData.get("contact_email") ?? "").trim() || null,
    contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
    guardian_name: String(formData.get("guardian_name") ?? "").trim() || null,
  });

  revalidatePath("/school");
  redirect("/school");
}

export async function updateStudentAction(studentId: string, formData: FormData) {
  await requireRole("school");
  const supabase = await createClient();
  const fields = studentFields(formData);

  const { error } = await supabase.from("students").update(fields).eq("id", studentId);
  if (error) throw new Error(error.message);

  await supabase.from("student_contacts").upsert({
    student_id: studentId,
    contact_email: String(formData.get("contact_email") ?? "").trim() || null,
    contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
    guardian_name: String(formData.get("guardian_name") ?? "").trim() || null,
  });

  revalidatePath("/school");
  redirect("/school");
}

export async function toggleVisibilityAction(studentId: string, makeVisible: boolean) {
  await requireRole("school");
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ is_visible: makeVisible })
    .eq("id", studentId);
  if (error) throw new Error(error.message);
  revalidatePath("/school");
}

export async function deleteStudentAction(studentId: string) {
  await requireRole("school");
  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) throw new Error(error.message);
  revalidatePath("/school");
}
