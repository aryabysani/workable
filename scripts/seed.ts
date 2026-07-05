/**
 * WorkAble seed script (local Supabase).
 *
 * Creates real, loggable auth users via the admin API (email_confirm: true),
 * then inserts the matching profiles/schools/recruiters/students/contacts/
 * job_listings and contact_unlocks using the service-role key.
 *
 * Volume:
 *   - 1 admin
 *   - 20 schools / training centres, each with several students
 *   - 20 self-registered individuals
 *   - 5 recruiters, each posting 20 requirements (job listings)
 *   - "who viewed" contact_unlocks spread across every centre and individual
 *
 * Run AFTER `supabase db reset`:  npx tsx scripts/seed.ts
 * Idempotent: it wipes existing auth users + public data first.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { seedMerch } from "./seed-merch";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!URL || !SERVICE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Password123!";

type Role = "school" | "recruiter" | "admin" | "individual";

/** insert + throw on error so nothing fails silently */
async function insert(table: string, rows: Record<string, unknown> | Record<string, unknown>[]) {
  const { error } = await admin.from(table).insert(rows);
  if (error) throw new Error(`${table} insert: ${error.message}`);
}

async function createUser(email: string, role: Role, fullName: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user!.id;
}

async function wipe() {
  // Public data (cascades handle most, but be explicit + ordered)
  for (const t of [
    "contact_unlocks",
    "student_contacts",
    "students",
    "job_listings",
    "recruiters",
    "schools",
    "profiles",
  ]) {
    await admin.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }
  // Auth users
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if (!data.users.length) break;
    for (const u of data.users) await admin.auth.admin.deleteUser(u.id);
    if (data.users.length < 1000) break;
    page++;
  }
}

const SKILLS = [
  "Data Entry", "Graphic Design", "Packaging", "Sorting", "Hospitality",
  "Computer Operations", "Document Scanning", "Quality Checking", "Gardening",
  "Baking", "Housekeeping", "Inventory Management", "Customer Greeting",
  "Assembly Line", "Photography", "Tally / Accounting",
];
const TIMINGS = ["Morning (9am-1pm)", "Afternoon (1pm-5pm)", "Full day", "Flexible"];
const CITIES = ["Bengaluru", "Mumbai", "Pune", "Chennai", "Hyderabad", "Delhi NCR"];

const FIRST_NAMES = [
  "Aarav","Diya","Kabir","Ananya","Rohan","Meera","Vivaan","Saanvi","Arjun","Isha",
  "Karthik","Riya","Aditya","Tara","Neel","Pooja","Dev","Sara","Yash","Nisha",
  "Aryan","Anika","Ishaan","Kavya","Reyansh","Myra","Atharv","Aadhya","Shaurya","Navya",
  "Vihaan","Aisha","Krish","Aarohi","Laksh","Ira","Om","Siya","Veer","Mira",
];
const LAST_NAMES = [
  "Sharma","Iyer","Reddy","Khan","Patel","Nair","Das","Menon","Kulkarni","Desai",
  "Rao","Shaikh","Pillai","Verma","Gupta","Joshi","Bose","Mehta","Naidu","Bhat",
];

/** deterministic pick of n consecutive items (wrapping) */
function pick<T>(arr: T[], i: number, n = 1): T[] {
  const out: T[] = [];
  for (let k = 0; k < n; k++) out.push(arr[(i + k) % arr.length]);
  return out;
}

// ---------------------------------------------------------------------------
// School / centre definitions (20). First account stays diya@ for docs.
// ---------------------------------------------------------------------------
const SCHOOL_NAMES = [
  "Diya Foundation", "Ashraya Training Centre", "Pragati Special School",
  "Bubbles Centre for Autism", "Akshadaa Vocational Trust", "Sankalp Skill Academy",
  "Aashish Inclusive Institute", "Disha Learning Centre", "Sparsh Vocational School",
  "Umang Special Needs Trust", "Navjyoti Training Centre", "Prerna Inclusive School",
  "Sahaara Skill Foundation", "Aadhaar Vocational Trust", "Roshni Special School",
  "Vikaas Training Institute", "Saksham Learning Centre", "Manzil Inclusive Academy",
  "Ananda Vocational Trust", "Jeevan Skill School",
];

