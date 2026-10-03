# Pricing Architecture Specification — Decisions 45–48

最終更新: 2026-10-04

本書は既存の Pricing Architecture Specification 群の続編として、未文書化だったDecision 45と、残存する内部仕様をDecision 46〜48の3項目に集約して定義する。

これにより、Pricing Architectureの設計検討フェーズを概ね完了し、以後は実装計画・実装・検証へ移行する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Decision 45 — Browser Price DB Loader / Cache

### 1.1 PriceDataStore

Browser runtimeでは、1タブにつき1つの`PriceDataStore`を生成する。

`PriceDataStore`は少なくとも以下を保持する。

- pinned `buildId`
- `build-manifest.json`
- serviceCode × region単位のProduct cache
- serviceCode × region単位のIndex cache
- in-flight request map
- resource status

個別Service Instanceから直接Price DBを`fetch()`してはならない。

### 1.2 build pinning

Browser起動時に以下を行う。

```text
manifest.json
-> activeBuildId
-> builds/<activeBuildId>/build-manifest.json
-> PriceDataStore初期化
```

同一タブ内では、その後`manifest.json`を再評価して別buildへ自動切替しない。

ページ再読み込み時にのみ最新manifestを取得し直す。

### 1.3 cache key

Price Data cache keyは以下とする。

```text
buildId + serviceCode + region
```

同一build・serviceCode・regionを利用する複数Service Instanceは同じPrice Dataを共有する。

### 1.4 products / index cache分離

以下を別cacheとする。

- `products.json`
- `index.json`

Catalog / selector候補表示ではindexのみを先に取得可能とし、料金計算が必要になった時点でproductsをlazy loadする。

### 1.5 in-flight request deduplication

同じresourceへの同時fetchは1本にまとめる。

結果だけでなくPromise自体をcacheし、後続requestは同じPromiseをawaitする。

fetch失敗時はin-flight cacheから削除し、retry可能にする。

### 1.6 URL生成責務

Price DB URL生成は`PriceDataStore`に集中させる。

概念API:

```text
getIndex(serviceCode, region)
getProducts(serviceCode, region)
```

Pricing Coreはnetwork accessを行わない。

### 1.7 resource validation

Price DB resource読込時に最低限以下を検証する。

- schemaVersion
- buildId
- serviceCode
- region

resource内buildIdがpinned buildIdと一致しない場合は`invalid`とし、cacheへ登録しない。

### 1.8 resource status

Price DB全体のglobal build statusに加え、serviceCode × region単位でresource statusを持つ。

代表状態:

- `loading`
- `available`
- `stale`
- `unavailable`
- `invalid`

局所resource failureは他serviceCode / regionへ波及させない。

ただし`build-manifest.json`自体がinvalidな場合はbuild全体をinvalidとする。

### 1.9 retry

初回取得失敗時は限定的な自動retryを許可する。

manual retryでも同じpinned buildを再取得し、retryを理由に最新manifestへ乗り換えない。

### 1.10 cache lifetime

初期版では、正常にロードしたPrice Dataはタブ終了までメモリcacheへ保持する。

LRU等のevictionは実装しない。

Price DB本体を`localStorage` / IndexedDB / Project JSONへ保存しない。

通常のBrowser HTTP cacheは利用してよい。

---

## 2. Decision 46 — Service Catalog / Definition Loading

### 2.1 Catalog生成物

Service Catalogは各`services/<serviceId>/service.json`からCI/build時に自動生成する。

Catalog用の手書きサービス一覧を正本として持たない。

Catalog生成物は、Service選択画面に必要な軽量metadataだけを保持する。

代表field:

```json
{
  "schemaVersion": 1,
  "services": [
    {
      "id": "efs",
      "label": "Amazon EFS",
      "description": "...",
      "tags": ["storage"],
      "defaultProfile": "standard",
      "priceSource": {
        "serviceCode": "AmazonEFS"
      }
    }
  ]
}
```

CatalogへProfile / Componentの全Definitionを埋め込まない。

### 2.2 DefinitionStore

Browser runtimeでは`PriceDataStore`とは別に`DefinitionStore`を持つ。

責務:

- Catalog load
- `service.json` load
- `profile.json` load
- `component.json` load
- Definition memory cache
- schemaVersion / ID consistencyの軽量runtime validation

