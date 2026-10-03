# Pricing Architecture Specification — Decisions 21–25

最終更新: 2026-10-04

本書は `docs/PRICING_ARCHITECTURE.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_09_14.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_15_16.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_17.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_18_20.md` の続編として、Decision Bundle 21〜25で確定した Project Migration / Restore Report、Tier扱い、Billing Semantics、Free Tier除外、Pricing Limitation共通管理を定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Decision 21 — Project Migration / Restore Report

### 1.1 基本方針

Project JSONの復元では、意味が同じと保証できる変更だけを自動Migrationする。

自動Migrationしてよい例:

- Service ID rename
- Profile ID rename
- Component ID rename
- input field ID rename
- selector valueの表記変更
- Project JSON schemaVersion変更に伴う構造変換

自動Migrationしてはいけない例:

- 廃止instance typeを似たinstance typeへ置換
- RDSをAuroraへ自動置換
- gp2をgp3へ自動置換
- 利用方式や料金体系が意味的に変わる変換

意味変化を伴う場合は自動補完せず、`warning`または`invalid`としてユーザー確認対象とする。

### 1.2 Migration方式

Migrationは原則として宣言的定義で表現し、任意JavaScript式を使用しない。

想定するbounded operation:

- `renameService`
- `renameProfile`
- `renameComponent`
- `renameField`
- `mapValue`
- `moveField`
- `setDefaultIfMissing`

`setDefaultIfMissing`は意味的に安全である場合だけ使用する。

### 1.3 Project schema migrationとDefinition migrationの分離

以下を別系統で管理する。

```text
Project schema migration
= Project JSON構造そのもののversion移行

Definition migration
= Service / Profile / Component / field / value IDの互換移行
```

### 1.4 schemaVersion migration

古いProject JSONは、対応するmigration chainを順番に適用する。

例:

```text
v1 -> v2 -> v3 -> v4
```

中間versionを飛ばす前提にしない。

現在アプリより新しいschemaVersion、または必要なmigration chainが欠落している場合はProject全体の復元を拒否する。

### 1.5 元JSONの保持

復元処理中はoriginal JSONとmigrated JSONを分離して扱い、元入力を破壊的に変更しない。

これによりRestore Reportで旧値と新値の差分を説明可能にする。

### 1.6 Restore Report

復元処理では、Project適用前または適用時にRestore Reportを生成する。

Reportには少なくとも以下を含める。

- source schemaVersion
- current schemaVersion
- savedAt
- 保存時Price Data build/date
- 現在Price Data build/date
- Plan / Row / Service Instance数
- 自動Migration件数
- warning件数
- invalid Service Instance件数

### 1.7 状態

Service Instance等の復元状態は以下とする。

- `valid`
- `warning`
- `invalid`

Project全体については人間向けに、例えば以下のように表示する。

- 完全復元
- 一部要確認
- 一部復元不可

### 1.8 issue format

Restore issueは自由文だけでなく、安定したmachine-readable codeを持つ。

例:

```json
{
  "severity": "warning",
  "code": "FIELD_RENAMED",
  "serviceInstanceId": "svc-001",
  "path": "components.instance.values.instanceClass",
  "from": "instanceClass",
  "to": "instanceType"
}
```

初期候補:

- `SCHEMA_MIGRATED`
- `SERVICE_RENAMED`
- `PROFILE_RENAMED`
- `COMPONENT_RENAMED`
- `FIELD_RENAMED`
- `VALUE_MAPPED`
- `UNKNOWN_SERVICE`
- `UNKNOWN_PROFILE`
- `UNKNOWN_COMPONENT`
- `UNKNOWN_FIELD`
- `INVALID_VALUE`
- `SKU_NOT_FOUND`
- `AMBIGUOUS_SKU`
- `PRICE_DATA_CHANGED`
- `REGION_UNAVAILABLE`
- `UNSUPPORTED_SCHEMA_VERSION`

### 1.9 Price Data更新

保存時と現在でPrice Data buildId / publicationDateが異なること自体は通常の状態とし、致命的エラーにしない。

現在のPrice Queryで正常に再解決できれば復元可能とする。

### 1.10 SKU変更

SKU ID自体はProject JSONの正本にしない。

同じユーザー入力・Definition条件から現在のPrice Queryで一意に解決できるなら、AWS側のSKU ID変更だけを理由に復元エラーとしない。

### 1.11 部分復元

warningや局所的invalidがあっても、構造的に安全ならProject全体の部分復元を許可する。

Project全体を拒否する代表例:

- JSON parse不可
- 未対応schemaVersionでmigration pathなし
- 必須トップレベル構造欠損
- ID参照関係が壊れていて安全にProjectを構築できない
- migration処理失敗

### 1.12 unresolvedデータ保持

未知Service / field等があっても、元値を自動削除しない。

未解決Service InstanceはProject内に保持し、UI上で「要再設定」等として表示する。

ユーザーが明示的に現在有効な設定へ修正した時点で、旧unresolved値を置換してよい。

