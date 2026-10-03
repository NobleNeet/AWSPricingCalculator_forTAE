# AWSPricingCalculator_forTAE 実装計画

最終更新: 2026-10-04

本書は `docs/SPEC.md` および `docs/PRICING_ARCHITECTURE.md` を実装へ落とすための計画書である。

最終的な実装指示は Codex CLI に `/goal` で渡す前提とする。

本書は仕様の正本ではない。仕様と矛盾する場合は以下を優先する。

1. `docs/SPEC.md`
2. `docs/PRICING_ARCHITECTURE.md`
3. 本書

実装中に仕様意味論、Project JSON互換性、料金計算結果、主要UIフローを変更する必要が生じた場合は、実装側で独断変更せず仕様更新へ戻る。

---

## 1. 現状

現在のアプリは静的モックであり、主な実装は `app.js` / `index.html` / `styles.css` / `onboarding.js` に集中している。

`app.js` 内には以下が混在している。

- UI state
- Project state
- mock Service 定義
- mock price
- Serviceごとの分岐
- DOM rendering
- localStorage persistence

現時点のGitHub ActionsはPages配信用workflowが中心で、Pricing Core、Service Definition、Price DB build、validator、scheduled price updateは未実装である。

したがって本実装では、既存UIを一度に全面置換せず、共通料金基盤を先に作り、その後既存モックUIを段階的に接続する。

---

## 2. 実装原則

### 2.1 仕様優先

各Phase開始時に必ず以下を読む。

- `docs/SPEC.md`
- `docs/PRICING_ARCHITECTURE.md`
- 本書の該当Phase

過去の会話や旧Decision文書を実装根拠にしない。

### 2.2 共通Coreを先に作る

料金意味論はBrowserとNode CLIで共有する。

共有対象:

- filter evaluator
- condition evaluator
- Price Query
- Dimension resolution
- Calculation DSL
- Decimal処理
- runtime issue format

Browser専用:

- DOM
- localStorage
- fetch orchestration
- PDF/CSV UI

Node専用:

- AWS Price List download
- normalization
- inventory
- validator orchestration
- filesystem
- CI report/build

### 2.3 既存モックを壊さず移行

各Phaseの途中でもPages上の既存画面が致命的に壊れないことを優先する。

mock priceから実Priceへの切替は、Pricing Coreと最低限のService Definitionが完成した後に行う。

### 2.4 1Phase 1Goalを基本とする

Codexへ巨大な `/goal` を一度だけ渡すのではなく、依存順にPhase単位で実装する。

各Phase完了時に以下を確認する。

- tests pass
- browser smoke test
- 仕様との差分なし
- 次Phaseに必要なinterfaceが固定されている

---

## 3. 推奨ディレクトリ構成

実装後の目標形:

```text
/
  index.html
  styles.css
  onboarding.js
  onboarding.css
  package.json

  src/
    app/
      app.js
      project-store.js
      ui-renderer.js
      export.js
    pricing/
      filter.js
      conditions.js
      price-query.js
      dimensions.js
      calculation.js
      decimal.js
      issues.js
    runtime/
      price-data-store.js
      definition-store.js
      catalog-loader.js

  services/
    <serviceId>/
      service.json
      profiles/
      components/
      golden/
      coverage.json
      adapter.js          # 例外時のみ

  schemas/
    service-definition/
      service.schema.json
      profile.schema.json
      component.schema.json
      golden.schema.json
      coverage.schema.json
    pricing/
      manifest.schema.json
      build-manifest.schema.json
      products.schema.json
      index.schema.json
    project.schema.json

  pricing/
    normalization/
      common.json
      services/
    limitations.json
    generated/
      manifest.json
      builds/
        <buildId>/
          build-manifest.json
          sources/
          indexes/

  tools/
    pricing-cli/
      cli.js
      commands/
        check-source.js
        download.js
        normalize.js
        inventory.js
        validate-definitions.js
        validate-price-data.js
        run-golden.js
        classify-change.js
        build.js

  tests/
    pricing/
    runtime/

  docs/
    SPEC.md
    PRICING_ARCHITECTURE.md
    IMPLEMENTATION_PLAN.md
```

