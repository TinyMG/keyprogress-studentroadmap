import { useEffect, useState } from "react";
import {
  listStages,
  listResources,
  type Stage,
  type Resource,
} from "../lib/supabase";
import { errorMessage } from "../lib/error";

export default function Curriculum() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [s, r] = await Promise.all([
        listStages() as Promise<Stage[]>,
        listResources() as Promise<Resource[]>,
      ]);
      setStages(s);
      setResources(r);
      if (s[0]) setExpanded(s[0].id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return <div className="px-8 py-12"><p className="text-slate-500">Loading…</p></div>;
  if (error)
    return <div className="px-8 py-12"><p className="text-sm text-red-600">{error}</p></div>;

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Curriculum Map</h1>
        <p className="text-sm text-slate-500">
          {stages.length} stages · {resources.length} approved resources
        </p>
      </div>

      <div className="space-y-3">
        {stages.map((stage) => {
          const stageResources = resources.filter(
            (r) => r.stage_id === stage.id,
          );
          const isOpen = expanded === stage.id;
          return (
            <div
              key={stage.id}
              className="rounded-xl border border-slate-200 bg-white"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : stage.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    S{stage.stage_number} — {stage.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {stageResources.length} resources
                  </p>
                </div>
                <span className="text-slate-400">{isOpen ? "▼" : "▶"}</span>
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 p-4">
                  {stage.description && (
                    <p className="mb-4 text-sm text-slate-600">
                      {stage.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    {stageResources.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                            {r.category}
                          </span>
                          <p className="font-medium text-slate-900">
                            {r.name}
                          </p>
                        </div>
                        {r.description && (
                          <p className="mt-1 text-sm text-slate-500">
                            {r.description}
                          </p>
                        )}
                        {r.author && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            {r.author}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
