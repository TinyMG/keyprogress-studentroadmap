import { createClient } from "@supabase/supabase-js";
import type { Series } from "../data/books";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // ponytail: silent no-op in dev without env; queries fail loudly instead of
  // crashing at module load. Wire real config before first login.
  console.warn("KeyProgress: missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

// A placeholder/invalid URL would throw inside createClient and blank the
// whole app; fall back to a dummy client so the UI still renders (and every
// query fails loudly) instead of a white screen.
function makeClient() {
  if (url && /^https?:\/\//.test(url)) {
    return createClient(url, anon ?? "");
  }
  console.error("KeyProgress: invalid VITE_SUPABASE_URL — check .env");
  return createClient("http://localhost", "invalid");
}

export const supabase = makeClient();

// ===== Types =====

export type Student = {
  id: string;
  teacher_id: string;
  auth_user_id: string | null;
  name: string;
  parent_email: string | null;
  series_id: string;
  created_at: string;
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

export type StudentBookRow = { student_id: string; book_id: string };

export type Stage = {
  id: string;
  stage_number: number;
  name: string;
  description: string | null;
  color: string | null;
};

export type ResourceCategory =
  | "Method" | "Theory" | "Technique"
  | "Repertoire" | "Rhythm" | "Sight Reading" | "Custom";

export type Resource = {
  id: string;
  name: string;
  description: string | null;
  category: ResourceCategory;
  author: string | null;
  purchase_link: string | null;
  stage_id: string | null;
  video_url: string | null;
};

export type MasteryLevel =
  | "Not Introduced"
  | "Learning"
  | "Developing"
  | "Secure"
  | "Performance Ready";

export type StudentResource = {
  student_id: string;
  resource_id: string;
  status: "active" | "complete" | "archived";
  mastery_level: MasteryLevel;
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

export type Role = "admin" | "teacher" | "student";

export type Profile = {
  id: string;
  email: string;
  role: Role;
};

// ===== Profile queries (roles) =====

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

// Admin-only via RLS: returns every account (Teachers tab, and the
// teacher/login pickers in the student editor).
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .order("email", { ascending: true });
  if (error) throw error;
  return data as Profile[];
}

export async function updateProfileRole(
  id: string,
  role: Role,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);
  if (error) throw error;
}

// ===== Student queries (expanded) =====

const STUDENT_COLS =
  "id, teacher_id, auth_user_id, name, parent_email, series_id, " +
  "created_at, age, date_of_birth, parent_name, phone, address, " +
  "is_adult, stage_id, date_entered_stage, " +
  "lesson_focus, general_notes, sub_notes";

export async function listStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_COLS)
    .order("name", { ascending: true });
  if (error) throw error;
  return data as unknown as Student[];
}

export async function getStudent(id: string): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_COLS)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as Student;
}

export async function createStudent(
  name: string,
  seriesId: string,
  parentEmail: string | null,
  opts: { teacherId?: string } = {},
): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .insert({
      name,
      series_id: seriesId,
      parent_email: parentEmail,
      // Only admins send teacher_id; the DB trigger stamps auth.uid()
      // when it's absent (teacher path). RLS rejects bad values.
      ...(opts.teacherId ? { teacher_id: opts.teacherId } : {}),
    })
    .select(STUDENT_COLS)
    .single();
  if (error) throw error;
  return data as unknown as Student;
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}

export async function updateStudent(
  id: string,
  fields: Partial<Omit<Student, "id" | "created_at">>,
): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .update(fields)
    .eq("id", id)
    .select(STUDENT_COLS)
    .single();
  if (error) throw error;
  return data as unknown as Student;
}

// ===== Book queries (existing — unchanged) =====

export async function listCompletedBooks(
  studentId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("student_books")
    .select("book_id")
    .eq("student_id", studentId);
  if (error) throw error;
  return (data as { book_id: string }[]).map((r) => r.book_id);
}

