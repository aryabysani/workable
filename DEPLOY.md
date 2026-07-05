# WorkAble — Deploy to hosted Supabase + Vercel

This is the exact, ordered runbook to take the app from **local Docker** to a
**hosted Supabase** database and a **live Vercel** deployment.

Prepared state (already done for you):

- ✅ Local stack is running; current data confirmed (47 users, 21 schools, 120
  students, 100 listings, 150 contact unlocks, 10 products, 5 orders).
- ✅ Full data export written to `supabase/exports/auth_data.sql` and
  `supabase/exports/public_data.sql` (captures the real sign-ups too, not just seed).
- ✅ `npm run build` passes clean (30 routes).
- ✅ Runtime env vars the app needs: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Steps **A–C** you run in your own terminal (they need interactive login + your
DB password). Step **D** deploys to Vercel.

---

## A. Authenticate & link to the hosted project

```bash
# 1. Log in (opens a browser to the account that owns hojnnubpbpzvhzwhhmoj)
supabase login

# 2. Link this repo to the hosted project
#    (prompts for the DB password — Dashboard ▸ Project Settings ▸ Database ▸ Password)
supabase link --project-ref hojnnubpbpzvhzwhhmoj
```

Verify it's healthy:

```bash
supabase projects list          # hojnnubpbpzvhzwhhmoj should appear as ACTIVE_HEALTHY
```

---

## B. Push the schema (migrations) to hosted

All 4 migrations (schema, RLS, individual role, merch marketplace) get applied:

```bash
supabase db push
```

---

## C. Load the data into hosted

The dumps disable triggers/FK during restore (`session_replication_role = replica`),
so the pay-range trigger won't rewrite values and FK ordering won't matter.
**Restore auth first, then public** (public rows reference `auth.users`).

Grab the hosted connection string from
**Dashboard ▸ Project Settings ▸ Database ▸ Connection string ▸ URI**
(use the **Direct connection** or **Session pooler** URI), then:

```bash
export HOSTED_DB_URL='postgresql://postgres:<DB_PASSWORD>@db.hojnnubpbpzvhzwhhmoj.supabase.co:5432/postgres'

# psql isn't on your PATH, so run it through Docker (already installed):
docker run --rm -v "$(pwd)/supabase/exports:/e" postgres:17 \
  psql "$HOSTED_DB_URL" -v ON_ERROR_STOP=1 -f /e/auth_data.sql

docker run --rm -v "$(pwd)/supabase/exports:/e" postgres:17 \
  psql "$HOSTED_DB_URL" -v ON_ERROR_STOP=1 -f /e/public_data.sql
```

> **Simpler alternative** (if the auth restore complains): skip the two dumps and
> just re-seed the hosted DB — it recreates users via the admin API, which is the
> canonical way. You lose only the handful of manual browser sign-ups.
> ```bash
> # point the seed at hosted by temporarily setting these, then:
> NEXT_PUBLIC_SUPABASE_URL=https://hojnnubpbpzvhzwhhmoj.supabase.co \
> NEXT_PUBLIC_SUPABASE_ANON_KEY=<hosted anon> \
> SUPABASE_SERVICE_ROLE_KEY=<hosted service_role> \
> npx tsx scripts/seed.ts
> ```

Verify:

```bash
supabase db dump --data-only -s public 2>/dev/null | grep -c "INSERT\|COPY"   # sanity check
```

---

## D. Deploy to Vercel

Vercel CLI is already logged in as `aryabysani`.

Get the hosted API keys from **Dashboard ▸ Project Settings ▸ API**
(`Project URL`, `anon public`, `service_role`).

```bash
# 1. Link the repo to a Vercel project (first time only)
vercel link

# 2. Set the three env vars for Production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
#   → https://hojnnubpbpzvhzwhhmoj.supabase.co
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
#   → <hosted anon public key>
vercel env add SUPABASE_SERVICE_ROLE_KEY production
#   → <hosted service_role key>   (keep secret — server-only)

# 3. Ship it
vercel --prod
```

After the deploy URL is live, log in with a seeded account
(`diya@workable.org` / `Password123!`) to confirm the DB wiring end-to-end.

---

## Notes

- **`.env.local` stays pointed at local Docker** (`http://127.0.0.1:54321`) for
  development — do not commit hosted keys there. Vercel holds the hosted values.
- The `service_role` key must never be exposed to the browser; it's only read in
  `src/lib/supabase/admin.ts` (server-side).
- Re-running `supabase db push` is safe/idempotent; re-running the data restore is
  **not** (it would duplicate rows) — restore once.
