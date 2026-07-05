import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui";
import { OrderStatusBadge } from "@/components/merch/OrderStatusBadge";
import { formatINR } from "@/lib/format";
import type { MerchOrder } from "@/lib/types";

export default async function AdminOrders() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("merch_orders")
    .select("*, products(name), schools(name), recruiters(company_name)")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as (MerchOrder & {
    products: { name: string } | null;
    schools: { name: string } | null;
    recruiters: { company_name: string } | null;
  })[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">All orders</h1>
        <p className="text-muted">Every merchandise order placed on the platform.</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" />
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-border/30 text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Centre</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{o.products?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{o.schools?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{o.recruiters?.company_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{o.quantity}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatINR(o.total_price)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
