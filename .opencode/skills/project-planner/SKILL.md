---
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