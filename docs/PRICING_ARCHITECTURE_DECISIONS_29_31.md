# Pricing Architecture Specification — Decisions 29–31

最終更新: 2026-10-04

本書は `docs/PRICING_ARCHITECTURE.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_09_14.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_15_16.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_17.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_18_20.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_21_25.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_26_27.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_28.md` の続編として、Decision Bundle 29〜31で確定した新規AWSサービス追加の一気通貫ワークフロー、Golden Case設計、Price List更新差分判定を定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Decision 29 — 新規AWSサービス追加の一気通貫ワークフロー

### 1.1 基本方針

ユーザーは原則として対象サービス名だけを指定すればよい。

例:

```text
Amazon EFSを追加して
```

ChatGPT等の自動化エージェントは、以下を原則自動実行する。

```text
対象AWSサービス特定
  -> 現在のmain / 既存Definition確認
  -> AWS Public Price List特定
  -> 東京リージョン料金構造解析
  -> AWS Pricing / Docs調査
  -> AWS Pricing Calculator UI調査
  -> Service / Profile / Component分解
  -> Definition生成
  -> Golden Case生成
  -> 静的validation
  -> 一時Price DBによる実料金validation
  -> 解析レポート生成
  -> branch作成
  -> commit
  -> Pull Request作成
  -> 人間レビュー / merge
```

途中でユーザーへ質問するのは、意味的な設計判断が不可避な場合に限定する。

### 1.2 最初に現在のリポジトリを確認する

新規追加開始前に必ず現在のdefault branchを確認し、以下を取得する。

- 既存Service Definition
- Definition schema
- 類似Service
- Catalog設定
- Pricing Limitation Registry
- Golden Case形式
- CI validation仕様

過去会話や記憶だけから現行実装を推測してDefinitionを作らない。

対象Serviceが既に存在する場合は、新規追加ではなく既存Definition拡張として扱う。

### 1.3 Price Listを最初の料金正本とする

対象`serviceCode x region`のAWS Public Price Listを特定し、まず料金構造インベントリを生成する。

最低抽出項目:

- productFamily
- operation
- usagetype
- unit
- attributes
- SKU
- Price Dimension
- beginRange / endRange

この段階ではDefinitionを生成せず、料金カテゴリの網羅性確認を優先する。

### 1.4 料金構造インベントリ

Price Listの内容を意味のある料金群へ整理する。

例:

```text
Storage
  - Standard
  - Infrequent Access

Data Access
  - Read
  - Write

Throughput
  - Provisioned
```

目的は、Price Listに存在する料金項目をDefinition作成時に取りこぼさないことである。

### 1.5 Pricing / Docsで意味解釈する

Price List内の`usagetype` / `operation`等だけでは意味が不明瞭な場合、AWS公式Pricingページおよび公式ドキュメントで課金項目の意味を確認する。

情報源優先順位:

1. AWS Public Price List
2. AWS公式Pricingページ
3. AWS公式Docs
4. AWS Pricing Calculator UI

料金値の正本はPrice Listとする。

### 1.6 Pricing Calculator UIの利用目的

AWS Pricing Calculatorは以下の確認に使用する。

- ユーザー入力項目
- selector / usage inputの依存関係
- default値
- primary / advanced相当の重要度
- 説明文

DOM selector / CSS class / XPath等は成果物へ保存しない。

### 1.7 Decision 28に従ってDefinitionへ分解する

収集した料金構造を以下へ分類する。

- Service
- Profile
- Pricing Component
- selector
- usageInput
- fixedFilter
- Pricing Limitation

基本原則:

```text
1 Pricing Component = 1種類の課金メーター
```

かつ初期版では、可能な限り以下へ収束させる。

```text
1 Component
  -> singleSku
  -> single billable dimension
```

### 1.8 全料金カテゴリを分類する

Price Listの全料金カテゴリは以下のどれかに必ず分類する。

- `mapped`
- `ignored`
- `unresolved`

