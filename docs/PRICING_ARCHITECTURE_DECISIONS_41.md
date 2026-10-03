# Pricing Architecture Specification — Decision 41

最終更新: 2026-10-04

本書は既存の Pricing Architecture Specification 群の続編として、Decision Bundle 41で確定した `usageTypeClass` / category inventory normalizer の方針を定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Decision 41 — `usageTypeClass` / category inventory normalizer

### 1.1 基本方針

category inventory normalizerは、AWS Price Listを完全自動で意味理解する仕組みにはしない。

安全に同一カテゴリと判断できるものだけをまとめ、判断できない場合は細かく分ける側へ倒す。

標準処理:

```text
AWS Product
-> global scope filter
-> raw category candidate
-> generic normalization
-> serviceCode-specific normalization
-> discriminator候補抽出
-> homogeneity check
-> detected category inventory
```

### 1.2 2段階normalizer

normalizerは以下の2段階とする。

```text
generic normalizer
-> serviceCode-specific normalization rules
```

Service固有処理も任意JavaScriptではなく、宣言的bounded operationで表現する。

### 1.3 generic処理

generic normalizerで許可するのは、安全性の高い処理に限定する。

代表例:

- region prefix除去
- trim
- null / 空文字の正規化
- 明確に共通仕様と判断できるprefix除去

SKU固有部分や意味不明なsuffixを推測で除去しない。

### 1.4 Region prefix除去

例:

```text
APN1-BoxUsage:m7i.large
USE1-BoxUsage:m7i.large
```

はcoverage上のregion差を除去し、例えば以下へ正規化可能とする。

```text
BoxUsage:m7i.large
```

Region自体はPrice DBファイル単位で管理されるため、category identityへ重複して持ち込まない。

### 1.5 Service固有rule

SKU固有suffix等の除去はserviceCode固有ruleで明示する。

例:

```text
BoxUsage:m7i.large
BoxUsage:m7i.xlarge
```

をEC2で`BoxUsage`へまとめる場合、それはAmazonEC2向けruleとして定義する。

genericに「コロン以降を削除」のような規則は持たせない。

### 1.6 bounded operation

初期版の候補operation:

- `stripRegionPrefix`
- `stripPrefix`
- `stripSuffix`
- `stripAfterDelimiter`
- `replaceExact`
- `mapExact`
- `keepExact`

regexによる自由変換や任意JavaScriptは禁止する。

### 1.7 Rule適用順序

normalization ruleは配列順で適用する。

例:

```json
{
  "usageTypeRules": [
    {"op": "stripRegionPrefix"},
    {
      "op": "stripAfterDelimiter",
      "delimiter": ":",
      "whenPrefix": "BoxUsage"
    }
  ]
}
```

### 1.8 条件付きrule

ruleには限定的な条件を持たせてよい。

例:

```json
{
  "when": {
    "productFamily": "Compute Instance"
  },
  "op": "stripAfterDelimiter",
  "delimiter": ":"
}
```

条件評価には既存のbounded filter evaluatorを再利用できる。

### 1.9 変換追跡

CI / 新サービス分析では、rawUsageTypeからusageTypeClassへの変換を追跡可能にする。

例:

```json
{
  "rawUsageType": "APN1-BoxUsage:m7i.large",
  "usageTypeClass": "BoxUsage"
}
```

この対応表は分析reportまたはCI artifactとして保持できるが、本番Price DBへ全件保存することは必須としない。

### 1.10 Homogeneity check

normalizerによって同一categoryへまとめられたProduct群について、少なくとも以下の整合性を確認する。

- `productFamily`
- `operation`
- `unit`
- 重要discriminator
- Price Dimension shape

不整合がある場合は過剰統合の可能性があるためERRORまたはreview-requiredとする。

### 1.11 単価差

`pricePerUnit`の差だけをcategory分割理由にしない。

同一料金メーターでもselector値ごとに単価が異なることは正常である。

### 1.12 Dimension shape差

