/**
 * Merchandise Marketplace seed.
 *
 * Adds products + sample orders on top of the existing seeded schools/recruiters.
 * Imported by scripts/seed.ts (so a full `db reset` reproduces it) and also
 * runnable standalone:  npx tsx scripts/seed-merch.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";

function img(label: string) {
  return `https://placehold.co/640x440/efe9dd/3f6e4b?text=${encodeURIComponent(label)}`;
}

export async function seedMerch(admin: SupabaseClient) {
  // Resolve existing centres + recruiters by name (robust to how the main seed
  // generates their login emails).
  const { data: schools } = await admin.from("schools").select("id, name");
  const { data: recruiters } = await admin.from("recruiters").select("id, company_name");
  const schoolByName = new Map((schools ?? []).map((s) => [s.name, s.id]));
  const recruiterByName = new Map((recruiters ?? []).map((r) => [r.company_name, r.id]));
  const school = (name: string) => {
    const v = schoolByName.get(name);
    if (!v) throw new Error(`seed-merch: no centre "${name}" — run the main seed first`);
    return v as string;
  };
  const recruiter = (name: string) => {
    const v = recruiterByName.get(name);
    if (!v) throw new Error(`seed-merch: no recruiter "${name}" — run the main seed first`);
    return v as string;
  };

  const DIYA = school("Diya Foundation");
  const ASHRAYA = school("Ashraya Training Centre");
  const PRAGATI = school("Pragati Special School");
  const BUBBLES = school("Bubbles Centre for Autism");
  const AKSHADAA = school("Akshadaa Vocational Trust");

  const BREWBEAN = recruiter("BrewBean Cafes");
  const PIXELCRAFT = recruiter("PixelCraft Studios");
  const GREENPACK = recruiter("GreenPack Logistics");
  const DATAWISE = recruiter("DataWise Solutions");

  // Clean slate (cascades handle orders, but order explicitly anyway).
  await admin.from("merch_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // ----- Products -----------------------------------------------------------
  const products = [
    { school: DIYA, name: "Soy Wax Candles", category: "Candles", desc: "Hand-poured soy candles in reusable glass jars, lightly scented with lavender and vanilla.", price: 250, min: 10, max: 200, avail: true },
    { school: DIYA, name: "Lavender Handmade Soap", category: "Soaps", desc: "Cold-process soap bars made with shea butter and dried lavender. Gentle and fragrant.", price: 120, min: 12, max: 300, avail: true },
    { school: DIYA, name: "Spiced Cookie Jars", category: "Food & Treats", desc: "Layered dry cookie mix in a ribboned jar — just add butter and an egg. Great corporate gift.", price: 220, min: 10, max: 120, avail: true },
    { school: ASHRAYA, name: "Cotton Tote Bags", category: "Tote Bags", desc: "Sturdy block-printed cotton totes, perfect for events and gifting. Custom prints on request.", price: 180, min: 20, max: 500, avail: true },
    { school: ASHRAYA, name: "Hand-painted Greeting Cards", category: "Greeting Cards", desc: "Set of assorted watercolour greeting cards with envelopes. Each one individually painted.", price: 60, min: 25, max: 1000, avail: true },
    { school: PRAGATI, name: "Beaded Bracelets", category: "Jewellery", desc: "Colourful handmade beaded bracelets in adjustable sizes. Sold in mixed-colour sets.", price: 150, min: 10, max: 250, avail: true },
    { school: PRAGATI, name: "Block-print T-shirts", category: "Apparel", desc: "100% cotton tees with hand block-printed motifs. Available in S–XL, assorted colours.", price: 350, min: 15, max: 300, avail: true },
    { school: BUBBLES, name: "Macramé Plant Hangers", category: "Home Decor", desc: "Hand-knotted cotton macramé hangers for small to medium pots. Adds warmth to any space.", price: 400, min: 5, max: 100, avail: true },
    { school: BUBBLES, name: "Recycled Paper Notebooks", category: "Stationery", desc: "A5 notebooks with recycled paper and hand-stitched binding. Plain or dotted pages.", price: 90, min: 20, max: 400, avail: true },
    { school: AKSHADAA, name: "Festive Diya Gift Set", category: "Home Decor", desc: "Set of hand-painted clay diyas in a gift box — a warm festive corporate gift. (Seasonal)", price: 320, min: 8, max: 150, avail: false },
  ];

  const nameToId = new Map<string, string>();
  for (const p of products) {
    const { data, error } = await admin.from("products").insert({
      school_id: p.school, name: p.name, category: p.category, description: p.desc,
      image: img(p.name), unit_price: p.price, min_qty: p.min, max_qty: p.max,
      is_available: p.avail,
    }).select("id").single();
    if (error) throw new Error(`product ${p.name}: ${error.message}`);
    nameToId.set(p.name, data.id);
  }

  // ----- Orders (across every status) --------------------------------------
  // unit_price/total_price/school_id are filled by the prepare trigger.
  const orders = [
    { product: "Soy Wax Candles", recruiter: BREWBEAN, qty: 50, status: "accepted",
      delivery: "BrewBean Cafes, 12 MG Road, Bengaluru 560001 — deliver by month-end.",
      notes: "For our café gifting shelf. Lavender scent preferred." },
    { product: "Cotton Tote Bags", recruiter: PIXELCRAFT, qty: 100, status: "pending",
      delivery: "PixelCraft Studios, Baner, Pune 411045.",
      notes: "Studio-branded print to follow once the order is accepted." },
    { product: "Recycled Paper Notebooks", recruiter: GREENPACK, qty: 200, status: "fulfilled",
      delivery: "GreenPack Logistics warehouse, Bhiwandi, Mumbai.",
      notes: "Dotted pages. Delivered and paid — thank you!" },
    { product: "Block-print T-shirts", recruiter: DATAWISE, qty: 40, status: "pending",
      delivery: "DataWise Solutions, HITEC City, Hyderabad 500081.",
      notes: "Team offsite tees — assorted sizes, navy preferred." },
    { product: "Lavender Handmade Soap", recruiter: BREWBEAN, qty: 30, status: "declined",
      delivery: "BrewBean Cafes central kitchen, Bengaluru.",
      notes: "Wanted custom scent we couldn't fulfil this cycle." },
  ] as const;

  for (const o of orders) {
    const product_id = nameToId.get(o.product)!;
    const { error } = await admin.from("merch_orders").insert({
      product_id, recruiter_id: o.recruiter, quantity: o.qty, status: o.status,
      delivery_details: o.delivery, notes: o.notes,
      // placeholders — overwritten by the prepare_merch_order() trigger
      unit_price: 0, total_price: 0,
    });
    if (error) throw new Error(`order ${o.product}: ${error.message}`);
  }

  return { products: products.length, orders: orders.length };
}

// Standalone runner
if (import.meta.url === `file://${process.argv[1]}`) {
  config({ path: ".env.local" });
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  seedMerch(admin)
    .then((r) => console.log(`Seeded ${r.products} products and ${r.orders} orders.`))
    .catch((e) => { console.error(e); process.exit(1); });
}
