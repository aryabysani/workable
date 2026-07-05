import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState, buttonClass } from "@/components/ui";
import { PendingBanner } from "@/components/PendingBanner";
import { inputClass } from "@/components/forms/field";
import { formatINR } from "@/lib/format";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/types";

export default async function Marketplace({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { profile } = await requireRole("recruiter");
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("products").select("*").eq("is_available", true);
  if (sp.category) query = query.eq("category", sp.category);
  if (sp.max_price) query = query.lte("unit_price", Number(sp.max_price));
  const { data } = await query.order("created_at", { ascending: false });
  const products = (data ?? []) as Product[];

  // Resolve centre names (school_id → schools.name)
  const ids = [...new Set(products.map((p) => p.school_id))];
  const { data: schools } = ids.length
    ? await supabase.from("schools").select("id, name").in("id", ids)
    : { data: [] };
  const schoolName = new Map((schools ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <PendingBanner status={profile.approval_status} />

      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Marketplace</h1>
        <p className="text-muted">
          Bulk-order handmade merchandise made by autistic adults at partner centres.
        </p>
      </div>

      <Card>
        <form className="grid gap-3 sm:grid-cols-3 items-end" method="get">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Category</span>
            <select name="category" defaultValue={sp.category ?? ""} className={inputClass}>
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Max price (₹)</span>
            <input name="max_price" type="number" min={1} defaultValue={sp.max_price ?? ""} placeholder="Any" className={inputClass} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass("primary")}>Filter</button>
            <Link href="/recruiter/marketplace" className={buttonClass("ghost")}>Reset</Link>
          </div>
        </form>
      </Card>

      <p className="text-sm text-muted">{products.length} product{products.length === 1 ? "" : "s"} available</p>

      {products.length === 0 ? (
        <EmptyState title="No products match" hint="Try widening your filters." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/recruiter/marketplace/${p.id}`}
              className="bg-surface border border-border rounded-[20px] overflow-hidden flex flex-col hover:border-accent transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image ?? `https://placehold.co/640x440/efe9dd/3f6e4b?text=${encodeURIComponent(p.name)}`}
                alt=""
                className="w-full h-44 object-cover bg-clay-soft"
              />
              <div className="p-5 flex flex-col gap-1.5 flex-1">
                <span className="text-xs font-semibold text-clay uppercase tracking-wide">{p.category}</span>
                <h3 className="font-serif font-semibold text-lg text-foreground">{p.name}</h3>
                <p className="text-sm text-muted">{schoolName.get(p.school_id) ?? "Partner centre"}</p>
                <p className="text-foreground mt-auto pt-2">
                  <span className="font-semibold">{formatINR(p.unit_price)}</span>
                  <span className="text-muted text-sm"> / unit · min {p.min_qty}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
