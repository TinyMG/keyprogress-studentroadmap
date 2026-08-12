# Design Questions Reference

Trade-offs, recommendation heuristics, and examples for each design area. Read this fully before starting an interview.

## Contents

- Interview style: draft early, steer often
- Framing: the Plan → Implement → Verify flow
- Area 1: Context
- Area 2: Structure
- Area 3: Alignment
- Area 4: Verification
- Area 5: Feedback
- Cross-cutting red flags

## Interview style: draft early, steer often

- **Sequence:** topic → frame (unit of work, done, shape) → draft skeleton → per-phase detail. The skeleton lands as early as possible; detail questions attach to the phase they affect.
- **Why not batch:** a user can't steer twelve abstract questions, but they can steer a draft. Front-loaded gathering produces answers ungrounded in any structure — and the answers to detail questions (freedom, context placement) genuinely depend on steps that don't exist yet.
- **Propose vs. poll:** if the conversation plus the domain gives you a defensible answer, state it and invite correction ("I'd put X here because Y — move it?"). Use AskUserQuestion only where the user holds information you can't infer or the trade-off is genuinely theirs to make.
- **High-level answers open options:** when the user answers at a high level, name the design directions it opens — "that implies A, B, or C, because..." — and let the user choose. Don't fold the answer silently into one design decision; inference is for skipping already-answered questions, not for choosing among directions an answer leaves open.
- **No tech trivia:** ask about the workflow (unit of work, risk points, verification), not the technology (versions, dialects, frameworks) — unless the answer changes a design decision. "What's the unit of work per run?" beats "Which Java version?".

## Framing: the Plan → Implement → Verify flow

Most workflows follow **Plan → Implement → Verify**.

- **Plan** — explore the codebase and problem space, ensure all needed information is gathered from the user, then propose a plan. Built-in plan mode is fine for general tasks; a workflow with a specific goal usually wants a more consistent plan output (a defined artifact).
- **Implement** — execute the plan. Generally the simplest part.
- **Verify** — confirm the AI did what was asked. *This is the critical step for moving faster with AI tooling* — under-investing here is the most common design mistake.

Frame questions that shape everything downstream:

- **Unit of work per run** — one module, one ticket, one feature slice. Sets the blast radius, the verification scope, and how often checkpoints fire.
- **Does needed documentation exist?** Sometimes creating it is an upfront discovery phase — e.g., documenting a legacy system before a modernization workflow can plan against it.

If the user's task doesn't fit this shape (e.g., pure analysis or documentation), adapt — but verify-equivalents (review against a rubric) almost always still apply.

## Area 1: Context

**Questions to cover (per phase of the agreed skeleton):**

1. What does this phase need to know, and where does it come from — existing docs, an artifact created by an earlier phase, or the user's head?
2. Where should each piece live?

**Placement — three destinations, propose a table and let the user move rows:**

| Destination | Belongs there | Test |
|---|---|---|
| **CLAUDE.md** | Project-wide knowledge: conventions, idioms, stack standards, style | Would the user's *other* AI work also need this? Then it's not the skill's. |
| **SKILL.md** | Workflow-specific, needed **every run** | Putting it in references adds a read step for no benefit |
| **`references/`** | Workflow-specific, needed **some runs** | Putting it in SKILL.md taxes every execution |

- The classic miss: target-language idioms and team conventions feel like skill content but belong in **CLAUDE.md** — every code-writing task needs them, not just this workflow.
- Examples of `references/` content: mocking patterns for a particular type of testing, migration/modernization pattern mappings, page object model patterns, per-module-type discovery patterns.
- Litmus question: "what is relevant to *this task* but not to all code you write?" — that's the skill's context; the rest is CLAUDE.md.
- Don't ask the user "light SKILL.md or everything in SKILL.md?" — that's an abstract poll. Enumerate the context, trace its source, propose the placement, iterate.

## Area 2: Structure

**Questions to cover:**

1. One skill or several — where are the logical seams?
2. Degrees of freedom **per phase** — only answerable once the skeleton exists, and the answer usually differs phase to phase
3. Where can determinism be introduced?

**Skill boundaries:**

- Split where you want a **separate context window** for the next set of steps. Canonical example: legacy-codebase discovery should not pollute the context that writes new code — it risks carrying over bad practices or creating confusion.
- Default recommendation: one skill until there's a concrete reason to split (context pollution, reuse of a phase across workflows, or a natural handoff artifact between phases).

