import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

/** Current auth user + profile, or null if signed out. */
export async function getSessionProfile(): Promise<{ userId: string; profile: Profile } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return { userId: user.id, profile: profile as Profile };
}

/** Require a given role; redirect to login or the user's own dashboard otherwise. */
export async function requireRole(role: Role) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (session.profile.role !== role) redirect(dashboardPath(session.profile.role));
  return session;
}

export function dashboardPath(role: Role): string {
  switch (role) {
    case "school": return "/school";
    case "recruiter": return "/recruiter";
    case "individual": return "/individual";
    default: return "/admin";
  }
}
