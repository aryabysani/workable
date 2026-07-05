"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { Field, inputClass } from "@/components/forms/field";
import { formatINR } from "@/lib/format";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/types";

export function ProductForm({
  action,
  product,
}: {
  action: (formData: FormData) => void | Promise<void>;
  product?: Product;
}) {
  const [price, setPrice] = useState<number>(product?.unit_price ?? 0);

  return (
    <form action={action} className="space-y-5">
      <Field label="Product name">
        <input name="name" defaultValue={product?.name} required className={inputClass} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Category">
          <select name="category" defaultValue={product?.category ?? "Crafts"} className={inputClass}>
            {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Photo URL" hint="Optional. A placeholder is used if blank.">
          <input name="image" type="url" defaultValue={product?.image ?? ""} className={inputClass} />
        </Field>
      </div>

      <Field label="Description">
        <textarea name="description" rows={3} defaultValue={product?.description ?? ""} className={inputClass} />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Unit price (₹)">
          <input
            name="unit_price" type="number" min={1} step="0.01" required
            defaultValue={product?.unit_price ?? ""} className={inputClass}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </Field>
        <Field label="Min order qty">
          <input name="min_qty" type="number" min={1} required defaultValue={product?.min_qty ?? 1} className={inputClass} />
        </Field>
        <Field label="Max order qty">
          <input name="max_qty" type="number" min={1} required defaultValue={product?.max_qty ?? 100} className={inputClass} />
        </Field>
      </div>

      <div className="rounded-xl bg-accent-soft border border-accent-soft-border px-4 py-2.5 text-sm text-foreground">
        Unit price: <strong>{price > 0 ? formatINR(price) : "—"}</strong> per item
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox" name="is_available"
          defaultChecked={product ? product.is_available : true}
          className="w-5 h-5 accent-[var(--accent)]"
        />
        <span className="text-sm font-medium text-foreground">Available for orders</span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className={buttonClass("primary")}>
          {product ? "Save changes" : "Add product"}
        </button>
        <Link href="/school/merch" className={buttonClass("ghost")}>Cancel</Link>
      </div>
    </form>
  );
}
