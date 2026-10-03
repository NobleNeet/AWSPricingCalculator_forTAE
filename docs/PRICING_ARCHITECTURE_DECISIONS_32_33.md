# Pricing Architecture Specification — Decisions 32–33

最終更新: 2026-10-04

本書は既存Pricing Architecture仕様の続編として、Decision Bundle 32〜33で確定したPrice DB公開レイアウト、manifest、products.json正規化スキーマを定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Decision 32 — Price DB公開レイアウト / manifest

### 1.1 公開ディレクトリ構成

初期版は以下を基本とする。

```text
pricing/generated/
  manifest.json
  builds/
    <buildId>/
      build-manifest.json
      sources/
        <serviceCode>/
          <region>/
            products.json
      indexes/
        <serviceCode>/
          <region>/
            index.json
```

Price DB全体を1世代として扱い、serviceCode単位で独立したactive generationは持たない。

### 1.2 manifest.json

トップレベル`manifest.json`は、現在新規ロード時に採用すべきbuildへの小さなポインタとする。

```json
{
  "schemaVersion": 1,
  "activeBuildId": "20261004T012300Z-a1b2c3d4",
  "publicationDate": "2026-10-04T01:23:00Z"
}
```

サービス一覧やPrice DB本体をmanifestへ詰め込まない。

### 1.3 build-manifest.json

各buildの詳細metadataを保持する。

```json
{
  "schemaVersion": 1,
  "buildId": "20261004T012300Z-a1b2c3d4",
  "generatedAt": "2026-10-04T01:23:00Z",
  "publicationDate": "2026-10-04",
  "currency": "USD",
  "sources": {
    "AmazonEC2": {
      "regions": {
        "ap-northeast-1": {
          "products": "sources/AmazonEC2/ap-northeast-1/products.json",
          "index": "indexes/AmazonEC2/ap-northeast-1/index.json"
        }
      }
    }
  }
}
```

参照パスはbuildルートからの相対パスとし、GitHub Pages等の絶対URLを埋め込まない。

### 1.4 buildId

`buildId`は生成時刻 + content hash等から一意に識別可能な値とする。

例:

```text
20261004T012300Z-a1b2c3d4
```

公開済み`builds/<buildId>/`はimmutableとし、同じbuildId配下の内容を後から変更しない。

### 1.5 staging / publish順序

Workflowは公開領域へ直接書きながら検証せず、一時staging領域で生成・検証する。

```text
1. staging build生成
2. JSON Schema validation
3. structure diff
4. Golden verification
5. build整合性validation
6. builds/<newBuildId>/へ配置
7. retention整理
8. manifest.jsonのactiveBuildId更新
9. commit
10. GitHub Pages deploy
```

`manifest.json`更新を論理的publish commit pointとする。

### 1.6 previous build

working treeにはcurrent + previousの2世代を保持する。

ただし`manifest.json`へ`previousBuildId`は原則保持しない。

previous buildは運用上のretentionであり、runtimeの自動fallback APIにはしない。

### 1.7 stale fallback

初回ロードでactive build取得に失敗しても、previous buildを自動探索して使用しない。

```text
初回 active build取得失敗
-> unavailable
```

一方、同一タブですでに正常buildをロード済みで、その後最新確認または取得に失敗した場合のみ、その既ロード済みbuildの利用継続を許可する。

```text
既ロード済み正常buildを継続
-> stale
```

### 1.8 products.json / index.jsonの役割

`products.json`は料金計算に使う正規化Price DBの正本とする。

`index.json`は以下のための派生データとする。

- selector候補生成
- attribute value一覧
- UI検索
- availability判定

料金計算時の最終SKU解決は`products.json`で行う。

### 1.9 index生成

`index.json`は`products.json`から自動生成し、人手編集しない。

CIではindex内の値がproducts由来であることを検証する。

### 1.10 初期分割単位

初期版では`serviceCode x region`ごとに単一`products.json` / `index.json`を持つ。

ファイル巨大化時は将来shardingを導入できるようにする。

将来例:

```json
{
  "products": [
    "products-000.json",
    "products-001.json"
  ]
}
```

初期版ではshardingしない。

### 1.11 checksum / size

