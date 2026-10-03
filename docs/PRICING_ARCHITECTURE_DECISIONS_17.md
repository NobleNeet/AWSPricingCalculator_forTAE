# Pricing Architecture Specification — Decision 17

最終更新: 2026-10-03

本書は `docs/PRICING_ARCHITECTURE.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_09_14.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_15_16.md` の続編として、Decision Bundle 17 で確定した Service Catalog とサービス追加 UI の仕様を定義する。

---

## 1. 目的

サービス数が増えても共通 JavaScript にサービス一覧や追加候補をハードコードせず、Service Definition 追加だけでサービス追加画面へ反映されるデータ駆動構造とする。

現行モックの `serviceDefs` や `rows[].allowed` のようなサービス名ベースの静的定義は、本実装では段階的に廃止する。

---

## 2. Service Catalog の生成

### 2.1 `services/catalog.json`

サービス追加 UI が参照する軽量カタログを `services/catalog.json` とする。

ただし、このファイルは人間が手編集する正本ではない。

各 `services/<service>/service.json` を走査して build / CI 時に自動生成する。

```text
services/
  ec2/service.json
  lambda/service.json
  rds/service.json
  aurora/service.json
  ...

        ↓ generate

services/catalog.json
```

Service Definition を追加すれば、共通 JavaScript を変更せずサービス追加 UI に反映されることを目標とする。

### 2.2 二重管理を禁止する

以下のような構造は採用しない。

```text
service.json にサービス情報を書く
+
別の手編集ファイルにもサービス一覧を書く
```

Service の識別情報・検索 metadata は原則 `service.json` を正本とする。

---

## 3. Service catalog metadata

`service.json` は料金定義に加えて、サービス追加 UI 用の軽量 metadata を持てる。

例:

```json
{
  "id": "ec2",
  "label": "Amazon EC2",
  "shortLabel": "EC2",
  "description": "Virtual compute instances",
  "catalog": {
    "category": "compute",
    "keywords": [
      "virtual machine",
      "instance",
      "server",
      "仮想マシン",
      "サーバー"
    ],
    "aliases": [
      "EC2",
      "Elastic Compute Cloud"
    ],
    "sortOrder": 100,
    "status": "active",
    "icon": "ec2"
  }
}
```

Catalog metadata として少なくとも以下を表現可能にする。

- `category`
- `keywords`
- `aliases`
- `sortOrder`
- `status`
- `icon`（任意）

`label`、`shortLabel`、`description`、`id` は Service 本体 metadata を再利用する。

---

## 4. Category 管理

Category の定義は各 Service に重複記載せず、中央設定として管理する。

推奨パス:

```text
services/catalog-config.json
```

例:

```json
{
  "categories": [
    {
      "id": "compute",
      "label": "Compute",
      "sortOrder": 100
    },
    {
      "id": "database",
      "label": "Database",
      "sortOrder": 200
    },
    {
      "id": "storage",
      "label": "Storage",
      "sortOrder": 300
    },
    {
      "id": "networking",
      "label": "Networking & Content Delivery",
      "sortOrder": 400
    }
  ]
}
```

各 Service は Category ID だけを参照する。

Category は AWS 公式のサービス分類を基本とするが、料金計算とは独立した UI 分類なので、ユーザーが探しやすくなる範囲で簡略化・統合してよい。

---

## 5. サービス追加 UI

### 5.1 検索を主要導線とする

サービス数が増えても利用しやすいよう、追加画面は検索を主要導線とし、カテゴリ一覧を補助導線とする。

概念例:

```text
サービスを検索
[ EC2________________ ]

Compute
  Amazon EC2
  AWS Lambda

Database
  Amazon RDS
  Amazon Aurora
```

### 5.2 検索対象

検索対象は少なくとも以下とする。

- `id`
- `label`
- `shortLabel`
- `description`
- `aliases`
- `keywords`

高度な全文検索エンジンは初期版では不要とし、正規化した部分一致を基本とする。

### 5.3 日本語・英語検索

`aliases` / `keywords` により、日本語・英語・AWS の略称・正式名称のいずれからでも検索できる構造とする。

例:

```text
EC2
Elastic Compute Cloud
instance
compute
仮想マシン
サーバー
```

のいずれからでも Amazon EC2 を検索可能にできる。

検索 keyword は料金ロジックには使用しない。

---

## 6. Catalog の軽量化と Lazy Load

`services/catalog.json` には一覧表示・検索に必要な metadata のみを含める。

原則として以下程度に限定する。

- id
- label
- shortLabel
- description
- category
- keywords
- aliases
- status
- sortOrder
- icon key

