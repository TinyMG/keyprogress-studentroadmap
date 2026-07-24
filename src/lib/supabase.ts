import { createClient } from "@supabase/supabase-js";
import type { Series } from "../data/books";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // ponytail: silent no-op in dev without env; queries fail loudly instead of
  // crashing at module load. Wire real config before first login.
  console.warn("KeyProgress: missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url ?? "", anon ?? "");

export type Student = {
  id: string;
  name: string;
  parent_email: string | null;
  series_id: string;
  created_at: string;
};

export type StudentBookRow = { student_id: string; book_id: string };

export async function listStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from("students")
    .select("id, name, parent_email, series_id, created_at")
    .order("name", { ascending: true });
  if (error) throw error;
  return data as Student[];
}

export async function createStudent(
  name: string,
  seriesId: string,
  parentEmail: string | null,
): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .insert({ name, series_id: seriesId, parent_email: parentEmail })
    .select("id, name, parent_email, series_id, created_at")
    .single();
  if (error) throw error;
  return data as Student;
}

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

export type { Series };
