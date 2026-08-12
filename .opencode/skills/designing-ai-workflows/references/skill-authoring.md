# Skill Authoring Reference

Condensed from Anthropic's skill authoring best practices. Follow this when scaffolding the skill in Step 8.

## Contents

- Frontmatter rules
- Naming and descriptions
- Conciseness
- Structure and progressive disclosure
- Workflows, checkpoints, and feedback loops
- Degrees of freedom → file types
- Anti-patterns
- Pre-delivery checklist

## Frontmatter rules

- `name`: max 64 chars; lowercase letters, numbers, hyphens only; no "anthropic" or "claude". Prefer **gerund form**: `migrating-endpoints`, `writing-e2e-tests`.
- `description`: non-empty, max 1024 chars, **third person**, and must say both **what the skill does and when to use it** — include trigger terms the user would actually say. This field alone drives skill selection.

## Naming and descriptions

- Good: `processing-pdfs`, `analyzing-spreadsheets`. Avoid vague names (`helper`, `utils`) and generic ones (`documents`, `data`).
- Description pattern: "*Does X, Y, Z. Use when [task contexts / trigger words].*"

## Conciseness

- **Default assumption: the model is already very smart.** Only include what it doesn't know: domain-specific guardrails, limits, team conventions, anti-patterns. Cut explanations of general concepts and generic best practices.
- Challenge every paragraph: "Does this justify its token cost?"
- Keep SKILL.md **under 500 lines** (target well under — ~120 is a good bar). Use **consistent terminology** throughout (one term per concept).

## Structure and progressive disclosure

- SKILL.md is a table of contents that points to detail loaded on demand.
- **References one level deep only** — every reference file links directly from SKILL.md. Nested references get partially read.
- Reference files **over 100 lines get a table of contents** at the top so partial reads can navigate.
- Organize references by domain (`references/finance.md`, not `docs/file2.md`); name files descriptively.
- Every-run content lives in SKILL.md; some-runs content lives in `references/`.

## Workflows, checkpoints, and feedback loops

- Break complex tasks into sequential steps with a **copyable checklist** at the top that the model checks off as it goes.
- Mark human checkpoints with explicit **`-> STOP`** markers stating what to share and what to ask.
- Build **feedback loops**: run validator → fix errors → repeat; only proceed when the check passes.
- For conditional paths, use explicit decision points: "Creating new? → workflow A. Editing existing? → workflow B."

## Degrees of freedom → file types

| Freedom | Provide | Lives in |
|---|---|---|
| High | Prose heuristics, ordered steps | SKILL.md |
| Medium | Templates, pseudocode, 2-3 input→output example pairs | `assets/` |
| Low | Exact scripts ("run exactly this, don't modify"), strict templates | `scripts/`, `assets/` |

- Prefer **executing** scripts over reading them: "Run `scripts/parse_results.py`" (output consumes tokens, not the code). Say explicitly whether a script is to run or to read as reference.
- Scripts handle their own errors — no magic numbers, no punting failures back to the model.
- For high-stakes batch operations, use **plan-validate-execute**: write a plan file, validate it with a script, then apply.

## Anti-patterns

- **Emojis — never use emojis anywhere in drafted skill files** (SKILL.md, references, assets, scripts). Use plain-text markers instead: `-> STOP`, `FAILED:`, `[ ]`.
- Time-sensitive content ("before August 2025 use the old API") — use a collapsed "old patterns" section instead.
- Offering many alternatives — provide one default plus an escape hatch.
- Windows-style paths — forward slashes always.
- Assuming packages are installed — state dependencies explicitly.

## Pre-delivery checklist

- [ ] Description: what + when, third person, includes trigger terms
- [ ] SKILL.md under ~120 lines; some-runs detail moved to `references/`
- [ ] References one level deep; >100-line files have a TOC
- [ ] Checklist workflow with explicit `-> STOP` checkpoints
- [ ] No emojis anywhere in the generated files
- [ ] At least one verification/feedback loop
- [ ] Every generated file traces back to an interview decision — nothing speculative
- [ ] Suggest testing on a real task in a fresh session before sharing
