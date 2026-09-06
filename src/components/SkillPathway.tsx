import { useEffect, useState } from "react";
import {
  listStudents,
  listCompletedBooks,
  listStudentResources,
  listStages,
  listResources,
  listPathwayNodes,
  createPathwayNode,
  updatePathwayNode,
  deletePathwayNode,
  type Student,
  type StudentResource,
  type Stage,
  type Resource,
  type MasteryLevel,
  type PathwayNodeFields,
  type PathwayNodeRow,
} from "../lib/supabase";
import { deriveProgress, type Progress } from "../logic/progress";
import {
  derivePathway,
  nodeVisual,
  mergePathway,
  type PathwayViewState,
} from "../logic/pathway";
import {
  PATHWAY_NODES,
  PATHWAY_EDGES,
  PATHWAY_CANVAS,
  type PathwayNode,
} from "../data/pathway";
import { SERIES_BY_ID } from "../data/books";
import { errorMessage } from "../lib/error";
import VideoPlayer from "./VideoPlayer";
import type { Role } from "../logic/roles";

const STATUS_DOTS: Record<MasteryLevel, string> = {
  "Not Introduced": "bg-slate-400",
  Learning: "bg-current",
  Developing: "bg-sky-500",
  Secure: "bg-done",
  "Performance Ready": "bg-violet-500",
};

const STATUS_HELP: Record<MasteryLevel, string> = {
  "Not Introduced": "The skill has not yet been taught",
  Learning: "The student can demonstrate it with substantial help",
  Developing: "The student demonstrates it inconsistently or with reminders",
  Secure: "The student demonstrates it independently in lessons",
  "Performance Ready":
    "The student demonstrates it reliably under performance conditions",
};

const NODE_STYLE: Record<string, string> = {
  done: "bg-done border-done text-white",
  progress: "bg-white border-current text-slate-900 ring-4 ring-current/30",
  dim: "bg-white border-slate-300 border-dashed text-slate-400",
  locked: "bg-slate-50 border-slate-200 border-dashed text-slate-300",
};

const EDGE_LIT = "#10b981";
const EDGE_DIM = "#e2e8f0";

type Props = {
  onSelect: (s: Student) => void;
  role: Role;
};

