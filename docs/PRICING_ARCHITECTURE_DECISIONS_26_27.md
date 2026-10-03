# Pricing Architecture Specification — Decisions 26–27

最終更新: 2026-10-04

本書は `docs/PRICING_ARCHITECTURE.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_09_14.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_15_16.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_17.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_18_20.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_21_25.md` の続編として、Decision Bundle 26〜27で確定した SKU / Price Dimension の意味と初期版の解決規則を定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Decision 26 — SKU / Price Dimension の意味

### 1.1 SKU

SKU は AWS Public Price List 上で Product を識別する一意IDである。

本ツールでは、ユーザーが選択した Region、instance type、OS、tenancy、storage class 等の料金条件から Price Query を実行し、対象 Product / SKU を解決する。

例:

```text
東京リージョン
Linux
m7i.large
Shared tenancy
```

という条件に対応する Product が存在し、その Product に SKU が付与される。

SKU は Project JSON の正本として保存しない。

復元時・再計算時には、現在の Definition と Price DB を使用して再解決する。

### 1.2 Price Dimension

Price Dimension は、SKUで識別された Product / Termについて、具体的にどの単位・範囲・単価で課金するかを表す料金レートである。

代表的な属性:

- `unit`
- `beginRange`
- `endRange`
- `pricePerUnit`
- `description`
- `rateCode`

概念例:

```text
SKU
  EC2 m7i.large / Linux / Tokyo

Price Dimension
  unit = Hrs
  beginRange = 0
  endRange = Inf
  pricePerUnit = <hourly price>
```

### 1.3 複数SKU

本来1商品へ絞れるはずの Price Query が複数SKUを返した場合、通常は Definition の filter が不足していると判断する。

例:

```text
m7i.large / Linux / Shared
m7i.large / Linux / Dedicated
m7i.large / Linux / Host
```

が同時に残った場合、tenancy等の条件追加が必要である。

初期版では `expect: singleSku` を標準とする。

### 1.4 複数Price Dimension

1 SKU に複数 Price Dimension が含まれる場合がある。

代表例:

- volume tier / usage tier
- Free Tier + 有料dimension
- 同一 Product / Term 内の複数 rate code

したがって、複数Dimensionを一律に「全部足す」「先頭だけ使う」とはしない。

---

## 2. Decision 27 — 初期版のSKU / Dimension解決規則

### 2.1 Pricing Component の責務

Pricing Component は「1種類の課金メーター」を表す単位とする。

例:

```text
Lambda
  - Requests
  - Duration

RDS
  - DB Instance
  - Storage
  - I/O
  - Backup
```

複数の異なる課金種別を1 Componentの内部で自動合算しない。

### 2.2 SKU解決

初期版では Pricing Component ごとに `singleSku` を標準とする。

標準挙動:

```text
0 SKU       -> ERROR
1 SKU       -> 正常
2 SKU以上   -> ERROR
```

複数SKUが必要に見える場合は、まず以下を確認する。

- Componentの分割不足
- selector / fixedFilter不足
- Region / operation / usage type等の条件不足

`multipleSkus` は初期版では実装必須とせず、実際に不可避な料金体系が確認された場合だけ拡張する。

### 2.3 複数料金はComponentへ分解する

異なる課金項目をまとめて複数SKUとして扱う代わりに、Pricing Componentへ分割する。

例:

```text
DB Instance
Storage
I/O
Backup
```

それぞれを独立したComponentとして計算し、Service / Plan合計で加算する。

### 2.4 単一有料Dimension

SKU解決後に通常の有料Price Dimensionが1件だけ存在する場合、そのDimensionを使用する。

概念:

```text
1 Component
  -> 1 SKU
      -> 1 billable Price Dimension
```

これを初期版の正常系とする。

### 2.5 Free Tier dimension

Free Tier / 無料枠を表す0円Dimensionは Decision 24 に従い計算対象外とする。

無料Dimensionを除外し、通常の有料Dimensionを基準単価としてusageの最初から適用する。

例:

```text
0 - 1000 requests    $0
1000 - Inf           $X
```

であれば、初期版では `$X` を全usageへ適用する。

`free-tier` Limitationを必要に応じて表示する。

### 2.6 Tier dimension

複数Price Dimensionが usage tier を構成している場合は Decision 22 に従う。

初期版ではTier計算を行わず、最初の通常有料tierの単価を全usageへ適用する。

例:

