"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function placeOrderAction(productId: string, formData: FormData) {
  const { userId, profile } = await requireRole("recruiter");
  if (profile.approval_status !== "approved") {
    return { error: "Your account must be approved before placing orders." };
  }
  const supabase = await createClient();

  const quantity = Number(formData.get("quantity"));
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "Enter a valid quantity." };
  }

  // Belt-and-suspenders UI check against the product's range (the DB trigger is
  // the authority and will also reject out-of-range quantities).
  const { data: product } = await supabase
    .from("products").select("min_qty, max_qty, is_available").eq("id", productId).single();
  if (!product || !product.is_available) return { error: "This product is no longer available." };
  if (quantity < product.min_qty || quantity > product.max_qty) {
    return { error: `Quantity must be between ${product.min_qty} and ${product.max_qty}.` };
  }

  const { error } = await supabase.from("merch_orders").insert({
    product_id: productId,
    recruiter_id: userId,
    quantity,
    delivery_details: String(formData.get("delivery_details") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    // school_id / unit_price / total_price are set by the DB trigger
    unit_price: 0,
    total_price: 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/recruiter/orders");
  redirect("/recruiter/orders");
}
