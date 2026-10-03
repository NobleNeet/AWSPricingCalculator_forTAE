# Initial implementation verification

Specification semantics are unchanged. All Phase 1–11 implementation gates have been executed; mock remains isolated and unchanged. Remote UAT design commits were merged without changing their acceptance criteria.

## Implementation / directory map

| Directory | Responsibility |
|---|---|
| `src/pricing/` | Pure shared filter/condition/query/dimension/ordered Decimal calculation and runtime issues; no DOM/network/filesystem |
| `src/runtime/` | Tab-pinned immutable build, checksums, independent resource states/retry, Promise deduplication, lazy Definition/catalog, runtime schema subset |
| `src/app/` | Independent normalized Plans/Rows/Service Instances, comparison UI/Drawer, local autosave, safe migration/restore, PDF/JSON/CSV |
| `services/` | EC2, EBS, S3, Lambda and RDS PostgreSQL packages; explicit coverage and independent Golden assertions |
| `schemas/` | Central Definition, Project and Price DB JSON Schema |
| `pricing/` | Declarative normalizers, limitation registry, active manifest and immutable current/previous builds |
| `tools/` | Offline CLI validation/build, metadata/download boundaries, separate update/promotion, CI validation and static artifact packaging |
| `tests/` | Deterministic fixtures, curated raw AWS evidence, unit/integration and GUI E2E |
| `vendor/` | Decimal, PDF/font libraries and licensed Japanese font for offline static hosting |
| `.github/workflows/` | Application/Definition CI, scheduled update, production Pages |
| `mock/` | Historical reference; production does not import its pricing/UI code |

## Data and pricing

- Active: `20261003T195959Z-2abe18f7`; previous: `20261004-initial`.
- AWS Public Price List, Tokyo, USD On-Demand. Per-source versions/publications and supported meters are in [PRICE_SOURCES.md](PRICE_SOURCES.md).
- Full AWS regional source candidate: all five Service coverage reports have `unresolved=0` and zero validation ERRORs.
- 2,491 reachable selector/component resolutions and 11 independent raw semantic Golden cases pass.
- Published products/indexes contain only validated mapped branches, about 5.5 MB per build. Raw bulk sources are temporary and not committed.
- Source metadata and Definition/normalizer fingerprint jointly determine updates. Application-only CI validates active data offline; changed Definition CI validates a temporary full-source candidate without promotion.
- The real update pipeline produced a validated `PRICE_ONLY` release build. A separate promotion verified reports/checksums and retained current+previous. A following real metadata check returned `NO_CHANGE` without downloading bulk.

## Final local commands

| Check | Result |
|---|---|
| `npm test` | PASS: 30 distinct unit/integration tests; imported fixture duplicate tests consolidated |
| `npm run validate` | PASS: Definition Schema/reference/DAG/default; 2,491 Price branches; 11 Golden; manifest/resource Schema, checksum/size/identity, derived index and catalog consistency |
| `node tools/ci-validate.js` | PASS: same offline active validation, Definition fingerprint consistent |
| Full-source `validate-price-data --input .work/candidate` | PASS: complete source inventory/coverage and homogeneous category meter shapes, unresolved=0 |
| `npm run test:e2e` | PASS: 8 Chromium GUI scenarios, including narrow viewport |
| `actionlint` 1.7.12 | PASS: all three workflows |
| `npm run build:site` | PASS: static production artifact, excludes mock/node_modules/raw/git |
| `git diff --check` | PASS |
| Core / Definition architecture inspection | PASS: no service-name pricing branches, arbitrary expressions, SKU/rateCode query dependencies, or Core I/O |

E2E expected prices come from the independent raw semantic verifier and curated AWS evidence, so ordinary price-only updates do not leave fixed mock/obsolete amounts in acceptance tests. JSON restore and downloads are exercised through the GUI. Failure/stale/latency tests inject Browser transport faults and verify visible results; internal localStorage edits are not acceptance evidence.

## Requested final scenarios

