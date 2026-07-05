# WorkAble

A job-matching platform connecting job-ready **autistic & neurodiverse adults**
with **neuroinclusive employers** — built for a Rotary social initiative.

Three roles, three dashboards:

| Role | Can do |
| --- | --- |
| **Individual** | Self-register, build & edit their own candidate profile, toggle their own visibility, and see which recruiters viewed them |
| **School / Training Centre** | Register students (skills, prefs, bio, contact), toggle each student visible/hidden to recruiters, edit/remove, see which recruiters viewed them |
| **Recruiter / Employer** | Search & filter visible candidates, unlock contact details, post job listings with an enforced ±30% pay band, manage listings |
| **Admin (Rotary)** | Approve/reject new accounts, view all candidates/listings/users, see consolidated platform stats |

An **individual** is modelled as the owner of a single self-managed `students`
row (a student's owner — `students.school_id` — references `profiles`, so it can
be a school *or* an individual). Recruiters search schools' students and
self-registered individuals through the same listing, and the contact-unlock
gating works identically for both.

## Tech

- **Next.js 16** (App Router, TypeScript) — server components + server actions
- **Supabase** (Postgres, Auth, RLS) running **locally** via the Supabase CLI / Docker
- **Tailwind CSS v4** — warm, creamy, accessible UI
- Deploy-ready for Vercel

> Note: the brief asked for Next.js 14; `create-next-app` scaffolded the current
> default (Next 16 + Tailwind v4 + React 19), which is fully compatible and the
> Vercel-recommended baseline.

## Key logic — pay range (±30%)

A recruiter enters a **base pay**. The offered range is automatically
`base × 0.7 … base × 1.3` (e.g. ₹20,000 → ₹14,000–₹26,000). This is enforced in
**three** places:

1. **UI** — live preview + the form derives min/max (`src/lib/format.ts`).
2. **DB trigger** — `set_job_pay_range()` recomputes `min_pay`/`max_pay` from
   `base_pay` on every insert/update, so the stored range is authoritative.
3. **DB CHECK constraint** — `pay_range_within_band` rejects any row whose
   stored range falls outside the ±30% band.

## Contact-detail gating

A student's contact info lives in a separate `student_contacts` table. RLS only
lets a recruiter read it **after** they insert a row into `contact_unlocks` for
that student. The owning school sees those unlock rows as its "who viewed" feed,
and they power the admin "contacts made" stat.

## Database

- `supabase/migrations/*_schema.sql` — tables, indexes, pay-range trigger + CHECK, grants
- `supabase/migrations/*_rls_policies.sql` — RLS helper functions + all policies
- `scripts/seed.ts` — creates auth users via the admin API (`email_confirm: true`)
  and inserts all profile/role/student/listing data
- `scripts/test-rls.ts` — automated RLS + pay-range checks

## Run it locally (exact order)

The local Supabase stack should already be up (`supabase start`). Then:

```bash
# 1. install deps
npm install

# 2. apply schema + RLS migrations (drops & recreates the local DB)
supabase db reset

# 3. seed auth users + data
#    (REQUIRED after every `supabase db reset` — reset wipes auth.users)
npx tsx scripts/seed.ts

# 4. (optional) verify isolation + pay-range logic
npx tsx scripts/test-rls.ts

# 5. run the app
npm run dev        # http://localhost:3000
```

> **Important:** `supabase db reset` wipes the local database **including auth
> users**, then re-runs all migrations. Always re-run `npx tsx scripts/seed.ts`
> afterwards to recreate the loggable accounts.

Supabase Studio: http://127.0.0.1:54323

## Environment (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your local anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<your local service-role / secret key>
# Run `supabase status` after `supabase start` to get both keys.
```

The **anon/publishable** key is used by the browser + server clients (RLS
applies). The **secret/service-role** key is server-only — used at sign-up to
write the new user's profile row, and by the seed script.

## Test credentials

Password for **every** seeded account: **`Password123!`**

| Role | Email |
| --- | --- |
| Individual | `ananya.r@example.com` |
| School | `diya@workable.org` |
| Recruiter | `hr@brewbean.com` |
| Admin | `admin@workable.org` |

Other seeded logins: schools `ashraya@ / pragati@ / bubbles@ / akshadaa@workable.org`
(Akshadaa is left **pending** to demo approval); recruiters `jobs@pixelcraft.com`,
`talent@greenpack.in`, `hiring@datawise.io`, `careers@bloomretail.com` (Bloom is
**pending**).