Restore Report自体はProject JSONへ保存せず、復元時に毎回再評価する。

---

## 2. Decision 22 — Tier Pricingの扱い

### 2.1 初期版ではTier計算をしない

AWSの段階料金は初期版の計算対象外とする。

理由:

- 実請求では同一企業・AWS Organizations配下の他システム利用量が影響する場合がある
- 見積担当者が会社全体のAWS利用総量を把握できない場合が多い
- 本ツールの目的は厳密な請求再現ではなく概算見積である
- Tierを無視すると多くの場合、見積は安全側（高め）に寄る

### 2.2 独立見積方式

本ツールでは、見積対象Projectを独立したAWS利用として扱う。

以下は考慮しない。

- 他システムの利用量
- 他AWSアカウントの利用量
- AWS Organizations全体の利用量
- Account / Organization単位のvolume aggregation

### 2.3 Tier未考慮時の計算

複数tierが存在する料金項目でも、初期版では段階展開しない。

原則として基準となる最初の有料tier単価を、入力usage全体へ適用する。

例:

```text
first paid tier price × monthly usage
```

無料tierについてはDecision 24に従い無視する。

### 2.4 Tier情報自体はPrice DBへ保持する

計算では使用しなくても、AWS Price Listの`beginRange` / `endRange` / Price Dimension情報はPrice DBに保持する。

用途:

- Tier存在判定
- 警告表示
- 将来対応
- CIで料金構造変化を検出

### 2.5 Tier警告

Tier対象料金を利用している場合、UI / PDF / CSV等で「Tier未考慮」を識別可能にする。

表示例:

> AWSでは利用量に応じた段階料金が適用される場合があります。本見積では段階料金を考慮せず、基準単価で計算しています。

### 2.6 実装しない機能

初期版では以下を実装しない。

- Plan内Service Instance横断のusage aggregation
- Account aggregation
- Organization aggregation
- aggregate chargeの按分
- external usage baseline
- Tier専用aggregation engine

---

## 3. Decision 23 — Billing Semanticsの再現範囲

### 3.1 再現対象

単一usageから機械的に決定できるbilling semanticsはgeneric DSLで再現する。

対象:

- 最低課金量
- 課金incrementへの切り上げ
- 単位換算
- scale
- `ceil`等の限定rounding

概念pipeline:

```text
raw usage
  -> minimum
  -> billing increment
  -> rounding
  -> unit conversion
  -> price × billing quantity
```

### 3.2 DSL primitive

初期版のbounded primitiveは原則以下に限定する。

- `minimum`
- `increment`
- `rounding: ceil`
- `scale`
- unit conversion

Definitionへ任意数式を追加しない。

### 3.3 Price Dimension unitを正本とする

料金単位はAWS Price Dimensionの`unit`を可能な限り正本とする。

Definition側は、ユーザー入力をそのunitへどう変換するかを定義する。

### 3.4 UI stepとbilling incrementの分離

以下は別概念として扱う。

```text
usageInput.step
= UI上の入力刻み

calculation usageTransform.increment
= AWS料金上の課金刻み
```

UI stepを料金計算へ流用しない。

### 3.5 最低保存期間は計算しない

Storage Class等のminimum storage durationは初期版では計算しない。

理由:

- 正確な計算には保存開始・削除時刻等のライフサイクル履歴が必要
- 本ツールは月間集計usageを入力する概算見積ツールである

### 3.6 Early deletion / lifecycle charge

以下も初期版対象外とする。

- early deletion charge
- lifecycle transition由来の追加料金
- イベント履歴を必要とするstorage charge

対象外条件はPricing Limitationとして警告する。

### 3.7 月間usageは集計済み入力として扱う

例えばEC2の`160 hours/month`は、ユーザーが既に月間usageとして集計した値とみなす。

起動回数、各起動セッションの秒数、個々のrequest等を再現するイベントシミュレーションは行わない。

単一の月間usageから適用可能な料金条件までをPricing Engineの責務とする。

---

## 4. Decision 24 — Free Tier / 無料枠

### 4.1 無料枠を計算しない

初期版ではFree Tierおよび各種無料利用枠を一切計算しない。

対象外:

- AWS Free Tier
- 最初の○GB無料
- 最初の○requests無料
- Account依存の無料枠
- Organization共有の無料枠
- 契約・資格・アカウント作成時期に依存する無料枠

### 4.2 通常有料単価を最初から適用する

見積では、原則として通常の有料単価をusageの最初から適用する。

Price Listに0円dimensionが存在していても、それが無料枠を表す場合は見積ロジックへ反映しない。

### 4.3 見積方針

無料枠除外により実請求より見積が若干高くなることを許容する。

本ツールは以下の思想で統一する。

```text
On-Demand通常単価
×
月間集計usage
```

Savings Plans / Reserved / Spot / Tier discount / Free Tier等を原則考慮しない、概算上限寄りの見積を生成する。

