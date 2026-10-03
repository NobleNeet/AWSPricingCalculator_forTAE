# Pricing Architecture Specification — Decisions 39–40

最終更新: 2026-10-04

本書は既存の Pricing Architecture Specification 群の続編として、Decision Bundle 39〜40で確定した Service Definition package構造、Schema配置、coverage.json、および料金カテゴリ識別キーを定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Decision 39 — Definition package構造とSchema配置

### 1.1 Service package単位

Service Definitionは `services/<serviceId>/` を1 package単位とする。

標準構成:

```text
services/
  efs/
    service.json
    profiles/
      standard.json
    components/
      storage-standard.json
      storage-ia.json
      requests.json
    golden/
      standard.json
    coverage.json
    adapter.js          # 必要な場合のみ
```

Price DB本体はService packageへ含めない。

### 1.2 共通Schema

Definition用JSON Schemaは中央管理する。

```text
schemas/
  service-definition/
    service.schema.json
    profile.schema.json
    component.schema.json
    golden.schema.json
    coverage.schema.json
```

Service固有Schemaは作らない。

### 1.3 Golden Case

Golden Caseデータは各Service package内の `golden/` に配置する。

共通runner / validator / Price DB generator等の実行コードは中央ツールとして管理し、Service固有ロジックを共通runnerへ埋め込まない。

### 1.4 coverage.json

各Service packageは料金カテゴリ分類用 `coverage.json` を持つ。

料金カテゴリは少なくとも以下へ分類する。

- `mapped`
- `ignored`
- `unresolved`

新Service作成途中では `unresolved` を許可できるが、完成PRでは `unresolved = 0` を必須とする。

### 1.5 ID参照

ProfileからComponent、ServiceからProfileへの参照はファイルパスではなくIDで行う。

```text
service.json profiles[]
-> profiles/<id>.json

profile.json components[]
-> components/<id>.json
```

### 1.6 ファイル名とID

以下を一致させる。

```text
services/efs/service.json       -> service.json.id = "efs"
profiles/serverless-v2.json     -> id = "serverless-v2"
components/storage.json         -> id = "storage"
```

不一致はValidation ERRORとする。

### 1.7 package外参照

Service Definition packageから別Service packageのDefinitionを直接参照してはならない。

共有すべき概念は共通Schema / DSLへ昇格する。

初期版ではshared Component Definitionを作らない。

### 1.8 Adapter

Generic DSLで表現できない場合のみ `services/<serviceId>/adapter.js` を許可する。

Adapterの責務は限定料金変換に絞り、以下は禁止する。

- 任意Price DB取得
- ネットワークアクセス
- DOM操作
- UI生成
- Project state直接変更

Adapterはpure functionに近い限定interfaceを持たせ、存在する場合はCI / PR Summaryでreview requiredとして明示する。

### 1.9 Catalog

Service Catalogは `service.json` の走査から生成する。

別の手書きService一覧を正本にしない。

### 1.10 package completeness

CIでは以下の参照関係が閉じていることを確認する。

```text
service.json
-> profiles[]
-> components[]
-> golden
-> coverage.json
```

Package内の未参照Definitionも検出し、原則として死んだDefinitionを残さない。

---

## 2. Decision 40 — coverage.jsonの料金カテゴリ識別キー

### 2.1 目的

coverageはSKU単位ではなく、意味的な料金カテゴリ単位で管理する。

目的は、AWS Price List更新時に単なるSKU追加と新しい課金メーター追加を区別することである。

### 2.2 基本キー

初期版の料金カテゴリ識別キーは以下を基本とする。

```text
productFamily
operation
usageTypeClass
unit
```

必要な場合だけ `discriminators` を追加する。

### 2.3 usageTypeClass

Raw `usageType` はRegion prefixやinstance type等を含む場合があるため、coverage identityへそのまま使用しない。

例:

```text
APN1-BoxUsage:m7i.large
APN1-BoxUsage:m7i.xlarge
```

はcoverage上では同一の `BoxUsage` classとして扱える。

ただしusageType正規化は料金解決には使用せず、category inventory生成専用とする。

正規化に自信がない場合は無理にまとめず、細かく分割する側へ倒す。

最終fallbackとしてexact usageTypeをusageTypeClassとして利用可能とする。

