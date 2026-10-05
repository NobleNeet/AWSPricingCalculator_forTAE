# AGENTS.md

## Purpose

This repository implements `AWSPricingCalculator_forTAE`, a static web application for comparing AWS architecture estimates using AWS Public Price List data.

## Source of truth

Before changing behavior or pricing semantics, read these documents in this order:

1. `docs/SPEC.md` — user-visible behavior, Project/Plan/Row model, save/restore, PDF/CSV and runtime UI behavior.
2. `docs/PRICING_ARCHITECTURE.md` — Service Definition, Price DB, Pricing Core, validation, CLI and CI/CD architecture.
3. `docs/PRICING_MAPPING_ARCHITECTURE.md` — service-specific AWS Price List mapping, semantic-resolution responsibility, drift handling and finalize behavior. For pricing-item meaning resolution or semantic/finalize behavior, this document takes precedence over older generic-resolution assumptions in `docs/PRICING_ARCHITECTURE.md`.
4. `docs/SERVICE_ONBOARDING.md` — rules for adding a new AWS service or expanding an existing service from the AWS Pricing Calculator UI under the On-Demand-only policy.
5. `docs/ONBOARDING_PROMOTION_QUEUE.md` — branch/PR queue rules for running multiple service onboarding or re-onboarding jobs in parallel while serializing main integration, Price DB publication, and Pages deployment.
6. `docs/AUTONOMOUS_IMPLEMENTATION.md` — how Codex must execute implementation work without unnecessary human intervention.
7. `docs/IMPLEMENTATION_PLAN.md` — phased implementation plan and completion criteria.
8. `docs/PRICING_ARCHITECTURE_DECISION_HISTORY.md` — design-history index only; it is not the current specification.

If code and documentation disagree, do not silently invent a new behavior. Follow the current source-of-truth documents unless the `/goal` explicitly requests a specification change.

If the operational instructions in `docs/IMPLEMENTATION_PLAN.md` conflict with `docs/AUTONOMOUS_IMPLEMENTATION.md`, the autonomous implementation document takes precedence.

## Codex workflow

Implementation work is expected to be assigned through `/goal`.

The normal workflow is **one overall `/goal` for the complete implementation**, not one human-issued goal per phase.

- Read `docs/AUTONOMOUS_IMPLEMENTATION.md` before starting implementation.
- When adding a new AWS service or expanding service estimate fields, also read and follow `docs/PRICING_MAPPING_ARCHITECTURE.md`, `docs/SERVICE_ONBOARDING.md`, and `docs/ONBOARDING_PROMOTION_QUEUE.md` before deciding which fields or pricing mappings to implement.
- A request such as `AWS Fargateを追加して` is a complete service-onboarding request unless the user explicitly limits the scope. It includes research, implementation, tests, Price DB work when required, queued promotion, Actions verification, and Pages deployment verification.
- Decompose the overall goal into the phases defined in `docs/IMPLEMENTATION_PLAN.md` where those phases are relevant to the requested change.
- Continue through all work required by the goal without waiting for human confirmation between normal implementation steps.
- Treat each relevant completion criterion as an internal gate. Do not advance while known required checks fail.
- When a test/build/validation or deployment fails, diagnose, fix, rerun, and continue. A normal implementation failure is not a reason to ask the user what to do.
- If later work exposes a defect in an earlier implementation, return to it, fix it, revalidate, then resume forward progress.
- Do not stop merely because the work is large or spans many files.
- Prefer reviewable commits, but do not require human merge/approval between normal implementation steps.
- Phase-specific `/goal` examples in `docs/IMPLEMENTATION_PLAN.md` are fallback templates for targeted reruns/debugging, not the default workflow.

Only stop for a genuine blocker defined in `docs/AUTONOMOUS_IMPLEMENTATION.md`, such as an irreconcilable source-of-truth specification conflict, an unavoidable pricing/data compatibility semantic change, missing external permissions that cannot be worked around, or an unsafe destructive action that is not already authorized by the specifications.

For ordinary implementation choices, choose a reasonable solution and continue.

## Architecture constraints

- Browser application server/backend database are not part of the design; deployment remains static GitHub Pages plus GitHub Actions.
- Pricing logic must not be embedded as service-name-specific branches when it can be expressed by the generic Definition/DSL/Mapping model.
- AWS pricing-item meaning is resolved during service onboarding and persisted as service-specific Pricing Mapping data. Scheduled price updates must validate those mappings deterministically rather than infer unknown pricing semantics.
- Service-specific unit aliases, price-source overrides, product attribute combinations and similar semantic details belong in `services/<serviceId>/` mappings unless they are demonstrably safe global rules.
- Shared Pricing Core must remain independent of DOM, `window`, `localStorage`, filesystem and network access.
- Browser-only loading/state code and Node-only CLI/filesystem/network code stay outside the shared Pricing Core.
- Arbitrary JavaScript expressions in Service Definitions are prohibited. `adapter.js` is exceptional and requires explicit justification.
- Initial normal pricing resolution is `singleSku`; do not silently select a first/cheapest/similar SKU.
- Tier pricing and Free Tier/free allowances follow `docs/PRICING_ARCHITECTURE.md`; do not reintroduce tier integration or allowance subtraction.
- Monetary/usage calculation must use decimal-safe arithmetic and avoid intermediate display rounding.
- Price DB generation/validation must be deterministic where specified.

