# Amazon Redshift — official UI contract and onboarding evidence

- Reference: https://calculator.aws/#/createCalculator/Redshift
- Evidence: two user-supplied Japanese AWS Pricing Calculator screenshots (2026-10-12), one with **Redshift** selected and one with **Redshift Serverless** selected.
- Region shown: アジアパシフィック (東京).
- Status: **UI contract captured; NOT an implemented or published service.** Do not treat this document as a completed onboarding.
- Independent acceptance baseline: this inventory is derived from the screenshots, **not** from any Service Definition or Pricing Component. Never relax expected UI fields merely to match an implementation.
- Pricing semantics reference: https://aws.amazon.com/jp/redshift/pricing/ and https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing.html
- The screenshots establish initial visible states only. Dropdown alternatives and unshown conditional fields require independent interactive verification before claiming full visual parity.

## Shared inputs

1. 説明 (optional, common service description).
2. ロケーションタイプを選択: リージョン.
3. リージョンを選択: アジアパシフィック (東京) in supplied captures. Region should use the project's common region control, not a duplicate service-specific region input.
4. One mutually exclusive mode selector: **Redshift** / **Redshift Serverless**.

Only the active mode's fields may be visible. No pricing-component-internal or duplicated quantity inputs may appear.

## Mode A: Redshift (provisioned)

Section **Redshift インスタンスの選択**, in visible order:

1. ノード: numeric, screenshot default **1**.
2. Instance selection/search: screenshot chosen **dc2.8xlarge** and shows **vCPU: 32**, **Memory: 244 GiB**. This must be a selector with information display, not multiple independent CPU/memory billing inputs.
3. 使用状況 (オンデマンドのみ): screenshot **100**, associated unit selector **%utilized/Month**. The utilization and unit controls are one logical input group and must not repeat per internal billing component.
4. 価格モデル: **OnDemand**. Per the project's fixed On-Demand policy, no Reserved/Spot/commitment alternatives need be exposed; a redundant purchase-plan selector may be omitted.
5. Calculation display is output, not input.

Section **追加のバックアップストレージ**:
- 追加のバックアップストレージ: one numeric input (empty in screenshot), adjacent unit **GB**.

Section **Redshift Spectrum**:
- スキャンしたデータ: one numeric input (empty), adjacent unit **TB**.

Section **Redshift マネージドストレージ**:
- マネージドストレージサイズ: one numeric input (empty), adjacent unit **GB**.
- Helper text indicates use for instances using managed storage; availability/charging must be conditional on actual node family. Spectrum scanning is separately billed for RA3/DC2 but included in RG and Serverless compute (AWS management guide); inspect official dynamic visibility when selecting RG.

Section **Redshift Data Transfer**:
- 特定の宛先へのデータ転送 (IN): one numeric input (empty), adjacent unit **GB**.

## Mode B: Redshift Serverless

Section **Redshift Serverless**, visible in this order:

1. Advisory sizing table (**non-interactive**): Small 4–64 RPU; Medium 64–128 RPU; Large 128–256 RPU; Extra Large 256–1024 RPU (values transcribed from supplied screenshot, and require verifying against live official UI when updating).
2. ワークロードのサイズ: selector, screenshot **Medium**.
3. ベース RPU: selector, screenshot **128**. The workload sizing selector may influence this value; dependency needs interactive verification.
4. 想定される1日あたりのランタイム (時間): one numeric input, screenshot **1**.
5. Calculation display is output, not input.

Section **追加のバックアップストレージ**:
- 追加のバックアップストレージ: one numeric input (empty), unit **GB**.

Section **Redshift マネージドストレージ**:
- マネージドストレージサイズ: one numeric input (empty), unit **GB**.

Section **Redshift Data Transfer**:
- 特定の宛先へのデータ転送 (IN): one numeric input (empty), unit **GB**.

**Redshift Spectrum section must not be visible in Serverless mode.** For provisioned RG nodes, do not apply a second Spectrum charge (and confirm official UI conditional visibility). AWS states Serverless data-lake queries are included in RPU compute; do not charge a second Spectrum meter. https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing.html

## Independent visibility assertions

- When **Redshift** is selected: exactly one node input, one instance selector, one utilization group, one backup quantity, one Spectrum scan quantity, one managed storage quantity, one data transfer IN quantity; **no** Serverless workload size, base RPU, or per-day runtime fields.
- When **Redshift Serverless** is selected: exactly one workload size selector, one base RPU selector, one daily runtime input, one backup quantity, one managed storage quantity, one transfer IN quantity; **no** provisioned instance/node/utilization inputs and **no** Spectrum section.
- Neither state may display a pricing-internal duplicate of any logical quantity.
- Switching modes must render only the applicable field set. Verify preservation of entered values when switching modes against official behavior rather than assuming it.
- Test actual *visibility*, not just presence in DOM; derive expected sets from this contract rather than generating them from the Definition.
- Validate section ordering, label text, units, defaults, and output recomputation.
- Test instance family dependence of managed-storage billing and numeric unit switching.

## Pricing work required prior to a ready PR

Individually investigate real AWS Public Price List products, dimensions, units and region availability for: provisioned node compute by node type; provisioned extra backup storage; provisioned Spectrum scanned TB; managed storage GB-month; data transfer IN (including whether an IN meter is free or from a distinct AWSDataTransfer price source); Serverless RPU-hours; Serverless extra backup; Serverless managed storage. Create deterministic service-specific mappings with cardinality/unit checks. Do not use displayed dollar values from the screenshot as persisted prices.

- Serverless compute is charged for RPU-hours on a per-second basis with a minimum 60-second charge; the screenshot's daily runtime input is an estimate and should be converted to a monthly figure using a documented calendar convention: https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing.html
- Redshift managed storage is billed separately by GB-month: https://aws.amazon.com/jp/redshift/pricing/
- Serverless Spectrum is included in compute: https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing.html
- The project's On-Demand-only policy excludes commitment/reservation and upfront choices.

## Release gate

Do **not** apply `onboarding-ready` until: both modes implemented; Public Price List semantic mapping verified; coverage and golden cases present; Japanese label catalog and existing impacted tests updated; narrow tests and visibility E2E pass; repository validation passes. Complete only after queue promotion, Price DB publish and GitHub Pages checks according to `AGENTS.md` and `docs/SERVICE_ONBOARDING.md`.

## Unverified items

Dropdown full option inventories, range/step constraints, instance search UI, mode-switch persistence, time-unit alternatives, managed-storage dependency details, and the actual AWS SKU/dimension cardinalities remain unverified. None of these may be declared tested or silently inferred from the screenshot.
