import { useState } from "react";
import { SERIES_BY_ID } from "../data/books";
import { nextBookSuggestion, type Progress } from "../logic/progress";
import { sendNextBookEmail } from "../lib/email";
import type { Student } from "../lib/supabase";

type Props = {
  student: Student;
  progress: Progress;
  teacherEmail: string;
};

export default function EmailParentButton({ student, progress, teacherEmail }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = nextBookSuggestion(progress);
  const series = SERIES_BY_ID[student.series_id];
  const canSend = Boolean(next && student.parent_email);

  async function send() {
    if (!next || !student.parent_email) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await sendNextBookEmail({
        studentName: student.name,
        parentEmail: student.parent_email,
        seriesName: series?.name ?? student.series_id,
        nextBookTitle: next.title,
        teacherEmail,
      });
      setMsg("Email sent to parent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (progress.isComplete) {
    return (
      <div className="rounded-xl border border-done/30 bg-done/5 p-4 text-sm text-done">
        🎉 {student.name} completed the entire {series?.name} series!
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-900">Suggest next book to parent</p>
        {next ? (
          <p className="text-sm text-slate-600">
            Will email {student.parent_email ?? "(no parent email on file)"} suggesting{" "}
            <span className="font-medium">{next.title}</span>.
          </p>
        ) : (
          <p className="text-sm text-slate-600">No next book to suggest.</p>
        )}
      </div>
      <button
        onClick={send}
        disabled={!canSend || busy}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Email parent"}
      </button>
      {!student.parent_email && (
        <p className="mt-2 text-xs text-slate-500">
          Add a parent email to the student to enable this.
        </p>
      )}
      {msg && <p className="mt-2 text-sm text-done">{msg}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
