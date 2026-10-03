# Pricing Architecture Specification — Decision 42

最終更新: 2026-10-04

本書は既存の Pricing Architecture Specification 群の続編として、Decision Bundle 42で確定した Price Update Workflow の GitHub Actions 構成を定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Workflow全体構成

Price Update Workflowは単一の巨大処理ではなく、責務ごとの段階的jobへ分割する。

```text
check-source
-> download
-> normalize
-> inventory
-> validate-definitions
-> validate-price-data
-> run-golden
-> classify-change
-> build-price-db
-> publish
```

生成途中のcandidateはactive Price DBとは分離して扱う。

---

## 2. check-source

AWS Public Price List側のmetadata / version / publication dateを確認する。

変更が無い場合は`NO_CHANGE`として正常終了し、巨大なPrice List本体を取得しない。

---

## 3. download

変更が確認された`serviceCode`だけraw Price Listを取得する。

初期対象regionは原則`ap-northeast-1`とする。

raw JSONはGitHub Actions runner上の一時データとして扱い、repositoryへcommitしない。

将来複数regionへ拡張する場合はmatrix化可能とする。

---

## 4. normalize

raw AWS Price Listを、既定のscope filterおよびnormalization ruleへ通し、candidate Price Dataを生成する。

```text
raw AWS Price List
-> scope filter
-> Product normalization
-> On-Demand Term normalization
-> candidate products.json
```

Reserved Instances / Savings Plans / Spot等、本ツールの対象外と確定した料金体系はこの段階以前またはこの段階で除外する。

---

## 5. inventory

正規化済みPrice Dataからdetected pricing category inventoryを生成する。

同時に、`rawUsageType -> usageTypeClass`等のnormalizer traceを生成する。

inventoryおよびtraceは主にCI解析用artifactとし、通常のPrice DB runtime dataとは分離する。

---

## 6. validate-definitions

Service Definition validationのLayer 1〜2を実行する。

対象例:

- JSON Schema
- file / ID consistency
- Profile / Component参照
- `valueFrom`参照
- default値
- dependency DAG
- package completeness

Price Dataに依存しない静的ERRORが存在する場合は失敗とし、後続の料金意味検証へ進めないことを許容する。

---

## 7. validate-price-data

Service Definition validationのLayer 3を実行する。

対象例:

- `serviceCode`存在確認
- selector attribute存在確認
- Price Query `singleSku`
- Price Dimension resolution
- unit整合性
- Pricing Limitation
- coverage
- unmapped pricing category

代表的ERROR:

- `SKU_NOT_FOUND`
- `AMBIGUOUS_SKU`
- `PRICE_DIMENSION_NOT_FOUND`
- `AMBIGUOUS_PRICE_DIMENSION`
- `UNIT_MISMATCH`
- `UNMAPPED_PRICING_CATEGORY`

---

## 8. run-golden

Decision 30で定義したStructure GoldenおよびPrice Verificationを実行する。

概念上、actualとexpectedは独立経路から取得する。

```text
Definition -> Pricing Engine -> actual
raw Price List verifier -> expected
```

Definitionと同一ロジックをexpected生成へ流用して自己整合だけでPASSする構成は禁止する。

---

## 9. classify-change

現在activeなPrice DB buildとcandidateを比較し、Decision 31の分類へ落とす。

- `PRICE_ONLY`
- `STRUCTURE_WARNING`
- `STRUCTURE_BREAKING`

例:

```text
pricePerUnitのみ変更
-> PRICE_ONLY

新selector value / instance type追加
-> STRUCTURE_WARNING

unit変更 / singleSku崩壊 /異種paid dimension増加
-> STRUCTURE_BREAKING
```

同時にrate diff summaryを生成する。

大幅な価格変動はwarningとして報告可能だが、価格変動率だけを理由にpublishをblockしない。

---

## 10. build-price-db

全validation後に正式candidate buildをstagingへ生成する。

例:

```text
staging/<buildId>/
  build-manifest.json
  sources/...
  indexes/...
```

ここで少なくとも以下を確定する。

- `buildId`
- source metadata
- checksums
- file sizes
- normalized runtime files

この時点では`manifest.json.activeBuildId`を変更しない。

