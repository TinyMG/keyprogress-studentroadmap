---
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