export async function setBookCompleted(
  studentId: string,
  bookId: string,
  completed: boolean,
): Promise<void> {
  if (completed) {
    const { error } = await supabase
      .from("student_books")
      .upsert({ student_id: studentId, book_id: bookId })
      .eq("student_id", studentId)
      .eq("book_id", bookId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("student_books")
      .delete()
      .eq("student_id", studentId)
      .eq("book_id", bookId);
    if (error) throw error;
  }
}

export async function countCompletedBooks(): Promise<number> {
  const { count, error } = await supabase
    .from("student_books")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

// ===== Stage queries =====

export async function listStages(): Promise<Stage[]> {
  const { data, error } = await supabase
    .from("curriculum_stages")
    .select("id, stage_number, name, description, color")
    .order("stage_number", { ascending: true });
  if (error) throw error;
  return data as Stage[];
}

// Admin-only writes (RLS-enforced).
export type StageFields = {
  stage_number: number;
  name: string;
  description: string | null;
  color: string | null;
};

export async function createStage(fields: StageFields): Promise<void> {
  const { error } = await supabase
    .from("curriculum_stages")
    .insert(fields);
  if (error) throw error;
}

export async function updateStage(
  id: string,
  fields: Partial<StageFields>,
): Promise<void> {
  const { error } = await supabase
    .from("curriculum_stages")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteStage(id: string): Promise<void> {
  const { error } = await supabase
    .from("curriculum_stages")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ===== Resource queries =====

export async function listResources(
  stageId?: string,
  category?: ResourceCategory,
): Promise<Resource[]> {
  let q = supabase
    .from("approved_resources")
    .select(
      "id, name, description, category, author, purchase_link, " +
        "stage_id, video_url",
    )
    .order("name", { ascending: true });
  if (stageId) q = q.eq("stage_id", stageId);
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return data as unknown as Resource[];
}

// Admin-only writes (RLS-enforced).
export type ResourceFields = {
  name: string;
  description: string | null;
  category: ResourceCategory;
  author: string | null;
  purchase_link: string | null;
  stage_id: string | null;
  video_url: string | null;
};

export async function createResource(
  fields: ResourceFields,
): Promise<void> {
  const { error } = await supabase
    .from("approved_resources")
    .insert(fields);
  if (error) throw error;
}

export async function updateResource(
  id: string,
  fields: Partial<ResourceFields>,
): Promise<void> {
  const { error } = await supabase
    .from("approved_resources")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase
    .from("approved_resources")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// Upload a lesson video to the resource-videos bucket and return its
// public URL. Call BEFORE writing the resource row so a failed upload
// never leaves a row pointing at nothing.
export async function uploadResourceVideo(file: File): Promise<string> {
  const path = `videos/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("resource-videos")
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw error;
  return supabase.storage.from("resource-videos").getPublicUrl(path)
    .data.publicUrl;
}

// ===== Custom skill-pathway nodes (admin-curated) =====

export type PathwayNodeRow = {
  id: string;
  label: string;
  parent_id: string;
  category: string | null;
  sub_skills: string[];
  resource_name: string | null;
  dx: number;
  dy: number;
  created_at: string;
};

export type PathwayNodeFields = {
  label: string;
  parent_id: string;
  category: string | null;
  sub_skills: string[];
  resource_name: string | null;
};

export async function listPathwayNodes(): Promise<PathwayNodeRow[]> {
  const { data, error } = await supabase
    .from("pathway_nodes")
    .select(
      "id, label, parent_id, category, sub_skills, resource_name, " +
        "dx, dy, created_at",
    )
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as PathwayNodeRow[];
}

export async function createPathwayNode(
  fields: PathwayNodeFields,
): Promise<void> {
  const { error } = await supabase
    .from("pathway_nodes")
    .insert(fields);
  if (error) throw error;
}

export async function updatePathwayNode(
  id: string,
  fields: Partial<PathwayNodeFields>,
): Promise<void> {
  const { error } = await supabase
    .from("pathway_nodes")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deletePathwayNode(id: string): Promise<void> {
  const { error } = await supabase
    .from("pathway_nodes")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// Persist a drag-to-nudge offset (from the auto-placed position).
export async function setNodePosition(
  id: string,
  dx: number,
  dy: number,
): Promise<void> {
  const { error } = await supabase
    .from("pathway_nodes")
    .update({ dx, dy })
    .eq("id", id);
  if (error) throw error;
}

// ===== Student-resource assignment =====

export async function listStudentResources(
  studentId: string,
): Promise<StudentResource[]> {
  const { data, error } = await supabase
    .from("student_resources")
    .select("student_id, resource_id, status, mastery_level, assigned_at")
    .eq("student_id", studentId);
  if (error) throw error;
  return data as unknown as StudentResource[];
}

export async function assignResource(
  studentId: string,
  resourceId: string,
): Promise<void> {
  const { error } = await supabase
    .from("student_resources")
    .upsert({
      student_id: studentId,
      resource_id: resourceId,
      status: "active",
      mastery_level: "Not Introduced",
    })
    .eq("student_id", studentId)
    .eq("resource_id", resourceId);
  if (error) throw error;
}

export async function unassignResource(
  studentId: string,
  resourceId: string,
): Promise<void> {
  const { error } = await supabase
    .from("student_resources")
    .delete()
    .eq("student_id", studentId)
    .eq("resource_id", resourceId);
  if (error) throw error;
}

export async function setStudentResourceStatus(
  studentId: string,
  resourceId: string,
  status: StudentResource["status"],
): Promise<void> {
  const { error } = await supabase
    .from("student_resources")
    .update({ status })
    .eq("student_id", studentId)
    .eq("resource_id", resourceId);
  if (error) throw error;
}

export async function updateMasteryLevel(
  studentId: string,
  resourceId: string,
  level: MasteryLevel,
): Promise<void> {
  const { error } = await supabase
    .from("student_resources")
    .update({ mastery_level: level })
    .eq("student_id", studentId)
    .eq("resource_id", resourceId);
  if (error) throw error;
}

// ===== Resource completion history =====

export async function listResourceHistory(
  studentId: string,
): Promise<ResourceHistoryEntry[]> {
  const { data, error } = await supabase
    .from("resource_history")
    .select("id, student_id, resource_id, date_completed")
    .eq("student_id", studentId)
    .order("date_completed", { ascending: false });
  if (error) throw error;
  return data as ResourceHistoryEntry[];
}

export async function listAllResourceHistory(
  limit = 10,
): Promise<ResourceHistoryEntry[]> {
  const { data, error } = await supabase
    .from("resource_history")
    .select("id, student_id, resource_id, date_completed")
    .order("date_completed", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as ResourceHistoryEntry[];
}

export async function completeResource(
  studentId: string,
  resourceId: string,
): Promise<void> {
  const { error: histError } = await supabase
    .from("resource_history")
    .insert({ student_id: studentId, resource_id: resourceId });
  if (histError) throw histError;
  await setStudentResourceStatus(studentId, resourceId, "complete");
}

// ===== Lesson notes =====

export async function listLessonNotes(
  studentId: string,
): Promise<LessonNote[]> {
  const { data, error } = await supabase
    .from("lesson_notes")
    .select("id, student_id, content, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as LessonNote[];
}

export async function createLessonNote(
  studentId: string,
  content: string,
): Promise<LessonNote> {
  const { data, error } = await supabase
    .from("lesson_notes")
    .insert({ student_id: studentId, content })
    .select("id, student_id, content, created_at")
    .single();
  if (error) throw error;
  return data as LessonNote;
}

export type { Series };