// ---------------------------------------------------------------------------
// Job/requirement templates — recruiters draw 20 each from this pool.
// ---------------------------------------------------------------------------
const ROLE_TEMPLATES = [
  { title: "Cafe Floor Assistant", skills: ["Hospitality", "Customer Greeting"], base: 18000 },
  { title: "Kitchen Prep & Packaging", skills: ["Packaging", "Baking"], base: 16000 },
  { title: "Junior Graphic Assistant", skills: ["Graphic Design", "Computer Operations"], base: 25000 },
  { title: "Photo Tagging Associate", skills: ["Photography", "Data Entry"], base: 20000 },
  { title: "Warehouse Sorting Operator", skills: ["Sorting", "Inventory Management"], base: 17000 },
  { title: "Packaging Line Member", skills: ["Packaging", "Quality Checking"], base: 15000 },
  { title: "Data Entry Operator", skills: ["Data Entry", "Computer Operations"], base: 22000 },
  { title: "Document Scanning Clerk", skills: ["Document Scanning", "Quality Checking"], base: 19000 },
  { title: "Greenhouse Assistant", skills: ["Gardening", "Quality Checking"], base: 16000 },
  { title: "Housekeeping Associate", skills: ["Housekeeping", "Customer Greeting"], base: 14000 },
  { title: "Inventory Stock Clerk", skills: ["Inventory Management", "Sorting"], base: 18000 },
  { title: "Assembly Line Technician", skills: ["Assembly Line", "Quality Checking"], base: 17000 },
  { title: "Bakery Production Helper", skills: ["Baking", "Packaging"], base: 16000 },
  { title: "Front Desk Greeter", skills: ["Customer Greeting", "Hospitality"], base: 15000 },
  { title: "Accounts Tally Assistant", skills: ["Tally / Accounting", "Data Entry"], base: 24000 },
  { title: "Quality Check Associate", skills: ["Quality Checking", "Sorting"], base: 18000 },
  { title: "Computer Operations Trainee", skills: ["Computer Operations", "Data Entry"], base: 21000 },
  { title: "Photo Studio Assistant", skills: ["Photography", "Computer Operations"], base: 19000 },
  { title: "Garden Maintenance Helper", skills: ["Gardening", "Housekeeping"], base: 15000 },
  { title: "Records Filing Clerk", skills: ["Document Scanning", "Data Entry"], base: 17000 },
  { title: "Retail Shelf Associate", skills: ["Inventory Management", "Customer Greeting"], base: 16000 },
  { title: "Catering Packing Assistant", skills: ["Packaging", "Hospitality"], base: 15000 },
];

const RECRUITERS = [
  { email: "hr@brewbean.com",         company: "BrewBean Cafes",      industry: "Hospitality", city: "Bengaluru", person: "Sneha Rao",    approved: true  },
  { email: "jobs@pixelcraft.com",     company: "PixelCraft Studios",  industry: "Design",      city: "Pune",      person: "Aman Verma",   approved: true  },
  { email: "talent@greenpack.in",     company: "GreenPack Logistics", industry: "Warehousing", city: "Mumbai",    person: "Farah Sheikh", approved: true  },
  { email: "hiring@datawise.io",      company: "DataWise Solutions",  industry: "IT Services", city: "Hyderabad", person: "Vikram Nair",  approved: true  },
  { email: "careers@bloomretail.com", company: "Bloom Retail",        industry: "Retail",      city: "Chennai",   person: "Divya Pillai", approved: false }, // pending demo
];

const JOBS_PER_RECRUITER = 20;
const STUDENTS_PER_SCHOOL = 5;
const INDIVIDUAL_COUNT = 20;