**Degrees of freedom (assessed per phase, against the drafted skeleton):**

| Level | Form | Use when |
|---|---|---|
| High | Prose / heuristics | Multiple approaches valid; context drives decisions (writing new code) |
| Medium | Pseudocode / templates | A preferred pattern exists; some variation OK (tests, docs of a given type) |
| Low | Exact script or clear example | Fragile or consistency-critical operations, handoff artifacts |

- Templates live in `assets/`. A strong medium-freedom technique: provide **2-3 input→output example pairs** (few-shot) instead of describing the format.
- Recommend: match strictness to fragility. New-code phases lean high; test-writing and documentation lean medium; conversions, migrations, and handoff artifacts lean low. Propose a level per phase with the rationale; don't ask for one global setting.

**Determinism:**

- **Make everything that can be deterministic, deterministic.** If code can do part of a conversion, scaffold a template, or map dependencies — let it.
- Examples: parse test/log output with a script instead of burning context (or a subagent) reading it; scaffold templates; generate dependency maps.
- `scripts/` = deterministic steps the skill runs. **Hooks** = deterministic enforcement the harness runs. Key distinction to share: **context rules are advisory; hooks are deterministic** (guaranteed action). If the user hasn't seen hooks, give that one-line intro.

## Area 3: Alignment

**Questions to cover (per phase where relevant):**

1. Where has the user seen AI struggle on this task?
2. Where should the human be in the loop?

**Heuristics and trade-offs:**

- Struggle points get an **artifact** for additional focus. Examples: recognizing existing code that should be reused rather than rewritten, understanding a particular part of the codebase, overwriting certain types of code.
- Checkpoints go at **high-risk points where being slightly off causes significant rework**. Examples: choosing mapping patterns (migrations are rarely 1:1 in functionality), approving the proposed plan, reviewing assumptions/decisions after implementation completes.
- Second checkpoint trigger: places where the *user* doesn't yet know what's needed and should be pulled in to co-build the process as it runs.
- Trade-off to present: each checkpoint costs flow interruption. Recommend checkpoints only where rework cost > interruption cost — usually 2-3 per workflow, almost always including plan approval.

## Area 4: Verification

**Questions to cover:**

1. How can the work be verified as correct?
2. Would multiple perspectives help?

**Heuristics and trade-offs:**

- Ladder, weakest to strongest: it compiles → LSP confirms correctness → AI navigates and runs commands to check further → tests written against acceptance criteria → AI runs the user's "manual" tests and produces an example document (an artifact) → an automated **adversarial review** step.
- Recommend at least one machine-verifiable check (compile/LSP/tests) plus one artifact the human reviews.
- **Multiple perspectives** is where agents enter: different perspectives for different kinds of code review (e.g., conventions vs. security vs. reuse). Trade-off: more tokens and time; recommend only when a single review demonstrably misses things, or stakes are high.

## Area 5: Feedback

**Questions to cover:**

1. Where does the workflow learn, so it improves over time?

**Heuristics:**

- Does the last step update some form of documentation? Options: inside the skill (`references/`), a documentation system (Confluence etc.), or a runbook.
- Recommend defaulting to the skill's own `references/` — it keeps improvements where the next run will actually read them. External systems are right when other teams or non-AI processes consume the same knowledge.

## Cross-cutting red flags

Call these out if the interview produces them:

- **Batch info-gathering without steering** — a wall of questions before any draft exists; put a skeleton on the table first.
- **Abstract polls instead of proposals** — "light or heavy SKILL.md?"-style questions; draft the placement and let the user move rows.
- **Tech-detail questions that don't change the design** — versions, dialects, frameworks.
- **High freedom everywhere + thin verification** — fast but unreviewable; tighten verify or reduce freedom.
- **No checkpoints before expensive work** — plan approval is nearly free; rework isn't.
- **Project-wide knowledge stuffed into the skill** — idioms and conventions belong in CLAUDE.md, where all the user's work benefits.
- **All context in SKILL.md** — every-run tax; move some-runs content to `references/`.
- **AI reading what a script could parse** — test output, logs, large generated files; introduce a script.
- **No feedback step** — the workflow will be exactly as good in six months as it is today.
