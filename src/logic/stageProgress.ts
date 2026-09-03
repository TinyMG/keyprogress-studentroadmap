import type {
  Stage,
  Resource,
  StudentResource,
  ResourceHistoryEntry,
} from "../lib/supabase.ts";

// Stage progress: pure function, no React. Derives per-stage completion
// stats from stages, resources, student assignments, and history.

export type StageProgress = {
  stage: Stage;
  totalResources: number;
  completedResources: number;
  activeResources: number;
  percent: number; // 0-100, 0 if no resources
};

export function deriveStageProgress(
  stages: Stage[],
  resources: Resource[],
  studentResources: StudentResource[],
  history: ResourceHistoryEntry[],
): StageProgress[] {
  const completedIds = new Set(
    history.map((h) => h.resource_id),
  );
  return stages.map((stage) => {
    const stageResources = resources.filter(
      (r) => r.stage_id === stage.id,
    );
    const total = stageResources.length;
    if (total === 0) {
      return {
        stage,
        totalResources: 0,
        completedResources: 0,
        activeResources: 0,
        percent: 0,
      };
    }
    let completed = 0;
    let active = 0;
    for (const r of stageResources) {
      const sr = studentResources.find(
        (s) => s.resource_id === r.id,
      );
      if (completedIds.has(r.id)) {
        completed++;
      } else if (sr && sr.status === "active") {
        active++;
      }
    }
    return {
      stage,
      totalResources: total,
      completedResources: completed,
      activeResources: active,
      percent: Math.round((completed / total) * 100),
    };
  });
}
