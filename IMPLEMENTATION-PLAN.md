# NotePath Migration — Implementation Plan

Migrate KeyProgress to match NotePath. Ponytail: additive, not
rewrite. Keep what works (Supabase RLS, Auth, Roadmap, progress.ts,
EmailJS, errorMessage). Add stages, resources, notes, dashboard, and
new pages alongside existing code.

### Story summary

- **Goal:** Match NotePath's feature set — 7 curriculum stages, 48
  approved resources, 5-level skill tracking, lesson notes, student
  profiles with expanded fields, dashboard with stats, sidebar
  layout, and 6 pages (Dashboard, Students, Curriculum, Skill Pathway,
  Resources, Admin).
- **Users:** Music teachers (single-teacher per account, Supabase RLS).
- **Success criteria:** `npm run build` passes. `npm run check` passes.
  All 6 pages render with real Supabase data. Existing book roadmap
  and EmailJS still work.

### Assumptions & constraints

- **No router dep.** Keep view-state in `App.tsx` (one more `useState`).
  7 views is fine without `react-router-dom`. URLs won't be shareable
  but this is a single-teacher app, not a public site.
- **No Teachers table.** Keep `teacher_id = auth.uid()` via the existing
  trigger. NotePath has a Teacher entity but KeyProgress's RLS approach
  is simpler and proven. Don't add it.
- **Keep `books.ts` + `student_books` + `deriveProgress`.** The book
  series roadmap works and is tested. Stages are a new layer on top,
  not a replacement. `student_books` tracks ordered book progression;
  `student_resources` tracks the broader resource library.
- **No public token / parent portal.** Keep EmailJS as the only parent
  communication channel. Defer public_token until the school asks.
- **Stages + resources are shared reference data.** No RLS on
  `curriculum_stages` or `approved_resources` — all teachers see the
  same curriculum. Per-teacher customization is a later YAGNI.
- **Admin = Dashboard.** NotePath's /admin shows the same content as
  the dashboard. Don't build a separate admin page; route /admin to
  the dashboard component.

### Step-by-step plan

1. **Schema** — add 5 new tables + expand `students` columns in
   `supabase/schema.sql`. Re-run in Supabase SQL editor. RLS on
   student-owned tables, none on reference tables.
2. **Seed** — write `supabase/seed.sql` with 7 stages + 48 resources
   copied from NotePath API data. Run once in Supabase SQL editor.
3. **Types** — expand `Student` type, add `Stage`, `Resource`,
   `StudentResource`, `ResourceHistory`, `LessonNote` types in
   `src/lib/supabase.ts`.
4. **Data layer** — add ~10 new functions to `src/lib/supabase.ts`
   following existing patterns (throw on error, return typed data).
5. **Logic** — add `src/logic/stageProgress.ts` (pure) +
   `src/logic/dashboard.ts` (pure). Self-checks in `.test.ts` files.
6. **Update `npm run check`** — chain new test files.
7. **Layout** — new `Sidebar.tsx`. Rework `App.tsx` to use `view`
   state with 7 views. Remove the current top header.
8. **Dashboard** — new `Dashboard.tsx`. Stats cards + recent
   completions + students-by-stage breakdown.
9. **Students list** — expand `StudentList.tsx`: add search input,
   stage filter dropdown, stage badge on cards.
10. **Student detail** — rework `StudentDetail.tsx`: 4 tabs
    (Resources, History, Notes, Profile). Move Roadmap to Skill
    Pathway page. Keep EmailParentButton in the Resources tab.
11. **Curriculum** — new `Curriculum.tsx`. 7 collapsible stage cards,
    each showing its resources grouped by category.
12. **Skill Pathway** — new `SkillPathway.tsx`. Student selector +
    reuse existing `Roadmap` component. Add 5-level skill status
    legend.
13. **Resources** — new `ResourcesPage.tsx`. Filterable grid of 48
    resources. Category filter tabs + search.
14. **Tailwind** — add stage colors to `tailwind.config.js`. Keep
    existing `brand`/`done`/`current`/`goal` tokens.
15. **Verify** — `npm run build` + `npm run check`. Manual smoke test
    each page.

### Architecture impact

- **Modules/services:** No new services. Supabase remains the only
  backend. No new npm dependencies.
