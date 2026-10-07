# Service-Specific Pricing Mapping Architecture

最終更新: 2026-10-07

本書は、AWS Public Price List上の料金項目を本アプリのPricing Componentへ対応付ける方法、およびPrice DB更新時の検証責務を定義する正本である。

`docs/PRICING_ARCHITECTURE.md` のPricing Core、Calculation DSL、Price DB publication model等は引き続き有効とする。ただし、AWS料金項目の意味解釈、semantic filtering、coverage/finalizeの責務について本書と競合する場合は、本書を優先する。

---

## 1. 背景と設計方針

従来設計では、AWS Public Price Listから取得した多数のProduct / SKU / Price Dimensionについて、generic normalizer、semantic filter、coverage、finalize等の共通処理を用いて全サービス共通の意味解釈を行う方向に寄っていた。

しかしAWS Public Price Listでは、サービスごとに以下が異なる。

- `productFamily`
- `operation`
- `usageType`
- `attributes.*`
- Price Dimensionの`unit`
- description表現
- 同一意味の別表記
- serviceCodeをまたぐ料金項目
- 例外的なoverride source

これらをすべて共通ロジック側で意味解釈しようとすると、あるサービスへの対応が別サービスへ影響しやすく、semantic validation / finalizeが複雑化する。

本設計では、**AWS料金の意味理解は新サービス取り込み時に一度行い、その結果をサービス固有のPricing Mappingとして保存する**。

定期Price DB更新時には意味を再推論せず、保存済みMappingが現在のPublic Price List上でも成立するかだけを決定論的に検証する。

---

## 2. 責務分離

### 2.1 サービス取り込み時

ChatGPT / Codex等の実装担当が、以下を突き合わせて料金意味を理解する。

- AWS Pricing Calculatorのレンダリング済み実画面
- AWS公式pricing page / service documentation
- AWS Public Price Listの実データ

その結果をService DefinitionとPricing Mappingとしてrepositoryへ固定する。

LLMによる意味理解はこの工程で使用してよい。

### 2.2 定期Price DB更新時

GitHub Actions上の処理はLLMに依存しない。

実行するのは次だけとする。

1. AWS Public Price Listを取得する
2. 保存済みPricing Mappingを適用する
3. Mappingが期待するProduct / Dimension cardinalityと意味上の不変条件を検証する
4. 成立すればPrice DBを生成する
5. 成立しなければfail-closedでpublishを停止する

定期更新処理が未知の料金カテゴリの意味を推測してMappingを自動生成してはならない。

---

## 3. 共通化するもの / しないもの

### 3.1 共通化するもの

- Mapping schema
- filter evaluator
- selector値の参照
- cardinality検証
- unit alias照合
- Dimension selection
- Price DB generation
- drift detection
- report / issue format
- Golden verificationの実行基盤

### 3.2 共通化しないもの

以下の意味判断を全サービス共通ロジックへ埋め込まない。

- ある`usageType`が何の料金を意味するか
- ある`productFamily`がどのComponentに属するか
- サービス固有のunit表記揺れ
- どのattributesの組み合わせで目的の料金を識別するか
- serviceCodeをまたぐComponentがどのprice sourceを使うか

これらはサービス固有Mappingへ記述する。

### 3.3 禁止事項

- サービス名による巨大な`if/else`をShared Pricing Coreへ追加する
- unknown SKUを先頭/最安/類似SKUで補完する
- 定期更新時にheuristicで新カテゴリを既存Componentへ自動分類する
- LLMをscheduled price updateの必須runtime dependencyにする

---

## 4. Service package構造

標準構造を次のように拡張する。

```text
services/
  <serviceId>/
    service.json
    profiles/
      <profileId>.json
    components/
      <componentId>.json
    pricing-mappings/
      <mappingId>.json
    golden/
      ...
    coverage.json
    adapter.js          # 必要な場合のみ
```

Pricing Mappingは、アプリ上の料金ComponentとAWS Public Price List上の料金項目の意味的対応関係を表す。

