/**
 * Merchandise marketplace RLS + order-flow checks. Run after seeding:
 *   npx tsx scripts/test-merch.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PW = "Password123!";

async function as(email: string) {
  const c = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PW });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return c;
}
let pass = 0, fail = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  ok ? pass++ : fail++;
}

async function main() {
  const admin = createClient(URL, SECRET, { auth: { persistSession: false } });

  // ---- Recruiter product visibility ----------------------------------------
  const rec = await as("hr@brewbean.com");
  const { count: recProducts } = await rec.from("products").select("id", { count: "exact", head: true });
  const { count: availTotal } = await admin
    .from("products").select("id", { count: "exact", head: true }).eq("is_available", true);
  check("recruiter sees only available products", recProducts === availTotal,
    `recruiter=${recProducts} available=${availTotal}`);

  // ---- Individuals are excluded from merch entirely ------------------------
  const ind = await as("ananya.r@example.com");
  const { count: indProducts } = await ind.from("products").select("id", { count: "exact", head: true });
  const { count: indOrders } = await ind.from("merch_orders").select("id", { count: "exact", head: true });
  check("individual sees NO products", (indProducts ?? 0) === 0, `count=${indProducts}`);
  check("individual sees NO orders", (indOrders ?? 0) === 0, `count=${indOrders}`);

  // ---- Place an order (valid) on a Diya product ----------------------------
  const { data: diyaProd } = await admin
    .from("products").select("id, unit_price, min_qty, max_qty, school_id")
    .eq("name", "Spiced Cookie Jars").single();
  const qty = diyaProd!.min_qty + 5;
  const { data: { user: recUser } } = await rec.auth.getUser();
  const { data: placed, error: placeErr } = await rec.from("merch_orders").insert({
    product_id: diyaProd!.id, recruiter_id: recUser!.id, quantity: qty, unit_price: 0, total_price: 0,
    delivery_details: "Test delivery", notes: "test",
  }).select("id, total_price, unit_price, status, school_id").single();
  check("approved recruiter can place a valid order", !placeErr && !!placed,
    placeErr ? placeErr.message : `id=${placed?.id?.slice(0,8)}`);
  check("order total auto-computed by trigger",
    !!placed && Number(placed.total_price) === qty * Number(diyaProd!.unit_price),
    `total=${placed?.total_price} expected=${qty * Number(diyaProd!.unit_price)}`);
  check("order starts as pending", placed?.status === "pending");

  // ---- Out-of-range quantity is rejected -----------------------------------
  const { error: badErr } = await rec.from("merch_orders").insert({
    product_id: diyaProd!.id, recruiter_id: recUser!.id, quantity: diyaProd!.max_qty + 1,
    unit_price: 0, total_price: 0,
  });
  check("out-of-range quantity rejected", !!badErr, badErr ? "blocked" : "ALLOWED (bad)");

  // ---- A different recruiter cannot see this order -------------------------
  const rec2 = await as("jobs@pixelcraft.com");
  const { data: other } = await rec2.from("merch_orders").select("id").eq("id", placed!.id);
  check("other recruiter cannot see someone else's order", (other?.length ?? 0) === 0);

  // ---- Owning centre sees + drives the lifecycle ---------------------------
  const school = await as("diya@workable.org");
  const { data: schoolView } = await school.from("merch_orders").select("id, status").eq("id", placed!.id);
  check("owning centre sees the order", (schoolView?.length ?? 0) === 1);

  // illegal transition pending -> fulfilled must fail
  const { error: illegal } = await school.from("merch_orders").update({ status: "fulfilled" }).eq("id", placed!.id);
  check("illegal status jump (pending→fulfilled) blocked", !!illegal, illegal ? "blocked" : "ALLOWED (bad)");

  // legal: accept then fulfil
  const { error: acceptErr } = await school.from("merch_orders").update({ status: "accepted" }).eq("id", placed!.id);
  check("centre can accept (pending→accepted)", !acceptErr, acceptErr?.message ?? "");
  const { error: fulfilErr } = await school.from("merch_orders").update({ status: "fulfilled" }).eq("id", placed!.id);
  check("centre can fulfil (accepted→fulfilled)", !fulfilErr, fulfilErr?.message ?? "");

  // recruiter cannot change status
  const { data: afterRec } = await rec.from("merch_orders").update({ status: "pending" }).eq("id", placed!.id).select("id");
  check("recruiter cannot change order status", (afterRec?.length ?? 0) === 0);

  // cleanup
  await admin.from("merch_orders").delete().eq("id", placed!.id);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
