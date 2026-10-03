# AGENTS.md

## Purpose

This repository implements `AWSPricingCalculator_forTAE`, a static web application for comparing AWS architecture estimates using AWS Public Price List data.

## Source of truth

Before changing behavior or pricing semantics, read these documents in this order:

1. `docs/SPEC.md` — user-visible behavior, Project/Plan/Row model, save/restore, PDF/CSV and runtime UI behavior.
2. `docs/PRICING_ARCHITECTURE.md` — Service Definition, Price DB, Pricing Core, validation, CLI and CI/CD architecture.
3. `docs/IMPLEMENTATION_PLAN.md` — phased implementation plan and completion criteria.
4. `docs/PRICING_ARCHITECTURE_DECISION_HISTORY.md` — design-history index only; it is not the current specification.

If code and documentation disagree, do not silently choose a new behavior. Follow the current source-of-truth documents unless the `/goal` explicitly requests a specification change.

## Codex workflow

Implementation work is expected to be assigned through `/goal`.

- Treat the requested phase or goal as the scope boundary.
- Inspect the current repository before editing; do not assume implementation state from earlier sessions.
- Prefer completing one implementation phase at a time, including its tests and validation.
- Do not continue into later phases merely because prerequisite work is nearby.
- If a goal reveals a genuine specification conflict that affects user behavior, persisted data compatibility, pricing semantics, publication consistency, or fail-open/fail-closed behavior, stop that portion and report the conflict instead of inventing a new rule.
- Minor implementation details not fixed by the specification may be decided locally when they do not alter the above semantics.

## Architecture constraints

- Browser application server/backend database are not part of the design; deployment remains static GitHub Pages plus GitHub Actions.
- Pricing logic must not be embedded as service-name-specific branches when it can be expressed by the generic Definition/DSL model.
- Shared Pricing Core must remain independent of DOM, `window`, `localStorage`, filesystem and network access.
- Browser-only loading/state code and Node-only CLI/filesystem/network code stay outside the shared Pricing Core.
- Arbitrary JavaScript expressions in Service Definitions are prohibited. `adapter.js` is exceptional and requires explicit justification.
- Initial normal pricing resolution is `singleSku`; do not silently select a first/cheapest/similar SKU.
- Tier pricing and Free Tier/free allowances follow `docs/PRICING_ARCHITECTURE.md`; do not reintroduce tier integration or allowance subtraction.
- Monetary/usage calculation must use decimal-safe arithmetic and avoid intermediate display rounding.
- Price DB generation/validation must be deterministic where specified.

## Mock isolation

The historical UI discussion mock is isolated under `mock/`.

- `mock/` is reference/demo material, not the production source layout.
- Do not build new architecture by extending mock-specific hard-coded pricing/service branches.
- Keep the mock working unless a `/goal` explicitly says it may be removed.
- GitHub Pages currently publishes `mock/` until the real application replaces it.

## Verification

For every implementation goal:

- Add or update automated tests for changed deterministic logic.
- Run the narrow relevant tests first, then the repository-level validation commands defined by the implementation phase.
- Validate JSON Schema/reference/dependency/Golden behavior where relevant.
- Do not report completion while known validation errors remain.
- Summarize changed files, tests run, and any remaining warnings or deferred items.

## Generated data

- Do not hand-edit generated Price DB files as a substitute for fixing source Definitions, normalizers or builders.
- Raw AWS bulk Price List files are temporary inputs and should not be committed unless a specification change explicitly says otherwise.
- Publishing an active Price DB build is a separate promotion step; validation/build success alone must not implicitly change the active manifest.