`ignored`には必ず理由を付与する。

例:

- Free Tier: 本ツール対象外
- Tier pricing: 段階計算対象外
- Reserved / Savings Plans: 本ツール対象外

`unresolved`が存在する状態は完成扱いにしない。

### 1.9 Definition生成

標準成果物:

```text
services/<service>/
  service.json
  profiles/*.json
  components/*.json
```

必要に応じてCatalog metadataを追加する。

共通JavaScript変更は原則避け、まずDefinition境界やgeneric DSLで表現可能か再確認する。

### 1.10 adapter候補

adapterが必要そうな場合、まず以下を再確認する。

- Component分割で解決できないか
- Profile分割で解決できないか
- selector / fixedFilter不足ではないか
- bounded transformで表現できないか

それでも必要ならPR解析レポートへ理由を記録する。

adapter使用はレビュー重要度を上げるが、PR作成自体は可能とする。

### 1.11 Golden Case生成

Definitionと同時にGolden Caseを生成する。

標準パス:

```text
tests/golden/<service>.json
```

詳細仕様はDecision 30に従う。

### 1.12 一時Price DB

新しい`serviceCode`等で正式Price DBがまだ存在しない場合、一時的にAWS Price Listを取得しtemporary Price DBを生成してvalidationへ使用する。

このtemporary Price DBはcommitしない。

正式な`pricing/generated`更新はmerge後のPrice Update Workflowが担当する。

### 1.13 validationと自動修正

PR作成前に最低限以下を検証する。

- JSON Schema
- Definition reference整合性
- Catalog整合性
- `singleSku`
- Price Dimension
- unmapped pricing category
- Pricing Limitation
- Golden Case

判定:

- `PASS`
- `WARNING`
- `ERROR`

ERROR発生時は、原因解析後に一定回数まで自動修正を許可する。

例:

```text
AMBIGUOUS_SKU
  -> fixedFilter追加
  -> selector追加
  -> Component分割
```

無限修正は禁止し、規定回数で解決しない場合は`UNRESOLVED`として残す。

### 1.14 ユーザー確認を要求する条件

原則ユーザーへ途中確認しない。

ただし以下では確認してよい。

- Service境界が本質的に曖昧
- 対象範囲の選択で実装規模・UXが大きく変わる
- generic engine自体の拡張が必要
- 既存仕様では意味的に正しい表現が不可能

### 1.15 Git運用

基本:

```text
1 service = 1 branch
```

例:

```text
service/add-efs
```

コミットは1サービス追加を1まとまりとしてよい。

例:

```text
Add Amazon EFS pricing definition
```

### 1.16 Pull Request

PRには少なくとも以下を含める。

- Service名
- Price Source / serviceCode
- Region
- Profiles
- Components
- mapped / ignored / unresolved件数
- Pricing Limitations
- adapter有無
- Golden Case件数 / coverage
- validation結果
- 調査したAWS公式情報源

例:

```text
Service: Amazon EFS
Price Source: AmazonEFS
Region: ap-northeast-1

Profiles: 1
Components: 4
Mapped categories: 8
Ignored categories: 2
Unresolved: 0
Adapter: No
Golden Cases: 6 passed
Validation: PASS
```

### 1.17 merge

自動化の終点は原則Pull Request作成までとする。

mergeは人間レビューを基本とし、Golden / CIがPASSしたことだけを理由に自動mergeしない。

merge後はPrice Update Workflowが正式Price DB生成と公開を担当する。

---

## 2. Decision 30 — Golden Case設計

### 2.1 目的

Golden Caseは最終金額だけを比較するテストではなく、料金解決経路まで検証する。

最低限以下を確認する。

```text
input
  -> expected SKU count
  -> matched semantic attributes
  -> Price Dimension
  -> Pricing Limitation
  -> billing quantity
  -> Component amount
  -> Service total
```

