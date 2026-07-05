/**
 * End-to-end RLS + pay-range checks against the local stack.
 * Run after seeding:  npx tsx scripts/test-rls.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PW = "Password123!";

function anon() {
  return createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function as(email: string) {
  const c = anon();
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

  // ---- Recruiter visibility -------------------------------------------------
  const rec = await as("hr@brewbean.com");
  const { count: recVisible } = await rec
    .from("students").select("id", { count: "exact", head: true });
  const { count: totalVisible } = await admin
    .from("students").select("id", { count: "exact", head: true }).eq("is_visible", true);
  check("recruiter sees only visible students", recVisible === totalVisible,
    `recruiter=${recVisible} visible=${totalVisible}`);

  const { count: recAll } = await rec.from("students").select("id", { count: "exact", head: true });
  const { count: trueTotal } = await admin.from("students").select("id", { count: "exact", head: true });
  check("recruiter does NOT see hidden students", recAll! < trueTotal!,
    `recruiter=${recAll} total=${trueTotal}`);

  // ---- Contact gating -------------------------------------------------------
  const { data: someVisible } = await rec.from("students").select("id").limit(1).single();
  const targetId = someVisible!.id;
  // a fresh recruiter that has NOT unlocked this student
  const rec2 = await as("jobs@pixelcraft.com");
  const { data: lockedContact } = await rec2
    .from("student_contacts").select("*").eq("student_id", targetId);
  check("locked contact is hidden before unlock", (lockedContact?.length ?? 0) === 0,
    `rows=${lockedContact?.length ?? 0}`);

  // unlock then read
  const { data: { user: rec2User } } = await rec2.auth.getUser();
  await rec2.from("contact_unlocks").upsert(
    { recruiter_id: rec2User!.id, student_id: targetId },
    { onConflict: "recruiter_id,student_id", ignoreDuplicates: true },
  );
  const { data: unlockedContact } = await rec2
    .from("student_contacts").select("*").eq("student_id", targetId);
  check("contact visible after unlock", (unlockedContact?.length ?? 0) === 1,
    `rows=${unlockedContact?.length ?? 0}`);

  // ---- School isolation -----------------------------------------------------
  const school = await as("diya@workable.org");
  const { data: { user: schoolUser } } = await school.auth.getUser();
  const { data: ownStudents } = await school.from("students").select("school_id");
  const onlyOwn = (ownStudents ?? []).every((s) => s.school_id === schoolUser!.id);
  check("school sees only its own students", onlyOwn && (ownStudents?.length ?? 0) > 0,
    `count=${ownStudents?.length ?? 0}`);

  // school cannot insert a student under a different school
  const { error: crossErr } = await school.from("students").insert({
    school_id: "00000000-0000-0000-0000-000000000000", name: "Hacker", skills: [],
  });
  check("school cannot create student for another school", !!crossErr,
    crossErr ? "blocked" : "ALLOWED (bad)");

  // ---- Pay range ------------------------------------------------------------
  const { data: jobs } = await admin.from("job_listings").select("base_pay, min_pay, max_pay");
  const allBanded = (jobs ?? []).every((j) =>
    Math.abs(Number(j.min_pay) - Math.round(Number(j.base_pay) * 0.7)) < 0.5 &&
    Math.abs(Number(j.max_pay) - Math.round(Number(j.base_pay) * 1.3)) < 0.5);
  check("all listings sit at exactly ±30%", allBanded);

  // trigger recomputes range from base_pay on insert
  const recApproved = await as("hr@brewbean.com");
  const { data: { user: rUser } } = await recApproved.auth.getUser();
  const { data: newJob, error: jobErr } = await recApproved.from("job_listings").insert({
    recruiter_id: rUser!.id, title: "RLS Test Role", base_pay: 10000,
    min_pay: 1, max_pay: 999999, required_skills: [], // bogus values, trigger should fix
  }).select("min_pay, max_pay").single();
  check("trigger overrides bogus min/max on insert",
    !jobErr && Number(newJob?.min_pay) === 7000 && Number(newJob?.max_pay) === 13000,
    jobErr ? jobErr.message : `min=${newJob?.min_pay} max=${newJob?.max_pay}`);

  // CHECK constraint blocks an out-of-band manual min_pay update (no base change)
  const { data: aJob } = await admin.from("job_listings").select("id").limit(1).single();
  const { error: checkErr } = await admin
    .from("job_listings").update({ min_pay: 1 }).eq("id", aJob!.id);
  check("CHECK constraint blocks out-of-band min_pay", !!checkErr,
    checkErr ? "blocked" : "ALLOWED (bad)");

  // cleanup the test job
  await admin.from("job_listings").delete().eq("title", "RLS Test Role");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