実装上より単純な構成が合理的なら多少変更してよいが、Browser shared core / Node tooling / Service Definition / generated Price DB の責務境界は維持する。

---

# Phase 1 — Node / ES Modules / Schema / Shared primitives

## 目的

今後のBrowser/CLI共通基盤を作る。

## 実装内容

1. `package.json` を追加する。
2. ES Modulesを採用する。
3. test runnerを導入する。
4. Decimal libraryを導入する。
5. JSON Schema validatorを導入する。
6. `schemas/` の初期schemaを作成する。
7. shared pricing primitiveを実装する。

最低限必要なshared module:

```text
src/pricing/decimal.js
src/pricing/filter.js
src/pricing/conditions.js
src/pricing/issues.js
```

### filter evaluator

対応:

- eq
- neq
- in
- notIn
- exists
- notExists

要件:

- implicit type conversion禁止
- string case-sensitive
- `neq` はfield存在時のみ成立
- static `in/notIn`

### condition evaluator

対応:

- all
- any
- not
- leaf filter operators

### Decimal

JavaScript `Number` のみで料金計算しない。

Decimal wrapperを1箇所に閉じ込め、Browser/Node双方から同じinterfaceを使う。

## 完了条件

- `npm test` が成功する。
- filter/conditionの正常・異常・missing field testcaseがある。
- Decimalのmultiply/scale/比較が文字列入力で安定する。
- schema loaderが少なくともService/Profile/Component schemaを読める。
- 既存Pages UIが起動する。

## Codex `/goal`

```text
/goal Phase 1を実装してください。

正本仕様は docs/SPEC.md と docs/PRICING_ARCHITECTURE.md です。docs/IMPLEMENTATION_PLAN.md の Phase 1 に従ってください。

目的:
- Node.js + native ES Modules の開発基盤を追加
- package.json / test runner / JSON Schema validator / Decimal library を導入
- src/pricing/decimal.js, filter.js, conditions.js, issues.js を実装
- schemas/ の初期Service Definition schemaを追加
- shared primitiveに十分なunit testを追加

制約:
- 現在の静的モックUIを壊さない
- bundlerは導入しない
- Pricing CoreにDOM/localStorage/network依存を入れない
- 任意式評価やevalは使わない

完了時:
- 実行したテストと結果
- 追加/変更ファイル
- 仕様上の未解決事項があれば列挙
を報告してください。
```

---

# Phase 2 — Pricing Core

## 目的

Service DefinitionからPrice Dataを決定論的に料金計算できる共通Coreを完成させる。

## 実装内容

追加module:

```text
src/pricing/price-query.js
src/pricing/dimensions.js
src/pricing/calculation.js
```

### Price Query

実装順:

```text
products
-> productFilters
-> singleSku cardinality
-> On-Demand Term
-> dimensionFilters
-> Dimension policy
```

必須エラー:

- SKU_NOT_FOUND
- AMBIGUOUS_SKU
- PRICE_DIMENSION_NOT_FOUND
- AMBIGUOUS_PRICE_DIMENSION
- UNIT_MISMATCH

### Dimension policy

- free allowanceを信頼して識別できる場合のみ除外
- tierは段階計算しない
- base paid tierを全usageに適用
- 異種paid dimensions複数はERROR

### Calculation DSL

正式model:

```text
unit
```

usage:

- sources
- combine=multiply

transforms:

- minimum
- increment
- rounding: ceil
- scale
- unitConversion

順序付きで適用する。

### 結果object

最低限:

```text
rawUsage
billingQuantity
billingUnit
unitPriceUsd
amountUsd
issues
```

## 完了条件

- Pricing CoreがDOM/network/filesystemに依存しない。
- Price Query cardinality failure testcaseがある。
- tier/free allowance policy testcaseがある。
- transform順序 testcaseがある。
- Decimalで途中丸めしない。
- outputUnit mismatchを検出する。

## Codex `/goal`

