import type {
  Student,
  Stage,
  Resource,
  StudentResource,
  ResourceHistoryEntry,
} from "../lib/supabase.ts";

// Dashboard stats: pure function, no React. Aggregates counts from
// students, stages, assignments, history, and resources.

export type RecentCompletion = {
  studentName: string;
  resourceName: string;
  dateCompleted: string;
};

export type DashboardStats = {
  totalStudents: number;
  activeResources: number;
  booksCompleted: number;
  stageGroups: number;
  recentCompletions: RecentCompletion[];
  studentsByStage: { stageName: string; count: number }[];
};

export function deriveDashboardStats(
  students: Student[],
  stages: Stage[],
  studentResources: StudentResource[],
  resourceHistory: ResourceHistoryEntry[],
  resources: Resource[],
): DashboardStats {
  const activeResources = studentResources.filter(
    (sr) => sr.status === "active",
  ).length;

  const stageGroups = new Set(
    students
      .filter((s) => s.stage_id)
      .map((s) => s.stage_id),
  ).size;

  const resourceById = new Map(resources.map((r) => [r.id, r]));
  const studentById = new Map(students.map((s) => [s.id, s]));

  const recentCompletions: RecentCompletion[] = resourceHistory
    .map((h) => {
      const res = resourceById.get(h.resource_id);
      const stu = studentById.get(h.student_id);
      return {
        studentName: stu?.name ?? "Unknown",
        resourceName: res?.name ?? "Unknown",
        dateCompleted: h.date_completed,
      };
    })
    .sort((a, b) => b.dateCompleted.localeCompare(a.dateCompleted))
    .slice(0, 10);

  const studentsByStage = stages
    .map((stage) => ({
      stageName: stage.name,
      count: students.filter((s) => s.stage_id === stage.id).length,
    }))
    .filter((entry) => entry.count > 0);

  return {
    totalStudents: students.length,
    activeResources,
    booksCompleted: resourceHistory.length,
    stageGroups,
    recentCompletions,
    studentsByStage,
  };
}