### 2.3 lazy loading

初期ロードではCatalogだけを取得する。

Service Definition本体はユーザーがServiceを選択・編集する時点でlazy loadする。

推奨フロー:

```text
App startup
-> Catalog

Service選択
-> service.json
-> default/selected profile.json
-> profileが参照するcomponents/*.json
-> selector用index preload
```

全Service Definitionを起動時にロードしない。

### 2.4 Definition cache

Definitionはstable ID単位でメモリcacheする。

代表key:

- serviceId
- serviceId + profileId
- serviceId + componentId

同じServiceを複数Plan / Rowで利用してもDefinition fetchを重複させない。

### 2.5 in-flight deduplication

PriceDataStoreと同様にDefinition fetchもPromise単位でdeduplicateする。

### 2.6 Definition path resolution

Definition pathはID規則から機械的に解決する。

```text
services/<serviceId>/service.json
services/<serviceId>/profiles/<profileId>.json
services/<serviceId>/components/<componentId>.json
```

Definition内へ任意file pathを書かない。

### 2.7 runtime validation

Browser側ではCI相当の完全検証を繰り返さない。

最低限以下を確認する。

- schemaVersionが対応範囲内
- directory/file IDと内部IDが一致
- profile/component参照が解決できる
- 必須fieldが存在する

致命的不整合は`invalid`とする。

### 2.8 Catalog availability

Catalogには静的に「利用可能/利用不可」を手書きしない。

Price Data build側の`build-manifest.json`に対象serviceCode / regionが存在するか、およびDefinitionが正常にロードできるかからruntimeで利用可否を導出する。

### 2.9 preloading

Service選択時に必要な`index.json`は先読みしてよい。

`products.json`は実際に料金計算が必要になるまで遅延させる。

### 2.10 Definition変更とPrice DB build

Definitionはアプリコードと同じdeploy commitの内容を使用する。

Price DB buildIdは独立したPrice Data世代を示す。

Project JSONはDefinitionファイル自体を保存せず、service/profile/component IDとユーザー値だけを保存する。

---

## 3. Decision 47 — Runtime Error / Loading UI Contract

本項は内部状態をユーザーUIへどう露出するかの最低契約だけを定義する。

詳細な見た目はUI実装へ委ねる。

### 3.1 Service Instance状態

各Service Instanceの料金評価状態は少なくとも以下を持つ。

- `loading`
- `ready`
- `warning`
- `unavailable`
- `invalid`

`warning`は計算可能だがPricing Limitation等がある状態を含む。

### 3.2 loading

Price Data / Definitionロード中は旧値や仮値を確定金額として表示しない。

表示上は「料金データ読込中」等で計算待ちであることを識別可能にする。

### 3.3 unavailable

通信失敗等で必要resourceを取得できない場合は`unavailable`とする。

- Service Instance金額を未計算扱いにする
- Plan totalへ加算しない
- retry操作を提供可能にする
- Project編集や保存自体は継続可能とする

### 3.4 invalid

取得したDefinition / Price Data / Query結果が不正で安全に計算できない場合は`invalid`とする。

例:

- unknown schemaVersion
- buildId mismatch
- SKU 0件 / 複数件
- Dimension解決失敗
- unit mismatch

`invalid`時に旧価格や推測価格へsilent fallbackしてはならない。

### 3.5 stale

既に正常ロード済みのPrice Dataを利用できるが、最新確認等に失敗した場合は`stale`として継続利用可能とする。

ユーザーには古い可能性があることを識別可能にする。

### 3.6 invalid selector value

親selector変更、Price Data更新、Project restore等によって現在値が候補外となった場合、別値へ自動変更しない。

対象inputを`要再選択`状態として表示し、ユーザーの再選択を要求する。

### 3.7 Plan total

一部Service Instanceが未計算でも、計算済みServiceのsubtotalは表示可能とする。

ただし完全なPlan totalと誤認させない。

表示上少なくとも以下を識別する。

```text
Calculated subtotal
+ uncalculated service count
```

### 3.8 Pricing Limitation

適用中のPricing LimitationはService Drawer内で確認可能にする。

特に`impactDirection = estimate-may-be-lower`は通常noticeより強く表示する。

