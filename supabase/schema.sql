-- KeyProgress schema
-- Run in Supabase SQL editor. Uses auth.users for teacher identity.

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_email text,
  series_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists students_teacher_id_idx on students(teacher_id);

-- student_books: one row per completed book. Absence = not done.
-- ponytail: status column is always 'completed' for now; collapse to a
-- bare join table (drop status) if no other states ever appear.
create table if not exists student_books (
  student_id uuid not null references students(id) on delete cascade,
  book_id text not null,
  status text not null default 'completed' check (status in ('completed')),
  completed_at timestamptz not null default now(),
  primary key (student_id, book_id)
);

create index if not exists student_books_student_id_idx on student_books(student_id);

alter table students enable row level security;
alter table student_books enable row level security;

-- A teacher can do anything with students they own.
drop policy if exists "students owner all" on students;
create policy "students owner all" on students
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- student_books: gate on the owning student's teacher.
drop policy if exists "student_books owner all" on student_books;
create policy "student_books owner all" on student_books
  for all
  using (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid())
  )
  with check (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid())
  );

-- Stamp teacher_id from the authenticated session on every insert.
-- Trust boundary: the DB owns "who this row belongs to", the client never
-- sends teacher_id. RLS WITH CHECK then passes because the value is set.
create or replace function set_students_teacher_id()
returns trigger as $$
begin
  new.teacher_id := auth.uid();
  return new;
end;
$$ language plpgsql;

drop trigger if exists students_set_teacher_id on students;
create trigger students_set_teacher_id
  before insert on students
  for each row execute function set_students_teacher_id();

-- ===== NotePath migration: curriculum stages, resources, notes =====

-- Stages: shared reference data, no RLS (all teachers see same curriculum)
create table if not exists curriculum_stages (
  id uuid primary key default gen_random_uuid(),
  stage_number int not null unique,
  name text not null,
  description text,
  color text,
  created_at timestamptz not null default now()
);

-- Approved resources: shared reference, no RLS
create table if not exists approved_resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null check (category in
    ('Method','Theory','Technique','Repertoire',
     'Rhythm','Sight Reading','Custom')),
  author text,
  purchase_link text,
  stage_id uuid references curriculum_stages(id),
  created_at timestamptz not null default now()
);

create index if not exists approved_resources_stage_id_idx
  on approved_resources(stage_id);

-- Expand students with NotePath fields (all nullable — existing rows ok)
alter table students add column if not exists age int;
alter table students add column if not exists date_of_birth date;
alter table students add column if not exists parent_name text;
alter table students add column if not exists phone text;
alter table students add column if not exists address text;
alter table students add column if not exists is_adult boolean default false;
alter table students add column if not exists stage_id uuid
  references curriculum_stages(id);
alter table students add column if not exists date_entered_stage date;
alter table students add column if not exists lesson_focus text;
alter table students add column if not exists general_notes text;
alter table students add column if not exists sub_notes text;

-- Student-resource assignment (RLS via student join)
create table if not exists student_resources (
  student_id uuid not null references students(id) on delete cascade,
  resource_id uuid not null references approved_resources(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active','complete','archived')),
  mastery_level text not null default 'Not Introduced'
    check (mastery_level in
      ('Not Introduced','Learning','Developing','Secure','Performance Ready')),
  assigned_at timestamptz not null default now(),
  primary key (student_id, resource_id)
);

-- ponytail: mastery_level added after initial create; additive ALTER for
-- existing tables. Safe to re-run.
alter table student_resources add column if not exists mastery_level text
  not null default 'Not Introduced'
  check (mastery_level in
    ('Not Introduced','Learning','Developing','Secure','Performance Ready'));

alter table student_resources enable row level security;
drop policy if exists "student_resources owner all" on student_resources;
create policy "student_resources owner all" on student_resources
  for all
  using (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid())
  )
  with check (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid())
  );

-- Resource completion history (RLS via student join)
create table if not exists resource_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  resource_id uuid not null references approved_resources(id) on delete cascade,
  date_completed date not null default current_date,
  created_at timestamptz not null default now()
);

alter table resource_history enable row level security;
drop policy if exists "resource_history owner all" on resource_history;
create policy "resource_history owner all" on resource_history
  for all
  using (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid())
  )
  with check (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid())
  );

-- Lesson notes (RLS via student join)
create table if not exists lesson_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table lesson_notes enable row level security;
drop policy if exists "lesson_notes owner all" on lesson_notes;
create policy "lesson_notes owner all" on lesson_notes
  for all
  using (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid())
  )
  with check (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid())
  );

-- ===== Roles: admin / teacher / student =====
-- Roles live in profiles, NOT auth user metadata: clients can edit their
-- own metadata, so it is not a trust boundary. RLS below is the boundary.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'teacher'
    check (role in ('admin','teacher','student')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- SECURITY DEFINER so RLS policies can check role without recursing
-- into profiles' own policies.
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "profiles self read" on profiles;
create policy "profiles self read" on profiles
  for select using (id = auth.uid());

drop policy if exists "profiles admin read" on profiles;
create policy "profiles admin read" on profiles
  for select using (is_admin());

drop policy if exists "profiles admin update" on profiles;
create policy "profiles admin update" on profiles
  for update using (is_admin()) with check (is_admin());

-- Copy email into profiles on signup. Every new account starts as
-- 'teacher'; the admin promotes/demotes in the app.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email) values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill users that existed before this migration (safe to re-run).
insert into profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;

