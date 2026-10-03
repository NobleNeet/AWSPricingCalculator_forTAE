# Pricing Architecture Specification — Decisions 15–16

最終更新: 2026-10-03

本書は `docs/PRICING_ARCHITECTURE.md` および `docs/PRICING_ARCHITECTURE_DECISIONS_09_14.md` の続編として、Decision Bundle 15〜16で確定した Price DB の世代整合性、キャッシュ、更新時の混在防止、通信失敗・整合性エラー時の動作を定義する。

前提仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Price DB の世代整合性

### 1.1 buildId

Price DB 全体に `buildId` を付与する。

例:

```text
20261003T123456Z-a1b2c3d4
```

`buildId` は生成時刻と content hash 等から一意に識別可能な値とする。

トップレベル `manifest.json` は現在有効な Price DB 世代を指す。

```json
{
  "schemaVersion": 1,
  "activeBuildId": "20261003T123456Z-a1b2c3d4"
}
```

### 1.2 versioned path

Price DB ファイルは `builds/<buildId>/` 配下に配置する。

```text
pricing/generated/
  manifest.json
  builds/
    20261003T123456Z-a1b2c3d4/
      build-manifest.json
      sources/
        AmazonRDS/
          ap-northeast-1/
            products.json
      indexes/
        AmazonRDS/
          ap-northeast-1/
            index.json
```

一度公開された build 配下のファイルは不変リソースとして扱う。

### 1.3 Browser の build 固定

ブラウザは最初に `manifest.json` を取得し、`activeBuildId` を決定する。

その後の Price DB 取得はすべて同一 buildId 配下から行う。

```text
GET manifest.json
  -> activeBuildId = A
  -> GET builds/A/...
```

同じ Price DB ロード中に manifest を再評価して別 build へ乗り換えない。

1ブラウザタブ内では、編集中に新 build が公開されても現在利用中の build を自動差し替えしない。

初期版ではページ再読み込み時に最新 manifest を読み直し、新 build へ切り替える。

### 1.4 Price DB 全体を1世代として扱う

serviceCode 単位で独立した active generation を持たない。

Price Update Workflow が一部 serviceCode だけ更新した場合でも、論理的には Price DB 全体を1つの build snapshot として扱う。

これにより同一 Plan 内で EC2 と RDS が異なる世代の料金データを参照する状態を避ける。

### 1.5 manifest は commit point

Price DB 更新順序は以下とする。

```text
1. new build を一時生成
2. JSON Schema validation
3. Golden Case validation
4. build 内整合性 validation
5. builds/<newBuildId>/ を確定
6. manifest.json の activeBuildId を newBuildId へ更新
7. generated data を commit
8. 同じ commit SHA を GitHub Pages へ deploy
```

`manifest.json` は新 build 完成後に最後に更新する。

生成途中の build を active にしてはならない。

### 1.6 各ファイルの buildId 検証

`build-manifest.json`、`products.json`、`index.json` 等の生成 JSON には所属 `buildId` を記録できるようにし、ブラウザ側でも一致確認する。

例:

```json
{
  "buildId": "20261003T123456Z-a1b2c3d4"
}
```

manifest が指す buildId と取得済み生成物の buildId が異なる場合、そのデータは利用しない。

---

## 2. キャッシュ戦略

### 2.1 manifest

`manifest.json` は最新 build を指す可変リソースであるため、長期固定キャッシュを前提にしない。

短い TTL または再検証可能なキャッシュを想定する。

GitHub Pages 上で細かな `Cache-Control` 制御ができない場合でも、ページ再読み込み時に manifest の最新化を試みる。

### 2.2 versioned assets

以下の buildId 付き URL は不変リソースとして扱う。

```text
pricing/generated/builds/<buildId>/sources/.../products.json
pricing/generated/builds/<buildId>/indexes/.../index.json
```

query parameter 方式:

```text
products.json?v=123
```

ではなく、path に buildId を含める方式を採用する。

### 2.3 Browser cache

通常の HTTP browser cache の利用は許容する。

ただしアプリは「キャッシュが存在するはず」という仮定で料金計算しない。

取得に成功し、schemaVersion / buildId 等の validation を通過したデータのみ利用する。

### 2.4 Price DB の永続保存

Price DB 本体を `localStorage` や Project JSON へ保存しない既存方針を維持する。

Project の編集状態だけを localStorage / Project JSON に保存する。

---

## 3. build retention

### 3.1 working tree

初期版では `pricing/generated/builds/` に以下の2世代を保持する。

```text
current build
previous build
```

更新直後に旧タブが以前の build URL を必要とする可能性に備えるためである。

### 3.2 それ以前の build

3世代以上前の build は working tree から削除してよい。

過去の Price DB は Git 履歴から復元可能とする。

生成物の容量が将来問題となった場合、content-addressed storage 等による重複排除を検討できるが、初期版では採用しない。

---

## 4. Project JSON と build metadata

Project JSON には保存時の Price DB を識別する監査情報として `buildId` を記録する。

例:

```json
{
  "priceData": {
    "buildId": "20261003T123456Z-a1b2c3d4",
    "publicationDate": "..."
  }
}
```

これは復元時に旧 build を強制使用する目的ではない。

復元時は従来どおり現在の有効な Definition / Price DB で再計算する。

保存時と現在の build / publicationDate が異なる場合、現在の料金データで再計算していることをユーザーへ表示できるようにする。

---

## 5. Price DB / Definition 異常時の状態モデル

料金計算に関する実行時状態を少なくとも以下に分類する。

