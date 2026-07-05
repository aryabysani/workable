-- WorkAble Row Level Security
-- Isolation rules:
--   * schools see/edit only their own students + contacts
--   * recruiters see only visible students; their own listings/unlocks
--   * admin sees everything
--   * a student's contact details unlock only after a contact_unlock row exists

-- ---------------------------------------------------------------------------
-- Helper functions (security definer to avoid RLS recursion on profiles)
-- ---------------------------------------------------------------------------
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_approved_recruiter()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'recruiter'
      and approval_status = 'approved'
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.schools          enable row level security;
alter table public.recruiters       enable row level security;
alter table public.students         enable row level security;
alter table public.student_contacts enable row level security;
alter table public.job_listings     enable row level security;
alter table public.contact_unlocks  enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_own_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

-- own row may be updated by the user; admins may update anyone (approvals)
create policy profiles_update_own_or_admin on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- schools  (name/location are public-ish so recruiters can show "from X")
-- ---------------------------------------------------------------------------
create policy schools_select on public.schools
  for select using (
    id = auth.uid() or public.is_admin() or public.my_role() in ('recruiter','school')
  );

create policy schools_insert_self on public.schools
  for insert with check (id = auth.uid());

create policy schools_update_own_or_admin on public.schools
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- recruiters (company info visible so schools can see "who viewed")
-- ---------------------------------------------------------------------------
create policy recruiters_select on public.recruiters
  for select using (
    id = auth.uid() or public.is_admin() or public.my_role() in ('recruiter','school')
  );

create policy recruiters_insert_self on public.recruiters
  for insert with check (id = auth.uid());

create policy recruiters_update_own_or_admin on public.recruiters
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------
-- school owner + admin see all their students; approved recruiters see only
-- visible ones.
create policy students_select on public.students
  for select using (
    school_id = auth.uid()
    or public.is_admin()
    or (is_visible and public.is_approved_recruiter())
  );

create policy students_insert_own on public.students
  for insert with check (school_id = auth.uid() or public.is_admin());

create policy students_update_own on public.students
  for update using (school_id = auth.uid() or public.is_admin())
  with check (school_id = auth.uid() or public.is_admin());

create policy students_delete_own on public.students
  for delete using (school_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- student_contacts  -- the gated sensitive table
-- ---------------------------------------------------------------------------
create policy student_contacts_select on public.student_contacts
  for select using (
    -- owning school
    exists (select 1 from public.students s
            where s.id = student_contacts.student_id and s.school_id = auth.uid())
    or public.is_admin()
    -- recruiter who has unlocked this student
    or exists (select 1 from public.contact_unlocks cu
               where cu.student_id = student_contacts.student_id
                 and cu.recruiter_id = auth.uid())
  );

create policy student_contacts_write on public.student_contacts
  for all using (
    exists (select 1 from public.students s
            where s.id = student_contacts.student_id and s.school_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.students s
            where s.id = student_contacts.student_id and s.school_id = auth.uid())
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- job_listings  (active listings are browsable; owner/admin manage)
-- ---------------------------------------------------------------------------
create policy job_listings_select on public.job_listings
  for select using (
    is_active or recruiter_id = auth.uid() or public.is_admin()
  );

create policy job_listings_insert_own on public.job_listings
  for insert with check (
    recruiter_id = auth.uid() and public.is_approved_recruiter()
  );

create policy job_listings_update_own on public.job_listings
  for update using (recruiter_id = auth.uid() or public.is_admin())
  with check (recruiter_id = auth.uid() or public.is_admin());

create policy job_listings_delete_own on public.job_listings
  for delete using (recruiter_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- contact_unlocks
-- ---------------------------------------------------------------------------
-- recruiter sees own unlocks; the owning school sees who viewed its students;
-- admin sees all.
create policy contact_unlocks_select on public.contact_unlocks
  for select using (
    recruiter_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.students s
               where s.id = contact_unlocks.student_id and s.school_id = auth.uid())
  );

-- only an approved recruiter may unlock, and only for a visible student
create policy contact_unlocks_insert_own on public.contact_unlocks
  for insert with check (
    recruiter_id = auth.uid()
    and public.is_approved_recruiter()
    and exists (select 1 from public.students s
                where s.id = contact_unlocks.student_id and s.is_visible)
  );

create policy contact_unlocks_delete_admin on public.contact_unlocks
  for delete using (public.is_admin());
