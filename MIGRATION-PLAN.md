# NotePath Migration Plan

Migrate KeyProgress to match NotePath (`notepath-music-flow.base44.app`),
a Base44-built SPA for piano school curriculum tracking.

## What NotePath has that KeyProgress doesn't

| Feature | KeyProgress (now) | NotePath (target) |
|---|---|---|
| **Stages** | None — flat book list per series | 7 curriculum stages (S0–S6) with descriptions |
| **Skill tracking** | Binary: done / not done | 5 levels: Not Introduced → Learning → Developing → Secure → Performance Ready |
| **Resources** | None | 48 approved resources, 7 categories, linked to stages |
| **Resource assignment** | None | Resources assigned to students, tracked active/complete |
| **Completion history** | `student_books` (presence = done) | `ResourceHistory` with dates |
| **Lesson notes** | None | Per-student lesson notes |
| **Student fields** | name, parent_email, series_id | + age, DOB, address, phone, parent_name, teacher, stage, lesson_focus, general_notes, sub_notes, is_adult, public_token |
| **Teachers** | Implicit (RLS auth.uid) | Explicit `Teacher` entity, students reference teacher_id |
| **Dashboard** | None | Stats: total students, active resources, books completed, stage groups |
| **Curriculum page** | None | Stage-grouped view of skill tracks + resources |
| **Skill pathway** | Horizontal book roadmap | Interactive skill tree per student |
| **Search/filter** | None | Search students, filter by teacher + stage |
| **Student detail tabs** | Single roadmap view | Resources / History / Notes / Profile tabs |
| **Public parent view** | None (email only) | `public_token` for parent portal access |

## NotePath data model (from API exploration)

### Entities (Base44 API)

```
Student
  id, name, age, date_of_birth, email, phone, address, is_adult,
  parent_name, parent_email,
  teacher_id, teacher_name,
  stage_id, stage_number, stage_name, date_entered_stage,
  lesson_focus, general_notes, sub_notes,
  public_token,
  created_date, updated_date, created_by_id, created_by, is_sample

CurriculumStage
  id, stage_number (0-6), name, description, color,
  created_date, updated_date, created_by_id, created_by, is_sample

ApprovedResource
  id, name, description, category, author, purchase_link, stage_id,
  created_date, updated_date, created_by_id, created_by, is_sample

StudentResource           // assignment of a resource to a student
  (student_id, resource_id, status, ...)

ResourceHistory           // completion log
  (student_id, resource_id, date_completed, ...)

LessonNote
  (student_id, content, date, ...)

Teacher
  (id, name, ...)
```

### Categories (7)
Method, Theory, Technique, Repertoire, Rhythm, Sight Reading, Custom

### Stages (7)
| # | Name | Resources |
|---|---|---|
| S0 | Piano Journey | 6 |
| S1 | Completion | 8 |
| S2 | Continuity | 8 |
| S3 | Confidence | 7 |
| S4 | Expression | 8 |
| S5 | Interpretation | 7 |
| S6 | Independence | 4 |

### Skill statuses (5-level)
1. Not Introduced
2. Learning (can demonstrate with substantial help)
3. Developing (inconsistent or with reminders)
4. Secure (independently in lessons)
5. Performance Ready (reliably under performance conditions)

## KeyProgress current state

```
students: id, teacher_id, name, parent_email, series_id, created_at
student_books: student_id, book_id, status('completed'), completed_at
```

4 static series in `src/data/books.ts`. Supabase RLS + email auth.
EmailJS for parent emails. No backend server.

## Migration plan

### Phase 0: Scope decision

Before starting, decide what to keep vs rebuild:

- **Keep**: Supabase (DB + RLS + auth), Vite + React + TS + Tailwind,
  EmailJS, Cloudflare Pages deploy, `errorMessage` helper, ponytail mode.
- **Rebuild**: Data model, all UI pages, logic layer.
- **New deps?** None required. Base44 uses its own API; we use Supabase
  directly (already have it). No routing lib needed — single `App.tsx`
  with view state, or add `react-router-dom` if the page count warrants it
  (6+ pages with nested student detail — probably worth it).

### Phase 1: Schema migration (`supabase/schema.sql`)

```sql
-- 1. Stages (replaces static series — or runs alongside it)
create table curriculum_stages (
  id uuid primary key default gen_random_uuid(),
  stage_number int not null unique,
  name text not null,
  description text,
  color text,
  created_at timestamptz default now()
);

-- 2. Expand students
alter table students
  add column age int,
  add column date_of_birth date,
  add column parent_name text,
  add column phone text,
  add column address text,
  add column is_adult boolean default false,
  add column stage_id uuid references curriculum_stages(id),
  add column date_entered_stage date,
  add column lesson_focus text,
  add column general_notes text,
  add column sub_notes text,
  add column public_token text unique;
-- series_id becomes optional or stays for backward compat

-- 3. Approved resources (replaces static books.ts as the source of truth)
create table approved_resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null check (category in
    ('Method','Theory','Technique','Repertoire','Rhythm','Sight Reading','Custom')),
  author text,
  purchase_link text,
  stage_id uuid references curriculum_stages(id),
  created_at timestamptz default now()
);

-- 4. Student-resource assignment (active resources per student)
create table student_resources (
  student_id uuid not null references students(id) on delete cascade,
  resource_id uuid not null references approved_resources(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active','complete','archived')),
  assigned_at timestamptz default now(),
  primary key (student_id, resource_id)
);

-- 5. Resource completion history (replaces/extends student_books)
create table resource_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  resource_id uuid not null references approved_resources(id) on delete cascade,
  date_completed date not null default current_date,
  created_at timestamptz default now()
);

-- 6. Lesson notes
create table lesson_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- 7. Teachers (optional — or keep implicit via auth.users)
-- ponytail: keep teacher_id = auth.uid() from RLS trigger;
--   add a teachers table only if we need teacher metadata (name, email).

-- RLS on all new tables: same pattern as existing
-- (teacher sees only their students' data via the students join).
```