```text
/goal Phase 2を実装してください。

正本仕様は docs/SPEC.md と docs/PRICING_ARCHITECTURE.md、実装順は docs/IMPLEMENTATION_PLAN.md Phase 2 です。

目的:
- shared Pricing Coreとして Price Query / Dimension resolution / Calculation DSL を実装
- singleSkuを厳格に守る
- Free Tierは無視、Tierはbase paid rateを全usageに適用
- 異種paid dimensionsは自動合算しない
- Decimalで途中丸めしない

制約:
- Pricing Coreはpureに近いmoduleとし、fetch/DOM/localStorage/fsを使わない
- fallback SKUやfuzzy matchingを実装しない
- tiered modelを追加しない

十分なunit testを追加し、完了時にテスト結果と仕様差分有無を報告してください。
```

---

# Phase 3 — Service Definition package / Validator / CLI skeleton

## 目的

Definitionを機械検証でき、新Serviceをデータ追加として扱える基盤を作る。

## 実装内容

1. `services/` package loader
2. Definition JSON Schema
3. Reference validation
4. dependency DAG validation
5. CLI entry point
6. machine-readable report envelope

CLI基本command:

```text
validate-definitions
validate-price-data
run-golden
normalize
inventory
classify-change
build
check-source
download
```

このPhaseでは未実装commandが明示的に`not implemented`でもよいが、CLI command routingとreport interfaceは固定する。

### report envelope

```json
{
  "schemaVersion": 1,
  "command": "validate-definitions",
  "status": "passed",
  "summary": {
    "info": 0,
    "warning": 0,
    "error": 0
  },
  "issues": []
}
```

exit code:

```text
0 success / warnings only
1 validation error
2 tool/input/environment failure
```

### validate-definitions

検証:

- schema
- file name / ID一致
- service -> profile
- profile -> component
- duplicate input ID
- valueFrom refs
- enabledWhen/options filters dependency cycles
- package外参照
- invalid default
- orphan Definition

## 完了条件

- 正常なfixture packageがPASSする。
- broken fixture群が安定したissue codeでFAILする。
- CLI JSON reportがCIから機械利用可能。
- validation logicがGitHub Actions YAMLへ埋め込まれていない。

## Codex `/goal`

```text
/goal Phase 3を実装してください。

正本仕様は docs/SPEC.md / docs/PRICING_ARCHITECTURE.md、実装計画は docs/IMPLEMENTATION_PLAN.md Phase 3 です。

目的:
- Service Definition package loaderとJSON Schemaを完成
- Layer 1-2 validationを実装
- tools/pricing-cli の共通CLI基盤を作成
- machine-readable report envelope / stable issue code / exit codeを実装

このPhaseではAWS downloadや正式Price DB buildを完成させなくて構いません。CLI interfaceを壊さない形でstub可能です。

テストfixtureを用意し、正常/参照切れ/循環/duplicate/default不正等を検証してください。
```

---

# Phase 4 — AWS Price List normalization / index / inventory / coverage

## 目的

AWS Public Price List JSONを正式なnormalized Price DB candidateへ変換する。

## 実装内容

### download/check-source

- AWS source metadataを先に確認
- 変更なしなら巨大sourceを取得しない
- raw sourceはworking tempのみ

### normalize

出力:

```text
products.json
index.json
```

requirements:

- On-Demandのみ
- Product + current On-Demand Term + Price Dimensions
- decimal/rangeは文字列維持
- productFamily/operation/usageTypeをtop-level normalized fieldへ
- Reserved/Savings Plans/Spot除外
- multiple active On-Demand TermはERROR

### index

基本:

```text
attribute -> distinct values
```

- productsから自動生成
- deterministic stable sort
- UI pricing truthにはしない

### normalizer

```text
generic rules
-> serviceCode-specific bounded declarative rules
```

禁止:

- arbitrary JS
- heuristic fuzzy grouping

### inventory / coverage

category identity:

```text
productFamily
operation
usageTypeClass
unit
discriminators
```

coverage status:

```text
mapped
ignored
unresolved
```

