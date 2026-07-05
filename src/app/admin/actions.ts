"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ApprovalStatus } from "@/lib/types";

export async function setApprovalAction(profileId: string, status: ApprovalStatus) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ approval_status: status })
    .eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}
