# Pricing Architecture Specification — Decision 28

最終更新: 2026-10-04

本書は `docs/PRICING_ARCHITECTURE.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_09_14.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_15_16.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_17.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_18_20.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_21_25.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_26_27.md` の続編として、Decision Bundle 28で確定した新規AWSサービス追加時の Service / Profile / Pricing Component 分解規則と、自動解析レポート要件を定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. 目的

未収録AWSサービスの追加をChatGPT等で自動化する際、AWS Public Price Listや公式ドキュメントから取得した料金構造を、毎回恣意的にService / Profile / Pricing Componentへ分けるのではなく、共通の判定規則でDefinitionへ変換できるようにする。

標準フローは既存Decision 09の以下を維持する。

```text
対象サービス指定
  -> AWS Public Price List解析
  -> AWS公式Pricing / Docs調査
  -> AWS Pricing Calculator UI調査
  -> Service / Profile / Component候補生成
  -> generic DSL適合性判定
  -> Definition JSON生成
  -> CI / Golden Case validation
  -> Pull Request
  -> 人間レビュー / merge
```

---

## 2. Service境界

Serviceは、ユーザーがAWS上で独立したサービスとして認識し、見積へ追加・比較するのが自然な単位とする。

例:

- EC2
- Lambda
- S3
- RDS
- Aurora

AWS Public Price Listの`serviceCode`とアプリ上のServiceは必ずしも1:1でなくてよい。

例:

```text
Price Source: AmazonRDS
  -> App Service: RDS
  -> App Service: Aurora
```

Service分割の強い根拠は以下とする。

- AWS公式で別サービス名として扱われている
- AWS Pricing Calculator等でも独立サービスとして扱われる
- 主要料金体系が明確に異なる
- ユーザーが別サービスとして追加・比較するのが自然

以下だけを理由にServiceを分けない。

- instance family差
- engine差
- Storage Class差
- 単なるSKU属性差

---

## 3. Profile境界

Profileは、同一Service内で利用方式を切り替えると主要Pricing Component構成または主要課金方式が変わる場合に作る。

例:

```text
Aurora
  -> Provisioned
  -> Serverless v2
```

ProvisionedとServerless v2のように、主要料金メーターが変わる場合はProfile分割する。

一方、Component構成が同じで、商品選択条件だけが変わる場合は原則selectorとする。

例:

```text
MySQL / PostgreSQL
```

が同一Component構造で表現できるならProfile分割しない。

単なるselector差をProfileへ昇格させない。

---

## 4. Pricing Component境界

Pricing Componentは、Decision 27に従い以下を基本定義とする。

> 1 Pricing Component = 1種類の課金メーター

別Component候補とする強い条件:

- usage単位が異なる
- ユーザーが使用量を独立して入力できる
- Price Queryが別になる
- SKU / productFamily / operation / usagetypeの課金群が別になる
- 一方のusage変更が他方の料金へ直接影響しない
- 料金内訳として独立表示するのが自然

例:

```text
Lambda
  -> Requests
  -> Duration
```

```text
S3
  -> Storage
  -> GET Requests
  -> PUT Requests
  -> Data Transfer
```

```text
RDS
  -> DB Instance
  -> Storage
  -> I/O
  -> Backup
```

複数SKUや複数の意味的に異なるPrice Dimensionを1 Componentへ無理に押し込まない。

---

## 5. selector / usageInput / fixedFilter

### 5.1 selector

selectorは「何を使うか」を決定する入力とする。

例:

- instanceType
- operatingSystem
- tenancy
- databaseEngine
- storageClass

selectorは主として同一Component内でSKUを選び分ける条件に使用する。

### 5.2 usageInput

usageInputは「どれだけ使うか」を決定する入力とする。

例:

- quantity
- hoursPerMonth
- storageGB
- requestsPerMonth
- dataTransferGB

### 5.3 fixedFilter

ユーザーへ選択させる必要がなく、そのDefinitionでは常に固定する料金条件はfixedFilterとする。

例:

```text
purchaseOption = OnDemand
```

また、本アプリがShared tenancyのみを対象とするService/Profileであれば、tenancyをfixedFilterとして固定できる。

### 5.4 hidden / advanced selectorとの違い

以下を区別する。

```text
fixedFilter
= Definition上の対象範囲として常時固定

hidden / advanced selector
= 状態として存在し、将来または詳細UIでは選択可能だが通常UIでは露出しない
```

完全に対象外とする条件はfixedFilterを優先する。

---

## 6. 新サービス解析アルゴリズム

新規Service追加時は、対象`serviceCode x region`のPrice Listから少なくとも以下を抽出する。

- productFamily
- operation
- usagetype
- unit
- beginRange / endRange
- 主なattributes
- attribute値集合
- SKU数
- Price Dimension構造

その後、以下の順で分類する。

