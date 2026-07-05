"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { payRange } from "@/lib/format";

/** Recruiter unlocks a student's contact details (idempotent). */
export async function unlockContactAction(studentId: string) {
  const { userId, profile } = await requireRole("recruiter");
  if (profile.approval_status !== "approved") {
    return { error: "Your account must be approved before you can view contacts." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_unlocks")
    .upsert(
      { recruiter_id: userId, student_id: studentId },
      { onConflict: "recruiter_id,student_id", ignoreDuplicates: true },
    );
  if (error) return { error: error.message };
  revalidatePath(`/recruiter/students/${studentId}`);
  return { ok: true };
}

export async function createJobAction(formData: FormData) {
  const { userId, profile } = await requireRole("recruiter");
  if (profile.approval_status !== "approved") {
    throw new Error("Your account must be approved before posting jobs.");
  }
  const supabase = await createClient();

  const basePay = Number(formData.get("base_pay"));
  if (!Number.isFinite(basePay) || basePay <= 0) {
    throw new Error("Base pay must be a positive number.");
  }
  const { min, max } = payRange(basePay);

  const skills = formData.getAll("required_skills").map(String).filter(Boolean);

  const { error } = await supabase.from("job_listings").insert({
    recruiter_id: userId,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    required_skills: skills,
    location: String(formData.get("location") ?? "").trim() || null,
    work_timing: String(formData.get("work_timing") ?? "").trim() || null,
    base_pay: basePay,
    // min/max are also enforced/derived by the DB trigger + CHECK constraint
    min_pay: min,
    max_pay: max,
    is_active: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/recruiter/jobs");
  redirect("/recruiter/jobs");
}

export async function toggleJobActiveAction(jobId: string, makeActive: boolean) {
  await requireRole("recruiter");
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_listings")
    .update({ is_active: makeActive })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
  revalidatePath("/recruiter/jobs");
}

export async function deleteJobAction(jobId: string) {
  await requireRole("recruiter");
  const supabase = await createClient();
  const { error } = await supabase.from("job_listings").delete().eq("id", jobId);
  if (error) throw new Error(error.message);
  revalidatePath("/recruiter/jobs");
}