- **Events/messaging:** EmailJS stays. No new integrations.
- **Schemas/migrations:** 5 new tables, `students` gains 12 columns,
  new RLS policies, no existing tables dropped or renamed.
  `student_books` and the `set_students_teacher_id` trigger stay.

### API & model contracts (sketch)

```ts
// src/lib/supabase.ts — new types

export type Stage = {
  id: string;
  stage_number: number;   // 0-6
  name: string;
  description: string;
  color: string | null;
};

export type Resource = {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  author: string;
  purchase_link: string | null;
  stage_id: string;
};

export type ResourceCategory =
  | "Method" | "Theory" | "Technique"
  | "Repertoire" | "Rhythm" | "Sight Reading" | "Custom";

export type StudentResource = {
  student_id: string;
  resource_id: string;
  status: "active" | "complete" | "archived";
  assigned_at: string;
};

export type ResourceHistoryEntry = {
  id: string;
  student_id: string;
  resource_id: string;
  date_completed: string;
};

export type LessonNote = {
  id: string;
  student_id: string;
  content: string;
  created_at: string;
};

// Expanded Student (additive — existing fields stay)
export type Student = {
  id: string;
  name: string;
  parent_email: string | null;
  series_id: string;
  created_at: string;
  // new fields (all nullable — existing rows have null)
  age: number | null;
  date_of_birth: string | null;
  parent_name: string | null;
  phone: string | null;
  address: string | null;
  is_adult: boolean | null;
  stage_id: string | null;
  date_entered_stage: string | null;
  lesson_focus: string | null;
  general_notes: string | null;
  sub_notes: string | null;
};
```

```ts
// src/lib/supabase.ts — new functions

export async function listStages(): Promise<Stage[]>
export async function listResources(
  stageId?: string, category?: ResourceCategory
): Promise<Resource[]>
export async function getStudent(id: string): Promise<Student>
export async function updateStudent(
  id: string, fields: Partial<Student>
): Promise<Student>
export async function listStudentResources(
  studentId: string
): Promise<StudentResource[]>
export async function assignResource(
  studentId: string, resourceId: string
): Promise<void>
export async function unassignResource(
  studentId: string, resourceId: string
): Promise<void>
export async function completeResource(
  studentId: string, resourceId: string
): Promise<void>
export async function listResourceHistory(
  studentId: string
): Promise<ResourceHistoryEntry[]>
export async function listAllResourceHistory(
  limit?: number
): Promise<(ResourceHistoryEntry & { student_name: string; resource_name: string })[]>
export async function createLessonNote(
  studentId: string, content: string
): Promise<LessonNote>
export async function listLessonNotes(
  studentId: string
): Promise<LessonNote[]>
```

```ts
// src/logic/stageProgress.ts — pure

export type StageProgress = {
  stage: Stage;
  totalResources: number;
  completedResources: number;
  activeResources: number;
  percent: number; // 0-100
};

export function deriveStageProgress(
  stages: Stage[],
  resources: Resource[],
  studentResources: StudentResource[],
  resourceHistory: ResourceHistoryEntry[],
): StageProgress[]
```

```ts
// src/logic/dashboard.ts — pure

export type DashboardStats = {
  totalStudents: number;
  activeResources: number;
  booksCompleted: number;
  stageGroups: number;
  recentCompletions: RecentCompletion[];
  studentsByStage: { stageName: string; count: number }[];
};

export type RecentCompletion = {
  studentName: string;
  resourceName: string;
  dateCompleted: string;
};

export function deriveDashboardStats(
  students: Student[],
  stages: Stage[],
  studentResources: StudentResource[],
  resourceHistory: ResourceHistoryEntry[],
  resources: Resource[],
): DashboardStats
```

### Key code skeletons

- **`src/components/Sidebar.tsx`:**

```tsx
type View = "dashboard" | "students" | "student"
  | "curriculum" | "roadmap" | "resources";

type Props = {
  current: View;
  onNavigate: (v: View) => void;
  teacherEmail: string;
  onSignOut: () => void;
};

export default function Sidebar({ current, onNavigate, teacherEmail, onSignOut }: Props) {
  const items: { id: View; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "students", label: "Students" },
    { id: "curriculum", label: "Curriculum" },
    { id: "roadmap", label: "Skill Pathway" },
    { id: "resources", label: "Resources" },
  ];
  // fixed left sidebar, w-64, brand bg, nav buttons, sign out at bottom
}
```

