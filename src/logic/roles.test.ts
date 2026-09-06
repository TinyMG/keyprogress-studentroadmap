import assert from "node:assert/strict";
import { visibleNav, homeView, NAV } from "./roles.ts";

// Admin sees everything, including Admin.
assert.deepEqual(
  visibleNav("admin").map((n) => n.id),
  NAV.map((n) => n.id),
);

// Teacher never sees Admin.
assert.ok(!visibleNav("teacher").some((n) => n.id === "admin"));
assert.ok(!visibleNav("student").some((n) => n.id === "admin"));

// Student nav is a subset of teacher nav (same items, minus nothing
// today, but the invariant must hold if navs diverge later).
const teacherIds = visibleNav("teacher").map((n) => n.id);
for (const n of visibleNav("student")) {
  assert.ok(teacherIds.includes(n.id), `student nav leaked: ${n.id}`);
}

// Home views: students land on their (RLS-filtered) student list.
assert.equal(homeView("admin"), "dashboard");
assert.equal(homeView("teacher"), "dashboard");
assert.equal(homeView("student"), "students");

console.log("roles.test: all assertions passed");