## Service onboarding

For a new service or an expansion/re-onboarding of an existing service:

- Use the AWS Pricing Calculator service screen as the primary reference for estimate inputs, defaults, dependencies, conditional fields, and primary/advanced grouping.
- Keep purchase-plan choices On-Demand-only; do not add Reserved, Savings Plans, Spot, commitment-term, or upfront-payment choices unless the source-of-truth specification is explicitly changed.
- Do not omit operational or usage inputs merely because payment plans are fixed to On-Demand.
- Use AWS Public Price List as the pricing truth; never copy calculator-displayed prices into Definitions.
- Inspect actual Public Price List products and price dimensions during onboarding and create deterministic service-specific Pricing Mappings for each supported pricing component.
- Do not defer unresolved pricing meaning to a future generic semantic resolver or scheduled workflow.
- Treat test impact analysis as part of Definition/UI implementation, not as cleanup after CI failure. When Definition, drawer UI, dependencies, selectors, options, defaults, conditional visibility, DOM structure, or component structure changes, search all affected existing unit/Golden/E2E tests and update their expectations, locators, and assertion methods before repository-wide CI.
- Run the narrowest relevant service-specific tests and E2E first. Do not use repeated commit/push/Actions runs to discover known stale tests one failure at a time; advance to repository-wide validation only after the affected narrow tests pass.
- Follow the end-to-end workflow and completion gate in `docs/SERVICE_ONBOARDING.md`, including deployment verification.
- Do not implement service onboarding directly on `main`. New services use `onboard/<serviceId>`; re-onboarding uses `reonboard/<serviceId>`.
- Different service IDs may be worked on concurrently in separate branches/chats. Do not run multiple onboarding jobs for the same service ID concurrently.
- When branch implementation and branch CI are complete, open/retain a PR and apply `onboarding-ready`; do not directly merge it into `main`.
- `.github/workflows/onboarding-promotion.yml` owns serialized promotion. It integrates one ready PR into latest `main`, revalidates the merged candidate, waits for the matching Price DB publication and Pages deployment, then advances the next queued PR.
- Treat `onboarding-ready` PRs as the durable queue. Do not rely on GitHub Actions concurrency pending runs as the queue state.
- `services/catalog.json` is reconciled during promotion from `services/*/service.json` using `tools/generate-service-catalog.js`; do not add ad-hoc conflict logic for concurrent catalog edits.
- A branch being READY/queued is not final completion. Report onboarding complete only after serialized promotion, Price DB publication, and Pages deployment succeed.

## Mock isolation

The historical UI discussion mock is isolated under `mock/`.

- `mock/` is reference/demo material, not the production source layout.
- Do not build new architecture by extending mock-specific hard-coded pricing/service branches.
- Keep the mock working until the real application replaces it, unless the `/goal` explicitly permits removal.
- GitHub Pages currently publishes `mock/` until the real application replaces it.

## Verification

For every implementation phase or onboarding step:

- Add or update automated tests for changed deterministic logic.
- For onboarding/re-onboarding UI or Definition changes, inventory affected existing tests before full validation; update stale expectations, locators, and assertion semantics as part of the implementation change itself.
- Run narrow relevant tests first, including service-specific browser E2E where applicable, then repository-level validation commands defined by the implementation plan.
- Validate JSON Schema/reference/dependency/Golden behavior where relevant.
- Validate service-specific Pricing Mappings against actual Public Price List candidate data where relevant.
- Do not mark work complete while known required validation errors remain.
- Record changed files, tests run, warnings and deferred items as progress information.
- Continue automatically after each normal implementation gate rather than waiting for a response.
- When the goal changes the deployed application, verify the relevant GitHub Actions and GitHub Pages deployment before reporting completion.

At the final phase, run the applicable completion checklist in `docs/IMPLEMENTATION_PLAN.md` and, for service onboarding, `docs/SERVICE_ONBOARDING.md` plus `docs/ONBOARDING_PROMOTION_QUEUE.md`. If any required item fails, return to the responsible implementation, fix it, and repeat final verification.

## Generated data

- Do not hand-edit generated Price DB files as a substitute for fixing source Definitions, Pricing Mappings, normalizers or builders.
- Raw AWS bulk Price List files are temporary inputs and should not be committed unless a specification change explicitly says otherwise.
- Publishing an active Price DB build is a separate promotion step; validation/build success alone must not implicitly change the active manifest.
