import os

# Define the base directory structure for OpenCode local project skills
base_dir = ".opencode/skills"

skills = {
    "project-planner": {
        "content": """---
name: project-planner
description: Structural blueprint and architecture planning for KeyProgress app.
license: MIT
compatibility: opencode
metadata:
  role: software-architect
  phase: initial-setup
---

## Objective
Establish a rock-solid, type-safe full-stack architectural plan for the KeyProgress application before generating functional code blocks.

## Development Priorities
1. **Schema Integrity**: Enforce normalized relational schemas (or strict validation for NoSQL). Prevent arbitrary column mutation without explicit model migrations.
2. **API Specification**: Standardize REST or GraphQL payloads. Every response must strictly structure status codes, execution payloads, and explicit error signatures.
3. **State Topography**: Graph data boundaries clearly across server boundaries, client caching layers, and transient UI components.

## Rules of Engagement
- Always request or create a detailed entity relationship map before implementing data persistence logic.
- Reject multi-tier execution strings that embed logic rawly inside layout files. Emphasize crisp, testable service layers.
"""
    },
    "frontend-designer": {
        "content": """---
name: frontend-designer
description: Production-grade web interface design and clean component styling for KeyProgress.
license: MIT
compatibility: opencode
metadata:
  role: staff-frontend-engineer
  aesthetic: modern-professional
---

## Objective
Eradicate generic, uninspired, default AI component design. Build beautifully designed layouts with crisp design tokens and fluid responsive flows.

## Core Mandates
1. **Visual Guidelines**: Use cohesive typography scale, predictable layout margins, and clean spacing hierarchies (e.g., 4px/8px grid bounds).
2. **Component Isolation**: Design highly reusable, self-contained interactive components. Keep design systems isolated from application-wide business logic loops.
3. **Accessibility (a11y)**: Enforce appropriate HTML5 semantic structures, clear focus management states, and full ARIA compliance patterns across all component iterations.

## Operational Constraints
- Never deploy raw color codes arbitrarily inside single elements. Leverage consistent, centrally declared tailwind or css design variable tokens.
- Review components dynamically against layout shifts, mobile breakpoints, and accessibility criteria before certifying completion.
"""
    },
    "test-driven-development": {
        "content": """---
name: test-driven-development
description: Test-Driven Development protocol enforcing a red-green-refactor loop.
license: MIT
compatibility: opencode
metadata:
  role: qa-automation-lead
  framework: playwright-vitest
---

## Objective
Minimize debugging overhead and avoid code regressions by strictly adhering to a red-green-refactor test writing framework.

## Core Rules
1. **Tests First**: Write clear failing assertion parameters covering the core logic criteria *before* generating target application logic.
2. **Minimal Execution**: Generate only the baseline, unbloated logic requirements necessary to flip the failing test criteria to green.
3. **Refactor Safety**: Optimize structure, clean variable nomenclature, and eliminate boilerplate safely while maintaining passing test coverage bars.

## Verification Steps
- Run the localized test suite commands automatically after code updates.
- If a test crashes, halt feature generation immediately. Debug and refactor inside the sandbox until the code consistently passes the verification assertions.
"""
    }
}

# Create directories and populate files
for skill_name, data in skills.items():
    skill_folder = os.path.join(base_dir, skill_name)
    os.makedirs(skill_folder, exist_ok=True)
    
    file_path = os.path.join(skill_folder, "SKILL.md")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(data["content"].strip())

print("Successfully written 3 OpenCode skills to .opencode/skills/")