### 2.4 discriminators

同じ基本キーでも課金メーターの意味が変わる場合のみ、追加attributeを `discriminators` に含める。

例:

```json
{
  "productFamily": "Data Transfer",
  "operation": "",
  "usageTypeClass": "DataTransfer-Out-Bytes",
  "unit": "GB",
  "discriminators": {
    "transferType": "Internet"
  }
}
```

全Product attributesをdiscriminatorにはしない。

Component境界や料金メーターの意味を変えるattributeだけを対象とする。

### 2.5 coverage.json構造

概念例:

```json
{
  "schemaVersion": 1,
  "serviceId": "efs",
  "serviceCode": "AmazonEFS",
  "region": "ap-northeast-1",
  "categories": [
    {
      "id": "standard-storage",
      "match": {
        "productFamily": "Storage",
        "operation": "",
        "usageTypeClass": "TimedStorage-ByteHrs",
        "unit": "GB-Mo",
        "discriminators": {
          "storageClass": "Standard"
        }
      },
      "status": "mapped",
      "componentId": "storage-standard"
    }
  ]
}
```

Category `id` はAWS内部IDではなく、人間が読める安定した意味ベースIDとする。

### 2.6 mapped

`status = mapped` は `componentId` を必須とする。

原則として1料金カテゴリを1 Pricing Componentへ対応させる。

### 2.7 ignored

`status = ignored` は理由を必須とする。

可能な場合はPricing Limitation IDを理由として利用する。

underestimate可能性等を表すため `impactDirection` を持たせてもよい。

### 2.8 scope外料金体系

Reserved / Savings Plans / Spot等、プロジェクト全体で対象外と確定している料金体系はcoverage分類以前のglobal scope filterで除外する。

coverage.jsonは本ツールが対象とするOn-Demand料金空間の分類を表す。

### 2.9 Dimension構造はcategoryを分けない

以下は同一coverage category内のPrice Dimension構造として扱う。

- Free Tier / 無料Dimension
- Tier range

したがって `beginRange / endRange / pricePerUnit / rateCode / SKU / SKU count` はcoverage identityへ含めない。

TierやFree Tierの変化はDimension構造差分として別途検出する。

### 2.10 category inventory

Price DB更新ごとに現在のPrice DBからdetected category inventoryを再生成し、`coverage.json`と照合する。

AWS側事実と本ツールの分類判断を分離する。

```text
AWS Price DB
-> detected category inventory

Service Definition package
-> coverage classification
```

### 2.11 新カテゴリ

新Price DBにcoverage未一致の有料カテゴリが出現した場合は `UNMAPPED_PRICING_CATEGORY` とする。

新Service追加の完成条件、および既存Serviceの構造変化検出では原則ERRORとする。

### 2.12 category削除・変更

`mapped` categoryがPrice DBから消失した場合は原則ERRORとする。

AWS側のcategory key変更は旧category削除 + 新category追加として検出し、名前類似による自動migrationは行わない。

### 2.13 fuzzy matching禁止

Category変更時に類似文字列や近似SKUを根拠に自動対応しない。

意味的同一性を確認できる変更だけを明示的に更新する。

### 2.14 coverage matcher

coverage matcherにも任意JavaScriptや曖昧regexを持ち込まない。

初期版では `eq / in / exists` 程度の限定条件を基本とする。

---

## 3. 本書で確定した事項

1. `services/<serviceId>/` をDefinition package単位とする。
2. package内にService/Profile/Component/Golden/Coverageを集約する。
3. Schemaは中央管理し、Service固有Schemaを作らない。
4. package外Definition参照とshared Componentを初期版では禁止する。
5. AdapterはService package内の限定例外機構とする。
6. CoverageはSKUではなく意味的料金カテゴリ単位で管理する。
7. Coverage基本keyは `productFamily / operation / usageTypeClass / unit` とする。
8. 必要時のみ意味的attributeを `discriminators` へ追加する。
9. Free Tier / Tier / price / SKU / rateCodeはcoverage identityへ含めない。
10. Price DB更新ごとにdetected category inventoryを再生成する。
11. coverage未一致の新有料カテゴリは `UNMAPPED_PRICING_CATEGORY` とする。
12. Category変更はfuzzy matchingせず明示的に扱う。
