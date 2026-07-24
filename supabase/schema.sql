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
