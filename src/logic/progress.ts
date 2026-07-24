import { SERIES } from "../data/books.ts";

// Progress derivation: pure function, no React. The one non-trivial piece of
// logic in the app, so it gets the self-check (see progress.test.ts).

export type BookStatus = "done" | "current" | "next" | "todo" | "goal";

export type ProgressNode = {
  bookId: string;
  title: string;
  status: BookStatus;
  position: number; // 0-based index within the series
};

export type Progress = {
  nodes: ProgressNode[];
  currentIndex: number; // -1 if series complete
  nextIndex: number; // -1 if no next book
  goalIndex: number; // last book
  isComplete: boolean;
};

export function deriveProgress(
  seriesId: string,
  completedBookIds: string[],
): Progress {
  const series = SERIES.find((s) => s.id === seriesId);
  if (!series) throw new Error(`unknown series: ${seriesId}`);

  const done = new Set(completedBookIds);
  const last = series.books.length - 1;
  const currentIndex = series.books.findIndex((b) => !done.has(b.id));
  const resolvedCurrent = currentIndex === -1 ? last : currentIndex;
  const nextIndex =
    currentIndex === -1 || currentIndex === last ? -1 : currentIndex + 1;
  const isComplete = currentIndex === -1;

  const nodes: ProgressNode[] = series.books.map((b, i) => {
    let status: BookStatus;
    if (done.has(b.id)) status = "done";
    else if (i === last) status = "goal";
    else if (i === currentIndex) status = "current";
    else if (i === nextIndex) status = "next";
    else status = "todo";
    return { bookId: b.id, title: b.title, status, position: i };
  });

  return {
    nodes,
    currentIndex: resolvedCurrent,
    nextIndex,
    goalIndex: last,
    isComplete,
  };
}

export function nextBookSuggestion(p: Progress): ProgressNode | null {
  return p.nextIndex === -1 ? null : p.nodes[p.nextIndex];
}
