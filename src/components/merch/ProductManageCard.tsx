"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Badge, buttonClass } from "@/components/ui";
import { formatINR } from "@/lib/format";
import { toggleProductAvailableAction, deleteProductAction } from "@/app/school/merch/actions";
import type { Product } from "@/lib/types";

export function ProductManageCard({ product }: { product: Product }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="bg-surface border border-border rounded-[20px] overflow-hidden flex flex-col">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image ?? `https://placehold.co/640x440/efe9dd/3f6e4b?text=${encodeURIComponent(product.name)}`}
        alt=""
        className="w-full h-40 object-cover bg-clay-soft"
      />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <h3 className="font-serif font-semibold text-lg text-foreground truncate">{product.name}</h3>
            <p className="text-sm text-muted">{product.category}</p>
          </div>
          <div className="ml-auto">
            {product.is_available ? <Badge tone="accent">Available</Badge> : <Badge tone="neutral">Hidden</Badge>}
          </div>
        </div>

        <p className="text-sm text-foreground">
          <span className="font-semibold">{formatINR(product.unit_price)}</span>
          <span className="text-muted"> / unit · {product.min_qty}–{product.max_qty} qty</span>
        </p>

        <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
          <button
            disabled={pending}
            onClick={() => startTransition(() => toggleProductAvailableAction(product.id, !product.is_available))}
            className={buttonClass("secondary")}
          >
            {product.is_available ? "Hide" : "Make available"}
          </button>
          <Link href={`/school/merch/${product.id}/edit`} className={buttonClass("ghost")}>Edit</Link>
          <button
            disabled={pending}
            onClick={() => { if (confirm(`Remove "${product.name}"?`)) startTransition(() => deleteProductAction(product.id)); }}
            className={`${buttonClass("danger")} ml-auto`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