1 Componentに複数の独立料金メーターがある場合は、原則としてComponentを分割する。それでも複数Mappingが必要な場合は明示的に複数Mappingを参照する。

---

## 5. Pricing Mappingの論理モデル

概念例:

```json
{
  "schemaVersion": 1,
  "id": "ebs-gp3-storage",
  "componentId": "ebs-storage",
  "priceSource": {
    "serviceCode": "AmazonEC2"
  },
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

上記は概念例であり、実際のschema field名は実装時に既存Price Query DSLと整合させてよい。

重要なのは、**SKU IDやrateCodeそのものではなく、料金の意味を識別する安定属性をMappingとして保存すること**である。

---

## 6. SKU / rateCode固定の扱い

`sku`、`rateCode`の固定依存は原則禁止する。

理由:

- AWS側でSKUが差し替わる可能性がある
- region追加やProduct再編でIDが変わり得る
- 同じ意味の料金を追従できなくなる

Mappingには可能な限り以下を使用する。

- productFamily
- operation
- usageType
- attributes.*
- unit
- beginRange / endRange
- description（他の安定属性で識別不能な場合に限定）

例外的にID固定が不可避な場合は、理由をMappingまたは調査記録へ残し、drift時にfail-closedとする。

---

## 7. 表記揺れとalias

同一意味であることを取り込み時に確認できた表記揺れは、generic normalizerへ追加するのではなく、原則として対象サービスのMappingで受け入れる。

例:

```json
{
  "field": "unit",
  "op": "in",
  "values": ["GB-Mo", "GB-month"]
}
```

generic aliasとして扱ってよいのは、AWS全体で意味が同一であることを十分に確認でき、サービス固有例外を生まないものだけとする。

---

## 8. price source override

1つのApp Serviceが複数のAWS Price List `serviceCode`を利用することを許可する。

price sourceはService全体だけでなくMapping単位で指定可能とする。

例:

```text
App Service: EC2
  instance      -> AmazonEC2
  EBS           -> AmazonEC2
  data transfer -> AWSDataTransfer