- **`src/App.tsx` (reworked):**

```tsx
const [view, setView] = useState<View>("dashboard");
const [selected, setSelected] = useState<Student | null>(null);

function openStudent(s: Student) {
  setSelected(s);
  setView("student");
}

// render: <div className="flex min-h-full">
//   <Sidebar ... />
//   <main className="flex-1">
//     {view === "dashboard" && <Dashboard />}
//     {view === "students" && <StudentList onSelect={openStudent} />}
//     {view === "student" && selected && <StudentDetail ... />}
//     {view === "curriculum" && <Curriculum />}
//     {view === "roadmap" && <SkillPathway />}
//     {view === "resources" && <ResourcesPage />}
//   </main>
// </div>
```

- **`src/components/Dashboard.tsx`:**

```tsx
// Fetches: listStudents, listStages, listAllResourceHistory,
// listResources, count student_books
// Renders: 4 stat cards (Total Students, Active Resources,
//   Books Completed, Stage Groups) + recent completions list +
//   students-by-stage breakdown
// Error pattern: try/catch + errorMessage(err), same as existing
```

- **`src/components/StudentDetail.tsx` (reworked):**

```tsx
type Tab = "resources" | "history" | "notes" | "profile";
const [tab, setTab] = useState<Tab>("resources");

// Tab content:
// resources: listStudentResources + assign/unassign buttons
// history: listResourceHistory with dates
// notes: listLessonNotes + create form
// profile: editable fields (age, DOB, parent_name, phone, address,
//   stage, lesson_focus, general_notes, sub_notes) → updateStudent
```

- **`src/components/Curriculum.tsx`:**

```tsx
// Fetches: listStages, listResources (all)
// Renders: 7 collapsible stage cards. Each stage shows
//   resources grouped by category (Technique, Rhythm, Theory,
//   Method, etc.) with name + author + description.
```

- **`src/components/SkillPathway.tsx`:**

```tsx
// Student selector dropdown → fetch student's completed books
// via listCompletedBooks → deriveProgress → render <Roadmap>
// Also shows 5-level skill status legend
// Reuses existing Roadmap.tsx component unchanged
```

- **`src/components/ResourcesPage.tsx`:**

```tsx
// Fetches: listResources (all)
// State: category filter ("All" | each category), search query
// Renders: filter tabs + search input + grid of resource cards
//   (name, author, category badge, description)
```

- **`supabase/schema.sql` (additive):**

```sql
-- Stages (shared reference, no RLS)
create table if not exists curriculum_stages (
  id uuid primary key default gen_random_uuid(),
  stage_number int not null unique,
  name text not null,
  description text,
  color text,
  created_at timestamptz not null default now()
);

-- Approved resources (shared reference, no RLS)
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

-- Expand students
alter table students
  add column if not exists age int,
  add column if not exists date_of_birth date,
  add column if not exists parent_name text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists is_adult boolean default false,
  add column if not exists stage_id uuid references curriculum_stages(id),
  add column if not exists date_entered_stage date,
  add column if not exists lesson_focus text,
  add column if not exists general_notes text,
  add column if not exists sub_notes text;

-- Student-resource assignment (RLS via student join)
create table if not exists student_resources (
  student_id uuid not null references students(id) on delete cascade,
  resource_id uuid not null references approved_resources(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active','complete','archived')),
  assigned_at timestamptz not null default now(),
  primary key (student_id, resource_id)
);
alter table student_resources enable row level security;
drop policy if exists "student_resources owner all" on student_resources;
create policy "student_resources owner all" on student_resources
  for all using (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid()))
  with check (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid()));

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
  for all using (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid()))
  with check (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid()));

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
  for all using (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid()))
  with check (
    exists (select 1 from students s
            where s.id = student_id and s.teacher_id = auth.uid()));
```

- **`supabase/seed.sql` — 7 stages + 48 resources** (full INSERT
  statements sourced from `notepath-api-data.json`. Generated by
  mapping NotePath stage_number → name → description and each
  resource → name, description, category, author, stage_number.)

