import type { MasteryLevel } from "../lib/supabase.ts";
import { PATHWAY_EDGES, type PathwayNode } from "../data/pathway.ts";

// Pure derivation of the skill-tree view state for one student. Mirrors
// NotePath's rules: stage circles track the student's stage_number; skill
// nodes read mastery from the student's assigned resource of the same name;
// a node unlocks when its prerequisite is Secure or Performance Ready.

export type PathwayViewState = {
  status: MasteryLevel;
  locked: boolean;
};

const DONE_LEVELS: MasteryLevel[] = ["Secure", "Performance Ready"];

export function derivePathway(
  nodes: PathwayNode[],
  stageNumber: number, // student's current stage_number (0 = Piano Journey)
  masteryByName: Record<string, MasteryLevel>, // resource name -> student mastery
): Record<string, PathwayViewState> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const status: Record<string, MasteryLevel> = {};

  for (const n of nodes) {
    switch (n.kind) {
      case "root":
        status[n.id] = "Secure";
        break;
      case "fundamentals":
        status[n.id] =
          stageNumber >= 1 ? "Secure" : stageNumber === 0 ? "Learning" : "Not Introduced";
        break;
      case "goal":
        status[n.id] = stageNumber >= 6 ? "Performance Ready" : "Not Introduced";
        break;
      case "stage":
        status[n.id] =
          stageNumber > n.stage!
            ? "Secure"
            : stageNumber === n.stage!
              ? "Learning"
              : "Not Introduced";
        break;
      case "skill":
        status[n.id] =
          (n.resourceName && masteryByName[n.resourceName]) || "Not Introduced";
        break;
    }
  }

  const view: Record<string, PathwayViewState> = {};
  for (const n of nodes) {
    const prev = n.prev ? byId.get(n.prev) : undefined;
    let locked: boolean;
    if (n.kind === "root" || n.kind === "fundamentals") {
      locked = false;
    } else if (stageNumber < 1) {
      locked = true; // fundamentals not done: everything above stays locked
    } else if (n.kind === "goal") {
      locked = stageNumber < 6;
    } else if (n.kind === "stage") {
      locked = stageNumber < n.stage!;
    } else {
      locked = !prev || !DONE_LEVELS.includes(status[prev.id]);
    }
    view[n.id] = { status: status[n.id], locked };
  }
  return view;
}

export type NodeVisual = "done" | "progress" | "dim" | "locked";

export function nodeVisual(v: PathwayViewState): NodeVisual {
  if (v.locked) return "locked";
  if (v.status === "Secure" || v.status === "Performance Ready") return "done";
  if (v.status === "Learning" || v.status === "Developing") return "progress";
  return "dim";
}

export function isEdgeLit(
  toId: string,
  view: Record<string, PathwayViewState>,
): boolean {
  return PATHWAY_EDGES.some(([, to]) => to === toId) && !view[toId].locked;
}
