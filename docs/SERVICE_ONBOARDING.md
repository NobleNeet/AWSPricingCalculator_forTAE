# AWS Service Onboarding Specification

最終更新: 2026-10-05

本書は、新しいAWSサービスをAWSPricingCalculator_forTAEへ追加する場合、および既存サービスの見積入力項目や料金対応を拡充する場合の標準作業フローを定義する。

本書は `docs/PRICING_ARCHITECTURE.md` と `docs/PRICING_MAPPING_ARCHITECTURE.md` を補完するService onboardingの正本である。

- UI / Project / Plan / 保存復元: `docs/SPEC.md`
- Pricing Core / Calculation DSL / Price DB: `docs/PRICING_ARCHITECTURE.md`
- AWS料金項目の意味解釈 / Pricing Mapping / drift検証: `docs/PRICING_MAPPING_ARCHITECTURE.md`

---

## 1. 目的

新サービス追加を、サービス名だけの依頼から最後まで自律的に実行できる再現可能な手順にする。

通常の依頼例:

```text
AWS Fargateを追加して
```

この依頼を受けた実装担当は、現在のrepositoryとAWS公式情報を調査し、次を一連の作業として実施する。

- Calculator UI調査
- 入力項目設計
- 課金Component分解
- AWS Public Price List実データ調査
- 各ComponentとAWS料金項目の意味対応の確定
- Pricing Mapping作成
- Definition / UI実装
- test / validation
- Price DB build / publish
- commit / push
- GitHub Actions / Pages確認

単なるDefinition作成、あるいは料金候補をgeneric resolverへ渡すだけでは追加完了としない。

---

## 2. 基本原則

### 2.1 LLMを使う場所

LLM / ChatGPT / Codexは、**サービス取り込み時の意味理解**に使用する。

主な役割:

- Calculator UIの読み取り
- 公式pricing/service documentationの確認
- Public Price List候補の探索
- Product / SKU / Price Dimensionの意味理解
- アプリ上のComponentとの対応付け
- Pricing Mapping生成
- Golden Case設計

一方、scheduled price updateはLLMを必須依存にしない。

### 2.2 意味理解は取り込み時に完了させる

定期更新時に「このSKUは何の料金か」を推測させない。

取り込み時に、各料金Componentについて以下をrepositoryへ固定する。

```text
アプリ上の料金Component
        ↓
どのAWS Price List serviceCodeを見るか
        ↓
どのProduct属性で識別するか
        ↓
どのPrice Dimensionを使うか
        ↓
許容unit / alias / invariant
```

この固定結果をPricing Mappingと呼ぶ。

### 2.3 共通化対象

共通化するのはMappingを実行する仕組みであり、AWSサービス固有の料金意味ではない。

Shared Pricing Coreへサービス固有`if/else`を増やさない。

---

## 3. 情報源の優先順位

### 3.1 見積入力UI

AWS Pricing Calculator (`https://calculator.aws/`) の該当サービス作成画面を主要参照先とする。

確認対象:

- 入力セクション
- primary / advanced
- 入力項目
- 選択肢
- 初期値
- 条件付き表示
- 項目間依存
- quantity / usage / duration入力方式

Calculator UIは料金値の正本ではない。

### 3.2 料金値 / SKU / Dimension

AWS Public Price Listを正本とする。

Calculator画面に表示された単価や月額をDefinitionへ転記してはならない。

### 3.3 課金意味

Calculator UIだけで意味が確定しない場合は、AWS公式pricing page / service documentationとPublic Price List実データを突き合わせる。

優先関係:

- 入力項目 / 操作: Calculator UI
- 料金値 / SKU / Dimension: Public Price List
- 課金意味 / 条件: AWS公式docs + Public Price List

根拠不足の料金は推測実装しない。

---

## 4. Calculator URLとSPA

サービス作成画面例:

```text
https://calculator.aws/#/createCalculator/Lambda
```