```

あるMappingへ指定したprice sourceに、別Mappingのproduct filterやsemantic prefilterを暗黙適用してはならない。

各Mappingは自身のprice sourceとmatcherだけで候補を決定する。

---

## 9. Mapping作成時の意味確認

新規Mappingを作成するときは、実データを使って少なくとも以下を確認する。

1. 対象regionに候補Productが存在する
2. 採用matcherで目的の料金だけへ絞れる
3. Product属性がCalculator上の入力条件と対応する
4. On-Demand Termを特定できる
5. Price Dimensionを目的の課金メーターへ絞れる
6. unitがCalculation DSLのoutputUnitと整合する
7. Free Tier / tier / minimum billing等の制約を確認する
8. 類似する別料金を誤って拾っていない
9. 複数regionで同じ意味論が成立するか確認する
10. Golden Caseで代表条件の料金を検証する

LLMは候補探索と意味理解に使用できるが、最終Mappingはrepositoryに保存された決定論的データでなければならない。

---

## 10. Scheduled Price Updateの検証モデル

更新時フロー:

```text
AWS metadata check
-> raw Price List download
-> mechanical normalization
-> Mapping load
-> Mapping単位のProduct match
-> cardinality validation
-> Dimension match
-> semantic invariant validation
-> Price DB build
-> drift classification
-> publish
```

### 10.1 正常

Mappingの期待条件を満たす場合は新Price DBへ更新する。

### 10.2 PRICE_ONLY

Product/Dimensionの意味的識別結果が同一で単価だけ変わった場合。

-> publish可能。

### 10.3 STRUCTURE_WARNING

既存Mappingは一意に成立しているが、候補selector、新SKU等の周辺構造が増えた場合。

-> publish可能。ただしreportへwarningを出す。

### 10.4 MAPPING_BREAKING

例:

- 0 Product
- 2+ Product
- 0 billable Dimension
- 非tierの複数billable Dimension
- 必須attribute消失
- unitがMappingのaccepted values外へ変更
- price source構造変更
- Mappingが別料金を拾うようになった

-> publish禁止。active buildを維持する。

これは「汎用semantic resolverが失敗した」のではなく、**サービス取り込み時に確定した契約がAWS側変更により成立しなくなった**と解釈する。

---

## 10.5 Incremental drift validation

Scheduled Price Updateのdrift検証は、前回publish済みbuildを検証済みbaselineとして再利用し、変更局所性に従って不要な再検証を省略する。

検証対象は次の順序で絞り込む。

```text
pricing contract / service Definition fingerprint
-> serviceCode
-> region
-> relevant SKU
-> reachable case
```

規則:

1. build manifestへglobal pricing contract fingerprintとservice単位Definition fingerprintを保存する。
2. global pricing contractが変化した場合、または旧buildにfingerprintが存在しない場合はfail-safeで全price sourceを再検証する。
3. service固有Definition / Pricing Mappingだけが変化した場合、そのserviceが実際に参照するprice sourceだけをDefinition refresh対象とする。Mappingのcomponent override sourceも含める。
4. Definition変更もAWS source変更もないserviceCode/regionはdrift task自体を作成しない。
5. AWS source versionが変化しても、semantic validationがpublish対象として選択したSKU集合のnormalized Product/Dimension内容が前buildと完全一致するregionはdrift評価を再実行せずreuseする。
6. SKU集合とsemantic structureが同一で単価だけが変化した場合は、変更SKUを含まないreachable caseをreuseし、変更SKUへ到達し得るcaseだけを再評価する。
7. SKU追加/削除、attribute、unit、range、dimension構造等のsemantic changeがある場合はprice-only shortcutを使用せず、そのtaskを通常どおり再検証する。
8. normalized product chunkにはcontent SHA-256を記録し、同一chunkを機械的に識別可能にする。chunk fingerprintは診断・将来のより細粒度なreuseにも使用できるが、fingerprint一致が確認できない場合は再検証側へ倒す。
9. reuseは常にfail-closedとする。必要なfingerprint、baseline、SKU集合、semantic equalityのいずれかを確認できない場合はskipしてはならない。

この最適化は検証意味論を変更しない。省略できるのは「前回成功済みで、入力契約と対象料金内容が同一であることを決定論的に証明できる処理」だけである。

### 10.6 修復・再生成時のValidation Scope保全

Price DB破損、publish不具合、builder/finalize不具合等を修復する場合も、既存のincremental / onboarding scope制御を無条件に解除してはならない。

特に、**「Price DBを再生成する必要があること」と「全Serviceのsemantic validationを再実行する必要があること」は別の判定**として扱う。

規則:

1. 修復着手前に、現在のworkflowでvalidation scopeを決定している入力・fingerprint・`PRICE_UPDATE_SCOPE_SERVICE_IDS`・`effectiveValidationSourceCodes`等を確認する。
2. 変更がmaterialization / chunking / publication / retention等の**格納・公開方法だけ**に関係し、Pricing Mapping、selector到達性、Product/Dimension解決意味論を変えない場合、その変更だけを理由にsemantic validationを全Serviceへ拡大してはならない。
3. DB再生成を強制するためのfingerprintを追加・変更するときは、そのfingerprintがsemantic scope判定にも使われていないかを確認する。semantic意味論とbuild/publication意味論は必要に応じて別fingerprintへ分離する。
4. onboarding / re-onboardingのscoped runでは、対象Service、当該Definition変更で影響を受けるprice source、および同時にAWS側変更が確認されたsourceだけを重いsemantic validation対象とする。対象外sourceは直前の検証済みbuildから保持し、空集合としてpublishしてはならない。
5. 修復用変更をmergeする前に、semantic planのsummaryまたは同等のdry-planを確認し、`scope = all`、想定外Serviceの追加、case数・batch数の急増が発生していないか確認する。
6. 想定外にEC2等の大規模Serviceがscopeへ入った場合は、その全件再検証が修復対象の意味論変更に本当に必要であることを説明できない限り、実行をそのまま正当化せずscope判定を修正する。
7. active Price DB自体が破損しており全sourceのデータ再取得・再materializeが必要な場合でも、既存の検証済みsemantic結果を安全に再利用できるsourceまで全reachable caseを再評価する必要はない。再取得範囲、再生成範囲、semantic再検証範囲を分離する。
8. scope制御またはpublish selectionを修正した場合は、少なくとも「対象sourceだけ再検証されること」と「対象外sourceが保持されること」の回帰testを追加する。
9. fail-safeは「不明なら全semantic再検証」と短絡させず、まず何が不明なのかを分類する。semantic契約の安全性が不明な場合のみsemantic側を広げ、単なるpublication実装変更ではbuild側だけを広げる。

修復時の原則は次とする。

```text
原因修正
-> 既存scope制御への影響分析
-> DB再取得 / 再生成 / semantic再検証の必要範囲を別々に決定
-> planで対象Service・case数を確認
-> narrow regression test
-> 必要最小scopeでActions実行
```

「修復を確実に走らせるため」という理由だけでglobal semantic fingerprintを変更し、全Service validationへ退化させてはならない。

---

## 11. semantic validation / finalizeの責務変更

従来のsemantic validation / finalizeに、次の責務を持たせない。

- 未知カテゴリの意味推論
- すべてのサービスに通用する料金分類
- override sourceと通常sourceをまたぐheuristic filtering
- unit表記から料金意味を推測する処理

今後のvalidation/finalizeは次を行う。

```text
Definition + Pricing Mapping
        +