| # | Scenario | Evidence / result |
|---|---|---|
| 1–4 | New Project, first Plan, real EC2, multiple services | GUI E2E PASS |
| 5–8 | Duplicate, replace, selector/usage change, total/delta | GUI E2E and independent state/decimal tests PASS |
| 9–10 | Service/Plan delete, final Plan protection | GUI E2E PASS |
| 11 | localStorage resume | GUI reload E2E PASS |
| 12–14 | JSON export/restore, different saved build | GUI download/paste/restore/report/recalculation PASS |
| 15 | Invalid selector requires reselection | Parent OS change and pasted invalid instance type, no replacement; GUI PASS |
| 16–17 | Price fetch failure; incomplete subtotal | Source-scoped fault, other Service ready, subtotal/count, explicit retry; GUI PASS |
| 18–19 | PDF+JSON, CSV | Actual GUI downloads PASS; Japanese font-embedded PDF generation/readback and exact CSV/risk tests PASS |
| 20 | PRICE_ONLY | Real source→candidate→Golden→classification→build→separate promotion PASS; fixture rate changes PASS |
| 21 | STRUCTURE_WARNING | New safe SKU/selector structure classification and verified promotion/retention fixture PASS |
| 22 | STRUCTURE_BREAKING | Ambiguous/missing SKU/unit and heterogeneous dimension tests; publish rejection leaves active manifest byte-identical PASS |

Additional hardening: disabled input DAG strips inactive saved values; optional Component retains saved inputs; tab build pinning, concurrent fetch dedupe, stale cached price, corrupted checksum and concurrent publication rejection; opaque stable ID escaping; malformed Region requires explicit repair; catalog search/filter/cancel; mobile Drawer visible within viewport.

## Workflows and publication

- `ci.yml`: push/PR, npm ci, unit/integration, active or temporary Definition candidate validation, Browser E2E, static artifact/report.
- `price-update.yml`: daily 02:23 UTC and dispatch; `pricing-update` concurrency; metadata→download→normalize→inventory→Definition→price→Golden→classification→immutable build; reports/candidate artifacts; permission-separated publication/bot commit; reusable Pages deployment.
- `pages.yml`: main push/dispatch/reusable; validation and production static artifact. Manifest promotion is the logical publication commit point; build success alone never promotes.
- Live Actions/Pages confirmation will be recorded after final push. Local implementation and all checks above pass.

## Known specified limits

Tokyo only; supported meters listed in PRICE_SOURCES.md; discounts/tax/RI/Savings Plans/Spot/Free Tier deduction excluded; no tier integration; aggregate billing cannot reconstruct event histories. Uncomputed transfer/CPU-credit/backup/Extended Support/etc. charges carry the applicable declared warnings. Unknown/future configuration is retained for partial restore; unsupported future schema versions without explicit migration are fatal. Old mock configurations are retained as opaque legacy data and require explicit Service replacement, without guessing pricing settings.

There are no outstanding specification conflicts or locally deferred implementation items.

## Reviewable commits

| Phase | Commit | Main change |
|---|---|---|
| 1 | `bfec70f` | ESM, Decimal, Schema and strict primitives |
| 2 | `2313b1e` | Deterministic shared Pricing Core |
| 3 | `bf592b7` | Package/reference/DAG validation and CLI |
| 4 | `5e06bcd` | Metadata/version-pinned acquisition and normalization/index/inventory |
| 5 | `f523460` | Semantic/independent Golden/drift/immutable build |
| 6 | `cb5753a` | Browser stores, pinning/cache and derived catalog |
| 7 | `65df9d5` | Five real services, exhaustive coverage and first build |
| 8 | `a6bb4d3` | Production comparison UI |
| 9 | `9a1e55c` | Safe restore and real Japanese PDF+JSON/CSV |
| 10 | `15f29c6` | Automated update/promotion and production Pages |
| UAT integration | `babe7a8` | Preserve remote UAT design additions |
| 11 | `Phase 11: harden final flows and verify release price publication` | Final hardening/E2E, Definition update detection, verified release build, docs alignment |
