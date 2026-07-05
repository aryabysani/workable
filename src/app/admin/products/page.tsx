import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, Badge, EmptyState } from "@/components/ui";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

export default async function AdminProducts() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*, schools(name)")
    .order("created_at", { ascending: false });
  const products = (data ?? []) as (Product & { schools: { name: string } | null })[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">All products</h1>
        <p className="text-muted">Every merchandise product across all centres.</p>
      </div>

      {products.length === 0 ? (
        <EmptyState title="No products yet" />
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead className="bg-border/30 text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Centre</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Unit price</th>
                <th className="px-4 py-3 font-medium">Qty range</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{p.schools?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{p.category}</td>
                  <td className="px-4 py-3 text-foreground">{formatINR(p.unit_price)}</td>
                  <td className="px-4 py-3 text-muted">{p.min_qty}–{p.max_qty}</td>
                  <td className="px-4 py-3">
                    {p.is_available ? <Badge tone="accent">Available</Badge> : <Badge tone="neutral">Hidden</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
