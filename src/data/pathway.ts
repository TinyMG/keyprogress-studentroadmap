// ponytail: skill-tree layout is a static const (same approach as NotePath
// and books.ts above); migrate to a DB table only if teachers need to edit
// the tree without a deploy.

export type PathwayKind = "root" | "fundamentals" | "stage" | "skill" | "goal";
export type PathwayTrack =
  | "core" | "spine" | "technique" | "coordination"
  | "rhythm" | "sightreading" | "theory";

export type PathwayNode = {
  id: string;
  kind: PathwayKind;
  label: string;
  x: number; // center coords on a 1160x1100 canvas (y grows upward = later)
  y: number;
  shape: "circle" | "rect";
  track: PathwayTrack;
  stage?: number; // kind === "stage": the stage_number this circle represents
  prev?: string; // prerequisite node id (unlock gating)
  sub?: string[]; // "skills covered" shown in the click dialog
  resourceName?: string; // matches approved_resources.name -> mastery_level
  category?: string;
  description?: string; // dialog text for non-skill nodes
};

// Stage-circle labels come from the DB (curriculum_stages); `label` here is
// only a fallback. Coordinates lifted from NotePath's tree.
export const PATHWAY_NODES: PathwayNode[] = [
  { id: "journey", kind: "root", label: "Piano Journey", x: 555, y: 1030, shape: "circle", track: "core" },
  {
    id: "fundamentals", kind: "fundamentals", label: "Piano Fundamentals",
    x: 555, y: 910, shape: "rect", track: "core", prev: "journey",
    description:
      "Foundations: sitting position, keyboard geography, finger numbers, and white-key names.",
    sub: [
      "Sitting position",
      "Keyboard geography (black & white keys)",
      "Finger numbers",
      "White key names (A-B-C-D-E-F-G)",
    ],
  },
  { id: "stage1", kind: "stage", stage: 1, label: "Completion", x: 555, y: 790, shape: "circle", track: "spine", prev: "fundamentals" },
  { id: "stage2", kind: "stage", stage: 2, label: "Continuity", x: 555, y: 670, shape: "circle", track: "spine", prev: "stage1" },
  { id: "stage3", kind: "stage", stage: 3, label: "Confidence", x: 555, y: 550, shape: "circle", track: "spine", prev: "stage2" },
  { id: "stage4", kind: "stage", stage: 4, label: "Expression", x: 555, y: 430, shape: "circle", track: "spine", prev: "stage3" },
  { id: "stage5", kind: "stage", stage: 5, label: "Interpretation", x: 555, y: 310, shape: "circle", track: "spine", prev: "stage4" },
  { id: "stage6", kind: "stage", stage: 6, label: "Independence", x: 555, y: 190, shape: "circle", track: "spine", prev: "stage5" },
  {
    id: "performance", kind: "goal", label: "Performance Ability",
    x: 555, y: 70, shape: "rect", track: "core", prev: "stage6",
    description: "Plays reliably under performance conditions: memorized, musical, and self-correcting.",
  },

  // Technique track (far left)
  {
    id: "tech1", kind: "skill", label: "Technique I", category: "Technique",
    resourceName: "Technique I — Foundations",
    x: 110, y: 790, shape: "rect", track: "technique", prev: "fundamentals",
    sub: ["5-finger scales (PA1, PA2)", "Simple chords / triads", "Staccato vs. legato", "Pedaling", "Cross-hand arpeggios"],
  },
  {
    id: "tech2", kind: "skill", label: "Technique II", category: "Technique",
    resourceName: "Technique II",
    x: 110, y: 550, shape: "rect", track: "technique", prev: "tech1",
    sub: ["1-octave scales", "Major & minor scales (natural & harmonic)", "Chromatic scale", "1-octave arpeggios", "Chord inversions"],
  },
  {
    id: "tech3", kind: "skill", label: "Technique III", category: "Technique",
    resourceName: "Technique III",
    x: 110, y: 310, shape: "rect", track: "technique", prev: "tech2",
    sub: ["2-octave scales", "2-octave arpeggios"],
  },

  // Coordination track
  {
    id: "coord1", kind: "skill", label: "One-hand Coordination",
    x: 285, y: 790, shape: "rect", track: "coordination", prev: "fundamentals",
    sub: ["Single-hand melody and accompaniment", "Hand independence prep"],
  },
  {
    id: "coord2", kind: "skill", label: "Two-handed Coordination",
    x: 285, y: 670, shape: "rect", track: "coordination", prev: "coord1",
    sub: ["Hands play together", "Simple coordination patterns"],
  },
  {
    id: "coord3", kind: "skill", label: "R.H. Melody / L.H. Bass",
    resourceName: "R.H. Melody / L.H. Bass Playing",
    x: 285, y: 550, shape: "rect", track: "coordination", prev: "coord2",
    sub: ["Right-hand melody with left-hand bass-note accompaniment"],
  },
  {
    id: "coord4", kind: "skill", label: "R.H. Melody / L.H. Chord",
    resourceName: "R.H. Melody / L.H. Chord Playing",
    x: 285, y: 430, shape: "rect", track: "coordination", prev: "coord3",
    sub: ["Right-hand melody with left-hand chord accompaniment"],
  },
  {
    id: "coord5", kind: "skill", label: "R.H. Chord / L.H. Melody",
    resourceName: "R.H. Chord / L.H. Melody Playing",
    x: 285, y: 310, shape: "rect", track: "coordination", prev: "coord4",
    sub: ["Right-hand chords with left-hand melody — coordination inversion"],
  },

  // Rhythm track
  {
    id: "rhythm1", kind: "skill", label: "Basic Rhythms I", category: "Rhythm",
    resourceName: "Rhythm I — Basic Rhythms",
    x: 715, y: 790, shape: "rect", track: "rhythm", prev: "fundamentals",
    sub: ["Whole, half, dotted-half, quarter notes", "4/4 and 3/4 time"],
  },
  {
    id: "rhythm2", kind: "skill", label: "Basic Rhythms II", category: "Rhythm",
    resourceName: "Basic Rhythms II",
    x: 715, y: 670, shape: "rect", track: "rhythm", prev: "rhythm1",
    sub: ["Eighth notes", "2/4, 3/4, 4/4 time", "Dotted-quarter notes", "Eighth rests, quarter/half/whole rests", "Ties"],
  },
  {
    id: "rhythm3", kind: "skill", label: "Basic Rhythms III", category: "Rhythm",
    resourceName: "Basic Rhythms III",
    x: 715, y: 550, shape: "rect", track: "rhythm", prev: "rhythm2",
    sub: ["3/8 and 6/8 time signatures", "Syncopations", "Triplets", "16th-note rhythms", "Dotted-eighth to 16th-note patterns"],
  },
  {
    id: "rhythm4", kind: "skill", label: "Basic Rhythms IV", category: "Rhythm",
    resourceName: "Basic Rhythms IV",
    x: 715, y: 430, shape: "rect", track: "rhythm", prev: "rhythm3",
    sub: ["Changing time signatures within a piece"],
  },

  // Sight Reading track
  {
    id: "sr1", kind: "skill", label: "Sight Reading I", category: "Sight Reading",
    resourceName: "Sight Reading I",
    x: 870, y: 790, shape: "rect", track: "sightreading", prev: "fundamentals",
    sub: ["Intervallic reading", "Pattern recognition", "Rhythm-only sight reading"],
  },
  {
    id: "sr2", kind: "skill", label: "Sight Reading II", category: "Sight Reading",
    resourceName: "Sight Reading II",
    x: 870, y: 550, shape: "rect", track: "sightreading", prev: "sr1",
    sub: ["Intervals: 4ths, 5ths, 6ths", "Landmark notes", "Flats & sharps"],
  },
  {
    id: "sr3", kind: "skill", label: "Sight Reading III", category: "Sight Reading",
    resourceName: "Sight Reading III",
    x: 870, y: 310, shape: "rect", track: "sightreading", prev: "sr2",
    sub: ["7ths, 8va", "Key signatures", "Leger lines", "Flat key signature reading", "Cadenzas"],
  },

  // Theory track (far right)
  {
    id: "th1", kind: "skill", label: "Music Theory I", category: "Theory",
    resourceName: "Music Theory I",
    x: 1020, y: 910, shape: "rect", track: "theory", prev: "fundamentals",
    sub: ["Orientation / intro to staff reading", "Treble & bass clef", "Grand staff", "Middle C", "Time signatures", "Volumes / dynamics"],
  },
  {
    id: "th2", kind: "skill", label: "Music Theory II", category: "Theory",
    resourceName: "Music Theory II",
    x: 1020, y: 790, shape: "rect", track: "theory", prev: "th1",
    sub: ["Treble & bass clef note reading", "Transposition", "Steps & skips on the staff", "The octave", "The tie"],
  },
  {
    id: "th3", kind: "skill", label: "Music Theory III", category: "Theory",
    resourceName: "Music Theory III",
    x: 1020, y: 670, shape: "rect", track: "theory", prev: "th2",
    sub: ["Music phrases", "Half steps & whole steps", "Pedal markings", "Cresc. / decresc.", "Landmark notes", "Basic lead-sheet reading"],
  },
  {
    id: "th4", kind: "skill", label: "Music Theory IV", category: "Theory",
    resourceName: "Music Theory IV",
    x: 1020, y: 550, shape: "rect", track: "theory", prev: "th3",
    sub: ["Binary & ternary form", "Alberti bass", "Syncopations", "12-bar blues", "Sharp key signatures", "Compound time (3/8, 6/8)", "D.C. Al Coda"],
  },
  {
    id: "th5", kind: "skill", label: "Music Theory V", category: "Theory",
    resourceName: "Music Theory V",
    x: 1020, y: 430, shape: "rect", track: "theory", prev: "th4",
    sub: ["Circle of fifths", "Flat key signatures", "Primary chords in major/minor keys", "Cadenzas in different keys", "Changing time signatures"],
  },
];

