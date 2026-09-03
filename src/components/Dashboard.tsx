import { useEffect, useState } from "react";
import {
  supabase,
  listStudents,
  listStages,
  listResources,
  listAllResourceHistory,
  countCompletedBooks,
  type Student,
  type Stage,
  type Resource,
  type ResourceHistoryEntry,
  type StudentResource,
} from "../lib/supabase";
import { deriveDashboardStats, type DashboardStats } from "../logic/dashboard";
import { errorMessage } from "../lib/error";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [students, stages, resources, history, booksCount] =
        await Promise.all([
          listStudents() as Promise<Student[]>,
          listStages() as Promise<Stage[]>,
          listResources() as Promise<Resource[]>,
          listAllResourceHistory(10),
          countCompletedBooks(),
        ]);

      // ponytail: no listAllStudentResources helper; query supabase
      // directly for active count. Add a helper if this pattern repeats.
      const { data: allSR, error: srError } = await supabase
        .from("student_resources")
        .select("student_id, resource_id, status, assigned_at")
        .eq("status", "active");
      if (srError) throw srError;

      const s = deriveDashboardStats(
        students,
        stages,
        (allSR as StudentResource[]) ?? [],
        history as ResourceHistoryEntry[],
        resources,
      );
      setStats({ ...s, booksCompleted: booksCount });
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
  if (!stats) return null;

  const statCards = [
    { label: "Total Students", value: stats.totalStudents },
    { label: "Active Resources", value: stats.activeResources },
    { label: "Books Completed", value: stats.booksCompleted },
    { label: "Stage Groups", value: stats.stageGroups },
  ];

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Here's an overview of your piano school today.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Recent Completions
          </h2>
          {stats.recentCompletions.length === 0 ? (
            <p className="text-sm text-slate-500">No completions yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentCompletions.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {c.resourceName}
                    </p>
                    <p className="text-sm text-slate-500">{c.studentName}</p>
                  </div>
                  <span className="text-sm text-slate-400">
                    {c.dateCompleted}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Students by Stage
          </h2>
          {stats.studentsByStage.length === 0 ? (
            <p className="text-sm text-slate-500">
              No students assigned to stages yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {stats.studentsByStage.map((s) => (
                <li
                  key={s.stageName}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <span className="font-medium text-slate-900">
                    {s.stageName}
                  </span>
                  <span className="text-sm text-slate-500">
                    {s.count} student{s.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