unmapped paid categoryは `UNMAPPED_PRICING_CATEGORY`。

## 完了条件

- fixture/raw sampleからdeterministicなproducts/indexが生成される。
- 同一入力の再生成diffがない。
- inventory traceで rawUsageType -> usageTypeClass が確認できる。
- coverage unmatchedを検出できる。
- raw巨大JSONをrepoへcommitしない。

## Codex `/goal`

```text
/goal Phase 4を実装してください。

正本仕様は docs/PRICING_ARCHITECTURE.md、実装計画は docs/IMPLEMENTATION_PLAN.md Phase 4 です。

目的:
- AWS Public Price Listのcheck-source/download/normalize
- normalized products.json / index.json
- usageTypeClass normalizer
- category inventory / coverage validation
を実装してください。

重要:
- On-Demandのみ
- normalizerはbounded declarative ruleのみ
- fuzzy matching禁止
- raw sourceをcommitしない
- output deterministic

AWSへの実通信部分とfixtureベースのtestを分離し、CIでnetworkなしでも主要ロジックを検証できるようにしてください。
```

---

# Phase 5 — Golden / semantic validation / drift classification / Price DB build

## 目的

candidate Price Dataを公開可能か判定できる状態にする。

## 実装内容

### validate-price-data

検証:

- serviceCode exists
- selector attribute exists
- reachable selector branches
- singleSku
- Dimension resolution
- outputUnit
- limitation consistency
- coverage unresolved

### Golden

2種類を分離する。

```text
Structure Golden
Independent Price Verification
```

Production Pricing Coreとexpected verifierの同一実装共有は禁止する。

### classify-change

分類:

- PRICE_ONLY
- STRUCTURE_WARNING
- STRUCTURE_BREAKING

breaking時はpublish不可。

### build

出力:

```text
pricing/generated/builds/<buildId>/
  build-manifest.json
  sources/<serviceCode>/<region>/products.json
  indexes/<serviceCode>/<region>/index.json
```

`manifest.json` はbuild commandでは切り替えない。

## 完了条件

- invalid candidateがbuild/publish候補にならない。
- price-only diffとstructure breakをfixtureで分類できる。
- Golden verifierがproduction resolverへ単純委譲していない。
- buildId付きimmutable directoryが生成される。
- build-manifestにsource metadata/checksum/size等が入る。

## Codex `/goal`

```text
/goal Phase 5を実装してください。

正本仕様は docs/PRICING_ARCHITECTURE.md、計画は docs/IMPLEMENTATION_PLAN.md Phase 5 です。

目的:
- Layer 3 validation
- Golden runner + independent verifier
- PRICE_ONLY / STRUCTURE_WARNING / STRUCTURE_BREAKING classification
- immutable Price DB build generation
を完成してください。

制約:
- STRUCTURE_BREAKINGはpublish不可
- build commandはactive manifestを変更しない
- Golden expected pathをproduction Pricing Coreと同一実装にしない

fixtureベースでprice-only、new selector、unit change、ambiguous SKU、tier change等を検証してください。
```

---

# Phase 6 — Browser PriceDataStore / DefinitionStore / Catalog

## 目的

静的Browser appからDefinitionとPrice DBを安全にlazy loadできるようにする。

## 実装内容

### PriceDataStore

1タブ1instance。

cache key:

```text
buildId + serviceCode + region
```

実装:

- manifest load
- active build pin
- build-manifest validation
- products/index別cache
- in-flight Promise dedupe
- retry
- per-resource status

### DefinitionStore

実装:

- Catalog load
- service/profile/component lazy load
- memory cache
- Promise dedupe
- lightweight runtime validation

### Catalog

CI/buildでservice.jsonから自動生成する。

手書きservice listを正本にしない。

## 完了条件

- 同じEC2を複数追加しても同一products fetchは1回。
- 同一タブでmanifestが更新されてもbuildを乗り換えない。
- ページ再読込で新active buildを採用できる。
- serviceCode/region単位のfailureが他serviceを止めない。
- localStorage/IndexedDBへPrice DBを永続保存しない。