- `available`: 正常な Price DB / Definition で計算可能
- `stale`: 既ロード済み正常 build は利用できるが、最新確認または更新取得に失敗
- `unavailable`: 必要な Price DB を取得できず計算不能
- `invalid`: データは取得できたが schema / query / build 整合性等の問題で計算不能

### 5.1 unavailable

例:

- `manifest.json` 取得失敗
- `products.json` 取得失敗
- `index.json` 取得失敗
- GitHub Pages 一時障害

必要な正常 Price DB がまだ取得されていない場合、その Service / Component は未計算とする。

### 5.2 invalid

例:

- Price Query が 0 SKU
- `singleSku` 期待なのに複数 SKU
- unit 不一致
- Definition 参照先不存在
- 未対応 schemaVersion
- buildId 不一致
- Price DB schema 不整合

`invalid` の場合は古い値、近似 SKU、似た商品等へ自動フォールバックしない。

### 5.3 stale

同一タブで正常 build をすでにロード済みで、その後最新 Price DB の確認・取得に失敗した場合は、既ロード済み build による計算継続を許可する。

UI 上は少なくとも以下を識別できるようにする。

```text
料金データ: build A
最新料金データの確認に失敗
```

初回起動で正常 build を一度も取得できていない場合は `stale` として扱わず `unavailable` とする。

---

## 6. 障害の局所化

Price DB や Definition の問題は、可能な限り該当 Price Source / Service / Component に局所化する。

例えば AmazonRDS の Price DB 取得に失敗しても EC2 / S3 等の正常な料金計算は継続できるようにする。

Project 全体を単一の成功 / 失敗状態として扱わない。

---

## 7. 未計算を含む合計表示

未計算 Service / Component が存在する場合、その Plan の計算済み金額を完全な Plan total として表示しない。

例:

```text
EC2                $100.00
S3                   $20.00
RDS                  未計算

計算済み小計       $120.00
未計算サービス          1
```

比較画面でも未計算件数を明示する。

例:

```text
案A    $220.00
案B    $180.00 + 未計算1件
```

未計算を含む案を、正常に全項目計算済みの案より安いと誤認させないことを優先する。

---

## 8. Project 編集・保存

Price DB が `unavailable` / `invalid` でも、料金計算以外の編集機能は可能な限り利用可能とする。

許可する操作:

- Project / Plan 編集
- Service 構成編集
- selector / usageInput 編集
- localStorage 保存
- Project JSON export

Project JSON は価格値の保存ではなく編集状態の保存を目的とするため、料金データ障害を理由に export を禁止しない。

---

## 9. PDF 出力

未計算項目を含む場合でも PDF 出力自体は許可する。

ただし出力前に未計算項目が存在することを明示し、必要に応じて確認を行う。

PDF 内にも次を表示する。

- 未計算項目が存在する旨
- 該当 Service / Component
- 未計算理由または状態
- 完全合計ではなく計算済み小計であること

例:

```text
RDS Backup: Not calculated
```

途中検討用資料として利用できる一方、完全な見積額として誤認させない構成とする。

---

## 10. schemaVersion

アプリが対応していない Price DB `schemaVersion` は利用しない。

同様に未対応の Service / Profile / Component Definition `schemaVersion` も計算へ利用しない。

未知 schema を「おそらく互換」と推定して読み進めてはならない。

未対応 schemaVersion は `invalid` とする。

---

## 11. Retry

通信失敗時の自動 retry は少数回に限定する。

初期実装では1回程度の自動 retry を基本とし、それでも失敗する場合は `unavailable` 等の状態を表示する。

ユーザーが明示的に再試行できる操作を用意する。

長時間・高頻度の自動 retry は行わない。

---

## 12. 本書で追加確定した事項

1. Price DB 全体に `buildId` を持たせる。
2. Price DB は `builds/<buildId>/` の versioned path へ配置する。
3. `manifest.json` が active build を指す。
4. Browser は同一ロード中の buildId を固定する。
5. Price DB 全体を1世代として扱い、serviceCode ごとの独立 active generation は持たない。
6. 新 build の validation 完了後、最後に manifest を更新する。
7. 各生成 JSON の buildId をロード時に検証する。
8. buildId 付き asset は不変リソースとして扱う。
9. manifest と versioned asset のキャッシュ特性を分ける。
10. 編集中の Price DB 自動差し替えは行わない。
11. ページ再読み込み時に最新 build を採用する。
12. GitHub Pages deploy は Price DB 更新 commit と同一 commit SHA を使用する。
13. working tree には current + previous の2世代を保持する。
14. それ以前の build は Git 履歴から復元する。
15. Project JSON へ保存時 buildId を監査 metadata として記録する。
16. Price DB 取得不能は `unavailable` とする。
17. schema / query / build 整合性異常は `invalid` とする。
18. 既ロード済み正常 build を使える場合のみ `stale` として継続計算可能とする。
19. 初回取得失敗時は料金計算しない。
20. 障害は Service / Component 単位で局所化する。
21. 未計算項目を含む Plan は完全な total として表示しない。
22. PDF 出力は許可するが未計算項目を明示する。
23. Project JSON export は料金データ障害中も許可する。
24. 未対応 schemaVersion は利用しない。
25. 古い SKU / 近似 SKU への自動フォールバックは禁止する。
26. 通信 retry は少数回に限定し、手動再試行を用意する。

---

## 13. 次に決定する事項

次の仕様検討では Service Definition のカタログ化とサービス追加画面の生成方法を定義する。

主な未決事項:

- Service 一覧の読み込み元
- Service Catalog manifest の有無
- category / search keyword / sort order
- hidden / deprecated / experimental 等の状態
- Service 追加画面の検索・絞り込み
- 新しい Service Definition を追加した際の一覧自動反映
- Price DB 未生成 Service の表示可否
