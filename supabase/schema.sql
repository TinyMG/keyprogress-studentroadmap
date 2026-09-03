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
