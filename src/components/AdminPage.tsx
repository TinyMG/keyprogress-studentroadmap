import { useEffect, useState } from "react";
import { SERIES } from "../data/books";
import {
  listStudents,
  listStages,
  listResources,
  listProfiles,
  createStudent,
  deleteStudent,
  updateStudent,
  updateProfileRole,
  createStage,
  updateStage,
  deleteStage,
  createResource,
  updateResource,
  deleteResource,
  type Student,
  type Stage,
  type Resource,
  type ResourceCategory,
  type Profile,
  type Role,
} from "../lib/supabase";
import { errorMessage } from "../lib/error";

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 " +
  "focus:ring-brand-500/30";
const btnCls =
  "rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold " +
  "text-white hover:bg-brand-700 disabled:opacity-50";

const CATEGORIES: ResourceCategory[] = [
  "Method",
  "Theory",
  "Technique",
  "Repertoire",
  "Rhythm",
  "Sight Reading",
  "Custom",
];

type Tab = "students" | "teachers" | "stages" | "resources";

const TABS: { id: Tab; label: string }[] = [
  { id: "students", label: "Students" },
  { id: "teachers", label: "Teachers" },
  { id: "stages", label: "Stages" },
  { id: "resources", label: "Approved Resources" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("students");

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <p className="text-sm text-slate-500">
          Manage students, teachers, curriculum stages, and approved
          resources.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "students" && <StudentsTab />}
      {tab === "teachers" && <TeachersTab />}
      {tab === "stages" && <StagesTab />}
      {tab === "resources" && <ResourcesTab />}
    </div>
  );
}

function ErrorMsg({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="mb-4 text-sm text-red-600">{error}</p>;
}

// ===== Students tab =====

function StudentsTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [seriesId, setSeriesId] = useState(SERIES[0].id);
  const [parentEmail, setParentEmail] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [busy, setBusy] = useState(false);

  const [edit, setEdit] = useState<{
    id: string;
    teacher_id: string;
    auth_user_id: string;
  } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [s, st, p] = await Promise.all([
        listStudents() as Promise<Student[]>,
        listStages() as Promise<Stage[]>,
        listProfiles() as Promise<Profile[]>,
      ]);
      setStudents(s);
      setStages(st);
      setProfiles(p);
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
      await createStudent(
        name.trim(),
        seriesId,
        parentEmail.trim() || null,
        teacherId ? { teacherId } : {},
      );
      setName("");
      setParentEmail("");
      setTeacherId("");
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    setError(null);
    try {
      await updateStudent(edit.id, {
        teacher_id: edit.teacher_id,
        auth_user_id: edit.auth_user_id || null,
      });
      setEdit(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: Student) {
    if (!window.confirm(`Delete ${s.name}? This cannot be undone.`))
      return;
    try {
      await deleteStudent(s.id);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const stageById = new Map(stages.map((s) => [s.id, s]));
  const emailById = new Map(profiles.map((p) => [p.id, p.email]));
  const teachers = profiles.filter(
    (p) => p.role === "teacher" || p.role === "admin",
  );

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => setShowAdd((s) => !s)}
          className={btnCls}
        >
          {showAdd ? "Cancel" : "Add Student"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={add}
          className="mb-6 max-w-lg space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Teacher
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className={inputCls}
            >
              <option value="">Select teacher…</option>
              {teachers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Series
            </label>
            <select
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              className={inputCls}
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
              className={inputCls}
            />
          </div>
          <button type="submit" disabled={busy} className={btnCls}>
            {busy ? "…" : "Save"}
          </button>
        </form>
      )}

      <ErrorMsg error={error} />

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {students.map((s) => {
            const stage = s.stage_id ? stageById.get(s.stage_id) : null;
            return (
              <li
                key={s.id}
                className="rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="text-sm text-slate-500">
                      {emailById.get(s.teacher_id) ?? "Unassigned"}
                      {s.age != null && ` · Age ${s.age}`}
                      {s.auth_user_id && " · has login"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {stage && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: (stage.color ?? "#e2e8f0") +
                            "22",
                          color: stage.color ?? "#475569",
                        }}
                      >
                        S{stage.stage_number} — {stage.name}
                      </span>
                    )}
                    <button
                      onClick={() =>
                        setEdit(
                          edit?.id === s.id
                            ? null
                            : {
                                id: s.id,
                                teacher_id: s.teacher_id,
                                auth_user_id: s.auth_user_id ?? "",
                              },
                        )
                      }
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(s)}
                      className="text-sm font-medium text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {edit?.id === s.id && (
                  <form
                    onSubmit={saveEdit}
                    className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4 sm:grid-cols-2"
                  >
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Teacher
                      </label>
                      <select
                        value={edit.teacher_id}
                        onChange={(e) =>
                          setEdit({ ...edit, teacher_id: e.target.value })
                        }
                        className={inputCls}
                      >
                        {teachers.some((p) => p.id === edit.teacher_id) ? (
                          teachers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.email}
                            </option>
                          ))
                        ) : (
                          <option value={edit.teacher_id}>
                            (current teacher)
                          </option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Student login (links an account)
                      </label>
                      <select
                        value={edit.auth_user_id}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            auth_user_id: e.target.value,
                          })
                        }
                        className={inputCls}
                      >
                        <option value="">— No login —</option>
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.email} ({p.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className={btnCls}
                      >
                        {busy ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
          {students.length === 0 && (
            <p className="text-slate-500">No students yet.</p>
          )}
        </ul>
      )}
    </div>
  );
}