誤ったSKUを選んだ結果、偶然同じ単価になるような不具合を検出できるようにする。

### 2.2 SKU IDは原則固定しない

Golden期待値にAWS SKU文字列そのものを永続固定しない。

代わりに意味的属性を検証する。

例:

```text
instanceType = m7i.large
operatingSystem = Linux
tenancy = Shared
```

SKU IDは診断情報として記録してよいが、Goldenの正本にはしない。

### 2.3 Profile coverage

全Profileを最低1ケースでカバーする。

Profileが存在するということは主要料金構造が異なるため、未検証Profileを許さない。

### 2.4 Component coverage

全Pricing Componentを最低1ケースでカバーする。

Service合計だけでなく、Componentごとのbilling quantity / amountも検証する。

例:

```json
{
  "expected": {
    "components": {
      "instance": {
        "billingQuantity": "730",
        "amountUsd": "..."
      },
      "storage": {
        "billingQuantity": "100",
        "amountUsd": "..."
      }
    },
    "totalUsd": "..."
  }
}
```

### 2.5 SKU count

各Componentで`skuCount = 1`を明示的に検証する。

金額が一致していても、0件または複数SKUならFAILとする。

### 2.6 Price Dimension expectations

最低限以下を検証可能とする。

- unit
- 有料Dimension数
- range形状
- Tier / Free Tier判定
- Pricing Limitation

### 2.7 selector / usage variation

各Componentについて必要に応じて以下を用意する。

- default / representative case
- selector variation
- usage variation
- boundary case

全SKU網羅は要求しない。

基準は、料金ロジック上の各分岐を最低1回通すことである。

### 2.8 Tier Case

Tier対象Componentでは、Tier境界を超えるusageもテストする。

本ツール仕様ではTier計算をしないため、Goldenでは以下を確認する。

- first paid tier単価をusage全体へ使用
- `tier-pricing` Limitationが付与される

### 2.9 Free Tier Case

無料枠より小さいusageでも0円にならないことを確認する。

以下を検証する。

- 通常有料単価を最初から適用
- `free-tier` Limitationが付与される

### 2.10 Billing transform境界

`minimum / increment / ceil`等があるComponentでは境界値をテストする。

例:

```text
59
60
61
```

ただしDecision 23で対象外としたセッション単位イベントシミュレーションはGoldenへ持ち込まない。

### 2.11 enabledWhen

条件付きComponentではtrue / false双方をカバーする。

無効状態は単なる0円ではなく`not evaluated`等として区別する。

### 2.12 invalid / error cases

正常Goldenとは別に、代表的な異常系をテストする。

例:

- SKU 0件
- SKU複数
- 不正Dimension
- required input欠落

推奨分離:

```text
tests/golden/<service>.json
tests/invalid/<service>.json
```

### 2.13 expected価格の独立生成

Golden expected値をPricing Engine自身から生成しない。

理想構成:

```text
AWS raw Price List
  -> independent Golden verifier
  -> expected

Definition
  -> Pricing Engine
  -> actual
```

Golden verifierはDefinitionのpriceQueryをそのまま再利用しない。

### 2.14 verifierの責務

Golden verifierを第二の複雑なPricing Engineにしない。

基本責務:

- テストで指定した意味的SKU条件からraw Price Listを直接検索
- first paid tier / free tier skip等の共通簡略ルールを適用
- 単純usageと単価からexpected amountを算出

### 2.15 Decimal比較

内部金額はDecimal相当で比較する。

表示用丸めは料金計算テストと分離する。

```text
calculation correctness
!=
display formatting
```

### 2.16 Structure GoldenとPrice Verificationを分離する

Structure Goldenで固定するもの:

- Profile
- Component
- selector分岐
- SKU count
- matched semantic attributes
- unit
- Dimension構造
- Limitation

Price Verificationでは現在Price Listのunit price / amountを検証する。

価格改定だけでStructure Goldenを壊さない。

### 2.17 Coverage Report