同一normalized category内でPrice Dimension shapeが大きく異なる場合は構造差として扱う。

例:

- SKU A: 単一paid dimension
- SKU B: tiered dimensions

この場合は少なくともwarningとし、自動的に同一categoryと確定しない。

### 1.13 discriminator候補の自動提案

新サービス解析時、同一基本key内でattribute値ごとに以下が分かれる場合、そのattributeをdiscriminator候補としてreportへ出せる。

- operation
- unit
- Price Dimension shape
- 明確な課金メーター意味

代表例:

- `storageClass`
- `transferType`
- `requestType`

候補は自動採用せず、最終boundaryは`coverage.json`で明示する。

### 1.14 coverage.jsonが正本

normalizerはAWS Price Dataの構造整理を行う。

最終的な料金カテゴリ境界はService package側の`coverage.json`を正本とする。

```text
Normalizer
= AWS Price Dataの構造整理

coverage.json
= 本ツールの設計判断
```

### 1.15 detected inventory

CI / 分析用途のdetected inventoryは、概念的に以下のような情報を持てる。

```json
{
  "serviceCode": "AmazonEFS",
  "region": "ap-northeast-1",
  "categories": [
    {
      "productFamily": "Storage",
      "operation": "",
      "usageTypeClass": "TimedStorage-ByteHrs",
      "unit": "GB-Mo",
      "productCount": 12,
      "rawUsageTypes": [
        "APN1-TimedStorage-ByteHrs"
      ],
      "attributeValueSummary": {
        "storageClass": ["Standard", "IA"]
      }
    }
  ]
}
```

### 1.16 detected inventoryの永続化

`detected-inventory.json`のような分析結果は原則としてリポジトリへcommitしない。

GitHub Actions artifactやPR Summaryで確認できればよい。

必要時のみデバッグ目的で保存可能とする。

### 1.17 Normalizer rule配置

Normalizer ruleはService Definition packageではなくPrice normalization側へ置く。

推奨概念構成:

```text
pricing/
  normalization/
    common.json
    services/
      AmazonEC2.json
      AmazonEFS.json
```

これはUI DefinitionではなくAWS Public Price Listの正規化規則であるためである。

### 1.18 rule単位

Normalizer ruleはApp Service単位ではなくAWS `serviceCode`単位を基本とする。

例:

```text
AmazonRDS
```

同一serviceCode内で必要なら`productFamily`等により条件分岐する。

### 1.19 normalizer変更

Normalizer rule変更は単なる実装リファクタとは扱わない。

同じAWS Price Listから異なるcategory inventoryが生成され得るため、coverage semantics変更として扱う。

Normalizer変更PRでは、旧inventory / 新inventory / coverage classification差分をCI Summaryで確認できるようにする。

---

## 2. 本書で追加確定した事項

1. category inventory normalizerはgeneric + serviceCode固有ruleの2段階とする。
2. Service固有ruleも宣言的bounded operationに限定する。
3. 任意JavaScriptによるnormalizationは禁止する。
4. generic処理はregion prefix除去等の安全性が高いものだけとする。
5. SKU固有suffix除去等はserviceCode固有ruleで明示する。
6. normalization ruleは順序付きとする。
7. rawUsageTypeからusageTypeClassへの変換を分析reportで追跡可能にする。
8. normalizer後にcategory homogeneity checkを行う。
9. 単価差だけではcategory分割しない。
10. unit / operation / Dimension shape等の構造差を重視する。
11. attribute差分からdiscriminator候補を自動提案可能とする。
12. 最終category boundaryは`coverage.json`を正本とする。
13. detected inventoryはCI artifact中心とし、原則commitしない。
14. Normalizer ruleは`pricing/normalization/`側で管理する。
15. rule単位はAWS `serviceCode`を基本とする。
16. 条件付きruleはbounded filter evaluatorを再利用可能とする。
17. Normalizer変更時はcoverage semantics変更としてCI差分確認を必須にする。