規則:

1. ユーザーがURLを提示した場合はそのURLを使う
2. 未提示なら実装担当が自ら特定する
3. 特定したURLは調査記録やtest/docsへ残す
4. `calculator.aws` はSPAなので、単純HTTP取得だけで実画面確認済みとはみなさない
5. primary / advanced / conditional fields / defaults / dependenciesは可能な限りJavaScript実行後の画面で確認する
6. 実画面を確認できない場合は公式docs / pricing page / Public Price Listで補完し、未確認事項を明示する
7. URLも画面内容も自力で確定できない場合に限りユーザーへ情報提供を求める

---

## 5. On-Demand固定ポリシー

通常見積はOn-Demand固定とする。

対象外:

- Reserved Instances / Reserved capacity
- Savings Plans
- Spot
- commitment term
- upfront payment option
- account-specific discount
- negotiated/private pricing

ただし、On-Demand料金自体へ影響する以下のような条件は取り込む。

- tenancy
- operating system / software
- CPU / memory / instance type
- storage type / capacity / IOPS / throughput
- requests / duration / task count
- deployment mode
- data transfer
- public IPv4
- monitoring
- architecture
- redundancy / Multi-AZ

---

## 6. 入力項目の採用規則

Calculatorの入力項目は原則実装候補とする。

必須採用候補:

- SKU選択へ影響
- Price Dimension選択へ影響
- 課金数量へ影響
- 月額へ直接影響
- 主要利用方式を切り替える
- Calculator上の主要見積条件

Project Region等の共通項目は重複実装しない。

省略可能なのは、料金意味へ影響しないUI専用項目、完全重複項目、対象外購入プラン等に限定する。

安全に算定できない場合は、次の順序で対応する。

1. 既存Definition / Mapping DSLで表現
2. Component分割
3. サービス固有Pricing Mapping追加
4. generic Mapping DSLの小規模拡張
5. Pricing Limitationとして明示
6. それでも不可なら未対応として明示

先頭SKU、最安SKU、類似SKUへのfallbackは禁止する。

---

## 7. Definitionへの分類

### 7.1 Profile

料金方式またはComponent構成が大きく変わる利用方式だけを分ける。

### 7.2 selector

「何を使うか」を選択する入力。

例:

- engine
- operating system
- deployment option
- instance type
- storage class
- architecture

### 7.3 usageInput

「どれだけ使うか」を示す入力。

例:

- hours/month
- quantity
- GB-month
- requests/month
- vCPU-hours
- GB-hours

### 7.4 Pricing Component

独立課金メーター単位で分割する。

例: EC2

```text
instance
EBS storage
EBS IOPS
monitoring
data transfer
public IPv4
```

UIセクション境界とComponent境界は1:1でなくてよい。

---

## 8. Pricing Mapping作成手順

各Pricing Componentについて、Public Price List実データを直接確認してMappingを作る。

### 8.1 price source確定

最初に、対象Componentがどの`serviceCode`から料金を取るか確定する。

Service全体と異なるprice sourceを使ってよい。

例:

```text
App Service: EC2
  instance      -> AmazonEC2
  data transfer -> AWSDataTransfer
```

### 8.2 Product候補調査

対象regionのPublic Price Listから候補Productを抽出し、実際の属性値を確認する。

最低限確認する候補field:

- productFamily
- operation
- usageType
- attributes.*

まず候補を広く取得し、料金意味を確認してから安定した識別条件へ絞る。

### 8.3 Dimension調査

対象ProductのOn-Demand TermとPrice Dimensionsについて確認する。

- unit
- description
- beginRange
- endRange
- free allowanceの有無
- tier構造
- 複数paid dimensionの有無

### 8.4 Mappingへ固定

意味を確認した結果を、サービス固有Pricing Mappingとして保存する。

原則としてSKU ID / rateCode固定ではなく、意味を識別できる属性条件を保存する。

概念例:

