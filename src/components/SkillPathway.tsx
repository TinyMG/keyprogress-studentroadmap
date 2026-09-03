import { useEffect, useState } from "react";
import {
  listStudents,
  listCompletedBooks,
  listStudentResources,
  type Student,
  type StudentResource,
  type MasteryLevel,
} from "../lib/supabase";
import { deriveProgress, type Progress } from "../logic/progress";
import { SERIES_BY_ID } from "../data/books";
import { errorMessage } from "../lib/error";

type Props = {
  onSelect: (s: Student) => void;
};

export default function SkillPathway({ onSelect }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [studentRes, setStudentRes] = useState<StudentResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    setError(null);
    try {
      const list = await listStudents();
      setStudents(list);
      if (list[0]) {
        setSelectedId(list[0].id);
        await loadProgress(list[0]);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadProgress(student: Student) {
    try {
      const [ids, sr] = await Promise.all([
        listCompletedBooks(student.id),
        listStudentResources(student.id),
      ]);
      setProgress(deriveProgress(student.series_id, ids));
      setStudentRes(sr);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function selectStudent(id: string) {
    setSelectedId(id);
    const student = students.find((s) => s.id === id);
    if (student) await loadProgress(student);
  }

  if (loading)
    return <div className="px-8 py-12"><p className="text-slate-500">Loading…</p></div>;
  if (error)
    return <div className="px-8 py-12"><p className="text-sm text-red-600">{error}</p></div>;

  const selected = students.find((s) => s.id === selectedId);
  const series = selected ? SERIES_BY_ID[selected.series_id] : null;

  const masteryCounts = studentRes.reduce<Record<string, number>>((acc, sr) => {
    const level = sr.mastery_level ?? "Not Introduced";
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {});

  const activeCount = studentRes.filter(
    (sr) => sr.status === "active",
  ).length;

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Skill Pathway</h1>
        <p className="text-sm text-slate-500">
          Interactive skill tree — track each student's journey from
          foundations to performance.
        </p>
      </div>

      {students.length === 0 ? (
        <p className="text-slate-500">No students yet.</p>
      ) : (
        <>
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Student
            </label>
            <select
              value={selectedId ?? ""}
              onChange={(e) => selectStudent(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="mb-4">
              <p className="text-sm text-slate-600">
                <button
                  onClick={() => onSelect(selected)}
                  className="font-medium text-brand-600 hover:underline"
                >
                  Open {selected.name}'s profile →
                </button>
              </p>
            </div>
          )}

          {progress && series && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-semibold text-slate-900">
                {series.name} Pathway
              </h2>
              <p className="mb-4 text-sm text-slate-500">
                {progress.nodes.filter((n) => n.status === "done").length} /{" "}
                {progress.nodes.length} books completed
              </p>

              <div className="overflow-x-auto pb-4">
                <ol className="flex gap-3">
                  {progress.nodes.map((n, i) => (
                    <li
                      key={n.bookId}
                      className="flex w-24 shrink-0 flex-col items-center gap-2"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                          n.status === "done"
                            ? "border-done bg-done text-white"
                            : n.status === "current"
                              ? "border-current bg-current text-white"
                              : n.status === "goal"
                                ? "border-goal bg-white text-goal"
                                : "border-slate-300 bg-white text-slate-400"
                        }`}
                      >
                        {n.status === "done" ? "✓" : i + 1}
                      </div>
                      <p
                        className={`text-center text-xs ${
                          n.status === "todo"
                            ? "text-slate-400"
                            : "text-slate-700"
                        }`}
                      >
                        {n.title}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Skill Mastery ({activeCount} active resources)
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {(["Not Introduced","Learning","Developing","Secure","Performance Ready"] as MasteryLevel[]).map((level) => (
                    <span key={level} className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1">
                      <span className="font-medium text-slate-700">
                        {masteryCounts[level] ?? 0}
                      </span>
                      <span className="text-slate-500">{level}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Book Roadmap Legend
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border-2 border-done bg-done" />
                    Completed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border-2 border-current bg-current" />
                    In progress
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border-2 border-goal bg-white" />
                    Goal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border-2 border-slate-300 bg-white" />
                    Not started
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