### 4.4 警告

UI / PDF等には必要に応じて以下を表示する。

> AWS Free Tierおよび各種無料利用枠は本見積に含めていません。

---

## 5. Decision 25 — Pricing Limitation共通管理

### 5.1 目的

計算対象外条件を各Service Definitionへ自由文で重複記載せず、共通のPricing Limitation体系として管理する。

### 5.2 安定Limitation ID

初期候補:

- `tier-pricing`
- `free-tier`
- `minimum-storage-duration`
- `early-deletion`
- `lifecycle-event-charge`
- `organization-usage-aggregation`
- `account-specific-discount`

### 5.3 Registry

Limitation文言と共通metadataは中央Registryを正本とする。

推奨パス:

```text
pricing/limitations.json
```

概念例:

```json
{
  "tier-pricing": {
    "severity": "notice",
    "impactDirection": "estimate-may-be-higher",
    "shortText": "段階料金は未考慮",
    "detailText": "AWSでは利用量に応じて単価が下がる場合があります。本見積では段階料金を考慮せず、基準単価で計算しています。"
  }
}
```

### 5.4 severity

初期版では少なくとも以下を使用する。

- `notice`: 概算上の既知の省略
- `warning`: 過小見積等、より注意が必要な省略

例:

```text
Tier未考慮      -> notice
Free Tier未考慮 -> notice
minimum storage duration未考慮 -> warning
```

### 5.5 impactDirection

Limitationは見積方向への影響を持てる。

許可値:

- `estimate-may-be-higher`
- `estimate-may-be-lower`
- `unknown`

概算ツールでは、過小見積リスクである`estimate-may-be-lower`をより強く表示する。

### 5.6 適用単位

Limitationは必要に応じて以下へ付与可能にする。

- Service
- Profile
- Pricing Component

基本は最も細かいPricing Component単位を優先する。

### 5.7 条件付きLimitation

Storage Class等の選択値によってLimitation適用有無が変わる場合、既存のbounded条件DSLを使用して条件付きで表現できるようにする。

任意JavaScript式は禁止する。

### 5.8 自動検出とDefinition宣言

Price Dataから安全に検出できる条件は自動付与を優先する。

例:

```text
複数tierのPrice Dimensionを検出
-> tier-pricingを自動付与
```

Price Listだけでは意味を安全に判断できない条件はDefinitionへ宣言する。

例:

- minimum storage duration
- early deletion
- lifecycle event charge

### 5.9 UI集約

同じLimitationが複数Service Instanceへ適用されても、画面上で同一文言を大量重複表示しない。

Project / Plan全体の注意事項として集約し、必要に応じて対象Service一覧を表示する。

Service Drawerでは、そのServiceに関係するLimitationだけを表示する。

### 5.10 PDF

PDFでは、その見積に適用されたLimitationを「見積条件・対象外」等のセクションで必ず表示する。

代表例:

- Free Tier未考慮
- Tier pricing未考慮
- minimum storage duration未考慮
- Savings Plans / Reserved / Spot未考慮

### 5.11 CSV

CSVではLimitation IDをmachine-readableに出力できるようにする。

例:

```text
limitations=tier-pricing;free-tier
```

必要に応じて`has_underestimate_risk`等の派生列も生成可能とする。

### 5.12 Project JSONには保存しない

Pricing LimitationはService Definition / Price Data /現在の計算条件から再導出する。

Project JSONには保存せず、復元時に現在のDefinitionとPrice DBから再評価する。

---

## 6. 本Decision群で確定した料金計算方針

初期版のPricing Engineは、AWS請求を完全再現するエンジンではなく、ユーザーが把握可能な月間集計usageからOn-Demand通常料金の概算を生成する。

原則:

```text
通常On-Demand有料単価
×
月間集計usage
```

計算するもの:

- 通常On-Demand価格
- Region差
- Service / Profile / Component差
- 単純なusage変換
- 単一usageから決定できるminimum / increment / ceil / unit conversion

初期版で計算しないもの:

- Savings Plans
- Reserved
- Spot
- Free Tier / 無料枠
- Tier pricing
- Account / Organization横断usage aggregation
- minimum storage duration
- early deletion
- lifecycle event履歴依存課金
- 税
- 為替換算

対象外項目は可能な限りPricing Limitationとしてユーザーへ明示する。

この方針により、複雑な請求再現機構を実装せず、概算見積として再現性・説明可能性・保守性を優先する。

---

## 7. 次に決定する事項

次の仕様検討では、Price Queryが複数SKU / 複数Price Dimensionを返す場合の正常系・異常系を定義する。

主な論点:

- `singleSku`をどこまで標準とするか
- `multipleSkus`を正常系として許可するケース
- 1 SKU内に複数Price Dimensionがある場合の扱い
- Tier未計算方針下で複数Dimensionからどの基準単価を選ぶか
- Query ambiguityと正当なmulti-matchをどう区別するか
- CI / Golden Caseで何をERRORにするか