```json
{
  "id": "ebs-gp3-storage",
  "componentId": "ebs-storage",
  "priceSource": {"serviceCode": "AmazonEC2"},
  "productMatchers": [
    {"field": "productFamily", "op": "eq", "value": "Storage"},
    {"field": "attributes.volumeApiName", "op": "eq", "value": "gp3"}
  ],
  "dimensionMatchers": [
    {"field": "unit", "op": "in", "values": ["GB-Mo", "GB-month"]}
  ],
  "expect": {
    "products": 1,
    "billableDimensions": 1
  }
}
```

### 8.5 alias / 表記揺れ

`GB-Mo` / `GB-month`等、同一意味であることを確認したサービス固有表記揺れはMappingへ記述する。

1サービスの都合だけでgeneric normalizerを変更しない。

### 8.6 Mapping検証

作成したMappingについて、最低限次を確認する。

- 0件にならない
- 複数件にならない
- 類似する別料金を拾っていない
- selector変更で期待する料金へ切り替わる
- unitがCalculation DSLと整合する
- 対応regionで成立する
- source overrideが他Componentのfilterに汚染されない

---

## 9. SKU / rateCode固定禁止

`sku` / `rateCode`固定は原則禁止する。

固定すべきなのはIDではなく、料金意味を識別する契約である。

優先して使用する:

- productFamily
- operation
- usageType
- attributes.*
- unit
- beginRange / endRange

ID固定が不可避な場合は理由を記録し、AWS側変更時はfail-closedとする。

---

## 10. Calculatorからの取り込み手順

新サービスごとに最低限次を調査する。

1. Calculator URLを特定
2. レンダリング済み画面を確認
3. 全primary入力を列挙
4. Advanced入力を列挙
5. 条件変更で現れる入力を確認
6. defaults / options / dependencies確認
7. On-Demand対象外の購入プラン項目を除外
8. Project共通項目を除外
9. Profile / selector / usageInput / Componentへ分類
10. 各ComponentのPublic Price List実データを取得
11. 各Componentについてprice sourceを確定
12. Product候補とattributesを調査
13. On-Demand Dimensionを調査
14. AWS公式docsと突き合わせ料金意味を確定
15. Pricing Mappingを作成
16. Mappingを実Price Listへ適用して一意解決を確認
17. Limitation / ignored範囲を整理
18. Golden Caseを作成

**手順10〜16は省略不可**とする。

「後段のgeneric semantic resolverが判定するはず」として意味未確定の候補を残してはならない。

---

## 11. 新サービス追加の標準作業フロー

```text
ユーザー: 「AWS <Service>を追加して」
        |
        v
[1] latest main / AGENTS / source-of-truth docs確認
        |
        v
[2] Calculator URL特定・レンダリング済みUI調査
        |
        v
[3] primary / advanced / conditional input棚卸し
        |
        v
[4] On-Demand固定ポリシーで採用入力決定
        |
        v
[5] Profile / Component / selector / usageInput設計
        |
        v
[6] AWS Public Price List実データ取得
        |
        v
[7] Componentごとにprice source / Product / Dimension候補調査
        |
        v
[8] AWS公式docsと突合して料金意味を確定
        |
        v
[9] ComponentごとのPricing Mapping作成
        |
        v
[10] Mappingを実データへ適用して一意解決検証
        |
        v
[11] Service Definition / UI実装
        |
        v
[12] coverage / limitation整理
        |
        v
[13] unit / Mapping / Definition / Golden test追加
        |
        v
[14] repository-level validation / E2E実行
        |
        v
[15] failureを修正して成功まで反復
        |
        v
[16] commit / push
        |
        v
[17] GitHub Actions確認
        |
        v
[18] Price DB build / validation / publish
        |
        v
[19] Pages deploy確認
        |
        v
[20] 公開版代表操作確認
```

途中の通常の実装判断についてユーザーへ確認を求めない。

---

