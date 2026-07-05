"use client";

import { useActionState, useState } from "react";
import { buttonClass } from "@/components/ui";
import { Field, FormError, inputClass } from "@/components/forms/field";
import { placeOrderAction } from "@/app/recruiter/marketplace/actions";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

export function OrderForm({ product }: { product: Product }) {
  const [qty, setQty] = useState<number>(product.min_qty);
  const [state, formAction, pending] = useActionState<{ error?: string }, FormData>(
    async (_prev, fd) => (await placeOrderAction(product.id, fd)) ?? {},
    {},
  );

  const inRange = qty >= product.min_qty && qty <= product.max_qty;
  const total = inRange ? qty * product.unit_price : 0;

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.error} />

      <Field
        label="Quantity"
        hint={`Allowed: ${product.min_qty} – ${product.max_qty} units`}
      >
        <input
          name="quantity" type="number" required
          min={product.min_qty} max={product.max_qty}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className={inputClass}
        />
      </Field>

      {!inRange && (
        <p className="text-sm text-danger">
          Quantity must be between {product.min_qty} and {product.max_qty}.
        </p>
      )}

      <div className="rounded-xl bg-accent-soft border border-accent-soft-border px-4 py-3">
        <p className="text-sm text-muted">Order total ({qty} × {formatINR(product.unit_price)})</p>
        <p className="font-serif text-2xl font-semibold text-foreground">
          {inRange ? formatINR(total) : "—"}
        </p>
      </div>

      <Field label="Delivery details">
        <textarea name="delivery_details" rows={2} placeholder="Delivery address & timeline" className={inputClass} />
      </Field>
      <Field label="Notes (optional)">
        <textarea name="notes" rows={2} placeholder="Anything the centre should know" className={inputClass} />
      </Field>

      <button type="submit" disabled={pending || !inRange} className={`${buttonClass("primary")} w-full`}>
        {pending ? "Placing order…" : "Place order"}
      </button>
      <p className="text-xs text-muted text-center">
        The centre&apos;s contact details unlock once they accept your order.
      </p>
    </form>
  );
}
