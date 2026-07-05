import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui";
import { OrderStatusBadge } from "@/components/merch/OrderStatusBadge";
import { formatINR } from "@/lib/format";
import type { MerchOrder } from "@/lib/types";

export default async function RecruiterOrders() {
  const { userId } = await requireRole("recruiter");
  const supabase = await createClient();

  const { data } = await supabase
    .from("merch_orders")
    .select("*, products(name)")
    .eq("recruiter_id", userId)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as (MerchOrder & { products: { name: string } | null })[];

  // Centre contact is shown only for accepted/fulfilled orders.
  const unlockedSchoolIds = [
    ...new Set(orders.filter((o) => o.status === "accepted" || o.status === "fulfilled").map((o) => o.school_id)),
  ];
  const { data: schools } = unlockedSchoolIds.length
    ? await supabase.from("schools").select("id, name, contact_person, phone, website").in("id", unlockedSchoolIds)
    : { data: [] };
  const schoolById = new Map((schools ?? []).map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">My orders</h1>
        <p className="text-muted">Track your merchandise orders. Centre contact unlocks on acceptance.</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" hint="Browse the marketplace to place your first order." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {orders.map((o) => {
            const centre = schoolById.get(o.school_id);
            return (
              <Card key={o.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <h3 className="font-serif font-semibold text-lg text-foreground">
                    {o.products?.name ?? "—"}
                  </h3>
                  <div className="ml-auto"><OrderStatusBadge status={o.status} /></div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><span className="text-muted block">Quantity</span><span className="font-semibold">{o.quantity}</span></div>
                  <div><span className="text-muted block">Unit</span><span className="font-semibold">{formatINR(o.unit_price)}</span></div>
                  <div><span className="text-muted block">Total</span><span className="font-semibold text-accent">{formatINR(o.total_price)}</span></div>
                </div>

                {centre ? (
                  <div className="rounded-xl bg-accent-soft border border-accent-soft-border px-4 py-3 text-sm">
                    <p className="font-semibold text-foreground mb-1">Centre contact unlocked</p>
                    <p className="text-foreground">{centre.name}{centre.contact_person ? ` · ${centre.contact_person}` : ""}</p>
                    {centre.phone && <p className="text-muted">{centre.phone}</p>}
                    {centre.website && <p className="text-muted">{centre.website}</p>}
                  </div>
                ) : o.status === "pending" ? (
                  <p className="text-sm text-muted">Awaiting the centre&apos;s response. Contact details unlock on acceptance.</p>
                ) : (
                  <p className="text-sm text-muted">This order was declined.</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
