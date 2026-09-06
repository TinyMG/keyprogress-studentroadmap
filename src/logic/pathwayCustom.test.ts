import assert from "node:assert/strict";
import { mergePathway, derivePathway } from "./pathway.ts";
import {
  PATHWAY_NODES,
  PATHWAY_EDGES,
  PATHWAY_CANVAS,
  type PathwayNode,
} from "../data/pathway.ts";

function row(over: Partial<import("./pathway.ts").CustomNodeRow>) {
  return {
    id: "u1",
    label: "Custom Skill",
    parent_id: "tech1",
    category: "Technique",
    sub_skills: ["a", "b"],
    resource_name: null,
    ...over,
  };
}

// Empty rows -> static tree unchanged (identity).
const base = mergePathway(
  PATHWAY_NODES,
  PATHWAY_EDGES,
  PATHWAY_CANVAS,
  [],
);
assert.equal(base.nodes.length, PATHWAY_NODES.length);
assert.equal(base.edges.length, PATHWAY_EDGES.length);
assert.equal(base.canvas.width, PATHWAY_CANVAS.width);
assert.equal(base.canvas.height, PATHWAY_CANVAS.height);

// One child under tech1: skill node, edge, inherits track, placed
// right of parent without overlapping any existing node.
const one = mergePathway(PATHWAY_NODES, PATHWAY_EDGES, PATHWAY_CANVAS, [
  row({}),
]);
const child = one.nodes.find((n) => n.id === "custom:u1")!;
assert.equal(child.kind, "skill");
assert.equal(child.prev, "tech1");
assert.equal(child.track, "technique");
assert.equal(child.sub?.join(","), "a,b");
assert.ok(one.edges.some(([f, t]) => f === "tech1" && t === "custom:u1"));
assert.ok(child.x > 110, "placed right of parent");
for (const n of one.nodes) {
  if (n.id === "custom:u1") continue;
  assert.ok(
    Math.abs(n.x - child.x) >= 165 || Math.abs(n.y - child.y) >= 95,
    `child overlaps ${n.id}`,
  );
}

// Orphan parent -> row hidden, tree unchanged.
const orphan = mergePathway(PATHWAY_NODES, PATHWAY_EDGES, PATHWAY_CANVAS, [
  row({ parent_id: "nope" }),
]);
assert.equal(orphan.nodes.length, PATHWAY_NODES.length);

// Right-edge parent (x=1100) flips to the left column.
const edgeNode: PathwayNode = {
  id: "edgep",
  kind: "skill",
  label: "P",
  x: 1100,
  y: 500,
  shape: "rect",
  track: "theory",
};
const flipped = mergePathway([edgeNode], [], { width: 1160, height: 1100 }, [
  row({ parent_id: "edgep" }),
]);
const flippedChild = flipped.nodes.find((n) => n.id === "custom:u1")!;
assert.ok(flippedChild.x < 1100, "flipped left near right edge");

// Canvas grows when a child is pushed past the bottom.
const lowNode: PathwayNode = { ...edgeNode, id: "lowp", x: 100, y: 1090 };
const grown = mergePathway([lowNode], [], { width: 1160, height: 1100 }, [
  row({ parent_id: "lowp" }),
]);
assert.ok(grown.canvas.height > PATHWAY_CANVAS.height);

// Unlock + mastery behave like any static skill node.
const merged = mergePathway(PATHWAY_NODES, PATHWAY_EDGES, PATHWAY_CANVAS, [
  row({ resource_name: "Technique I — Foundations" }),
]);
// tech1 Secure via mastery -> custom unlocked with that mastery.
const view = derivePathway(merged.nodes, 4, {
  "Technique I — Foundations": "Secure",
});
assert.equal(view["custom:u1"].status, "Secure");
assert.equal(view["custom:u1"].locked, false);
// No mastery -> Not Introduced; parent not done -> locked.
const view2 = derivePathway(merged.nodes, 4, {});
assert.equal(view2["custom:u1"].status, "Not Introduced");
assert.equal(view2["custom:u1"].locked, true);

console.log("pathwayCustom.test: all assertions passed");
