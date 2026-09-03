import assert from "node:assert/strict";
import { deriveStageProgress } from "./stageProgress.ts";
import type {
  Stage,
  Resource,
  StudentResource,
  ResourceHistoryEntry,
} from "../lib/supabase.ts";

function check() {
  const stages: Stage[] = [
    { id: "s0", stage_number: 0, name: "Piano Journey", description: null, color: null },
    { id: "s1", stage_number: 1, name: "Completion", description: null, color: null },
  ];
  const resources: Resource[] = [
    { id: "r1", name: "Technique I", description: null, category: "Technique", author: null, purchase_link: null, stage_id: "s0" },
    { id: "r2", name: "Rhythm I", description: null, category: "Rhythm", author: null, purchase_link: null, stage_id: "s0" },
    { id: "r3", name: "Level 1", description: null, category: "Method", author: null, purchase_link: null, stage_id: "s1" },
  ];
  const studentResources: StudentResource[] = [
    { student_id: "stu", resource_id: "r1", status: "active", assigned_at: "" },
  ];
  const history: ResourceHistoryEntry[] = [
    { id: "h1", student_id: "stu", resource_id: "r2", date_completed: "2026-01-01" },
  ];

  // empty student — all stages 0%
  const p0 = deriveStageProgress(stages, resources, [], []);
  assert.equal(p0.length, 2);
  assert.equal(p0[0].percent, 0);
  assert.equal(p0[1].percent, 0);
  assert.equal(p0[0].totalResources, 2);
  assert.equal(p0[0].completedResources, 0);
  assert.equal(p0[0].activeResources, 0);

  // r1 active, r2 completed -> S0: 50% (1 of 2), 1 active
  const p1 = deriveStageProgress(stages, resources, studentResources, history);
  assert.equal(p1[0].percent, 50);
  assert.equal(p1[0].completedResources, 1);
  assert.equal(p1[0].activeResources, 1);
  assert.equal(p1[1].percent, 0);

  // all S0 resources completed -> S0: 100%, S1: 0%
  const fullHistory: ResourceHistoryEntry[] = [
    { id: "h1", student_id: "stu", resource_id: "r1", date_completed: "2026-01-01" },
    { id: "h2", student_id: "stu", resource_id: "r2", date_completed: "2026-01-02" },
  ];
  const p2 = deriveStageProgress(stages, resources, [], fullHistory);
  assert.equal(p2[0].percent, 100);
  assert.equal(p2[0].completedResources, 2);
  assert.equal(p2[0].activeResources, 0);
  assert.equal(p2[1].percent, 0);

  // stage with no resources -> 0%
  const emptyStage: Stage[] = [
    { id: "empty", stage_number: 99, name: "Empty", description: null, color: null },
  ];
  const p3 = deriveStageProgress(emptyStage, resources, [], []);
  assert.equal(p3[0].percent, 0);
  assert.equal(p3[0].totalResources, 0);

  console.log("stageProgress.test: all checks passed");
}

check();