### Tests to add

- **smoke:** `npm run build` (tsc + vite). Must pass with zero TS
  errors. This is the gate — no separate lint/typecheck.
- **Integration:** `npm run check` — runs assert-based self-checks via
  `node --experimental-strip-types`. Update the script to chain:
  ```
  "check": "node --experimental-strip-types src/logic/progress.test.ts && node --experimental-strip-types src/logic/stageProgress.test.ts && node --experimental-strip-types src/logic/dashboard.test.ts"
  ```
- **functionality:**
  - `stageProgress.test.ts` — assert:
    - empty student → all stages 0%
    - student with all S0 resources complete → S0 = 100%, S1 = 0%
    - percent = completed / total, rounded
    - active count vs completed count
  - `dashboard.test.ts` — assert:
    - totalStudents = students.length
    - activeResources = count of active student_resources
    - booksCompleted = count of student_books rows
    - stageGroups = distinct stages with ≥1 student
    - recentCompletions sorted by date desc, limit 10
  - `progress.test.ts` — keep unchanged (existing book roadmap)

### Rollout & safety

- **Feature flag:** None. Single-teacher app, no A/B needed. Deploy
  is `npm run build` → Cloudflare Pages. Roll back via git revert +
  redeploy.
- **Backward compatibility:** `student_books` table and `series_id`
  column stay. Existing book roadmap keeps working. New columns on
  `students` are all nullable — existing rows have null, UI shows
  empty/placeholder. No data migration needed for existing rows.
- **Metrics/logs/traces:** None. No observability stack. Supabase
  dashboard shows API logs + query stats.
- **Runbook:**
  1. Run `supabase/schema.sql` (additive — safe, no drops)
  2. Run `supabase/seed.sql` (insert stages + resources)
  3. `npm run build` — must pass
  4. `npm run check` — must pass
  5. `npm run dev` — smoke test each page
  6. Push to `main` → Cloudflare Pages auto-deploys
  7. If broken: `git revert` + push → Cloudflare auto-redeploys

### Risks & mitigations

- **Supabase RLS on new tables:** if a policy is missing, rows are
  invisible (empty query results, not an error). Mitigation: copy
  the exact pattern from `student_books` policy. Test with a real
  auth session after schema run.
- **`student_resources` status column:** NotePath has statuses
  (active/complete/archived). Keep the check constraint strict.
  `ponytail:` collapse to bare join if no other statuses appear.
- **5-level skill status:** NotePath has 5 skill levels (Not
  Introduced → Performance Ready). This requires a
  `student_skill_status` table or a `skill_level` column on
  `student_resources`. **Deferred** — the current migration tracks
  resource assignment + completion (binary), not granular skill
  levels. Add when the school asks for it. The Skill Pathway page
  can show the legend as static text for now.
- **`listAllResourceHistory` needs a join:** Supabase JS client
  can't do cross-table joins in a single query easily. Fetch
  resource_history + students + resources separately, join in
  `deriveDashboardStats` (pure function). Keeps DB queries simple.
- **Schema drift:** `schema.sql` is re-run, not migrated. Use
  `if not exists` / `if not exists` on all new DDL. `alter table
  add column if not exists` prevents errors on re-run.

### Definition of done

- [ ] `supabase/schema.sql` re-run successfully in Supabase SQL editor
- [ ] `supabase/seed.sql` inserts 7 stages + 48 resources
- [ ] `npm run build` passes (zero TS errors)
- [ ] `npm run check` passes (all 3 test files)
- [ ] Dashboard renders stats from real Supabase data
- [ ] Students list has working search + stage filter
- [ ] Student detail has 4 tabs, all functional
- [ ] Curriculum page shows 7 stages with resources
- [ ] Skill Pathway shows book roadmap (existing Roadmap component)
- [ ] Resources page shows 48 resources with category filters
- [ ] Sidebar navigates between all 6 views
- [ ] Auth still works (sign in / sign up)
- [ ] EmailJS "Email parent" still works from student detail
- [ ] Existing book roadmap + toggle still works
- [ ] No new npm dependencies added
- [ ] `ponytail:` comments on all deliberate shortcuts