// [from, to] pairs; drawn as curved connectors, lit when the target is unlocked.
export const PATHWAY_EDGES: [string, string][] = [
  ["journey", "fundamentals"],
  ["fundamentals", "stage1"],
  ["fundamentals", "tech1"],
  ["fundamentals", "coord1"],
  ["fundamentals", "rhythm1"],
  ["fundamentals", "sr1"],
  ["fundamentals", "th1"],
  ["stage1", "stage2"],
  ["stage2", "stage3"],
  ["stage3", "stage4"],
  ["stage4", "stage5"],
  ["stage5", "stage6"],
  ["stage6", "performance"],
  ["tech1", "tech2"],
  ["tech2", "tech3"],
  ["tech3", "performance"],
  ["coord1", "coord2"],
  ["coord2", "coord3"],
  ["coord3", "coord4"],
  ["coord4", "coord5"],
  ["coord5", "performance"],
  ["rhythm1", "rhythm2"],
  ["rhythm2", "rhythm3"],
  ["rhythm3", "rhythm4"],
  ["rhythm4", "performance"],
  ["sr1", "sr2"],
  ["sr2", "sr3"],
  ["sr3", "performance"],
  ["th1", "th2"],
  ["th2", "th3"],
  ["th3", "th4"],
  ["th4", "th5"],
  ["th5", "performance"],
];

export const PATHWAY_CANVAS = { width: 1160, height: 1100 };
