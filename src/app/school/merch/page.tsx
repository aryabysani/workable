import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ButtonLink, EmptyState, StatCard } from "@/components/ui";
import { PendingBanner } from "@/components/PendingBanner";
import { ProductManageCard } from "@/components/merch/ProductManageCard";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

export default async function SchoolMerch() {
  const { userId, profile } = await requireRole("school");
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products").select("*").eq("school_id", userId)
    .order("created_at", { ascending: false });
  const list = (products ?? []) as Product[];

  // Earnings from fulfilled orders
  const { data: fulfilled } = await supabase
    .from("merch_orders").select("total_price").eq("school_id", userId).eq("status", "fulfilled");
  const earned = (fulfilled ?? []).reduce((s, o) => s + Number(o.total_price), 0);

  return (
    <div className="space-y-6">
      <PendingBanner status={profile.approval_status} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Merchandise</h1>
          <p className="text-muted">List the products your students make for companies to order.</p>
        </div>
        <ButtonLink href="/school/merch/new">+ Add product</ButtonLink>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Products listed" value={list.length} />
        <StatCard label="Available" value={list.filter((p) => p.is_available).length} />
        <StatCard label="Earned (fulfilled)" value={formatINR(earned)} />
      </div>

      {list.length === 0 ? (
        <EmptyState title="No products yet" hint="Add your first product to start receiving orders." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => <ProductManageCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
