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

// ===== Admin-added (DB) nodes =====

// Minimal row shape from the pathway_nodes table (structural typing
// keeps this pure - no supabase import).
export type CustomNodeRow = {
  id: string;
  label: string;
  parent_id: string;
  category: string | null;
  sub_skills: string[];
  resource_name: string | null;
};

const COL_GAP = 170; // custom nodes sit one column right of parent
const ROW_GAP = 100; // siblings / collision probes stack downward

function collides(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) < 165 && Math.abs(a.y - b.y) < 95;
}

// ponytail: heuristic placement (right of parent, probe down on
// collision, flip side near the right edge) - a manual drag editor is
// the upgrade path if layout gets cramped.
export function mergePathway(
  staticNodes: PathwayNode[],
  staticEdges: [string, string][],
  canvas: { width: number; height: number },
  rows: CustomNodeRow[],
): {
  nodes: PathwayNode[];
  edges: [string, string][];
  canvas: { width: number; height: number };
} {
  const byId = new Map(staticNodes.map((n) => [n.id, n]));
  const nodes = [...staticNodes];
  const edges = [...staticEdges];
  let { width, height } = canvas;

  const kids = new Map<string, CustomNodeRow[]>();
  for (const r of rows) {
    const list = kids.get(r.parent_id) ?? [];
    list.push(r);
    kids.set(r.parent_id, list);
  }

  for (const [parentId, list] of kids) {
    const p = byId.get(parentId);
    if (!p) continue; // unknown parent: hide rather than crash
    for (const r of list) {
      const id = `custom:${r.id}`;
      let x = p.x + COL_GAP;
      if (x + 80 > width - 20) x = Math.max(80, p.x - COL_GAP);
      let y = p.y;
      let tries = 0;
      while (
        tries < 8 &&
        nodes.some((n) => n.id !== id && collides(n, { x, y }))
      ) {
        y += ROW_GAP;
        tries++;
      }
      if (y > height - 60) height = y + 60;
      const node: PathwayNode = {
        id,
        kind: "skill",
        label: r.label,
        x,
        y,
        shape: "rect",
        track: p.track, // custom nodes inherit the parent's track
        category: r.category ?? undefined,
        resourceName: r.resource_name ?? undefined,
        sub: r.sub_skills.length ? r.sub_skills : undefined,
        prev: parentId,
      };
      nodes.push(node);
      edges.push([parentId, id]);
      byId.set(id, node); // enables custom-of-custom chains
    }
  }

  return { nodes, edges, canvas: { width, height } };
}