PR / CI Summaryへ最低限以下のcoverageを表示する。

```text
Profiles
Components
Conditional branches
Limitation types
Pricing units
```

例:

```text
Profiles: 2 / 2
Components: 7 / 7
Conditional branches: 4 / 4
Limitation types: 2 / 2
Pricing units: 5 / 5
```

---

## 3. Decision 31 — Price List更新差分判定

### 3.1 基本分類

Price Update Workflowでは差分を以下へ分類する。

- `PRICE_ONLY`
- `STRUCTURE_WARNING`
- `STRUCTURE_BREAKING`

目的は、通常の値上げ・値下げは自動追従し、Definitionの意味が壊れた場合だけ公開を止めることである。

### 3.2 PRICE_ONLY

以下のように料金値だけが変わり、意味構造が同じ場合は`PRICE_ONLY`とする。

- SKU解決条件は同じ
- productFamily等は同じ
- unitは同じ
- Price Dimension構造は同じ
- selector候補は同じ
- `pricePerUnit`のみ変更

処理:

```text
new Price DB build
  -> Golden price verification
  -> price diff summary
  -> publish可能
```

人間レビュー必須にはしない。

### 3.3 STRUCTURE_WARNING

Definitionは引き続き正常解決できるが、AWS料金構造に意味的変化があり得る場合。

例:

- 新instance type追加
- 新Storage Class追加
- 新attribute value追加
- SKU追加
- Tier range変更
- 新attribute追加だが既存解決に影響なし

既存`singleSku`等が引き続き成立するならpublish可能とする。

CI Summaryへ変更内容を表示する。

### 3.4 STRUCTURE_BREAKING

Definitionが現在のPrice Listを安全に解決できなくなった場合。

代表例:

- 0 SKU
- 複数SKU
- unit変更
- Price Dimension形状が意味的に変化
- productFamily等が変化して既存Query不成立
- Definitionが使うattribute消失
- Tier / Free Tierでは説明できない複数有料Dimension発生
- 新料金カテゴリが`unresolved`

この場合、新Price DBを公開しない。

### 3.5 SKU ID変更

SKU文字列変更自体はBreakingとしない。

意味的属性から現在のDefinitionで1SKUへ正常解決できれば問題なしとする。

### 3.6 新SKU / selector value

新instance type等の追加は原則`info`相当とする。

selectorがPrice Data由来なら、新値として自然に利用可能になることを許す。

### 3.7 新しい課金カテゴリ

新`productFamily / operation / usagetype`群等、既存Definitionが扱わない新料金カテゴリは単なるSKU追加と区別する。

`UNMAPPED_PRICING_CATEGORY`として検出する。

Decision 29と同じく全料金カテゴリを以下へ分類する。

- `mapped`
- `ignored`
- `unresolved`

旧buildで`unresolved = 0`だったものが新buildで増えた場合は構造変更として扱う。

### 3.8 Attribute変化

基本分類:

```text
new attribute value
  -> info

new attribute
  -> warning

Definitionが利用するattribute消失
  -> error
```

ただし新attributeによって従来1SKUだったQueryが複数SKUへ分岐する場合は`AMBIGUOUS_SKU`としてerrorにする。

### 3.9 unit変更

unit変更は原則`STRUCTURE_BREAKING`とする。

例:

```text
GB-Mo -> GB-Day
Hrs -> Seconds
```

Definitionのusage transform再確認が必要であるため、自動公開しない。

### 3.10 Tier range変更

Tier range変更は通常`STRUCTURE_WARNING`とする。

本ツールはTier計算をしないため即Breakingではない。

ただしfirst paid tier単価は現在Price Listに従って更新する。

### 3.11 Free Tier構造変更

Free Tier rangeの変更は通常`info`とする。

本ツールではFree Tierを計算しないため見積結果へ直接影響しない。

ただし無料Dimensionと通常有料Dimensionを安全に識別できなくなった場合はerrorにする。