-- Link student rows to login accounts (admin sets this in the app).
alter table students add column if not exists auth_user_id uuid
  references auth.users(id) on delete set null;
create unique index if not exists students_auth_user_id_key
  on students(auth_user_id) where auth_user_id is not null;

-- Widen students RLS. Split per-command (a FOR ALL policy would let a
-- student-role account insert a row owned by themselves, since the
-- trigger stamps teacher_id = auth.uid()).
drop policy if exists "students owner or admin" on students;
drop policy if exists "students owner all" on students;
drop policy if exists "students self read" on students;
drop policy if exists "students select" on students;
drop policy if exists "students insert" on students;
drop policy if exists "students update" on students;
drop policy if exists "students delete" on students;
create policy "students select" on students
  for select
  using (
    teacher_id = auth.uid()
    or is_admin()
    or auth_user_id = auth.uid()
  );
-- Insert: admin for any teacher; teachers for themselves (role checked
-- via profiles so a student-role account can't self-own rows).
create policy "students insert" on students
  for insert
  with check (
    is_admin()
    or (
      teacher_id = auth.uid()
      and exists (
        select 1 from profiles p
        where p.id = auth.uid() and p.role in ('teacher','admin')
      )
    )
  );
create policy "students update" on students
  for update
  using (teacher_id = auth.uid() or is_admin())
  with check (teacher_id = auth.uid() or is_admin());
create policy "students delete" on students
  for delete
  using (teacher_id = auth.uid() or is_admin());

-- Student login links are admin-managed: teachers can edit their
-- students' fields but must not change auth_user_id.
create or replace function guard_students_login()
returns trigger as $$
begin
  if not is_admin()
     and new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'Only admins can link student logins';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists students_guard_login on students;
create trigger students_guard_login
  before update on students
  for each row execute function guard_students_login();

-- Admin may create students for any teacher: only stamp teacher_id when
-- the client didn't send one (teacher path unchanged).
create or replace function set_students_teacher_id()
returns trigger as $$
begin
  if new.teacher_id is null then
    new.teacher_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql;

-- Self-read for linked students on the per-student tables. Existing
-- owner policies keep teacher/admin access; permissive policies OR.
drop policy if exists "student_books self read" on student_books;
create policy "student_books self read" on student_books
  for select using (
    exists (select 1 from students s
            where s.id = student_id and s.auth_user_id = auth.uid())
  );

drop policy if exists "student_resources self read" on student_resources;
create policy "student_resources self read" on student_resources
  for select using (
    exists (select 1 from students s
            where s.id = student_id and s.auth_user_id = auth.uid())
  );

drop policy if exists "resource_history self read" on resource_history;
create policy "resource_history self read" on resource_history
  for select using (
    exists (select 1 from students s
            where s.id = student_id and s.auth_user_id = auth.uid())
  );

drop policy if exists "lesson_notes self read" on lesson_notes;
create policy "lesson_notes self read" on lesson_notes
  for select using (
    exists (select 1 from students s
            where s.id = student_id and s.auth_user_id = auth.uid())
  );

-- Stages/resources: everyone logged in reads, only admin writes.
alter table curriculum_stages enable row level security;
drop policy if exists "stages read all" on curriculum_stages;
create policy "stages read all" on curriculum_stages
  for select using (auth.uid() is not null);
drop policy if exists "stages admin write" on curriculum_stages;
create policy "stages admin write" on curriculum_stages
  for all using (is_admin()) with check (is_admin());

alter table approved_resources enable row level security;
drop policy if exists "resources read all" on approved_resources;
create policy "resources read all" on approved_resources
  for select using (auth.uid() is not null);
drop policy if exists "resources admin write" on approved_resources;
create policy "resources admin write" on approved_resources
  for all using (is_admin()) with check (is_admin());

-- Deleting a stage must not orphan/brick on references: null them out.
alter table students
  drop constraint if exists students_stage_id_fkey;
alter table students
  add constraint students_stage_id_fkey
  foreign key (stage_id) references curriculum_stages(id)
  on delete set null;

alter table approved_resources
  drop constraint if exists approved_resources_stage_id_fkey;
alter table approved_resources
  add constraint approved_resources_stage_id_fkey
  foreign key (stage_id) references curriculum_stages(id)
  on delete set null;

-- ===== Resource videos =====
-- video_url holds either an external link (YouTube/Vimeo) or a
-- resource-videos storage public URL.

alter table approved_resources add column if not exists video_url text;

insert into storage.buckets (id, name, public, file_size_limit)
values ('resource-videos', 'resource-videos', true, 52428800)
on conflict (id) do nothing;

-- ponytail: public bucket + 50MB cap � free tier has 1GB total, long
-- lessons should be YouTube links. If quota bites, raise the limit or
-- move to signed URLs / external hosting.
drop policy if exists "videos public read" on storage.objects;
create policy "videos public read" on storage.objects
  for select using (bucket_id = 'resource-videos');

drop policy if exists "videos authed upload" on storage.objects;
create policy "videos authed upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resource-videos');
