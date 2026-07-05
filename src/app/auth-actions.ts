"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dashboardPath } from "@/lib/auth";
import type { Role } from "@/lib/types";

export type AuthState = { error?: string };

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(dashboardPath((profile?.role ?? "school") as Role));
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const role = String(formData.get("role") ?? "") as Role;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const orgName = String(formData.get("org_name") ?? "").trim();
  const contactPerson = String(formData.get("contact_person") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (role !== "school" && role !== "recruiter" && role !== "individual") {
    return { error: "Please choose an account type." };
  }
  if (!orgName) {
    return { error: role === "individual" ? "Your name is required." : "Organisation name is required." };
  }
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  // Create the auth user (email auto-confirmed locally) via service role so we
  // can reliably write the role/profile rows immediately after.
  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: orgName, role },
  });
  if (createErr) return { error: createErr.message };
  const userId = created.user!.id;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    role,
    approval_status: "pending", // admin must approve new accounts
    full_name: orgName,
    contact_email: email,
    contact_phone: phone || null,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    return { error: profileErr.message };
  }

  if (role === "school") {
    await admin.from("schools").insert({
      id: userId, name: orgName, contact_person: contactPerson || null,
      phone: phone || null, location: location || null,
    });
  } else if (role === "recruiter") {
    await admin.from("recruiters").insert({
      id: userId, company_name: orgName, contact_person: contactPerson || null,
      phone: phone || null, location: location || null,
    });
  } else {
    // individual: create their own (hidden until they complete it) student profile
    const { data: student } = await admin.from("students").insert({
      school_id: userId, name: orgName, preferred_location: location || null,
      is_visible: false,
    }).select("id").single();
    if (student) {
      await admin.from("student_contacts").insert({
        student_id: student.id,
        contact_email: email,
        contact_phone: phone || null,
        guardian_name: contactPerson || null,
      });
    }
  }

  // Sign the new user in immediately.
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });
  redirect(dashboardPath(role));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