current AWS Public Price List
        ↓
Mappingが現在も成立しているか検証
        ↓
成立: buildへ採用
不成立: 明示的error
```

finalizeは「候補から意味的に正しそうな料金を選ぶ工程」ではなく、**検証済みMappingに基づくPrice DB materialization / publication preparation**を主責務とする。

---

## 12. Coverageの扱い

`coverage.json`は、Public Price List上の全カテゴリを汎用ロジックで分類するためのものではなく、**対象Serviceで意図的に扱う料金範囲を記録する契約**として扱う。

分類:

- `mapped`: Pricing Mappingに明示的に対応する
- `ignored`: 本ツールのスコープ外。理由必須
- `unresolved`: 取り込み作業中のみ許可

新サービス完成時は`unresolved = 0`を必須とする。

ただし、AWSが後から追加した未知カテゴリを、scheduled updateが自動で既存Componentへ分類してはならない。未知カテゴリはwarningまたはbreaking driftとして報告し、必要ならサービス再オンボーディングでMappingを追加する。

---

## 13. Shared Pricing Coreの位置付け

Shared Pricing Coreは引き続きgenericである。

共通Coreが知るのは以下だけとする。

- Mapping/Price Queryの評価方法
- selector値の参照方法
- Product/Dimension cardinality
- Calculation DSL
- Decimal計算
- Tier/Free policy
- issue format

Shared Pricing Coreは「EC2とは何か」「RDSのStorageとは何か」を知らない。

サービス固有の意味は`services/<serviceId>/`配下のDefinition / Pricing Mappingに閉じ込める。

---

## 14. 変更局所性

新しい料金表現へ対応するときの優先順位:

1. 対象サービスのPricing Mappingを修正
2. 対象サービスのComponent/Definitionを修正
3. 共通schemaで表現できない場合のみMapping DSLを小規模拡張
4. Calculation model自体が新規の場合のみPricing Coreを拡張

あるサービス固有のPrice List表現に対応するためだけに、他サービスへ影響するgeneric semantic ruleを追加してはならない。

---

## 15. 完成条件

Pricing Mapping対応済みServiceは少なくとも以下を満たす。

- 各課金Componentに対応するMappingが存在する
- Mappingの根拠となるCalculator/公式docs/Public Price List調査が完了している
- SKU/rateCode固定へ不必要に依存していない
- 対応regionで一意に解決できる
- accepted unit / source override等のサービス固有差異がMappingへ閉じている
- Golden Caseが通る
- scheduled updateで意味推論を必要としない
- AWS側drift時はfail-closedする

この条件を満たした時点で、当該サービスの料金意味解釈は「実行時処理」ではなく「オンボーディング済み設定」として扱う。
