"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

function productFields(formData: FormData) {
  const price = Number(formData.get("unit_price"));
  const min = Number(formData.get("min_qty"));
  const max = Number(formData.get("max_qty"));
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "Crafts").trim() || "Crafts",
    description: String(formData.get("description") ?? "").trim() || null,
    image: String(formData.get("image") ?? "").trim() || null,
    unit_price: Number.isFinite(price) ? price : 0,
    min_qty: Number.isFinite(min) ? min : 1,
    max_qty: Number.isFinite(max) ? max : 1,
    is_available: formData.get("is_available") === "on",
  };
}

function validate(f: ReturnType<typeof productFields>): string | null {
  if (!f.name) return "Product name is required.";
  if (f.unit_price <= 0) return "Unit price must be greater than zero.";
  if (f.min_qty < 1) return "Minimum quantity must be at least 1.";
  if (f.max_qty < f.min_qty) return "Maximum quantity must be ≥ minimum quantity.";
  return null;
}

export async function createProductAction(formData: FormData) {
  const { userId } = await requireRole("school");
  const supabase = await createClient();
  const fields = productFields(formData);
  if (validate(fields)) throw new Error(validate(fields)!);

  const { error } = await supabase.from("products").insert({ ...fields, school_id: userId });
  if (error) throw new Error(error.message);
  revalidatePath("/school/merch");
  redirect("/school/merch");
}

export async function updateProductAction(productId: string, formData: FormData) {
  await requireRole("school");
  const supabase = await createClient();
  const fields = productFields(formData);
  if (validate(fields)) throw new Error(validate(fields)!);

  const { error } = await supabase.from("products").update(fields).eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/school/merch");
  redirect("/school/merch");
}

export async function toggleProductAvailableAction(productId: string, makeAvailable: boolean) {
  await requireRole("school");
  const supabase = await createClient();
  const { error } = await supabase
    .from("products").update({ is_available: makeAvailable }).eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/school/merch");
}

export async function deleteProductAction(productId: string) {
  await requireRole("school");
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/school/merch");
}

/** Centre advances an order through its lifecycle (DB trigger enforces validity). */
export async function setOrderStatusAction(orderId: string, status: OrderStatus) {
  await requireRole("school");
  const supabase = await createClient();
  const { error } = await supabase
    .from("merch_orders").update({ status }).eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath("/school/orders");
  return { ok: true };
}
