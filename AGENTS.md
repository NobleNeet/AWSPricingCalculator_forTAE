# AGENTS.md

## Purpose

This repository implements `AWSPricingCalculator_forTAE`, a static web application for comparing AWS architecture estimates using AWS Public Price List data.

## Source of truth

Before changing behavior or pricing semantics, read these documents in this order:

1. `docs/SPEC.md` — user-visible behavior, Project/Plan/Row model, save/restore, PDF/CSV and runtime UI behavior.
2. `docs/PRICING_ARCHITECTURE.md` — Service Definition, Price DB, Pricing Core, validation, CLI and CI/CD architecture.
3. `docs/AUTONOMOUS_IMPLEMENTATION.md` — how Codex must execute Phase 1 through the final phase without human intervention.
4. `docs/IMPLEMENTATION_PLAN.md` — phased implementation plan and completion criteria.
5. `docs/PRICING_ARCHITECTURE_DECISION_HISTORY.md` — design-history index only; it is not the current specification.

If code and documentation disagree, do not silently invent a new behavior. Follow the current source-of-truth documents unless the `/goal` explicitly requests a specification change.

If the operational instructions in `docs/IMPLEMENTATION_PLAN.md` conflict with `docs/AUTONOMOUS_IMPLEMENTATION.md`, the autonomous implementation document takes precedence.

## Codex workflow

Implementation work is expected to be assigned through `/goal`.

The normal workflow is **one overall `/goal` for the complete implementation**, not one human-issued goal per phase.

- Read `docs/AUTONOMOUS_IMPLEMENTATION.md` before starting implementation.
- Decompose the overall goal into the phases defined in `docs/IMPLEMENTATION_PLAN.md`.
- Start at Phase 1 and continue through the final phase without waiting for human confirmation between phases.
- Treat each phase's completion criteria as an internal gate. Do not advance while known required checks fail.
- When a test/build/validation fails, diagnose, fix, rerun, and continue. A normal implementation failure is not a reason to ask the user what to do.
- If a later phase exposes a defect in an earlier phase, return to the earlier implementation, fix it, revalidate, then resume forward progress.
- Do not stop merely because the work is large or spans many files.
- Prefer phase-sized reviewable commits, but do not require human merge/approval between phases.
- Phase-specific `/goal` examples in `docs/IMPLEMENTATION_PLAN.md` are fallback templates for targeted reruns/debugging, not the default workflow.

Only stop for a genuine blocker defined in `docs/AUTONOMOUS_IMPLEMENTATION.md`, such as an irreconcilable source-of-truth specification conflict, an unavoidable pricing/data compatibility semantic change, missing external permissions that cannot be worked around, or an unsafe destructive action that is not already authorized by the specifications.

For ordinary implementation choices, choose a reasonable solution and continue.

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
- Keep the mock working until the real application replaces it, unless the `/goal` explicitly permits removal.
- GitHub Pages currently publishes `mock/` until the real application replaces it.

## Verification

For every implementation phase:

- Add or update automated tests for changed deterministic logic.
- Run narrow relevant tests first, then repository-level validation commands defined by the implementation plan.
- Validate JSON Schema/reference/dependency/Golden behavior where relevant.
- Do not mark a phase complete while known required validation errors remain.
- Record changed files, tests run, warnings and deferred items as progress information.
- After recording completion, continue automatically to the next phase rather than waiting for a response.

At the final phase, run the full completion checklist in `docs/IMPLEMENTATION_PLAN.md`. If any required item fails, return to the responsible phase, fix it, and repeat final verification.

## Generated data

- Do not hand-edit generated Price DB files as a substitute for fixing source Definitions, normalizers or builders.
- Raw AWS bulk Price List files are temporary inputs and should not be committed unless a specification change explicitly says otherwise.
- Publishing an active Price DB build is a separate promotion step; validation/build success alone must not implicitly change the active manifest.
