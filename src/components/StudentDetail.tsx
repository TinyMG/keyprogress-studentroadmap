import { useEffect, useState } from "react";
import Roadmap from "./Roadmap";
import EmailParentButton from "./EmailParentButton";
import { SERIES_BY_ID } from "../data/books";
import { deriveProgress, type Progress } from "../logic/progress";
import {
  listCompletedBooks,
  setBookCompleted,
  type Student,
} from "../lib/supabase";

type Props = {
  student: Student;
  teacherEmail: string;
  onBack: () => void;
};

export default function StudentDetail({ student, teacherEmail, onBack }: Props) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const series = SERIES_BY_ID[student.series_id];

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const ids = await listCompletedBooks(student.id);
      setCompleted(ids);
      setProgress(deriveProgress(student.series_id, ids));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [student.id]);

  async function toggle(bookId: string) {
    setBusy(true);
    const wasDone = completed.includes(bookId);
    // optimistic
    const next = wasDone
      ? completed.filter((id) => id !== bookId)
      : [...completed, bookId];
    setCompleted(next);
    setProgress(deriveProgress(student.series_id, next));
    try {
      await setBookCompleted(student.id, bookId, !wasDone);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      void load(); // revert
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-brand-600 hover:underline">
        ← Back to students
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
        <p className="text-sm text-slate-500">
          {series?.name ?? student.series_id}
          {student.parent_email ? ` · ${student.parent_email}` : ""}
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading || !progress ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <>
          <Roadmap
            nodes={progress.nodes}
            seriesName={series?.name ?? student.series_id}
            onToggle={toggle}
            canEdit={!busy}
          />
          <div className="mt-8">
            <EmailParentButton
              student={student}
              progress={progress}
              teacherEmail={teacherEmail}
            />
          </div>
        </>
      )}
    </div>
  );
}