**Migrate existing data**: `student_books` → `resource_history` (one row per
completed book, `date_completed` = `completed_at`). Map `series_id` → nearest
`stage_id`. Keep `student_books` until migration verified, then drop.

### Phase 2: Seed curriculum data

Insert 7 stages + 48 resources into Supabase. Source the data from the
NotePath API responses captured during exploration (see
`notepath-explore-output.txt` in temp). Write a `supabase/seed.sql`.

### Phase 3: Data access layer (`src/lib/supabase.ts`)

Expand from 4 functions to ~12:
- `listStudents()` → add stage join, search, teacher/stage filters
- `getStudent(id)` → full profile
- `createStudent()` → expanded fields
- `updateStudent()` → new (for profile editing)
- `listStages()` → new
- `listResources()` → new, with category + stage filters
- `assignResource()` / `unassignResource()` → new
- `listStudentResources(studentId)` → new
- `completeResource()` → writes to `resource_history`
- `listResourceHistory(studentId)` → new
- `createLessonNote()` / `listLessonNotes()` → new

### Phase 4: Logic layer (`src/logic/`)

- `progress.ts` — keep `deriveProgress` for the book roadmap, or replace
  with stage-based progress. Add `deriveStageProgress` (student → stage %
  + skill status per resource).
- New `skillStatus.ts` — 5-level skill status logic (status transitions,
  validation).
- New `dashboard.ts` — aggregate stats (total students, active resources,
  books completed, stage distribution).

### Phase 5: UI — pages

#### 5a. Routing
Add `react-router-dom` (6 pages + nested student detail — worth it):
`/`, `/students`, `/students/:id`, `/curriculum`, `/roadmap`, `/resources`,
`/admin`.

#### 5b. Layout + sidebar
New `Sidebar.tsx` — fixed left sidebar with nav (Dashboard, Students,
Curriculum, Skill Pathway, Resources). Replace the current top header.

#### 5c. Dashboard (`/`)
Stats cards (Total Students, Active Resources, Books Completed, Stage
Groups) + recent completions list + students-by-stage breakdown.

#### 5d. Students list (`/students`)
Expand current `StudentList.tsx`: add search input, teacher/stage filter
dropdowns, student cards with stage badge + teacher name + active count.

#### 5e. Student detail (`/students/:id`)
4 tabs: Resources / History / Notes / Profile.
- Resources: assigned resources with status, add/remove
- History: completion log with dates
- Notes: lesson notes CRUD
- Profile: student fields (age, DOB, parent name/email, phone, address,
  stage, lesson focus, general notes)

#### 5f. Curriculum map (`/curriculum`)
7 stage cards, each expanding to show skill tracks + approved resources.
Collapsible accordion.

#### 5g. Skill pathway (`/roadmap`)
Interactive skill tree: student selector → tree of stages → skills with
5-level status. This is the most complex visual component.

#### 5h. Resources library (`/resources`)
Filterable grid of 48 resources. Category filter tabs (All, Method, Theory,
Technique, Repertoire, Rhythm, Sight Reading, Custom). Search.

#### 5i. Admin (`/admin`)
Same as dashboard (or admin-specific settings — resource CRUD, teacher
management).

### Phase 6: Keep what works

- `Auth.tsx` — stays as-is (Supabase email/password).
- `errorMessage()` — reuse everywhere.
- EmailJS `sendNextBookEmail()` — keep, may need template updates for
  new fields (stage name, resource name vs book title).
- `tailwind.config.js` palette — extend, don't replace. NotePath uses
  `hsl(var(--...))` CSS variables; we can adopt that or keep our
  `brand-500/600` tokens + add stage colors.
- RLS pattern — replicate for every new table.
- `ponytail:` comments — keep existing, add new ones for shortcuts.

### Phase 7: Testing

- Keep `progress.test.ts` pattern: assert-based self-checks.
- Add `skillStatus.test.ts` for the 5-level status logic.
- Add `dashboard.test.ts` for aggregate stats.
- Run `npm run check` after each logic file.

## Effort estimate

| Phase | Complexity | Sessions |
|---|---|---|
| 1. Schema | Medium — SQL + RLS | 1 |
| 2. Seed | Low — INSERT statements | 1 |
| 3. Data layer | Medium — 8 new functions | 1–2 |
| 4. Logic | Medium — 3 new modules | 1–2 |
| 5a–5i. UI | High — 6 new pages + sidebar + tabs | 4–6 |
| 6. Integration | Low — wire existing pieces | 1 |
| 7. Tests | Low — 3 self-check files | 1 |

**Total: ~10–14 sessions** for a faithful migration.

## Key decisions to make before starting

1. **Router**: Add `react-router-dom`, or keep view-state routing in
   `App.tsx`? (6 pages + nested detail → router is worth it)
2. **Teachers table**: Implicit (auth.uid) or explicit entity? NotePath
   has one, but KeyProgress's RLS approach is simpler and proven.
3. **Series vs stages**: Keep `books.ts` series for the book roadmap, or
   fully replace with stages? NotePath seems to have both (stages for
   skill tracking, Piano Adventures books shown in the pathway).
4. **Public token**: Implement parent portal access, or keep EmailJS
   as the only parent communication?
5. **Base44 → Supabase**: NotePath runs on Base44's API; we use Supabase
   directly. The data shapes map cleanly. No Base44 dependency needed.