サービス一覧表示時には、全 Service の Profile / Component Definition や Price DB を取得しない。

標準ロードフロー:

```text
catalog.json
  ↓
サービス検索 / 選択
  ↓
service.json load
  ↓
profile / component Definition load
  ↓
必要な Price Source / Region 判定
  ↓
Price DB load
  ↓
設定 UI 生成
  ↓
料金計算
```

これにより、対応サービス数が増えても初期ロードを抑える。

---

## 7. Service status

Service Catalog の状態は初期版では以下の3種類とする。

### 7.1 `active`

通常表示され、新規追加可能。

### 7.2 `deprecated`

新規追加は原則させないが、既存 Project の復元・互換性維持に利用する。

通常の追加一覧では非表示としてよい。

必要なら「廃止済みサービスを表示」等の UI で確認可能にする。

### 7.3 `hidden`

通常 UI には出さず、migration・互換性維持・内部用途で Definition を残す場合に使用する。

### 7.4 `preview` は設けない

料金精度が未保証の Service を本番 Catalog に露出すると、本ツールの「正確な見積」という目的と矛盾するため、初期版では `preview` / `beta` status を設けない。

未完成 Definition は PR / 開発環境で検証し、main には validation 済みの Service を載せる。

---

## 8. Region 可用性

Service ごとに `supportedRegions` を手入力で重複管理しない。

現在 Region でその Service を計算可能かは、以下から動的判定する。

```text
Service Definition
+
Price DB manifest
+
enabledRegions
```

現在 Region で利用できない場合でも、Service 自体を検索結果から完全に消さない。

推奨表示:

```text
Amazon Foo
東京リージョンでは料金データなし
```

のように表示し、追加操作だけ無効化する。

これにより「なぜサービス一覧に存在しないのか」という混乱を避ける。

---

## 9. Icon

Service の icon は料金計算に必須ではない UI metadata とする。

`service.json` には必要であれば icon asset そのものではなく、解決用キーだけを保持する。

例:

```json
{
  "catalog": {
    "icon": "ec2"
  }
}
```

UI Renderer がローカル asset 等へ解決する。

icon が存在しなくても Catalog 表示・Service 追加・料金計算は正常に成立しなければならない。

---

## 10. Catalog generation / CI validation

Catalog 生成時に少なくとも以下を検証する。

### ERROR

- Service ID 重複
- Service Definition が参照する Category ID が `catalog-config.json` に存在しない
- 必須 catalog metadata の型不正
- `status` が許可値以外
- catalog generation 自体の失敗

### 許可

- `sortOrder` の重複

同じ `sortOrder` の Service は、label または Service ID などの安定キーで二次ソートする。

Catalog は Service Definition の validation 成功後に生成する。

---

## 11. 本Decisionで確定した事項

1. `services/catalog.json` は Service Definition から自動生成する。
2. Service 一覧を人間が二重管理しない。
3. `service.json` に Catalog 用 metadata を持たせる。
4. Category は `services/catalog-config.json` で中央管理する。
5. Category は AWS 公式分類を基本としつつ UI 向けに簡略化可能とする。
6. サービス追加 UI は検索 + Category 表示を基本とする。
7. `id / label / shortLabel / aliases / keywords / description` を検索対象とする。
8. aliases / keywords により日本語・英語の検索を可能にする。
9. Catalog は軽量 metadata のみとし、Definition 本体は選択後に Lazy Load する。
10. Price DB は Service 選択後に必要分だけ Lazy Load する。
11. Service status は `active / deprecated / hidden` とする。
12. 本番用 `preview` status は設けない。
13. Region 対応可否は Price DB 等から動的判定する。
14. 現在 Region で追加不可でも Service 自体は検索結果に表示する。
15. Icon は任意の UI metadata とし、料金ロジックから分離する。
16. Catalog 生成時に Service ID、Category、status 等を CI validation する。
17. Service 追加だけでは共通 `app.js` 等を変更しない構造を目標とする。

---

## 12. 次に決定する事項

次の仕様検討では、比較表の Row モデルを定義する。

現行モックでは `EC2 / Lambda`、`RDS / Aurora` のような比較行ごとに `rows[].allowed` がハードコードされている。

次に以下を決める。

- 同一比較 Row に置ける Service の制約を残すか
- 比較 Row を固定カテゴリにするか、ユーザーが自由に作成できるようにするか
- EC2 と Lambda のような代替サービスをどう関連付けるか
- Service Catalog の Category と比較 Row の意味を分離するか
- Project JSON に Row の意味・ID・Service 配置をどう保存するか
- Service 追加時に既存 Row 定義の更新を必要としない構造にできるか