## Codex `/goal`

```text
/goal Phase 6を実装してください。

正本仕様は docs/PRICING_ARCHITECTURE.md、計画は docs/IMPLEMENTATION_PLAN.md Phase 6 です。

目的:
- Browser PriceDataStore
- DefinitionStore
- generated Service Catalog
を実装してください。

重要:
- 1タブ内build pinning
- products/index lazy load
- in-flight Promise dedupe
- Price DBをlocalStorage/IndexedDBへ保存しない
- Pricing Coreはfetchしない

network fetchはmock可能なinterfaceにしてunit test可能にしてください。
```

---

# Phase 7 — 最初の実Service Definition群

## 目的

generic DSLが異なる料金タイプへ対応できることを少数サービスで検証する。

## 推奨対象

最低限、性質の異なる以下を選ぶ。

```text
EC2
EBS
S3
Lambda
RDS または Aurora
```

理由:

- EC2: 時間 × 数量 + 多数selector
- EBS: 容量課金
- S3: 複数課金Component
- Lambda: request / duration系
- RDS/Aurora: Profile/Component依存

各Serviceで必要:

- service.json
- profiles
- components
- coverage.json
- golden cases
- limitations

`unresolved = 0` を完成条件とする。

## 完了条件

- 全Definition schema PASS。
- representative selector branchがsingleSku。
- Golden PASS。
- coverage unresolved = 0。
- adapterなしで表現できるものはadapterを使わない。

## Codex `/goal`

```text
/goal Phase 7を実装してください。

docs/PRICING_ARCHITECTURE.md と docs/IMPLEMENTATION_PLAN.md Phase 7 に従い、最初の実Service Definition群を追加してください。

対象候補:
EC2, EBS, S3, Lambda, RDSまたはAurora

各ServiceについてAWS Public Price Listを分析し、必要に応じて公式Pricing/Documentation/Calculator UIを補助情報として確認してください。

要件:
- mapped / ignored / unresolved inventoryを明示
- unresolved=0
- Golden PASS
- singleSku
- Pricing Limitationを明示
- generic DSLで表現可能ならadapterを使わない

Serviceごとに解析結果とcoverage summaryを報告してください。
```

---

# Phase 8 — 既存UIを実料金基盤へ接続

## 目的

現在のmock `serviceDefs` / `priceForCell()` 等を段階的にDefinition駆動へ置換する。

## 実装内容

### Project state移行

仕様上のnormalized Project JSONへ内部stateを移す。

```text
project
plans
rows
serviceInstances
```

stable IDとorderを分離する。

### Service add/edit

現在のhardcoded Service分岐から、以下へ切り替える。

```text
Catalog
-> Definition
-> generic input renderer
-> Pricing Core
```

### Runtime state UI

表示:

- loading
- ready
- warning
- unavailable
- invalid
- stale
- 要再選択

### total

未計算を含む場合:

```text
Calculated subtotal
+ uncalculated count
```

完全totalとして見せない。

### migration

既存localStorage mock dataは、可能なら一度だけbest-effort migrationする。

ただし意味を推測したSKU置換はしない。

## 完了条件

- mock monthly priceに依存せず実Price Dataで主要Serviceを計算する。
- Service固有`if (service === ...)`による料金計算を撤去する。
- Plan duplicate/delete/row replace等、既存主要UXが維持される。
- invalid/unavailableでもProject編集/保存可能。
- current Project JSON export/importがschema validationを通る。

## Codex `/goal`

```text
/goal Phase 8を実装してください。

既存UIモックを、docs/SPEC.md と docs/PRICING_ARCHITECTURE.md に従うDefinition/Price DB駆動へ移行してください。

docs/IMPLEMENTATION_PLAN.md Phase 8 を実装範囲とします。

重要:
- 既存のPlan追加/複製/削除、Row比較、Drawer編集UXを維持
- mock serviceDefsとpriceForCellによる料金計算を置換
- generic Definition rendererを使用
- runtime loading/warning/unavailable/invalid/staleを反映
- 未計算項目をtotalへ0円として黙って加算しない
- Project stateをnormalized modelへ移行

E2E smoke testも追加してください。
```

