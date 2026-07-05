-- Add a self-registering "individual" role.
-- An individual owns a single student profile (themselves). To reuse all the
-- existing students / student_contacts / contact_unlocks machinery, a student's
-- owner (students.school_id) now references profiles directly, so it can be a
-- school OR an individual. Existing school ids are already profile ids, so all
-- current data stays valid.

-- 1. allow the new role
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('school','recruiter','admin','individual'));

-- 2. repoint students owner FK from schools(id) to profiles(id)
alter table public.students drop constraint students_school_id_fkey;
alter table public.students
  add constraint students_school_id_fkey
  foreign key (school_id) references public.profiles(id) on delete cascade;

-- 3. individuals need to read recruiter company info for their "who viewed" feed
drop policy recruiters_select on public.recruiters;
create policy recruiters_select on public.recruiters
  for select using (
    id = auth.uid()
    or public.is_admin()
    or public.my_role() in ('recruiter','school','individual')
  );
