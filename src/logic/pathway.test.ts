import assert from "node:assert/strict";
import { derivePathway, nodeVisual } from "./pathway.ts";
import { PATHWAY_NODES } from "../data/pathway.ts";

function check() {
  const nodes = PATHWAY_NODES;
  const noMastery: Record<string, never> = {};

  // Stage 0 student: fundamentals in progress, everything above locked.
  const v0 = derivePathway(nodes, 0, noMastery);
  assert.equal(v0.journey.status, "Secure");
  assert.equal(v0.fundamentals.status, "Learning");
  assert.equal(v0.fundamentals.locked, false);
  assert.equal(v0.stage1.locked, true);
  assert.equal(v0.tech1.locked, true);
  assert.equal(v0.tech1.status, "Not Introduced");
  assert.equal(nodeVisual(v0.stage1), "locked");

  // Stage 2 student: past stages Secure, current Learning, future locked.
  const v2 = derivePathway(nodes, 2, noMastery);
  assert.equal(v2.fundamentals.status, "Secure");
  assert.equal(v2.stage1.status, "Secure");
  assert.equal(v2.stage2.status, "Learning");
  assert.equal(nodeVisual(v2.stage2), "progress");
  assert.equal(v2.stage2.locked, false);
  assert.equal(v2.stage3.status, "Not Introduced");
  assert.equal(v2.stage3.locked, true);
  // First skill nodes unlocked (fundamentals done); successors locked.
  assert.equal(v2.tech1.locked, false);
  assert.equal(v2.tech2.locked, true);
  // Goal locked until stage 6.
  assert.equal(v2.performance.locked, true);

  // Skill mastery flows from the resource-name map.
  const vM = derivePathway(nodes, 2, { "Technique I — Foundations": "Developing" });
  assert.equal(vM.tech1.status, "Developing");
  assert.equal(nodeVisual(vM.tech1), "progress");
  assert.equal(vM.tech2.locked, true); // prev not Secure yet

  const vS = derivePathway(nodes, 2, { "Technique I — Foundations": "Secure" });
  assert.equal(vS.tech1.status, "Secure");
  assert.equal(vS.tech2.locked, false); // unlocked once prev is Secure
  assert.equal(vS.tech2.status, "Not Introduced");

  // Stage 6 student: goal reached.
  const v6 = derivePathway(nodes, 6, noMastery);
  assert.equal(v6.performance.status, "Performance Ready");
  assert.equal(v6.performance.locked, false);

  // Every node's prev exists; every non-root node has prev; stages are 1..6.
  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    if (n.kind === "root") continue;
    assert.ok(n.prev, `${n.id} missing prev`);
    assert.ok(ids.has(n.prev), `${n.id} prev ${n.prev} not a node`);
    if (n.stage) assert.ok(n.stage >= 1 && n.stage <= 6);
  }
}

check();
console.log("pathway.test: all assertions passed");