```text
1. usage unitごとに料金構造を分類
2. productFamily / operation / usagetypeで課金群を分割
3. 独立課金群ごとにComponent候補を作る
4. Component内SKU差分属性をselector候補とする
5. 使用量を決める値をusageInput候補とする
6. 常時固定できる条件をfixedFilterへ移す
7. Component構成や主要課金方式が変わる利用方式をProfileへ分ける
8. AWS上の独立サービス概念が異なる場合はServiceを分ける
```

---

## 7. AWS Pricing Calculator UIの位置付け

AWS Pricing Calculator UIは料金値や料金構造の正本にしない。

Price Listから生成したモデル候補に対して、以下を確認する補助情報源として使用する。

- 実際にどの入力をユーザーへ求めているか
- selector / usage inputの依存関係
- default値
- 説明文
- primary / advanced相当の入力優先度

つまりCalculator UIは、Price Listから作成した料金モデルの意味確認・UI設計補助として使用する。

DOM selector / CSS class / XPath等は本番Definitionへ保存しない。

---

## 8. 迷った場合の原則

曖昧な場合は、Pricing Engineへ特殊処理を追加するよりDefinition境界を見直す。

特に以下を優先する。

> 1 Component = 1種類の課金メーター

複数SKUや複数異種Dimensionを1 Componentへ押し込む設計は避ける。

Profileを増やせば解決する場合はProfile分割を検討し、Componentを分ければ解決する場合はComponent分割を優先する。

---

## 9. adapter採用条件

まず以下の組み合わせで表現できるか確認する。

```text
selector
+ usageInput
+ fixedFilter
+ singleSku
+ single billable dimension
+ bounded transform
+ Component合算
```

adapter候補とするのは、上記およびProfile / Component分割でも正しく表現できない料金体系のみとする。

adapterを採用する前に、少なくとも以下を確認する。

- Component分割不足ではないか
- Profile分割で解決できないか
- selector / fixedFilter不足ではないか
- generic transformで表現できないか

adapter使用時は、generic DSLでは表現不能な理由をPR解析レポートへ記録する。

---

## 10. ChatGPT自動解析レポート

新サービス追加時、Definition JSONだけでなく構造解析レポートを生成する。

最低限以下を含める。

```text
Service
Price Source / serviceCode
Region

Profiles
Components
  - label / id
  - usage unit
  - matched productFamily / operation / usagetype
  - SKU expectation
  - Price Dimension expectation

Selectors
Usage inputs
Fixed filters
Pricing Limitations
Adapter有無
Unmapped pricing categories
```

概念例:

```text
Service: Amazon EFS
Price Source: AmazonEFS
Region: ap-northeast-1

Profiles:
- Standard

Components:
- Storage
  unit: GB-Mo
  SKU expectation: singleSku

- Infrequent Access
  unit: GB
  SKU expectation: singleSku

Selectors:
- storageClass

Limitations:
- free-tier: ignored

Adapter:
- not required
```

このレポートはPRまたはCI Summaryから人間が確認できるようにする。

---

## 11. 人間レビュー

新規Service追加の自動化終点は原則Pull Request作成までとする。

merge前に最低限以下をレビューする。

- Service境界が妥当か
- Profile境界が妥当か
- Pricing Component分割が妥当か
- selector / usageInput / fixedFilter分類が妥当か
- Price Queryが`singleSku`へ一意に解決するか
- Price Dimension解決がDecision 27に適合するか
- Pricing Limitation漏れがないか
- adapterが不要に導入されていないか

Golden Case / CI validation成功だけを理由に自動mergeしない。

---

## 12. 本Decisionで確定した事項

1. Serviceはユーザーが独立AWSサービスとして認識する単位とする。
2. `serviceCode`とServiceは1:1でなくてよい。
3. Profileは主要Component構成または主要課金方式が変わる場合だけ分ける。
4. 単なるSKU属性差はProfileにせずselectorとする。
5. Pricing Componentは「1種類の課金メーター」とする。
6. usage単位・Price Query・課金群が異なる料金要素は別Componentにする。
7. selectorは「何を使うか」を表す。
8. usageInputは「どれだけ使うか」を表す。
9. fixedFilterはDefinition上常時固定する料金条件とする。
10. hidden / advanced selectorは状態として存在するが通常UIで露出しない条件とする。
11. AWS Pricing Calculator UIはPrice Listから作った構造の意味確認に使う。
12. 複数SKU / 複数異種Dimensionを1 Componentへ押し込まない。
13. adapter採用前にComponent / Profile分割で解決できないか確認する。
14. ChatGPTはDefinitionと同時に構造解析レポートを生成する。
15. PR merge前に人間がService / Profile / Component境界をレビューする。

---

## 13. 次に決定する事項

次は、この判定規則を使って新規AWSサービス追加をChatGPTからGitHubまで一気通貫で実行する運用を定義する。

具体的には以下を決める。

- ユーザーが「EFSを追加して」と依頼した後の自動処理順序
- AWS公式情報収集の範囲
- 一時Price DB生成方法
- Definition / Golden Case生成方法
- branch / commit / PR作成単位
- CI失敗時の自動修正範囲
- どの段階で人間確認を要求するか
