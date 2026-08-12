---
name: designing-ai-workflows
description: Interviews the user through the design of a new AI-enabled workflow — framing it, drafting a skeleton early, then iteratively refining context, freedom, alignment, verification, and feedback phase by phase — and scaffolds the result as one or more skills plus a living design-summary HTML with a visual flow map. Use when the user wants to design or build a new workflow or skill for a task type (integrations, modernization, maintenance, testing, etc.) or asks to be interviewed about a workflow.
---

# Designing AI Workflows

Interview the user through the design of a new AI-enabled workflow, then scaffold it as one or more skills. Act as a consultant: **draft early and refine iteratively with the user** — ask the high-level questions, put a skeleton on the table, then sharpen each part in context. Bulk information-gathering up front without steering is an anti-pattern: the user can't react to twelve abstract questions, but they can react to a draft.

Before starting, read [references/design-questions.md](references/design-questions.md) — it holds the trade-offs, recommendation heuristics, and examples behind each design area.

## Interview rules

- **Topic first.** Get the topic / use case before planning any other questions, so every later question can be pointed at the domain.
- **Design the workflow, not the tech.** Skip technical details (language pairs, framework versions, system internals) unless the answer changes the workflow's design. The unit of work matters; Java-vs-Kotlin doesn't.
- **Propose, don't poll.** When you can infer a good answer from the conversation, propose it concretely and ask for a reaction in plain conversation. Reserve the **AskUserQuestion tool** for genuine decision points with real trade-offs — recommended option first, labeled "(Recommended)", pros/cons in the descriptions. Never ask abstract either/or questions about things you could draft instead (e.g., don't ask "light SKILL.md or heavy?" — propose a placement table and let the user move rows).
- **High-level answers open options — surface them.** When the user answers at a high level, don't silently translate the answer into design decisions. Spell out what it implies — "because you said X, the design could go A, B, or C, because..." — and let the user pick the direction (AskUserQuestion fits here). Inference is for skipping questions already answered, not for choosing among directions an answer leaves open.
- **Ask at the moment of relevance.** Detail questions belong inside the refinement of the phase they affect, not in an up-front batch.
- **Skip questions the user has already answered** in conversation — record the inferred answer in the design summary instead of re-asking.
- After each phase or area, give a **one-line recap** before moving on.
- If answers combine badly (e.g., high freedom everywhere plus no verification), **say so** and propose a fix — don't silently record a weak design.

## Workflow checklist

Copy this checklist and check off steps as you complete them:

```
Design Progress:
- [ ] Step 1: Get the topic
- [ ] Step 2: Frame the workflow
- [ ] Step 3: Draft the skeleton
- [ ] Step 4: Refine phase by phase
- [ ] Step 5: Confirm verification and feedback
- [ ] Step 6: Design summary checkpoint
- [ ] Step 7: Scaffold the skill(s)
- [ ] Step 8: Update the design summary
- [ ] Step 9: Dry run and refine
```

## Step 1: Get the topic

Ask for the topic / use case — plain conversation, one question. Do not plan, batch, or ask anything else until you have it. Everything downstream is pointed by this answer.

## Step 2: Frame the workflow

With the topic known, ask only what shapes the workflow (AskUserQuestion is fine here — these are real decision points):

- **Unit of work per run** — what one execution handles (a module, a ticket, a test suite, ...)
- **What "done" looks like** — the final artifact(s) (PR, mapping doc, test suite, ...)
- **Shape** — does **Plan → Implement → Verify** fit, or does it differ? In particular: does the documentation the workflow needs already exist, or is *creating it* an upfront discovery phase?

Recap the frame in 2-3 lines.

## Step 3: Draft the skeleton

From the frame, **propose** a draft structure — don't interview your way to it:

- Phases in order, each with a one-line purpose and its output artifact
- A first guess at **skill boundaries**: where a fresh context window is needed (and the handoff artifact at each seam)

