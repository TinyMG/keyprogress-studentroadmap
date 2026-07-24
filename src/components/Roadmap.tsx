import type { ProgressNode } from "../logic/progress";

const STATUS_STYLES: Record<string, string> = {
  done: "bg-done border-done text-white",
  current: "bg-current border-current text-white ring-4 ring-current/30",
  next: "bg-white border-current text-current",
  todo: "bg-white border-slate-300 text-slate-400",
  goal: "bg-white border-goal text-goal ring-2 ring-goal/40",
};

const CONNECTOR: Record<string, string> = {
  done: "bg-done",
  current: "bg-current",
  next: "bg-slate-200",
  todo: "bg-slate-200",
  goal: "bg-goal",
};

const STATUS_LABEL: Record<string, string> = {
  done: "Completed",
  current: "In progress",
  next: "Up next",
  todo: "Not started",
  goal: "Goal",
};

type Props = {
  nodes: ProgressNode[];
  seriesName: string;
  onToggle?: (bookId: string) => void;
  canEdit?: boolean;
};

export default function Roadmap({ nodes, seriesName, onToggle, canEdit }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{seriesName}</h2>
          <p className="text-sm text-slate-500">
            {nodes.filter((n) => n.status === "done").length} / {nodes.length} books
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-goal/10 px-3 py-1 text-xs font-medium text-goal">
          <span className="h-2 w-2 rounded-full bg-goal" />
          Goal: {nodes[nodes.length - 1].title}
        </span>
      </div>

      <ol className="relative">
        {nodes.map((n, i) => {
          const last = i === nodes.length - 1;
          const next = nodes[i + 1];
          return (
            <li key={n.bookId} className="relative flex items-start gap-4 pb-8 last:pb-0">
              {/* connector line to next node */}
              {!last && (
                <span
                  className={`absolute left-5 top-10 h-[calc(100%-2.5rem)] w-0.5 ${CONNECTOR[next.status] ?? "bg-slate-200"}`}
                  aria-hidden
                />
              )}
              {/* node */}
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => onToggle?.(n.bookId)}
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${STATUS_STYLES[n.status]} ${canEdit ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
                aria-label={`${n.title} — ${STATUS_LABEL[n.status]}${canEdit ? ". Click to toggle." : ""}`}
                title={STATUS_LABEL[n.status]}
              >
                {n.status === "done" ? "✓" : i + 1}
              </button>
              {/* label */}
              <div className="pt-1.5">
                <p className={`font-medium ${n.status === "todo" ? "text-slate-400" : "text-slate-900"}`}>
                  {n.title}
                </p>
                <p className="text-xs text-slate-500">{STATUS_LABEL[n.status]}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
