import { useEffect, useState } from "react";
import {
  listResources,
  type Resource,
  type ResourceCategory,
} from "../lib/supabase";
import { errorMessage } from "../lib/error";

const CATEGORIES: (ResourceCategory | "All")[] = [
  "All",
  "Method",
  "Theory",
  "Technique",
  "Repertoire",
  "Rhythm",
  "Sight Reading",
  "Custom",
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ResourceCategory | "All">("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setResources((await listResources()) as Resource[]);
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

  const filtered = resources.filter((r) => {
    if (category !== "All" && r.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.author?.toLowerCase().includes(q) ?? false) ||
        (r.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Teaching Resources</h1>
        <p className="text-sm text-slate-500">
          Browse the approved curriculum library.
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Search resources…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                category === cat
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="font-medium text-slate-900">{r.name}</p>
              <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {r.category}
              </span>
            </div>
            {r.author && (
              <p className="mb-1 text-xs text-slate-400">{r.author}</p>
            )}
            {r.description && (
              <p className="text-sm text-slate-500">{r.description}</p>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-slate-500">No resources found.</p>
      )}
    </div>
  );
}
