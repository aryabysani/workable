import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { StatCard, Card, Badge } from "@/components/ui";
import { ApprovalButtons } from "@/components/admin/ApprovalButtons";
import { OrderStatusBadge } from "@/components/merch/OrderStatusBadge";
import { formatINR } from "@/lib/format";
import type { Profile, OrderStatus } from "@/lib/types";

type OrderRow = {
  id: string;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  created_at: string;
  products: { name: string } | null;
  schools: { name: string } | null;
  recruiters: { company_name: string } | null;
};
type ListingRow = {
  id: string;
  title: string;
  location: string | null;
  min_pay: number;
  max_pay: number;
  is_active: boolean;
  recruiters: { company_name: string } | null;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : `${Math.floor(d / 30)}mo ago`;
}

function SectionHeader({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-serif text-xl font-semibold text-foreground">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-accent hover:text-accent-hover">
        {cta} →
      </Link>
    </div>
  );
}

export default async function AdminOverview() {
  await requireRole("admin");
  const supabase = await createClient();

  const head = { count: "exact" as const, head: true };
  const [
    schoolsR, recruitersR, individualsR,
    studentsR, visibleStudentsR,
    listingsR, activeR, contactsR,
    productsR, availProductsR,
    pendingOrdersR, acceptedOrdersR, fulfilledOrdersR, declinedOrdersR,
    schoolPendingR, recruiterPendingR,
  ] = await Promise.all([
    supabase.from("profiles").select("id", head).eq("role", "school"),
    supabase.from("profiles").select("id", head).eq("role", "recruiter"),
    supabase.from("profiles").select("id", head).eq("role", "individual"),
    supabase.from("students").select("id", head),
    supabase.from("students").select("id", head).eq("is_visible", true),
    supabase.from("job_listings").select("id", head),
    supabase.from("job_listings").select("id", head).eq("is_active", true),
    supabase.from("contact_unlocks").select("id", head),
    supabase.from("products").select("id", head),
    supabase.from("products").select("id", head).eq("is_available", true),
    supabase.from("merch_orders").select("id", head).eq("status", "pending"),
    supabase.from("merch_orders").select("id", head).eq("status", "accepted"),
    supabase.from("merch_orders").select("id", head).eq("status", "fulfilled"),
    supabase.from("merch_orders").select("id", head).eq("status", "declined"),
    supabase.from("profiles").select("id", head).eq("role", "school").eq("approval_status", "pending"),
    supabase.from("profiles").select("id", head).eq("role", "recruiter").eq("approval_status", "pending"),
  ]);

  const schools = schoolsR.count ?? 0;
  const recruiters = recruitersR.count ?? 0;
  const individuals = individualsR.count ?? 0;
  const students = studentsR.count ?? 0;
  const visibleStudents = visibleStudentsR.count ?? 0;
  const listings = listingsR.count ?? 0;
  const activeListings = activeR.count ?? 0;
  const contacts = contactsR.count ?? 0;
  const products = productsR.count ?? 0;
  const availProducts = availProductsR.count ?? 0;

  const pendingOrders = pendingOrdersR.count ?? 0;
  const acceptedOrders = acceptedOrdersR.count ?? 0;
  const fulfilledOrders = fulfilledOrdersR.count ?? 0;
  const declinedOrders = declinedOrdersR.count ?? 0;
  const totalOrders = pendingOrders + acceptedOrders + fulfilledOrders + declinedOrders;

  const schoolPending = schoolPendingR.count ?? 0;
  const recruiterPending = recruiterPendingR.count ?? 0;

  // Detail rows: pending approvals + recent activity
  const [{ data: pending }, { data: recentOrdersData }, { data: recentListingsData }, { data: revenueRows }] =
    await Promise.all([
      supabase
        .from("profiles").select("*")
        .in("role", ["school", "recruiter"]).eq("approval_status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("merch_orders")
        .select("id, quantity, total_price, status, created_at, products(name), schools(name), recruiters(company_name)")
        .order("created_at", { ascending: false }).limit(6),
      supabase
        .from("job_listings")
        .select("id, title, location, min_pay, max_pay, is_active, recruiters(company_name)")
        .order("created_at", { ascending: false }).limit(6),
      supabase.from("merch_orders").select("total_price").in("status", ["accepted", "fulfilled"]),
    ]);

  const pendingList = (pending ?? []) as Profile[];
  const recentOrders = (recentOrdersData ?? []) as unknown as OrderRow[];
  const recentListings = (recentListingsData ?? []) as unknown as ListingRow[];
  const orderValue = (revenueRows ?? []).reduce((s, o) => s + Number(o.total_price), 0);

  const statusBreakdown: { status: OrderStatus; count: number }[] = [
    { status: "pending", count: pendingOrders },
    { status: "accepted", count: acceptedOrders },
    { status: "fulfilled", count: fulfilledOrders },
    { status: "declined", count: declinedOrders },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Platform overview</h1>
        <p className="text-muted">Everything happening across WorkAble, in one place.</p>
      </div>

      {/* People + hiring */}
      <section>
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.04em] uppercase text-clay mb-3">
          <span className="w-[18px] h-px bg-clay inline-block" />
          People &amp; hiring
        </span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Schools &amp; centres" value={schools} href="/admin/users"
            sub={schoolPending > 0 ? `${schoolPending} awaiting approval` : "all approved"} />
          <StatCard label="Recruiters" value={recruiters} href="/admin/users"
            sub={recruiterPending > 0 ? `${recruiterPending} awaiting approval` : "all approved"} />
          <StatCard label="Individuals" value={individuals} href="/admin/users"
            sub="self-registered" />
          <StatCard label="Students" value={students} href="/admin/students"
            sub={`${visibleStudents} visible to recruiters`} />
          <StatCard label="Job listings" value={listings} href="/admin/listings"
            sub={`${activeListings} active`} />
          <StatCard label="Contacts made" value={contacts}
            sub="recruiter ↔ candidate" />
        </div>
      </section>

      {/* Marketplace */}
      <section>
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.04em] uppercase text-clay mb-3">
          <span className="w-[18px] h-px bg-clay inline-block" />
          Merchandise marketplace
        </span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Products listed" value={products} href="/admin/products"
            sub={`${availProducts} available`} />
          <StatCard label="Orders placed" value={totalOrders} href="/admin/orders"
            sub={`${pendingOrders} awaiting centre`} />
          <StatCard label="Orders fulfilled" value={fulfilledOrders}
            sub={`${acceptedOrders} in progress`} />
          <StatCard label="Value processed" value={formatINR(orderValue)}
            sub="accepted + fulfilled" />
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending approvals — actionable, spans 2 cols */}
        <div className="lg:col-span-2">
          <SectionHeader title="Pending approvals" href="/admin/users" cta="Manage accounts" />
          <Card>
            {pendingList.length === 0 ? (
              <p className="text-sm text-muted py-2">Nothing waiting — all caught up. ✅</p>
            ) : (
              <ul className="divide-y divide-border -my-2">
                {pendingList.map((p) => (
                  <li key={p.id} className="py-3 flex items-center gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{p.full_name}</p>
                      <p className="text-sm text-muted">{p.contact_email}</p>
                    </div>
                    <Badge tone={p.role === "school" ? "accent" : "clay"}>{p.role}</Badge>
                    <div className="ml-auto">
                      <ApprovalButtons profileId={p.id} status={p.approval_status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Order status breakdown */}
        <div>
          <SectionHeader title="Order pipeline" href="/admin/orders" cta="All orders" />
          <Card className="space-y-3">
            {totalOrders === 0 ? (
              <p className="text-sm text-muted py-2">No orders yet.</p>
            ) : (
              statusBreakdown.map((s) => (
                <div key={s.status} className="flex items-center gap-3">
                  <OrderStatusBadge status={s.status} />
                  <div className="flex-1 h-2 rounded-full bg-border/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${totalOrders ? (s.count / totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums w-6 text-right">
                    {s.count}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div>
          <SectionHeader title="Recent orders" href="/admin/orders" cta="View all" />
          <Card className="p-0 overflow-hidden">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted p-6">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentOrders.map((o) => (
                  <li key={o.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{o.products?.name ?? "—"}</p>
                      <p className="text-xs text-muted truncate">
                        {o.recruiters?.company_name ?? "—"} → {o.schools?.name ?? "—"} · {timeAgo(o.created_at)}
                      </p>
                    </div>
                    <span className="text-sm text-foreground whitespace-nowrap">{formatINR(o.total_price)}</span>
                    <OrderStatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Recent listings */}
        <div>
          <SectionHeader title="Recent job listings" href="/admin/listings" cta="View all" />
          <Card className="p-0 overflow-hidden">
            {recentListings.length === 0 ? (
              <p className="text-sm text-muted p-6">No listings yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentListings.map((j) => (
                  <li key={j.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{j.title}</p>
                      <p className="text-xs text-muted truncate">
                        {j.recruiters?.company_name ?? "—"}{j.location ? ` · ${j.location}` : ""}
                      </p>
                    </div>
                    <span className="text-sm text-foreground whitespace-nowrap">
                      {formatINR(j.min_pay)}–{formatINR(j.max_pay)}
                    </span>
                    {j.is_active ? <Badge tone="accent">Active</Badge> : <Badge tone="neutral">Paused</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