export default function SkillPathway({ onSelect, role }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [customRows, setCustomRows] = useState<PathwayNodeRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [studentRes, setStudentRes] = useState<StudentResource[]>([]);
  const [dialogNode, setDialogNode] = useState<PathwayNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [list, st, res, rows] = await Promise.all([
        listStudents(),
        listStages(),
        listResources(),
        listPathwayNodes(),
      ]);
      setStudents(list);
      setStages(st);
      setResources(res);
      setCustomRows(rows);
      if (list[0] && !selectedId) {
        setSelectedId(list[0].id);
        await loadStudent(list[0]);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function reloadRows() {
    try {
      setCustomRows(await listPathwayNodes());
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadStudent(student: Student) {
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
    setProgress(null);
    const student = students.find((s) => s.id === id);
    if (student) await loadStudent(student);
  }

  if (loading)
    return <div className="px-8 py-12"><p className="text-slate-500">Loading…</p></div>;
  if (error)
    return <div className="px-8 py-12"><p className="text-sm text-red-600">{error}</p></div>;

  const selected = students.find((s) => s.id === selectedId);
  const series = selected ? SERIES_BY_ID[selected.series_id] : null;

  // static curated tree + admin-added DB nodes
  const merged = mergePathway(
    PATHWAY_NODES,
    PATHWAY_EDGES,
    PATHWAY_CANVAS,
    customRows,
  );

  // student's stage number + mastery per resource name
  const stageNumber =
    stages.find((sg) => sg.id === selected?.stage_id)?.stage_number ?? 0;
  const resourcesById = new Map(resources.map((r) => [r.id, r]));
  const masteryByName: Record<string, MasteryLevel> = {};
  for (const sr of studentRes) {
    const r = resourcesById.get(sr.resource_id);
    if (r) masteryByName[r.name] = sr.mastery_level;
  }

  const view = derivePathway(merged.nodes, stageNumber, masteryByName);
  const nodesById = new Map(merged.nodes.map((n) => [n.id, n]));
  const stageName = (n: PathwayNode) =>
    stages.find((sg) => sg.stage_number === n.stage)?.name ?? n.label;

  async function handleCreateNode(fields: PathwayNodeFields) {
    await createPathwayNode(fields);
    await reloadRows();
  }

  async function handleUpdateNode(
    id: string,
    fields: Partial<PathwayNodeFields>,
  ) {
    await updatePathwayNode(id, fields);
    await reloadRows();
  }

  async function handleDeleteNode(id: string) {
    await deletePathwayNode(id);
    await reloadRows();
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Skill Pathway</h1>
          <p className="text-sm text-slate-500">
            Interactive skill tree — track each student's journey from
            foundations to performance.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Student
          </label>
          <select
            value={selectedId ?? ""}
            onChange={(e) => selectStudent(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="text-slate-500">No students yet.</p>
      ) : (
        selected && (
          <>
            <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              {stageNumber >= 1 ? (
                <>
                  Piano Fundamentals complete — skill tree unlocked for{" "}
                  <button
                    onClick={() => onSelect(selected)}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {selected.name}
                  </button>
                  . Currently in Stage {stageNumber}:{" "}
                  {stages.find((sg) => sg.stage_number === stageNumber)?.name}.
                </>
              ) : (
                <>
                  Complete Piano Fundamentals to unlock the skill tree for{" "}
                  {selected.name}.
                </>
              )}
            </div>

            <div className="flex flex-col gap-6 xl:flex-row">
              {/* tree canvas */}
              <div className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
                <div
                  className="relative mx-auto"
                  style={{
                    width: merged.canvas.width,
                    height: merged.canvas.height,
                    backgroundImage:
                      "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                >
                  <svg
                    className="absolute inset-0"
                    width={merged.canvas.width}
                    height={merged.canvas.height}
                    viewBox={`0 0 ${merged.canvas.width} ${merged.canvas.height}`}
                  >
                    {merged.edges.map(([from, to]) => {
                      const a = nodesById.get(from)!;
                      const b = nodesById.get(to)!;
                      const mx = (a.x + b.x) / 2;
                      const lit = !view[to].locked;
                      return (
                        <path
                          key={`${from}-${to}`}
                          d={`M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`}
                          fill="none"
                          stroke={lit ? EDGE_LIT : EDGE_DIM}
                          strokeWidth={2}
                        />
                      );
                    })}
                  </svg>

                  {merged.nodes.map((n) => {
                    const v: PathwayViewState = view[n.id];
                    const visual = nodeVisual(v);
                    const base =
                      "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center transition hover:scale-105";
                    const shape =
                      n.shape === "circle"
                        ? "h-16 w-16 rounded-full border-2"
                        : "w-40 rounded-xl border-2 px-3 py-2";
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setDialogNode(n)}
                        style={{ left: n.x, top: n.y }}
                        className={`${base} ${shape} ${NODE_STYLE[visual]}`}
                        aria-label={`${n.label} — ${v.status}${v.locked ? " (locked)" : ""}`}
                      >
                        {v.locked ? (
                          <LockIcon />
                        ) : n.kind === "stage" ? (
                          <span>
                            <span className="block text-[8px] font-semibold uppercase tracking-wider opacity-80">
                              Stage {n.stage}
                            </span>
                            <span className="block text-[10px] font-semibold leading-tight">
                              {stageName(n)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold leading-tight">
                            {n.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* side panels */}
              <aside className="w-full shrink-0 space-y-6 xl:w-80">
                {series && progress && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-base font-semibold text-slate-900">
                      {series.name} Series Progression
                    </h3>
                    <p className="mb-3 text-xs text-slate-500">
                      {progress.nodes.filter((n) => n.status === "done").length}{" "}
                      / {progress.nodes.length} books completed
                    </p>
                    <ol className="flex gap-2 overflow-x-auto pb-2">
                      {progress.nodes.map((n, i) => (
                        <li key={n.bookId} className="w-16 shrink-0 text-center">
                          <div
                            className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold ${
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
                            className={`mt-1 text-[10px] leading-tight ${
                              n.status === "todo" ? "text-slate-400" : "text-slate-700"
                            }`}
                          >
                            {n.title}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="mb-3 text-base font-semibold text-slate-900">
                    Status Legend
                  </h3>
                  <ul className="space-y-3">
                    {(
                      [
                        "Not Introduced",
                        "Learning",
                        "Developing",
                        "Secure",
                        "Performance Ready",
                      ] as MasteryLevel[]
                    ).map((level) => (
                      <li key={level} className="flex gap-2.5">
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOTS[level]}`}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {level}
                          </p>
                          <p className="text-xs text-slate-500">
                            {STATUS_HELP[level]}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </>
        )
      )}

      {dialogNode && view[dialogNode.id] && (
        <NodeDialog
          node={dialogNode}
          stageName={
            dialogNode.kind === "stage" ? stageName(dialogNode) : undefined
          }
          view={view[dialogNode.id]}
          videoUrl={
            (dialogNode.resourceName &&
              resources.find(
                (r) => r.name === dialogNode.resourceName,
              )?.video_url) ||
            null
          }
          isAdmin={role === "admin"}
          resources={resources}
          onCreate={handleCreateNode}
          onUpdate={handleUpdateNode}
          onDelete={handleDeleteNode}
          onClose={() => setDialogNode(null)}
        />
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function kindLabel(n: PathwayNode): string {
  if (n.kind === "stage") return `Stage ${n.stage}`;
  if (n.kind === "skill") return n.category ?? "Skill";
  if (n.kind === "goal") return "Goal";
  if (n.kind === "fundamentals") return "Core";
  return "Root";
}

function NodeDialog({
  node,
  stageName,
  view,
  videoUrl,
  isAdmin,
  resources,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: {
  node: PathwayNode;
  stageName?: string;
  view: PathwayViewState;
  videoUrl?: string | null;
  isAdmin: boolean;
  resources: Resource[];
  onCreate: (fields: PathwayNodeFields) => Promise<void>;
  onUpdate: (
    id: string,
    fields: Partial<PathwayNodeFields>,
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const isCustom = node.id.startsWith("custom:");
  const [mode, setMode] = useState<null | "add" | "edit">(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(fields: {
    label: string;
    category: string;
    subSkills: string[];
    resourceName: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const fields2: PathwayNodeFields = {
        label: fields.label,
        parent_id: node.id,
        category: fields.category || null,
        sub_skills: fields.subSkills,
        resource_name: fields.resourceName || null,
      };
      if (mode === "add") {
        await onCreate(fields2);
      } else {
        await onUpdate(node.id.slice("custom:".length), fields2);
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${node.label}" from the pathway?`)) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete(node.id.slice("custom:".length));
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {kindLabel(node)}
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              {stageName ?? node.label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOTS[view.status]}`} />
          {view.status}
          {view.locked && <span className="text-slate-400">· locked</span>}
        </p>

        {node.description && (
          <p className="mb-4 text-sm text-slate-600">{node.description}</p>
        )}

        {node.sub && node.sub.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-slate-900">
              Skills covered
            </h4>
            <ul className="space-y-1.5">
              {node.sub.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {node.resourceName && (
          <p className="text-sm text-slate-500">
            Resource:{" "}
            <span className="font-medium text-slate-700">
              {node.resourceName}
            </span>
          </p>
        )}

        {videoUrl && (
          <div className="mt-4">
            <VideoPlayer url={videoUrl} />
          </div>
        )}

        {isAdmin && !mode && (
          <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3">
            {!isCustom && (
              <button
                onClick={() => setMode("add")}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                + Add skill here
              </button>
            )}
            {isCustom && (
              <>
                <button
                  onClick={() => setMode("edit")}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={remove}
                  disabled={busy}
                  className="text-sm font-medium text-red-500 hover:underline"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {mode && (
          <NodeForm
            resources={resources}
            initial={
              mode === "edit"
                ? {
                    label: node.label,
                    category: node.category ?? "",
                    subSkills: node.sub ?? [],
                    resourceName: node.resourceName ?? "",
                  }
                : undefined
            }
            busy={busy}
            onSubmit={save}
            onCancel={() => setMode(null)}
          />
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function NodeForm({
  resources,
  initial,
  busy,
  onSubmit,
  onCancel,
}: {
  resources: Resource[];
  initial?: {
    label: string;
    category: string;
    subSkills: string[];
    resourceName: string;
  };
  busy: boolean;
  onSubmit: (fields: {
    label: string;
    category: string;
    subSkills: string[];
    resourceName: string;
  }) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [subSkillsText, setSubSkillsText] = useState(
    initial?.subSkills.join("\n") ?? "",
  );
  const [resourceName, setResourceName] = useState(
    initial?.resourceName ?? "",
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          label: label.trim(),
          category: category.trim(),
          subSkills: subSkillsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          resourceName,
        });
      }}
      className="mt-3 space-y-2 border-t border-slate-100 pt-3"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Skill name
        </label>
        <input
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Bound resource (drives mastery + videos)
        </label>
        <select
          value={resourceName}
          onChange={(e) => setResourceName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="">— None —</option>
          {resources.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Category (optional)
        </label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Skills covered (one per line)
        </label>
        <textarea
          rows={3}
          value={subSkillsText}
          onChange={(e) => setSubSkillsText(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