## 12. scheduled price updateで行うこと

scheduled updateは意味推論を行わない。

```text
AWS Price List取得
-> Pricing Mapping読込
-> Mapping適用
-> Product cardinality検証
-> Dimension cardinality検証
-> invariant / unit検証
-> Price DB生成
-> drift分類
-> publish
```

Mappingが成立しない場合はpublishを停止して現在のactive buildを維持する。

代表例:

- 0 Product
- 2+ Product
- unit変更
- 必須attribute消失
- price source構造変更
- 非tier複数paid dimension

この失敗はgeneric resolverを修正して無理に通すのではなく、対象サービスのMapping再調査対象とする。

---

## 13. Coverage

`coverage.json`は対象Serviceの意図的な料金範囲を記録する。

- `mapped`: Pricing Mappingあり
- `ignored`: 対象外。理由必須
- `unresolved`: 実装途中のみ許可

完成時は`unresolved = 0`。

scheduled updateで未知カテゴリを検出しても、自動的に既存Componentへ分類しない。

必要ならwarning / breaking driftとして出し、再オンボーディングでMappingを追加する。

---

## 14. Validation

最低限次を検証する。

### Layer 1: Schema

- Definition schema
- Pricing Mapping schema
- required / enum / ID

### Layer 2: Reference / Dependency

- Profile / Component参照
- Mapping -> Component参照
- valueFrom
- dependency DAG

### Layer 3: Mapping / Price Data

- price source存在
- Product一意解決
- Dimension一意解決
- selector attribute存在
- accepted unit
- coverage
- limitation

### Layer 4: Golden / behavior

- representative selector variation
- usage variation
- enabledWhen
- billing transform boundary
- resolved semantic attributes
- Component amount
- Service total

新ServiceはERROR 0件を完成条件とする。

---

## 15. Golden Case

Goldenは最終金額だけでなく解決経路を検証する。

```text
input
-> Pricing Mapping
-> price source
-> matched Product semantics
-> Dimension
-> billing quantity
-> Component amount
-> Service total
```

SKU ID自体は原則normative assertionにしない。

---

## 16. Web版ChatGPT Projectでの標準依頼

以下の短い依頼を完全なオンボーディング依頼として解釈する。

```text
AWS Fargateを追加して
```

```text
Amazon DynamoDBを追加して
```

```text
Lambdaの見積項目を公式Calculator相当にして
```

明示的な限定がない限り、次を含む。

- current repository確認
- Calculator URL特定
- rendered UI調査
- AWS公式資料調査
- Public Price List実データ調査
- Pricing Mapping作成
- Definition / UI実装
- tests
- Price DB validation/build/publish
- commit/push
- Actions確認
- Pages deploy確認
- failure時の継続修正

「Definitionだけ追加する」という意味には解釈しない。

---

## 17. 人間へ質問してよい条件

通常は追加質問なしで進める。

停止してよいのは次のような場合に限定する。

- AWS公式資料同士が矛盾し、安全な料金意味を決定できない
- Calculator / docs / Public Price Listのいずれからも意味を確定できない
- Calculator URL / UIをどうしても特定できない
- 既存DSLの意味変更が不可避で製品判断が必要
- 外部権限不足でcommit/publish/deploy不能

次はblockerではない。

- Price Listが巨大
- 項目が多い
- testが失敗した
- Mappingが一度で一意にならない
- CalculatorがSPA

候補を調査し、Mappingを改善して続行する。

---

## 18. 完成条件

新サービス追加は最低限以下を満たして完了とする。

- Calculator主要On-Demand入力を棚卸し済み
- Calculator URL特定済み、または不能理由記録済み
- rendered UI確認済み、または未確認範囲明示済み
- 各課金Componentが定義済み
- 各Componentのprice sourceが確定済み
- Public Price List実データを調査済み
- 各ComponentにPricing Mappingが存在
- Mappingが対応regionで一意に成立
- 不要なSKU/rateCode固定がない
- ambiguous / missing料金をfallbackで隠していない
- coverageの`unresolved = 0`
- representative Golden CaseがPASS
- generic Pricing Coreの既存testを壊していない
- required Actions成功
- 必要ならvalidated Price DBがpublish済み
- Pages deploy成功
- 公開版で追加・編集・再計算できる