`build-manifest.json`は必要に応じて各ファイルのchecksumとsizeを保持できるようにする。

```json
{
  "path": "sources/AmazonEC2/ap-northeast-1/products.json",
  "sha256": "...",
  "bytes": 1823412
}
```

主用途はCI/build整合性確認、deploy確認、異常肥大化検出とする。

ブラウザ側で全ファイルを毎回SHA-256検証することは初期版要件にしない。

### 1.12 build status

公開buildはvalidation済みのものだけとし、`build-manifest.json`へ`status: valid`等を持たせない。

失敗buildは公開しない。

更新失敗metadataが必要になった場合は、将来`update-status.json`等の別ファイルへ分離できる。

### 1.13 publicationDate / generatedAt

以下を分離する。

```text
publicationDate
= AWS価格情報側の日付

generatedAt
= 本ツールがPrice DBを生成した日時
```

同じAWS価格情報を再生成した場合でも意味が混ざらないようにする。

### 1.14 source metadata

`build-manifest.json`にはPrice List元データのversion / publication metadataを監査用に保持する。

巨大なraw Price List本体はリポジトリへ保存しない。

---

## 2. Decision 33 — products.json正規化スキーマ

### 2.1 基本方針

`products.json`はAWS Public Price List raw JSONの単純コピーではなく、本ツールのPrice QueryとPricing Engineが扱いやすい正規化Price DBとする。

ただし将来料金差へ関与する可能性があるAWS Product属性は不用意に削除しない。

### 2.2 Product単位

1 Product = 1 SKUとする。

概念例:

```json
{
  "schemaVersion": 1,
  "buildId": "20261004T012300Z-a1b2c3d4",
  "serviceCode": "AmazonEC2",
  "region": "ap-northeast-1",
  "products": [
    {
      "sku": "ABC123",
      "productFamily": "Compute Instance",
      "operation": "RunInstances",
      "usageType": "APN1-BoxUsage:m7i.large",
      "attributes": {
        "instanceType": "m7i.large",
        "operatingSystem": "Linux",
        "tenancy": "Shared"
      },
      "terms": {
        "onDemand": []
      }
    }
  ]
}
```

### 2.3 Product主要フィールド

`productFamily`、`operation`、`usageType`は新サービス解析・料金カテゴリ判定で頻繁に使うため、`attributes`配下ではなくProduct直下に正規化する。

### 2.4 attributes

対象regionのAWS Product attributesは原則広く保持する。

価格差へ直接使っていないように見える属性でも、将来AWSが料金分岐に使う可能性や構造差分検知用途があるため、安易に削除しない。

ただしregion/location等、ファイル単位で重複する情報はヘッダへ寄せ、Productごとの重複を減らしてよい。

### 2.5 Term対象

初期版ではOn-DemandのみをPrice DBへ保持する。

以下は対象外とする。

- Reserved
- Savings Plans
- Spot

Productの`terms`は少なくとも以下を持つ。

```json
{
  "terms": {
    "onDemand": []
  }
}
```

### 2.6 On-Demand Term

概念形:

```json
{
  "offerTermCode": "JRTCKXETXF",
  "effectiveDate": "2026-09-01T00:00:00Z",
  "priceDimensions": []
}
```

AWS内部識別子は診断・監査用途として保持できるが、Definitionの意味的主キーにはしない。

### 2.7 Price Dimension

AWS raw上でID-keyed objectであっても、正規化後は配列とする。

```json
{
  "rateCode": "...",
  "description": "...",
  "unit": "Hrs",
  "beginRange": "0",
  "endRange": "Inf",
  "pricePerUnit": {
    "USD": "0.1234000000"
  }
}
```

### 2.8 数値表現

以下はIEEE 754 numberへ変換せずdecimal stringとして保持する。

- `pricePerUnit`
- `beginRange`
- `endRange`

`Inf`も文字列のまま保持する。

Pricing Engine側で必要時にDecimalへ変換する。

### 2.9 Currency

初期版はUSDのみを保持してよい。

ただし`pricePerUnit`のcurrency map構造は維持する。

```json
{
  "pricePerUnit": {
    "USD": "0.1234"
  }
}
```

### 2.10 description / rateCode

