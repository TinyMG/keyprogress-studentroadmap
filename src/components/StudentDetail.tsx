import { useEffect, useState } from "react";
import EmailParentButton from "./EmailParentButton";
import { SERIES_BY_ID } from "../data/books";
import { deriveProgress, type Progress } from "../logic/progress";
import {
  listCompletedBooks,
  setBookCompleted,
  listStudentResources,
  listResources,
  listResourceHistory,
  listLessonNotes,
  createLessonNote,
  listStages,
  updateStudent,
  assignResource,
  unassignResource,
  completeResource,
  updateMasteryLevel,
  type Student,
  type Resource,
  type StudentResource,
  type ResourceHistoryEntry,
  type LessonNote,
  type Stage,
  type MasteryLevel,
} from "../lib/supabase";
import { errorMessage } from "../lib/error";

const MASTERY_LEVELS: MasteryLevel[] = [
  "Not Introduced",
  "Learning",
  "Developing",
  "Secure",
  "Performance Ready",
];

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  "Not Introduced": "bg-slate-100 text-slate-500",
  Learning: "bg-yellow-100 text-yellow-700",
  Developing: "bg-orange-100 text-orange-700",
  Secure: "bg-blue-100 text-blue-700",
  "Performance Ready": "bg-green-100 text-green-700",
};

type Props = {
  student: Student;
  teacherEmail: string;
  readOnly: boolean;
  onBack: () => void;
};

type Tab = "resources" | "history" | "notes" | "profile";