---

# Phase 9 — Project restore / PDF / CSV / limitations

## 目的

ユーザー向け完成機能を正式データモデルへ接続する。

## 実装内容

### Restore

- JSON parse
- schema migration
- semantic validation
- partial restore
- Restore Report
- unknown/unresolved data preserve

### PDF

必須:

- Plan totals/subtotals
- Component/Service breakdown
- publicationDate
- limitations
- underestimate warnings
- uncalculated items

PDF実行時にProject JSONも同時exportする。

### CSV

最低限:

- Plan
- Row
- Service
- Component
- raw monthly USD
- display monthly USD
- limitation IDs
- has_underestimate_risk

## 完了条件

- fatal restoreで現在Projectを破壊しない。
- warning/invalidを含むpartial restoreが可能。
- Project JSON round-tripで未知field dataを可能な限り保持。
- PDF/CSVがmock priceを参照しない。

## Codex `/goal`

```text
/goal Phase 9を実装してください。

正本仕様 docs/SPEC.md / docs/PRICING_ARCHITECTURE.md と docs/IMPLEMENTATION_PLAN.md Phase 9 に従ってください。

目的:
- Project JSON schema migration/semantic restore/Restore Report
- PDF + Project JSON同時export
- CSV export
- Pricing Limitation表示/出力
を完成してください。

fatal import時は現在Projectを変更せず、未知Service等はpartial restoreできる設計を守ってください。
```

---

# Phase 10 — GitHub Actions / publish

## 目的

Definition PR検証とscheduled Price Updateを自動化する。

## Workflow A: Definition / Application CI

trigger:

```text
push
pull_request
```

主処理:

```text
npm ci
npm test
validate-definitions
必要なPrice Dataでvalidate-price-data
run-golden
```

新serviceCode追加PRでは一時Price Listを取得してよい。

正式generated Price DBをPRからcommitしない。

## Workflow B: Price Update

trigger:

```text
schedule
workflow_dispatch
```

concurrency:

```text
pricing-update
```

job概念:

```text
check-source
-> download
-> normalize
-> inventory
-> validate-definitions
-> validate-price-data
-> run-golden
-> classify-change
-> build
-> publish
```

publish条件:

```text
validation error = 0
classification != STRUCTURE_BREAKING
```

publish順:

```text
builds/<newBuildId>/ commit
-> retention整理
-> manifest activeBuildId更新
-> commit
-> Pages deploy
```

manifest更新がlogical commit point。

## 完了条件

- scheduled workflowが同時実行しない。
- NO_CHANGE時は不要downloadしない。
- STRUCTURE_BREAKINGでactive manifestを変更しない。
- current + previous build retention。
- Job Summaryにvalidation/coverage/change/rate diffを表示。

## Codex `/goal`

```text
/goal Phase 10を実装してください。

現在のPages workflowを前提に、docs/PRICING_ARCHITECTURE.md と docs/IMPLEMENTATION_PLAN.md Phase 10 に従ってCI/CDを追加・整理してください。

必要:
1. Application/Definition PR CI
2. scheduled + workflow_dispatch Price Update
3. pricing-update concurrency
4. artifact受け渡し
5. validation/golden/change classification
6. immutable build generation
7. manifest promotion
8. current+previous retention
9. Actions Job Summary

STRUCTURE_BREAKINGまたはvalidation ERROR時にactive buildを変更しないことを必ずテスト可能な形で実装してください。
```

---

# Phase 11 — End-to-End verification / hardening

## 目的

ユーザー操作からPrice Updateまで通した完成検証を行う。

## E2Eシナリオ

最低限:

