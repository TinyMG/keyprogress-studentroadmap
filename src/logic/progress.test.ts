// ponytail: one runnable self-check for deriveProgress (non-trivial logic).
// Run with: npm run check  (Node 24 strips TS types natively)
import assert from "node:assert/strict";
import { deriveProgress, nextBookSuggestion } from "./progress.ts";

function check() {
  // no books done -> first is current, second is next, last is goal
  const p0 = deriveProgress("piano-adventures", []);
  assert.equal(p0.currentIndex, 0);
  assert.equal(p0.nextIndex, 1);
  assert.equal(p0.isComplete, false);
  assert.equal(p0.nodes[0].status, "current");
  assert.equal(p0.nodes[1].status, "next");
  assert.equal(p0.nodes[7].status, "goal");
  assert.equal(p0.nodes[2].status, "todo");

  // primer + 1 done -> 2A is current, 2B is next
  const p1 = deriveProgress("piano-adventures", ["pa-primer", "pa-1"]);
  assert.equal(p1.currentIndex, 2);
  assert.equal(p1.nextIndex, 3);
  assert.equal(p1.nodes[0].status, "done");
  assert.equal(p1.nodes[1].status, "done");
  assert.equal(p1.nodes[2].status, "current");
  assert.equal(p1.nodes[3].status, "next");

  // all but last done -> last is current AND goal, no next
  const p2 = deriveProgress("piano-adventures", [
    "pa-primer", "pa-1", "pa-2a", "pa-2b", "pa-3a", "pa-3b", "pa-4",
  ]);
  assert.equal(p2.currentIndex, 7);
  assert.equal(p2.nextIndex, -1);
  assert.equal(p2.nodes[7].status, "goal");
  assert.equal(p2.isComplete, false);

  // everything done -> complete, last is goal, no current/next
  const p3 = deriveProgress("piano-adventures", [
    "pa-primer", "pa-1", "pa-2a", "pa-2b", "pa-3a", "pa-3b", "pa-4", "pa-5",
  ]);
  assert.equal(p3.isComplete, true);
  assert.equal(p3.currentIndex, 7); // resolves to last
  assert.equal(p3.nextIndex, -1);
  assert.equal(p3.nodes[7].status, "done");

  // nextBookSuggestion
  assert.equal(nextBookSuggestion(p1)?.bookId, "pa-2b");
  assert.equal(nextBookSuggestion(p3), null);

  // short series: adult piano adventures, 2 books
  const p4 = deriveProgress("adult-piano-adventures", []);
  assert.equal(p4.currentIndex, 0);
  assert.equal(p4.nextIndex, 1);
  assert.equal(p4.nodes[0].status, "current");
  assert.equal(p4.nodes[1].status, "goal");

  // unknown series throws
  assert.throws(() => deriveProgress("nope", []), /unknown series/);

  console.log("progress.test: all checks passed");
}

check();