**-> STOP. Share the skeleton and iterate until the user agrees the shape is right. Every later question hangs off this draft — do not proceed on a skeleton the user hasn't reacted to.**

## Step 4: Refine phase by phase

Walk the agreed skeleton one phase at a time. For each phase, infer what you can and ask only what you can't. Cover:

- **Context** — what this phase needs to know and where it comes from (existing docs, docs created by an earlier phase, the user's head). Then **propose a placement table**: project-wide knowledge the user's other work also needs (conventions, idioms, stack standards) → **CLAUDE.md**; every-run, workflow-specific → **SKILL.md**; some-runs → **references/**. Let the user move rows.
- **Freedom** — propose high / medium / low for *this phase* with rationale; the answer differs per phase and can't be set before the steps exist. Medium/low ⇒ name the template or input→output example pairs (`assets/`). Sub-steps code could do ⇒ `scripts/` or hooks.
- **Alignment** — where AI struggles in this phase → a focusing **artifact**; whether the phase ends in a **checkpoint** (high rework cost if slightly off), and co-build vs. approve at that checkpoint.

One-line recap per phase before moving to the next. Update the skeleton as decisions land, so the user always sees the current draft.

## Step 5: Confirm verification and feedback

These usually fall out of the Step 4 walk — confirm and fill gaps rather than re-ask:

- **Verification:** the minimum machine bar (compiles, LSP clean, lints, existing tests); stronger checks (tests against acceptance criteria, AI-run "manual" tests producing an example artifact, adversarial review); whether **multiple perspectives** (agents) earn their cost.
- **Feedback:** what the workflow's final step updates so it improves over time — the skill's own `references/`, a docs system, or a runbook.

## Step 6: Design summary checkpoint

Fill in [assets/design-summary-template.html](assets/design-summary-template.html) with every decision — chosen and inferred — and save it as `design-summary.html` in the project. Mark inferred answers with *(inferred)*. Open it in the browser for the user.

The summary's sections follow the design areas, in this order: **The task → Structure** (the visual flow: skills as columns, steps with freedom levels, handoff artifacts, checkpoints) **→ Context → Alignment → Verification → Feedback → Files to generate**. This file is the workflow's living design document — Step 8 updates it after scaffolding.

**-> STOP. Present the completed summary and get explicit approval before scaffolding. This is the cheapest moment to change the design.**

## Step 7: Scaffold the skill(s)

Read [references/skill-authoring.md](references/skill-authoring.md) and follow it. The skill boundaries from the skeleton determine how many skills to create — **one directory per skill**. Generate only what the design called for:

- One `SKILL.md` per skill — frontmatter, checklist workflow, and the checkpoints from Step 4 as explicit `-> STOP` markers
- Where skills were split for a fresh context window, make the **handoff artifact explicit**: the upstream skill's last step writes it, the downstream skill's first step reads it — and each description says where it sits in the sequence
- `references/` — one stub per some-runs context item, each with a note on what to fill in and an example of the expected detail
- `assets/` templates and `scripts/` stubs — only where the design chose medium/low freedom or determinism
- Context the design routed to **CLAUDE.md** is not part of the skill — propose those additions to the user's CLAUDE.md separately

**-> STOP. Walk the user through the generated files, mapping each file back to the design decision that created it.**

## Step 8: Update the design summary

Update `design-summary.html` to match what was actually scaffolded — renamed skills, moved files, decisions that shifted during drafting. The Structure section's flow must show every skill, its steps in order, handoff artifacts, checkpoints, and freedom levels as built; the Files section must list exactly the generated files.

**-> STOP. Open the updated summary for the user and confirm it matches the scaffolded skills.**

## Step 9: Dry run and refine

Suggest running the new skill on one real unit of work from Step 2 **in a fresh session**. Tell the user what to watch for: Did checkpoints fire where expected? Did it read the right references? Did verification catch anything? Offer to refine the skill based on what they observe.
