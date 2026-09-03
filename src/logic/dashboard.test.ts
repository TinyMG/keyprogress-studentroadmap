import assert from "node:assert/strict";
import { deriveDashboardStats } from "./dashboard.ts";
import type {
  Student,
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

  const students: Student[] = [
    { id: "stu1", name: "Alice", parent_email: null, series_id: "piano-adventures", created_at: "", age: 7, date_of_birth: null, parent_name: null, phone: null, address: null, is_adult: false, stage_id: "s0", date_entered_stage: null, lesson_focus: null, general_notes: null, sub_notes: null },
    { id: "stu2", name: "Bob", parent_email: null, series_id: "piano-adventures", created_at: "", age: 10, date_of_birth: null, parent_name: null, phone: null, address: null, is_adult: false, stage_id: "s1", date_entered_stage: null, lesson_focus: null, general_notes: null, sub_notes: null },
    { id: "stu3", name: "Carol", parent_email: null, series_id: "piano-adventures", created_at: "", age: 12, date_of_birth: null, parent_name: null, phone: null, address: null, is_adult: false, stage_id: "s0", date_entered_stage: null, lesson_focus: null, general_notes: null, sub_notes: null },
  ];

  const resources: Resource[] = [
    { id: "r1", name: "Technique I", description: null, category: "Technique", author: null, purchase_link: null, stage_id: "s0" },
    { id: "r2", name: "Level 1", description: null, category: "Method", author: null, purchase_link: null, stage_id: "s1" },
  ];

  const studentResources: StudentResource[] = [
    { student_id: "stu1", resource_id: "r1", status: "active", assigned_at: "" },
    { student_id: "stu2", resource_id: "r2", status: "active", assigned_at: "" },
    { student_id: "stu3", resource_id: "r1", status: "complete", assigned_at: "" },
  ];

  const history: ResourceHistoryEntry[] = [
    { id: "h1", student_id: "stu3", resource_id: "r1", date_completed: "2026-01-15" },
    { id: "h2", student_id: "stu2", resource_id: "r2", date_completed: "2026-01-10" },
  ];

  const stats = deriveDashboardStats(students, stages, studentResources, history, resources);

  assert.equal(stats.totalStudents, 3);
  assert.equal(stats.activeResources, 2);
  assert.equal(stats.booksCompleted, 2);
  assert.equal(stats.stageGroups, 2);
  assert.equal(stats.recentCompletions.length, 2);
  assert.equal(stats.recentCompletions[0].studentName, "Carol");
  assert.equal(stats.recentCompletions[0].resourceName, "Technique I");
  assert.equal(stats.studentsByStage.length, 2);
  assert.equal(stats.studentsByStage[0].stageName, "Piano Journey");
  assert.equal(stats.studentsByStage[0].count, 2);
  assert.equal(stats.studentsByStage[1].count, 1);

  // empty
  const empty = deriveDashboardStats([], [], [], [], []);
  assert.equal(empty.totalStudents, 0);
  assert.equal(empty.activeResources, 0);
  assert.equal(empty.booksCompleted, 0);
  assert.equal(empty.stageGroups, 0);
  assert.equal(empty.recentCompletions.length, 0);
  assert.equal(empty.studentsByStage.length, 0);

  console.log("dashboard.test: all checks passed");
}

check();