Calculatorとの金額比較はsanity checkとして使用してよいが、Calculator表示額を料金正本にはしない。

---

## 19. 既存サービスの拡充 / 移行

既存サービスについて入力不足、Mapping不足、generic semantic rule依存が見つかった場合も本手順を適用する。

移行優先順位:

1. 現在のComponentとPrice Queryを確認
2. 実際に利用しているPublic Price List候補を列挙
3. 各Componentの意味を再確認
4. サービス固有Pricing Mappingへ固定
5. generic semantic workaroundを不要にできるか確認
6. Golden / Actionsで回帰確認

既存generic ruleは、全対応サービスのMappingへ移行できたことを確認してから削除する。

一括でPricing Coreを書き換えて全サービスを同時破壊する移行は避ける。

---

## 20. Service onboarding作業モード

Service onboardingには、次の2つの正式な作業モードを定義する。

### 20.1 New Service Onboarding

未実装のAWSサービスを新たに追加する場合の標準モード。

代表的な依頼:

```text
AWS <Service>を追加して
```

このモードでは、本書の新サービス追加フローを最初から最後まで実行する。

### 20.2 Existing Service Re-onboarding

既に実装済みのAWSサービスを、現在の仕様・現在のAWS Pricing Calculator・現在のAWS Public Price Listに基づいて再構築するモード。

代表的な依頼:

```text
既存のAWS <Service>を現行仕様で再オンボーディングして作り直して
```

このモードは、旧Definitionや旧Pricing Mappingへ差分修正を加えるだけの作業ではない。

原則:

1. 既存Definition、Pricing Mapping、Price Query、adapter、fallback、サービス固有workaroundを正しいものと仮定しない
2. 現在のCalculator UIを基準にprimary / advanced / conditional fields、defaults、dependenciesを再調査する
3. 現在のOn-Demand固定ポリシーに基づき採用入力を再決定する
4. Profile / selector / usageInput / Pricing Componentを再設計する
5. 各Pricing ComponentについてPublic Price List実データを改めて調査する
6. serviceCode / Product属性 / Price Dimension / unit / rangeをAWS公式資料と突き合わせ、料金意味を再確定する
7. 現行方式のサービス固有Pricing Mappingを新規作成または全面的に見直す
8. Mappingを実Price Listへ適用し、一意解決を確認する
9. Definition / UI / Calculation / coverage / limitation / Golden Case / testsを現行仕様へ合わせる
10. 旧実装だけに必要だった定義、fallback、compatibility code、workaroundは不要性を確認して削除する
11. Project / Plan / 保存復元などサービス外の共通仕様との互換性は維持する
12. Price DB build / validation / publish、Actions、Pages、公開版代表操作まで確認する

判断基準は、**「既存実装との差分を埋める」ではなく「現在このサービスを新規追加するとしたらどう実装するか」**とする。

既存実装は比較材料、回帰確認材料、移行時の影響範囲把握には使用してよいが、現在のCalculator UIやsource-of-truth仕様と矛盾する旧挙動を維持する理由にはしない。

再オンボーディング完了時には、最低限次を整理して報告する。

- 旧実装から変更した主要点
- 削除した旧仕様 / 旧ロジック / workaround
- 現在対応しているPricing Component
- 意図的に対象外とした入力 / 料金項目と理由
- Mapping / Golden / repository validation / Actions / Pagesの確認結果

既存generic ruleを削除する場合は、そのruleを利用している他サービスへの影響を確認し、必要なサービスがすべてサービス固有Mappingへ移行済みであることを確認してから削除する。