async function main() {
  console.log("Wiping existing data + users...");
  await wipe();

  // ----- Admin --------------------------------------------------------------
  console.log("Creating admin...");
  const adminId = await createUser("admin@workable.org", "admin", "Rotary Admin");
  await insert("profiles", {
    id: adminId, role: "admin", approval_status: "approved",
    full_name: "Rotary Admin", contact_email: "admin@workable.org",
    contact_phone: "+91 98000 00000",
  });

  // ----- Schools (20) -------------------------------------------------------
  const schoolIds: string[] = [];
  for (let i = 0; i < SCHOOL_NAMES.length; i++) {
    const name = SCHOOL_NAMES[i];
    const slug = name.toLowerCase().split(" ")[0];
    // first is diya@workable.org (documented), rest derive from slug
    const email = i === 0 ? "diya@workable.org" : `${slug}${i}@workable.org`;
    const approved = i !== 4 && i !== 12; // a couple left pending for the admin demo
    const city = CITIES[i % CITIES.length];
    const person = `${pick(FIRST_NAMES, i + 3)[0]} ${pick(LAST_NAMES, i)[0]}`;
    console.log(`Creating school ${name} (${email})...`);
    const id = await createUser(email, "school", name);
    schoolIds.push(id);
    await insert("profiles", {
      id, role: "school", approval_status: approved ? "approved" : "pending",
      full_name: name, contact_email: email, contact_phone: "+91 98 1234 0000",
    });
    await insert("schools", {
      id, name,
      description: `${name} prepares neurodiverse young adults for meaningful, dignified employment.`,
      location: city, contact_person: person, phone: "+91 98 1234 0000",
      website: `https://${slug}.org`,
    });
  }

  // ----- Students (per school) ----------------------------------------------
  console.log("Creating students...");
  const studentIds: string[] = [];
  let g = 0; // global student index for variety
  for (let si = 0; si < schoolIds.length; si++) {
    for (let k = 0; k < STUDENTS_PER_SCHOOL; k++) {
      const name = `${pick(FIRST_NAMES, g)[0]} ${pick(LAST_NAMES, g + 7)[0]}`;
      const age = 19 + (g % 10); // 19-28
      const skills = pick(SKILLS, g * 2, 2 + (g % 2));
      const is_visible = g % 6 !== 0; // ~1 in 6 hidden
      const { data: stu, error } = await admin.from("students").insert({
        school_id: schoolIds[si], name, age, skills,
        photo_url: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name + g)}`,
        preferred_location: CITIES[g % CITIES.length],
        preferred_timing: TIMINGS[g % TIMINGS.length],
        bio: `${name.split(" ")[0]} is a focused, reliable learner who thrives with clear routines and excels at ${skills[0].toLowerCase()}.`,
        training_completed: `6-month vocational program in ${skills[0]}`,
        notes: "Responds well to written instructions and a calm workspace.",
        is_visible,
      }).select("id").single();
      if (error) throw new Error(`student ${name}: ${error.message}`);
      studentIds.push(stu!.id);
      await insert("student_contacts", {
        student_id: stu!.id,
        contact_email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}.guardian@example.com`,
        contact_phone: `+91 90000 ${(10000 + g).toString().slice(-5)}`,
        guardian_name: `${name.split(" ")[0]}'s Guardian`,
      });
      g++;
    }
  }
  console.log(`  ${studentIds.length} students created.`);

  // ----- Recruiters + 20 requirements each ----------------------------------
  const recruiterIds: string[] = [];
  const approvedRecruiterIds: string[] = [];
  for (let ri = 0; ri < RECRUITERS.length; ri++) {
    const r = RECRUITERS[ri];
    console.log(`Creating recruiter ${r.company}...`);
    const id = await createUser(r.email, "recruiter", r.company);
    recruiterIds.push(id);
    if (r.approved) approvedRecruiterIds.push(id);
    await insert("profiles", {
      id, role: "recruiter", approval_status: r.approved ? "approved" : "pending",
      full_name: r.company, contact_email: r.email, contact_phone: "+91 80 4000 0000",
    });
    await insert("recruiters", {
      id, company_name: r.company,
      description: `${r.company} is committed to neuroinclusive hiring and building supportive teams.`,
      industry: r.industry, location: r.city, contact_person: r.person,
      phone: "+91 80 4000 0000", website: `https://${r.company.toLowerCase().split(" ")[0]}.com`,
    });

    // 20 requirements per recruiter (active only if the recruiter is approved)
    const jobs: Record<string, unknown>[] = [];
    for (let j = 0; j < JOBS_PER_RECRUITER; j++) {
      const tpl = ROLE_TEMPLATES[j % ROLE_TEMPLATES.length];
      const base = tpl.base + (j % 5) * 1000; // small pay variation
      jobs.push({
        recruiter_id: id,
        title: tpl.title,
        description: `${r.company} is hiring a ${tpl.title}. Full onboarding support, job coaching, and a sensory-friendly workspace provided.`,
        required_skills: tpl.skills,
        location: CITIES[(j + ri) % CITIES.length],
        work_timing: TIMINGS[j % TIMINGS.length],
        base_pay: base,
        min_pay: 0, max_pay: 0, // derived by DB trigger
        is_active: r.approved,
      });
    }
    await insert("job_listings", jobs);
  }
  console.log(`  ${recruiterIds.length * JOBS_PER_RECRUITER} job listings created.`);

  // ----- Self-registered individuals (20) -----------------------------------
  console.log("Creating individuals...");
  const individualStudentIds: string[] = [];
  for (let i = 0; i < INDIVIDUAL_COUNT; i++) {
    const fullName = `${pick(FIRST_NAMES, i + 11)[0]} ${pick(LAST_NAMES, i + 3)[0]}`;
    // first individual stays ananya.r@example.com (documented)
    const email = i === 0 ? "ananya.r@example.com"
      : `${fullName.toLowerCase().replace(/[^a-z]/g, ".")}.${i}@example.com`;
    const approved = i !== 7; // one left pending for the demo
    const skills = pick(SKILLS, i * 3, 2);
    const city = CITIES[i % CITIES.length];
    const id = await createUser(email, "individual", fullName);
    await insert("profiles", {
      id, role: "individual", approval_status: approved ? "approved" : "pending",
      full_name: fullName, contact_email: email, contact_phone: "+91 90000 50000",
    });
    const { data: stu, error } = await admin.from("students").insert({
      school_id: id, // an individual owns their own student row
      name: fullName, age: 20 + (i % 12), skills,
      photo_url: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(fullName)}`,
      preferred_location: city, preferred_timing: TIMINGS[i % TIMINGS.length],
      bio: `${fullName.split(" ")[0]} is a self-registered candidate keen to find inclusive, supportive work in ${skills[0].toLowerCase()}.`,
      training_completed: `Self-paced upskilling in ${skills[0]}`,
      is_visible: i % 9 !== 0, // most visible
    }).select("id").single();
    if (error) throw new Error(`individual ${fullName}: ${error.message}`);
    individualStudentIds.push(stu!.id);
    await insert("student_contacts", {
      student_id: stu!.id, contact_email: email,
      contact_phone: "+91 90000 50000", guardian_name: null,
    });
  }
  console.log(`  ${individualStudentIds.length} individuals created.`);

  // ----- "Who viewed" contact_unlocks (spread across all centres + people) --
  console.log("Creating contact unlocks (who-viewed data)...");
  // Pull every visible student so each centre/individual ends up with viewers.
  const { data: visible } = await admin
    .from("students").select("id").eq("is_visible", true);
  const allVisible = visible ?? [];
  const unlockRows: Record<string, unknown>[] = [];
  let u = 0;
  for (const s of allVisible) {
    // 1-2 distinct approved recruiters "view" each visible candidate
    const viewers = 1 + (u % 2);
    for (let v = 0; v < viewers; v++) {
      const recruiter_id = approvedRecruiterIds[(u + v) % approvedRecruiterIds.length];
      unlockRows.push({ recruiter_id, student_id: s.id });
    }
    u++;
  }
  const { error: unlockErr } = await admin
    .from("contact_unlocks")
    .upsert(unlockRows, { onConflict: "recruiter_id,student_id", ignoreDuplicates: true });
  if (unlockErr) throw new Error(`contact_unlocks: ${unlockErr.message}`);
  console.log(`  ${unlockRows.length} contact unlocks created.`);

  // ----- Merchandise marketplace (products + orders) ------------------------
  console.log("Seeding merchandise marketplace...");
  const merch = await seedMerch(admin);
  console.log(`  ${merch.products} products, ${merch.orders} orders created.`);

  console.log(
    `\nDone. Seeded: 1 admin, ${schoolIds.length} schools (${studentIds.length} students), ` +
    `${INDIVIDUAL_COUNT} individuals, ${recruiterIds.length} recruiters, ` +
    `${recruiterIds.length * JOBS_PER_RECRUITER} job listings, ${unlockRows.length} contact unlocks, ` +
    `${merch.products} products, ${merch.orders} orders.`,
  );
  console.log("\nLogin credentials (password for ALL accounts: " + PASSWORD + "):");
  console.log("  School     : diya@workable.org");
  console.log("  Recruiter  : hr@brewbean.com");
  console.log("  Individual : ananya.r@example.com");
  console.log("  Admin      : admin@workable.org");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