// ===== Teachers tab =====

const ROLES: Role[] = ["admin", "teacher", "student"];

function TeachersTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setProfiles((await listProfiles()) as Profile[]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeRole(p: Profile, role: Role) {
    if (
      !window.confirm(`Set ${p.email} to "${role}"?`)
    )
      return;
    try {
      await updateProfileRole(p.id, role);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Accounts self-register on the sign-in screen (as teachers). Set
        roles here — students appear once they sign up.
      </p>
      <ErrorMsg error={error} />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {profiles.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">{p.email}</p>
                <p className="text-xs text-slate-400">{p.role}</p>
              </div>
              <select
                value={p.role}
                onChange={(e) => changeRole(p, e.target.value as Role)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ===== Stages tab =====

type StageDraft = {
  stage_number: string;
  name: string;
  description: string;
  color: string;
};

const EMPTY_STAGE: StageDraft = {
  stage_number: "",
  name: "",
  description: "",
  color: "",
};

function StagesTab() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<StageDraft>(EMPTY_STAGE);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setStages((await listStages()) as Stage[]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function toFields(d: StageDraft) {
    return {
      stage_number: parseInt(d.stage_number),
      name: d.name.trim(),
      description: d.description.trim() || null,
      color: d.color.trim() || null,
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editId) {
        await updateStage(editId, toFields(draft));
      } else {
        await createStage(toFields(draft));
      }
      setDraft(EMPTY_STAGE);
      setEditId(null);
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: Stage) {
    if (!window.confirm(`Delete stage S${s.stage_number} — ${s.name}?`))
      return;
    try {
      await deleteStage(s.id);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function startEdit(s: Stage) {
    setEditId(s.id);
    setShowAdd(false);
    setDraft({
      stage_number: String(s.stage_number),
      name: s.name,
      description: s.description ?? "",
      color: s.color ?? "",
    });
  }

  const form = (
    <form
      onSubmit={save}
      className="mb-6 max-w-lg space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Stage number
          </label>
          <input
            type="number"
            required
            value={draft.stage_number}
            onChange={(e) =>
              setDraft({ ...draft, stage_number: e.target.value })
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            required
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          rows={2}
          value={draft.description}
          onChange={(e) =>
            setDraft({ ...draft, description: e.target.value })
          }
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Color (hex, e.g. #7C3AED)
        </label>
        <input
          value={draft.color}
          onChange={(e) => setDraft({ ...draft, color: e.target.value })}
          className={inputCls}
        />
      </div>
      <button type="submit" disabled={busy} className={btnCls}>
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => {
            setShowAdd((s) => !s);
            setEditId(null);
            setDraft(EMPTY_STAGE);
          }}
          className={btnCls}
        >
          {showAdd ? "Cancel" : "Add Stage"}
        </button>
      </div>
      {showAdd && form}
      <ErrorMsg error={error} />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {stages.map((s) => (
            <li key={s.id}>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    S{s.stage_number} — {s.name}
                  </p>
                  {s.description && (
                    <p className="truncate text-sm text-slate-500">
                      {s.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    onClick={() =>
                      editId === s.id
                        ? setEditId(null)
                        : startEdit(s)
                    }
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(s)}
                    className="text-sm font-medium text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {editId === s.id && <div className="mt-2">{form}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ===== Approved Resources tab =====

type ResourceDraft = {
  name: string;
  category: ResourceCategory;
  author: string;
  purchase_link: string;
  description: string;
  stage_id: string;
};

const EMPTY_RESOURCE: ResourceDraft = {
  name: "",
  category: "Method",
  author: "",
  purchase_link: "",
  description: "",
  stage_id: "",
};

function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<ResourceDraft>(EMPTY_RESOURCE);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stageFilter, setStageFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [r, s] = await Promise.all([
        listResources() as Promise<Resource[]>,
        listStages() as Promise<Stage[]>,
      ]);
      setResources(r);
      setStages(s);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function toFields(d: ResourceDraft) {
    return {
      name: d.name.trim(),
      category: d.category,
      author: d.author.trim() || null,
      purchase_link: d.purchase_link.trim() || null,
      description: d.description.trim() || null,
      stage_id: d.stage_id || null,
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editId) {
        await updateResource(editId, toFields(draft));
      } else {
        await createResource(toFields(draft));
      }
      setDraft(EMPTY_RESOURCE);
      setEditId(null);
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: Resource) {
    if (!window.confirm(`Delete resource "${r.name}"?`)) return;
    try {
      await deleteResource(r.id);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function startEdit(r: Resource) {
    setEditId(r.id);
    setShowAdd(false);
    setDraft({
      name: r.name,
      category: r.category,
      author: r.author ?? "",
      purchase_link: r.purchase_link ?? "",
      description: r.description ?? "",
      stage_id: r.stage_id ?? "",
    });
  }

  const filtered =
    stageFilter === "all"
      ? resources
      : resources.filter((r) => r.stage_id === stageFilter);

  const stageName = (id: string | null) => {
    const s = stages.find((x) => x.id === id);
    return s ? `S${s.stage_number} — ${s.name}` : null;
  };

  const form = (
    <form
      onSubmit={save}
      className="mb-6 max-w-lg space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Resource name
        </label>
        <input
          required
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            value={draft.category}
            onChange={(e) =>
              setDraft({
                ...draft,
                category: e.target.value as ResourceCategory,
              })
            }
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Skill level (stage)
          </label>
          <select
            value={draft.stage_id}
            onChange={(e) =>
              setDraft({ ...draft, stage_id: e.target.value })
            }
            className={inputCls}
          >
            <option value="">— None —</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                S{s.stage_number} — {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Author / Publisher
        </label>
        <input
          value={draft.author}
          onChange={(e) =>
            setDraft({ ...draft, author: e.target.value })
          }
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Purchase link
        </label>
        <input
          type="url"
          value={draft.purchase_link}
          onChange={(e) =>
            setDraft({ ...draft, purchase_link: e.target.value })
          }
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          rows={2}
          value={draft.description}
          onChange={(e) =>
            setDraft({ ...draft, description: e.target.value })
          }
          className={inputCls}
        />
      </div>
      <button type="submit" disabled={busy} className={btnCls}>
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => {
            setShowAdd((s) => !s);
            setEditId(null);
            setDraft(EMPTY_RESOURCE);
          }}
          className={btnCls}
        >
          {showAdd ? "Cancel" : "Add Approved Resource"}
        </button>
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
      {showAdd && form}
      <ErrorMsg error={error} />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.id}>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{r.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {r.category}
                    </span>
                    {r.stage_id && (
                      <span className="text-xs text-slate-400">
                        {stageName(r.stage_id)}
                      </span>
                    )}
                    {r.author && (
                      <span className="text-xs text-slate-400">
                        {r.author}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    onClick={() =>
                      editId === r.id ? setEditId(null) : startEdit(r)
                    }
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="text-sm font-medium text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {editId === r.id && <div className="mt-2">{form}</div>}
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-500">No resources found.</p>
          )}
        </ul>
      )}
    </div>
  );
}
