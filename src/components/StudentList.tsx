import { useEffect, useState } from "react";
import { SERIES } from "../data/books";
import {
  createStudent,
  listStudents,
  listStages,
  type Student,
  type Stage,
} from "../lib/supabase";
import { errorMessage } from "../lib/error";

type Props = {
  onSelect: (student: Student) => void;
};

export default function StudentList({ onSelect }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [seriesId, setSeriesId] = useState(SERIES[0].id);
  const [parentEmail, setParentEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [s, st] = await Promise.all([
        listStudents() as Promise<Student[]>,
        listStages() as Promise<Stage[]>,
      ]);
      setStudents(s);
      setStages(st);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createStudent(name.trim(), seriesId, parentEmail.trim() || null);
      setName("");
      setParentEmail("");
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const stageById = new Map(stages.map((s) => [s.id, s]));

  const filtered = students.filter((s) => {
    if (stageFilter !== "all" && s.stage_id !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.parent_email?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500">
            {students.length} enrolled student{students.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {showAdd ? "Cancel" : "Add Student"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={add}
          className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Series
            </label>
            <select
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {SERIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Parent email (optional)
            </label>
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "…" : "Save"}
          </button>
        </form>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search students…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="all">All stages</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              S{s.stage_number} — {s.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500">
          {students.length === 0
            ? "No students yet. Add one to get started."
            : "No students match your filters."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => {
            const series = SERIES.find((x) => x.id === s.series_id);
            const stage = s.stage_id
              ? stageById.get(s.stage_id)
              : null;
            return (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-brand-500 hover:shadow-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="text-sm text-slate-500">
                      {stage
                        ? `S${stage.stage_number} — ${stage.name}`
                        : (series?.name ?? s.series_id)}
                      {s.age != null && ` · Age ${s.age}`}
                    </p>
                  </div>
                  <span className="text-slate-400">→</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
