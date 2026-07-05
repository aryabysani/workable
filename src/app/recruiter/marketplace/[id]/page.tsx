import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, Badge, buttonClass } from "@/components/ui";
import { OrderForm } from "@/components/merch/OrderForm";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireRole("recruiter");
  const supabase = await createClient();

  const { data: product } = await supabase.from("products").select("*").eq("id", id).single();
  if (!product) notFound();
  const p = product as Product;

  const { data: school } = await supabase
    .from("schools").select("name, location").eq("id", p.school_id).single();

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/recruiter/marketplace" className={buttonClass("ghost")}>← Back to marketplace</Link>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card className="p-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image ?? `https://placehold.co/640x440/efe9dd/3f6e4b?text=${encodeURIComponent(p.name)}`}
            alt=""
            className="w-full h-64 object-cover bg-clay-soft"
          />
          <div className="p-6 space-y-3">
            <Badge tone="clay">{p.category}</Badge>
            <h1 className="font-serif text-3xl font-semibold text-foreground">{p.name}</h1>
            {school && (
              <p className="text-muted">
                Made by <span className="font-medium text-foreground">{school.name}</span>
                {school.location ? `, ${school.location}` : ""}
              </p>
            )}
            {p.description && <p className="text-foreground leading-relaxed">{p.description}</p>}
            <div className="flex gap-6 pt-2 border-t border-border">
              <div><span className="text-sm text-muted block">Unit price</span><span className="font-semibold text-foreground">{formatINR(p.unit_price)}</span></div>
              <div><span className="text-sm text-muted block">Order range</span><span className="font-semibold text-foreground">{p.min_qty} – {p.max_qty}</span></div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-xl font-semibold text-foreground mb-1">Place a bulk order</h2>
          {profile.approval_status === "approved" ? (
            <>
              <p className="text-sm text-muted mb-5">Enter a quantity to see the total.</p>
              <OrderForm product={p} />
            </>
          ) : (
            <p className="text-sm text-clay bg-clay-soft border border-clay/20 rounded-xl px-3.5 py-2.5 mt-3">
              Your account must be approved by a Rotary admin before you can place orders.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
