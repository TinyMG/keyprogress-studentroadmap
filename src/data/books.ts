// ponytail: books are a static const, ceiling = school needs custom series/edits;
// migrate to a `series`+`books` table + admin UI when that actually happens.

export type Book = { id: string; title: string };

export type Series = {
  id: string;
  name: string;
  publisher: string;
  books: Book[];
};

export const SERIES: Series[] = [
  {
    id: "piano-adventures",
    name: "Piano Adventures",
    publisher: "Faber",
    books: [
      { id: "pa-primer", title: "Primer Level" },
      { id: "pa-1", title: "Level 1" },
      { id: "pa-2a", title: "Level 2A" },
      { id: "pa-2b", title: "Level 2B" },
      { id: "pa-3a", title: "Level 3A" },
      { id: "pa-3b", title: "Level 3B" },
      { id: "pa-4", title: "Level 4" },
      { id: "pa-5", title: "Level 5" },
    ],
  },
  {
    id: "adult-piano-adventures",
    name: "Adult Piano Adventures",
    publisher: "Faber",
    books: [
      { id: "apa-1", title: "Book 1" },
      { id: "apa-2", title: "Book 2" },
    ],
  },
  {
    id: "rcm",
    name: "Royal Conservatory of Music",
    publisher: "RCM",
    books: [
      { id: "rcm-prep-a", title: "Preparatory A" },
      { id: "rcm-prep-b", title: "Preparatory B" },
      { id: "rcm-1", title: "Level 1" },
      { id: "rcm-2", title: "Level 2" },
      { id: "rcm-3", title: "Level 3" },
      { id: "rcm-4", title: "Level 4" },
      { id: "rcm-5", title: "Level 5" },
      { id: "rcm-6", title: "Level 6" },
      { id: "rcm-7", title: "Level 7" },
      { id: "rcm-8", title: "Level 8" },
      { id: "rcm-9", title: "Level 9" },
      { id: "rcm-10", title: "Level 10" },
      { id: "rcm-arct", title: "ARCT" },
    ],
  },
  {
    id: "piano-safari",
    name: "Piano Safari",
    publisher: "Safari",
    books: [
      { id: "ps-1", title: "Level 1" },
      { id: "ps-2", title: "Level 2" },
      { id: "ps-3", title: "Level 3" },
    ],
  },
];

export const SERIES_BY_ID: Record<string, Series> = Object.fromEntries(
  SERIES.map((s) => [s.id, s]),
);