### 3.12 複数Paid Dimension化

旧buildで1有料Dimensionだったものが複数になった場合、以下へ分類する。

```text
Tier化
  -> warning + tier-pricing limitation

Free Tier追加
  -> info + free-tier limitation

意味の異なる有料Dimension追加
  -> error
```

### 3.13 Structure Golden再実行

Price Update時にはDecision 30のStructure Goldenを新Price DBへ再実行する。

例:

```text
skuCount = 1
unit = Hrs
matched semantic attributes = expected
```

旧buildでPASSし、新buildでFAILした場合は構造変更として扱う。

### 3.14 Price差分レポート

正常な価格改定もCI Summaryへ表示する。

例:

```text
EC2 / m7i.large / Linux / Tokyo
old: $0.1234 / Hrs
new: $0.1280 / Hrs
change: +3.73%
```

大幅変動はwarning表示してよい。

例:

```text
PRICE_CHANGE_LARGE
```

閾値は運用品質監視用設定とし、料金仕様そのものにはしない。

大幅値上げ・値下げだけを理由にpublish停止しない。

### 3.15 publish判定

```text
PRICE_ONLY
  -> publish可能

STRUCTURE_WARNING
  -> publish可能
  -> CI Summaryへ警告

STRUCTURE_BREAKING
  -> publish禁止
```

### 3.16 Last Known Good Build

構造validationに失敗した場合、`pricing/generated`を新buildへ切り替えず、最後に正常だったbuildを維持する。

```text
download success
!=
publish success
```

Price List取得成功だけを理由にactive buildを更新しない。

### 3.17 Runtime状態

新Price Listのvalidationが失敗し旧buildを利用している場合、Runtime側ではDecision 16の`stale`相当として扱えるようにする。

ユーザーへ必要に応じて以下を表示する。

```text
Price data update failed validation.
Using last validated build.
```

料金計算そのものは最後の正常buildで継続可能とする。

---

## 4. Decisions 29–31で確定した事項

1. 新サービス追加はサービス名指定だけでPR作成まで自動化することを目標とする。
2. 現在のmainを必ず確認してからDefinitionを生成する。
3. Price Listから料金構造インベントリを作成してから意味解釈・Definition化する。
4. 全料金カテゴリを`mapped / ignored / unresolved`へ分類する。
5. DefinitionとGolden Caseを同時生成する。
6. 一時Price DBはvalidation専用としcommitしない。
7. CI ERRORは一定範囲まで自動修正し、未解決は隠さない。
8. 自動化の終点は原則PR作成までとし、mergeは人間レビューとする。
9. Golden Caseは最終金額だけでなく料金解決経路も検証する。
10. SKU IDではなく意味的属性をGoldenの正本とする。
11. 全Profile / Component /主要料金分岐をGoldenで最低1回カバーする。
12. Golden expected価格はPricing Engineと独立したraw Price List verifierで算出する。
13. Structure GoldenとPrice Verificationを分離する。
14. Price List更新差分を`PRICE_ONLY / STRUCTURE_WARNING / STRUCTURE_BREAKING`へ分類する。
15. 単価だけの変更は自動追従する。
16. SKU ID変更だけではBreakingとしない。
17. 新料金カテゴリ、unit変更、SKU ambiguity等は構造変更として検知する。
18. `STRUCTURE_BREAKING`なら新Price DBを公開しない。
19. 更新失敗時は最後の正常buildを維持する。
20. Runtimeでは必要に応じて`stale`状態として表示する。

---

## 5. 次に決定する事項

次は、最後の正常buildを安全に保持・切り替えるためのPrice DB公開レイアウトとmanifest仕様を定義する。

主な論点:

- `pricing/generated/` 配下のbuild directory構成
- immutable `buildId`
- active manifest
- service index / chunk配置
- atomic切り替え方法
- old build retention
- stale判定metadata
- GitHub Pages配信時のbrowser cacheとの整合