Price Dimensionの`description`は以下のため保持する。

- 複数Dimensionの意味判定
- ChatGPT自動解析
- CI差分
- 人間レビュー
- 障害調査

`rateCode`もAWS raw追跡・診断用途で保持するが、Definitionから固定参照しない。

### 2.11 独自意味分類

Price DBへ以下のような独自意味分類を過剰に埋め込まない。

```text
pricingCategory
isFreeTier
isTierPricing
```

原則としてPrice DBはraw由来の事実を保持し、意味解釈はDefinition / validation / Pricing Engine層で行う。

機械的に100%確定できる派生情報は追加可能だが、初期版必須ではない。

### 2.12 Tier判定

TierはPrice Dimensionのrange構造からCI / Pricing Engineで判定する。

Price DBへ`isTierPricing`を固定保存することは初期版では行わない。

### 2.13 Free Tier判定

`pricePerUnit = 0`だけを根拠にFree Tierまたは無料利用枠と判定しない。

```text
zero price != free allowance
```

通常料金として0円のDimensionやデータ転送方向等があり得るため、無料枠除外は意味が確定した場合だけ適用する。

### 2.14 SKU

SKUはPrice DB内部の診断・識別用途に使用する。

Project JSONの意味的正本としてSKUを保存しない。

### 2.15 On-Demand Term選別

1 SKUに複数On-Demand Termが存在する場合、配列先頭を暗黙採用しない。

Price DB生成時にeffectiveDate等を基に現在有効なTermを選別する。

選別後も`onDemand`は配列形式を維持する。

通常1件を期待し、想定外の複数有効Termが残る場合はCIで検出する。

### 2.16 推奨最終形

```json
{
  "schemaVersion": 1,
  "buildId": "20261004T012300Z-a1b2c3d4",
  "serviceCode": "AmazonEC2",
  "region": "ap-northeast-1",
  "products": [
    {
      "sku": "ABC123",
      "productFamily": "Compute Instance",
      "operation": "RunInstances",
      "usageType": "APN1-BoxUsage:m7i.large",
      "attributes": {
        "instanceType": "m7i.large",
        "operatingSystem": "Linux",
        "tenancy": "Shared"
      },
      "terms": {
        "onDemand": [
          {
            "offerTermCode": "JRTCKXETXF",
            "effectiveDate": "2026-09-01T00:00:00Z",
            "priceDimensions": [
              {
                "rateCode": "...",
                "description": "...",
                "unit": "Hrs",
                "beginRange": "0",
                "endRange": "Inf",
                "pricePerUnit": {
                  "USD": "0.1234000000"
                }
              }
            ]
          }
        ]
      }
    }
  ]
}
```

---

## 3. 本書で確定した事項

1. `manifest.json`はactive buildへの小さなポインタとする。
2. Price DB本体は`builds/<buildId>/`へ置く。
3. 各buildに`build-manifest.json`を持つ。
4. build配下assetはimmutableとする。
5. staging検証後にmanifestを最後に切り替える。
6. previous buildはretention用でruntimeの自動fallback先にはしない。
7. 初回失敗は`unavailable`、既ロード済み正常build継続のみ`stale`とする。
8. `products.json`を料金計算用正本とする。
9. `index.json`はproducts由来の派生索引とする。
10. 初期分割単位は`serviceCode x region`とする。
11. `products.json`は正規化Price DBとする。
12. 1 Product = 1 SKUとする。
13. `productFamily / operation / usageType`をProduct直下に持つ。
14. AWS Product attributesは原則広く保持する。
15. 初期版はOn-Demand Termのみ保持する。
16. Price Dimensionは配列化する。
17. range / priceはdecimal stringで保持する。
18. USDのみ保持してよいがcurrency map構造は維持する。
19. `description / rateCode / effectiveDate`を監査・診断用途で保持する。
20. Tier / Free Tier等の意味分類をPrice DBへ過剰に埋め込まない。
21. zero priceだけでFree Tier判定しない。
22. On-Demand Termの暗黙先頭採用を禁止する。

---

## 4. 次に決定する事項

次は`index.json`の具体schemaと、selector候補値を高速かつ安全に生成する方法を定義する。