---

## 11. publish条件

publish可能条件は以下とする。

```text
validation ERROR = 0
AND
change class is PRICE_ONLY or STRUCTURE_WARNING
```

`STRUCTURE_BREAKING`の場合はcandidate生成に成功していてもpublishしない。

```text
candidate generation success != publish success
```

を明確に区別する。

---

## 12. publish順序

publishはDecision 32のcommit point仕様に従う。

```text
1. builds/<newBuildId>/ 配置
2. build retention整理
3. manifest.jsonのactiveBuildId更新
4. generated data commit
5. GitHub Pages deploy
```

`manifest.json`更新を論理的publish pointとする。

---

## 13. STRUCTURE_BREAKING時

`STRUCTURE_BREAKING`では`manifest.json`を変更しない。

現在のvalid active buildを維持し、failed candidateをruntime Price DBとして公開しない。

これによりlast-good buildを維持する。

---

## 14. CI artifacts

各段階の詳細解析結果はActions artifactとして保持する。

初期候補:

- `source-metadata.json`
- `normalization-report.json`
- `category-inventory.json`
- `coverage-report.json`
- `definition-validation.json`
- `golden-report.json`
- `change-classification.json`
- `rate-diff.json`

これらはPrice DB本体とは分離し、通常runtimeから参照しない。

---

## 15. GitHub Actions Job Summary

Actions画面だけで更新結果を把握できるSummaryを生成する。

少なくとも以下を表示する。

- changed / unchanged serviceCode
- validation Layer結果
- mapped / ignored / unresolved category数
- change classification
- selector value等の構造追加
- 主要rate diff
- publish結果
- new buildId

---

## 16. job間データ受け渡し

大きなPrice DataやreportはGitHub Actions artifactでjob間受け渡しを行う。

job outputは以下のような小さいmetadataに限定する。

- buildId
- changed flag
- classification
- error count
- publish allowed flag

巨大JSONをjob outputへ載せない。

---

## 17. concurrency

Price Update Workflowは同時に複数publish処理を走らせない。

単一concurrency group（例:`pricing-update`）を利用し、manifestやgenerated buildの競合更新を防ぐ。

---

## 18. trigger

正式Price Update Workflowは最低限以下を持つ。

- scheduled trigger
- `workflow_dispatch`

Definition変更PRの検証Workflowとは分離する。

---

## 19. Definition PR CIとの分離

Service追加・変更PRでは少なくとも以下を実行する。

- Schema validation
- Reference / dependency validation
- temporary Price DBによるsemantic validation
- coverage validation
- Golden Case

ただしPR CIでは`pricing/generated/manifest.json`のactive buildを更新しない。

正式Price DBのpublishはmerge後のPrice Update Workflowが担当する。

---

## 20. generated data commit

正式Price DB更新commitはGitHub Actions botにより作成する。

Definition変更commitとgenerated Price DB更新commitを可能な限り分離し、履歴上の責務を明確にする。

---

## 21. 本Decisionで確定する事項

1. Price Update Workflowを段階的jobへ分割する。
2. 最初にsource metadataを確認し、変更が無ければdownloadしない。
3. raw Price Listはrunner一時領域だけで扱う。
4. normalizationとcategory inventory生成を分離する。
5. Definition Layer 1〜2 validationをPrice Data semantic validationより先に行う。
6. Price Data semantic validationを独立jobにする。
7. Golden validationを独立jobにする。
8. candidateを`PRICE_ONLY / STRUCTURE_WARNING / STRUCTURE_BREAKING`へ分類する。
9. rate diffをchange classification段階で生成する。
10. validation完了後にcandidate Price DB buildを生成する。
11. `STRUCTURE_BREAKING`はpublishしない。
12. Breaking時は既存active buildを維持する。
13. 詳細reportはActions artifactとして保持する。
14. 人間向けJob Summaryを生成する。
15. job間の大容量データはartifactで渡す。
16. Price Update Workflowへconcurrency制御を入れる。
17. scheduled / manual triggerを持つ。
18. Definition PR CIとPrice DB publish Workflowを分離する。
19. PR CIはactive manifestを更新しない。
20. generated Price DB更新はbot commitとする。