PDF出力では適用中Limitationを必ず含める。

### 3.9 Price Data metadata

画面上で少なくとも以下を確認可能にする。

- Price Data publicationDate
- 必要に応じてbuildId

Project restore時に保存時と現在のPrice Dataが異なる場合、現在Price Dataで再計算していることを表示可能にする。

### 3.10 UI方針

内部エラー詳細やstack traceを一般ユーザーへ直接表示しない。

UIには人間向けmessageを表示し、開発者向け診断情報は安定issue code / console / diagnostic reportで保持する。

---

## 4. Decision 48 — Implementation Boundary / Design Freeze

### 4.1 設計フェーズ完了条件

Decision 1〜48で以下の主要領域を確定済みとみなす。

- Project / Plan / Row / Service Instance
- Project JSON / restore / migration
- Price source / Price DB build / publication
- Service / Profile / Component Definition
- Price Query DSL
- Calculation DSL
- condition / dependency DSL
- Tier / Free Tier / Billing semantics
- Pricing Limitation
- SKU / Dimension resolution
- Golden Case
- Price update drift classification
- coverage / category inventory
- normalization
- JSON Schema / validation layering
- Definition package
- GitHub Actions workflow
- common CLI
- Node.js / Browser shared Pricing Core
- Browser Price DB loader/cache
- Catalog / Definition loader
- runtime error/loading contract

このため、以後は新たなDecision Bundle追加を通常の進め方とはしない。

### 4.2 実装中の判断

実装時に軽微な詳細が未定であっても、ユーザー挙動・データ互換性・料金意味論を変えない範囲では実装判断として決めてよい。

例:

- class/function名
- module分割の細部
- logging formatの細部
- test helper構造
- CLI内部ライブラリ
- retry待機時間等の小規模定数

### 4.3 再度仕様Decisionが必要な変更

以下を変更する場合だけ、仕様Decisionへ戻る。

- Project JSON互換性
- Service Definition schema/DSL意味論
- 料金計算結果の意味
- Tier / Free Tier等の対象範囲
- UI上の主要操作フロー
- Price DB publication consistency
- restore/migration挙動
- fail-open / fail-closed方針

### 4.4 実装順序

推奨実装順序:

```text
Phase 1: 基盤
- package.json / ES Modules
- schemas/
- shared filter/condition/decimal
- Definition loader

Phase 2: Pricing Core
- Price Query
- Dimension resolution
- Calculation DSL
- Pricing Limitation

Phase 3: Tooling
- normalize / inventory
- validators
- Golden runner
- classify-change / build

Phase 4: Browser integration
- PriceDataStore
- DefinitionStore
- Catalog
- Service Drawer dynamic rendering
- Project state連携

Phase 5: CI/CD
- Definition PR workflow
- scheduled Price Update workflow
- build publish / manifest promotion

Phase 6: Service onboarding
- 最初の実サービスDefinition
- Golden / coverage
- 自動サービス追加フロー検証
```

### 4.5 最初の実装対象Service

基盤完成後は、料金モデルの性質が異なる複数サービスを少数選び、generic DSLの妥当性を検証する。

最低でも以下の種類を含めることを推奨する。

- instance-hour型
- storage-capacity型
- request型
- 複数Component型

特定Service名は実装開始時に選定してよい。

### 4.6 Adapter導入判断

初期実装でgeneric DSLに合わないサービスが見つかっても、直ちにadapterを増やさない。

Definition boundary / Profile / Component split / fixed filter / transformで解決できないことを確認してからadapterを採用する。

### 4.7 Implementation Plan

次の成果物は新しいArchitecture Decisionではなく、実装計画とする。

少なくとも以下へ分割する。

- repository structure migration
- Pricing Core implementation
- CLI / normalization / validation
- Browser integration
- GitHub Actions
- initial Service Definitions
- end-to-end verification

各実装タスクは既存仕様書への参照を持ち、完了条件とtestを定義する。

---

## 5. 結論

Decision 48をもってPricing Architectureの主要仕様検討は一旦freezeする。

今後の主作業は仕様追加ではなく、既存仕様に基づく実装・テスト・初期Service onboardingとする。

実装中に主要な意味論変更が必要になった場合のみ、新たなDecisionを追加する。