1. 0 Plan -> 最初のPlan作成
2. EC2追加 -> selector選択 -> 実料金表示
3. S3/RDS追加
4. Plan複製
5. RDS -> Aurora等の置換
6. input変更 -> total/delta更新
7. Service削除
8. Plan削除
9. Project JSON export/import
10. 保存時と異なるPrice buildでrestore
11. invalid selector -> 要再選択
12. Price resource fetch failure -> unavailable
13. 一部unavailable -> subtotal + uncalculated count
14. PDF + JSON export
15. CSV export
16. Price Update PRICE_ONLY
17. Price Update STRUCTURE_WARNING
18. Price Update STRUCTURE_BREAKING -> publish拒否

## 最終チェック

- Service固有料金ロジックがgeneric Core外へ漏れていないか
- hardcoded SKU/rateCode依存がないか
- arbitrary JS Definitionがないか
- silent fallbackがないか
- browser build mixingがないか
- Golden verifierがproduction pathと独立しているか
- docsと実装が一致しているか

## Codex `/goal`

```text
/goal Phase 11として、実装済みAWS見積もりツール全体のE2E検証とhardeningを実施してください。

正本は docs/SPEC.md / docs/PRICING_ARCHITECTURE.md、検証項目は docs/IMPLEMENTATION_PLAN.md Phase 11 です。

不足テストや仕様逸脱を修正し、全主要シナリオが通るところまで実施してください。

完了時は:
- 実行したテスト一覧
- PASS/FAIL
- 修正内容
- 残存する既知制約
をまとめてください。
```

---

## 4. Phase依存関係

```text
Phase 1
  ↓
Phase 2
  ↓
Phase 3
  ↓
Phase 4
  ↓
Phase 5
  ├──────────────┐
  ↓              ↓
Phase 6        Phase 7
  └──────┬───────┘
         ↓
       Phase 8
         ↓
       Phase 9
         ↓
       Phase 10
         ↓
       Phase 11
```

Phase 7のService Definition作成はPhase 4〜5のtoolingが十分使える時点で開始する。

Phase 10のworkflow skeleton自体は早期に追加してもよいが、正式publishはPhase 5以降で有効化する。

---

## 5. Commit / PR単位

原則、Phaseごとに独立PRまたは独立したレビュー可能commit群とする。

推奨branch例:

```text
impl/phase-01-foundation
impl/phase-02-pricing-core
impl/phase-03-definition-cli
impl/phase-04-normalization
impl/phase-05-validation-build
impl/phase-06-runtime-loaders
impl/phase-07-service-definitions
impl/phase-08-browser-integration
impl/phase-09-export-restore
impl/phase-10-ci-pricing-update
impl/phase-11-e2e-hardening
```

Phase途中で unrelated refactorを混ぜない。

---

## 6. Codex運用ルール

### 6.1 `/goal`で毎回明記するもの

- 対象Phase
- 正本仕様ファイル
- 完了条件
- やってはいけない変更

### 6.2 Codexに任せてよいもの

仕様意味論を変えない範囲の:

- module名の細部
- helper分割
- test structure
- private internal API
- logging detail
- retry interval等の小定数

### 6.3 Codexが止まるべき条件

以下が必要なら、実装を推測で続けず仕様問題として報告する。

- Project JSON意味論変更
- Definition DSL追加/変更
- Price Query semantics変更
- Calculation semantics変更
- Free/Tier方針変更
- UI主要フロー変更
- restore fail-open/fail-closed変更
- publish consistency変更

ただし単純な実装上の選択肢についてユーザー承認待ちで停止せず、仕様範囲内で合理的な案を選んで進める。

---

## 7. 完成判定

本実装を初期リリース相当とみなす条件:

- mock price依存が主要フローから除去されている
- 対象ServiceがPublic Price Listから計算される
- Definition追加だけで通常の新Serviceを追加可能
- Price QueryがsingleSkuで決定論的に解決される
- Free Tier/Tier等の方針が仕様通り
- Project JSON restore/migrationが機能する
- PDF/CSV出力が実Priceを反映する
- Price Updateが自動実行される
- breaking changeで旧active buildを維持できる
- Golden/validationがCIで実行される
- 一部Price Data障害時も他Serviceを継続利用可能
- Pages上で主要E2Eシナリオが成立する

この条件を満たした時点で、料金基盤の初期実装を完了とする。