```text
0 - 50 TB       $X
50 - 500 TB     $Y
500 TB - Inf    $Z
```

なら `$X` を基準単価として使用し、`tier-pricing` Limitationを付与する。

Price DBには全Dimensionを保持し、Tierの存在判定・将来対応・CI検知に使用する。

### 2.7 Tier / Free Tier 以外の複数有料Dimension

TierでもFree Tierでもない、意味の異なる複数有料Dimensionが同時に存在する場合は、自動計算しない。

以下を禁止する。

- 全Dimensionの無条件sum
- 先頭Dimensionの無条件採用
- description等を曖昧に解釈して推測選択

この状態は CI / Definition validation の ERROR とする。

Definition作成時に以下のいずれかで解決する。

- Pricing Componentを分割する
- Price Queryをさらに絞る
- Dimensionを識別する限定filterを追加する

### 2.8 Dimension filter

必要に応じて、Definitionから特定Dimensionを識別できる限定filterを持てるようにする。

候補属性:

- `unit`
- `description`
- `beginRange`
- `endRange`

概念例:

```json
{
  "priceDimension": {
    "filter": {
      "unit": "Hrs"
    }
  }
}
```

`rateCode` はAWS内部IDへの依存が強いため、意味的条件で識別できる場合はそちらを優先する。

### 2.9 Dimension sum mode は実装しない

初期版では `sum` のようなDimension合算モードを設けない。

複数料金項目を加算する必要がある場合は、複数Pricing Componentへ分割し、既存のComponent -> Service -> Plan合算を使用する。

これによりPricing Engine内に別系統の合算ロジックを増やさない。

### 2.10 Pricing Engine標準フロー

初期版のComponent料金計算は以下を標準とする。

```text
Component
  -> Price Query

0 SKU
  -> ERROR

2+ SKU
  -> ERROR

1 SKU
  -> On-Demand Term
  -> Price Dimensions解析
  -> Free Tier Dimension除外
  -> Tierの場合は最初の通常有料Dimensionを採用
       + tier-pricing Limitation
  -> Tierでなく有料Dimensionが1件
       -> 採用
  -> Tier / Free Tier以外の複数有料Dimension
       -> ERROR
  -> usage transform
  -> unit conversion
  -> price x usage
```

### 2.11 CI validation

Service Definition / Price DB更新時には少なくとも以下を検証する。

ERROR:

- `singleSku` queryが0件
- `singleSku` queryが2件以上
- Free Tier / Tierとして説明できない複数有料Dimension
- Dimension filter適用後も候補が一意にならない
- 採用DimensionのunitがDefinitionの想定と不整合

NOTICE / WARNING:

- Tier存在 -> `tier-pricing` Limitation
- Free Tier存在 -> `free-tier` Limitation

通常のPrice変更そのものは既存のPrice DB CI方針に従う。

---

## 3. 本Decisionで確定した事項

1. SKUはAWS Price List上のProduct識別IDである。
2. Price DimensionはそのProductの具体的な課金レートである。
3. SKU IDはProject JSONの正本として保存しない。
4. Pricing Componentを「1種類の課金メーター」と定義する。
5. 初期版は`singleSku`を標準とする。
6. 0 SKU / 複数SKUはERRORとする。
7. 複数の異なる料金はPricing Componentへ分割する。
8. 通常有料Price Dimensionは原則1件へ解決する。
9. Free Tier Dimensionは無視し、通常有料単価を最初から適用する。
10. Tier Dimensionは最初の通常有料tier単価のみ使用し、Tier計算はしない。
11. Tier / Free Tier以外の複数有料DimensionはERRORとする。
12. Dimensionの無条件`sum`モードは初期版では実装しない。
13. 必要な場合だけ限定的なDimension filterをDefinitionに持たせる。
14. `multipleSkus`は実際に不可避なケースが見つかるまで初期版必須機能としない。
15. CIでSKU件数・Dimension構造・unit整合性を検証する。

---

## 4. 次に決定する事項

次の仕様検討では、新しいAWSサービスを追加するときに、Price List・AWS Pricing Calculator・料金ページ等から取得した情報をどのように Service / Profile / Pricing Component へ分解するかを正式化する。

主な論点:

- Service境界の判定
- Profile境界の判定
- Pricing Component境界の判定
- selector / usage input / fixed filter の分類
- Price Query候補の生成
- Golden Caseの自動生成
- ChatGPTが自動生成できる範囲と人間確認が必要な箇所
