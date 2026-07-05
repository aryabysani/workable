import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { EmptyState, StatCard } from "@/components/ui";
import { SchoolOrderCard } from "@/components/merch/SchoolOrderCard";
import type { MerchOrder } from "@/lib/types";

export default async function SchoolOrders() {
  const { userId } = await requireRole("school");
  const supabase = await createClient();

  const { data } = await supabase
    .from("merch_orders")
    .select("*, products(name), recruiters(company_name)")
    .eq("school_id", userId)
    .order("created_at", { ascending: false });

  const orders = (data ?? []).map((o) => {
    const product = o.products as unknown as { name: string } | null;
    const buyer = o.recruiters as unknown as { company_name: string } | null;
    return {
      ...(o as MerchOrder),
      productName: product?.name ?? "—",
      buyerName: buyer?.company_name ?? "—",
    };
  });

  const pending = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Incoming orders</h1>
        <p className="text-muted">Accept, decline, and fulfil orders placed for your products.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total orders" value={orders.length} />
        <StatCard label="Awaiting response" value={pending} />
        <StatCard label="Fulfilled" value={orders.filter((o) => o.status === "fulfilled").length} />
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" hint="Orders companies place for your products will appear here." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {orders.map((o) => <SchoolOrderCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
