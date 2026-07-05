-- WorkAble schema
-- Job-matching platform for autistic & neurodiverse adults.
-- Roles: school | recruiter | admin

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holds role + approval status
-- ---------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           text not null check (role in ('school','recruiter','admin')),
  approval_status text not null default 'pending'
                   check (approval_status in ('pending','approved','rejected')),
  full_name      text not null default '',
  contact_email  text,
  contact_phone  text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- schools: extra detail for school/training-centre accounts
-- ---------------------------------------------------------------------------
create table public.schools (
  id             uuid primary key references public.profiles(id) on delete cascade,
  name           text not null,
  description    text,
  location       text,
  contact_person text,
  phone          text,
  website        text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- recruiters: extra detail for recruiter/employer accounts
-- ---------------------------------------------------------------------------
create table public.recruiters (
  id             uuid primary key references public.profiles(id) on delete cascade,
  company_name   text not null,
  description    text,
  industry       text,
  location       text,
  contact_person text,
  phone          text,
  website        text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- students: belong to a school. Public fields visible to recruiters when
-- is_visible = true. Contact details live in student_contacts (gated).
-- ---------------------------------------------------------------------------
create table public.students (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid not null references public.schools(id) on delete cascade,
  name               text not null,
  age                int check (age between 14 and 99),
  photo_url          text,
  skills             text[] not null default '{}',
  preferred_location text,
  preferred_timing   text,
  bio                text,
  training_completed text,
  notes              text,
  is_visible         boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index students_school_id_idx on public.students(school_id);
create index students_is_visible_idx on public.students(is_visible);
create index students_skills_idx on public.students using gin(skills);

-- ---------------------------------------------------------------------------
-- student_contacts: sensitive contact info, separated so RLS can gate it
-- behind a contact_unlock.
-- ---------------------------------------------------------------------------
create table public.student_contacts (
  student_id     uuid primary key references public.students(id) on delete cascade,
  contact_email  text,
  contact_phone  text,
  guardian_name  text
);

-- ---------------------------------------------------------------------------
-- job_listings: posted by recruiters. base_pay drives min/max via trigger,
-- and a CHECK keeps the stored range inside the +/-30% band.
-- ---------------------------------------------------------------------------
create table public.job_listings (
  id             uuid primary key default gen_random_uuid(),
  recruiter_id   uuid not null references public.recruiters(id) on delete cascade,
  title          text not null,
  description    text,
  required_skills text[] not null default '{}',
  location       text,
  work_timing    text,
  base_pay       numeric(12,2) not null check (base_pay > 0),
  min_pay        numeric(12,2) not null,
  max_pay        numeric(12,2) not null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  -- DB-level guarantee: stored range must sit within +/-30% of base_pay
  constraint pay_range_within_band check (
    min_pay >= round(base_pay * 0.70, 2) - 0.01 and
    max_pay <= round(base_pay * 1.30, 2) + 0.01 and
    min_pay <= base_pay and
    max_pay >= base_pay
  )
);
create index job_listings_recruiter_id_idx on public.job_listings(recruiter_id);
create index job_listings_is_active_idx on public.job_listings(is_active);

-- Trigger: always derive min/max from base_pay (+/-30%), authoritative.
create or replace function public.set_job_pay_range()
returns trigger
language plpgsql
as $$
begin
  new.min_pay := round(new.base_pay * 0.70, 2);
  new.max_pay := round(new.base_pay * 1.30, 2);
  return new;
end;
$$;

create trigger trg_set_job_pay_range
  before insert or update of base_pay on public.job_listings
  for each row execute function public.set_job_pay_range();

-- ---------------------------------------------------------------------------
-- contact_unlocks: a recruiter "unlocks" a student's contact details.
-- Powers the school's "who viewed" feature + admin placement stats.
-- ---------------------------------------------------------------------------
create table public.contact_unlocks (
  id           uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.recruiters(id) on delete cascade,
  student_id   uuid not null references public.students(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (recruiter_id, student_id)
);
create index contact_unlocks_student_id_idx on public.contact_unlocks(student_id);
create index contact_unlocks_recruiter_id_idx on public.contact_unlocks(recruiter_id);

-- ---------------------------------------------------------------------------
-- keep students.updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_students_touch
  before update on public.students
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Grants. RLS (next migration) is what actually constrains anon/authenticated;
-- these grants make the tables reachable at all. service_role bypasses RLS.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