export default function StudentDetail({
  student,
  teacherEmail,
  readOnly,
  onBack,
}: Props) {
  const [tab, setTab] = useState<Tab>("resources");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resources tab state
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [studentRes, setStudentRes] = useState<StudentResource[]>([]);
  const [showAddRes, setShowAddRes] = useState(false);

  // History tab state
  const [history, setHistory] = useState<ResourceHistoryEntry[]>([]);

  // Notes tab state
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);

  // Profile tab state
  const [stages, setStages] = useState<Stage[]>([]);
  const [profileForm, setProfileForm] = useState({
    name: student.name,
    age: student.age?.toString() ?? "",
    date_of_birth: student.date_of_birth ?? "",
    parent_name: student.parent_name ?? "",
    parent_email: student.parent_email ?? "",
    phone: student.phone ?? "",
    address: student.address ?? "",
    stage_id: student.stage_id ?? "",
    lesson_focus: student.lesson_focus ?? "",
    general_notes: student.general_notes ?? "",
    sub_notes: student.sub_notes ?? "",
  });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const series = SERIES_BY_ID[student.series_id];

  useEffect(() => {
    void loadAll();
  }, [student.id]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [bookIds, res, sr, hist, st, ns] = await Promise.all([
        listCompletedBooks(student.id),
        listResources() as Promise<Resource[]>,
        listStudentResources(student.id) as Promise<StudentResource[]>,
        listResourceHistory(student.id),
        listStages() as Promise<Stage[]>,
        listLessonNotes(student.id),
      ]);
      setCompleted(bookIds);
      setProgress(deriveProgress(student.series_id, bookIds));
      setAllResources(res);
      setStudentRes(sr);
      setHistory(hist);
      setStages(st);
      setNotes(ns);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function toggleBook(bookId: string) {
    if (readOnly) return;
    const wasDone = completed.includes(bookId);
    const next = wasDone
      ? completed.filter((id) => id !== bookId)
      : [...completed, bookId];
    setCompleted(next);
    setProgress(deriveProgress(student.series_id, next));
    try {
      await setBookCompleted(student.id, bookId, !wasDone);
    } catch (err) {
      setError(errorMessage(err));
      void loadAll();
    }
  }

  async function handleAssign(resourceId: string) {
    try {
      await assignResource(student.id, resourceId);
      setStudentRes(await listStudentResources(student.id));
      setShowAddRes(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleUnassign(resourceId: string) {
    try {
      await unassignResource(student.id, resourceId);
      setStudentRes(await listStudentResources(student.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleMasteryChange(resourceId: string, level: MasteryLevel) {
    const prev = studentRes;
    setStudentRes((cur) =>
      cur.map((sr) =>
        sr.resource_id === resourceId ? { ...sr, mastery_level: level } : sr,
      ),
    );
    try {
      await updateMasteryLevel(student.id, resourceId, level);
    } catch (err) {
      setError(errorMessage(err));
      setStudentRes(prev);
    }
  }

  async function handleComplete(resourceId: string) {
    try {
      await completeResource(student.id, resourceId);
      setStudentRes(await listStudentResources(student.id));
      setHistory(await listResourceHistory(student.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteBusy(true);
    try {
      await createLessonNote(student.id, noteText.trim());
      setNoteText("");
      setNotes(await listLessonNotes(student.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setNoteBusy(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const fields: Partial<Student> = {
        name: profileForm.name,
        age: profileForm.age ? parseInt(profileForm.age) : null,
        date_of_birth: profileForm.date_of_birth || null,
        parent_name: profileForm.parent_name || null,
        parent_email: profileForm.parent_email || null,
        phone: profileForm.phone || null,
        address: profileForm.address || null,
        stage_id: profileForm.stage_id || null,
        lesson_focus: profileForm.lesson_focus || null,
        general_notes: profileForm.general_notes || null,
        sub_notes: profileForm.sub_notes || null,
      };
      await updateStudent(student.id, fields);
      setProfileMsg("Saved.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setProfileBusy(false);
    }
  }

  const assignedIds = new Set(studentRes.map((sr) => sr.resource_id));
  const assignedResources = allResources.filter((r) =>
    assignedIds.has(r.id),
  );
  const availableResources = allResources.filter(
    (r) => !assignedIds.has(r.id),
  );

  if (loading)
    return (
      <div className="px-8 py-12">
        <p className="text-slate-500">Loading…</p>
      </div>
    );

  return (
    <div className="px-8 py-8">
      <button
        onClick={onBack}
        className="mb-4 text-sm font-medium text-brand-600 hover:underline"
      >
        ← Back to students
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
        <p className="text-sm text-slate-500">
          {series?.name ?? student.series_id}
          {student.age != null && ` · Age ${student.age}`}
          {student.parent_email && ` · ${student.parent_email}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-400 hover:underline"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {(
          ["resources", "history", "notes", "profile"] as Tab[]
        )
          .filter((t) => !(readOnly && t === "profile"))
          .map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? "border-b-2 border-brand-600 text-brand-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Resources tab */}
      {tab === "resources" && (
        <div className="space-y-4">
          {progress && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Book Roadmap
              </p>
              <div className="flex flex-wrap gap-2">
                {progress.nodes.map((n, i) => (
                  <button
                    key={n.bookId}
                    onClick={() => toggleBook(n.bookId)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                      n.status === "done"
                        ? "border-done bg-done text-white"
                        : n.status === "current"
                          ? "border-current bg-current text-white"
                          : "border-slate-300 bg-white text-slate-400"
                    } ${readOnly ? "cursor-default" : ""}`}
                    title={n.title}
                  >
                    {n.status === "done" ? "✓" : i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Assigned Resources
            </h2>
            {!readOnly && (
              <button
                onClick={() => setShowAddRes((s) => !s)}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {showAddRes ? "Cancel" : "Add Resource"}
              </button>
            )}
          </div>

          {showAddRes && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <ul className="space-y-2">
                {availableResources.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {r.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {r.category} · {r.author}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAssign(r.id)}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Assign
                    </button>
                  </li>
                ))}
                {availableResources.length === 0 && (
                  <p className="text-sm text-slate-500">
                    All resources already assigned.
                  </p>
                )}
              </ul>
            </div>
          )}

          {assignedResources.length === 0 ? (
            <p className="text-sm text-slate-500">No active resources.</p>
          ) : (
            <ul className="space-y-2">
              {assignedResources.map((r) => {
                const sr = studentRes.find(
                  (s) => s.resource_id === r.id,
                );
                const mastery = sr?.mastery_level ?? "Not Introduced";
                return (
                  <li
                    key={r.id}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-400">
                          {r.category}
                          {r.author && ` · ${r.author}`}
                        </p>
                        {sr?.status === "complete" && (
                          <span className="mt-1 inline-block rounded-full bg-done/10 px-2 py-0.5 text-xs font-medium text-done">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {!readOnly && sr?.status !== "complete" && (
                          <button
                            onClick={() => handleComplete(r.id)}
                            className="text-sm font-medium text-done hover:underline"
                          >
                            Complete
                          </button>
                        )}
                        {!readOnly && (
                          <button
                            onClick={() => handleUnassign(r.id)}
                            className="text-sm font-medium text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    {readOnly ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Mastery: {mastery}
                      </p>
                    ) : (
                      sr?.status !== "complete" && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-500">
                            Mastery:
                          </span>
                          {MASTERY_LEVELS.map((level) => (
                            <button
                              key={level}
                              onClick={() =>
                                handleMasteryChange(r.id, level)
                              }
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                                mastery === level
                                  ? MASTERY_COLORS[level] +
                                    " ring-2 ring-offset-1"
                                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      )
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {progress && !readOnly && (
            <div className="mt-6">
              <EmailParentButton
                student={student}
                progress={progress}
                teacherEmail={teacherEmail}
              />
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No completion history yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => {
                const res = allResources.find(
                  (r) => r.id === h.resource_id,
                );
                return (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {res?.name ?? "Unknown resource"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {h.date_completed}
                      </p>
                    </div>
                    <span className="text-sm text-done">✓</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Notes tab */}
      {tab === "notes" && (
        <div className="space-y-4">
          {!readOnly && (
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a lesson note…"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                type="submit"
                disabled={noteBusy || !noteText.trim()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {noteBusy ? "…" : "Add note"}
              </button>
            </form>
          )}

          {notes.length === 0 ? (
            <p className="text-sm text-slate-500">No lesson notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-sm text-slate-700">{n.content}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Profile tab */}
      {tab === "profile" && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-lg space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Age
              </label>
              <input
                type="number"
                value={profileForm.age}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, age: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Date of Birth
              </label>
              <input
                type="date"
                value={profileForm.date_of_birth}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    date_of_birth: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Parent Name
            </label>
            <input
              value={profileForm.parent_name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, parent_name: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Parent Email
            </label>
            <input
              type="email"
              value={profileForm.parent_email}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  parent_email: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Stage
            </label>
            <select
              value={profileForm.stage_id}
              onChange={(e) =>
                setProfileForm({ ...profileForm, stage_id: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="">— None —</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  S{s.stage_number} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Lesson Focus
            </label>
            <input
              value={profileForm.lesson_focus}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  lesson_focus: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              General Notes
            </label>
            <textarea
              value={profileForm.general_notes}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  general_notes: e.target.value,
                })
              }
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Sub Notes
            </label>
            <textarea
              value={profileForm.sub_notes}
              onChange={(e) =>
                setProfileForm({ ...profileForm, sub_notes: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <button
            type="submit"
            disabled={profileBusy}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {profileBusy ? "Saving…" : "Save Profile"}
          </button>
          {profileMsg && (
            <p className="text-sm text-done">{profileMsg}</p>
          )}
        </form>
      )}
    </div>
  );
}
