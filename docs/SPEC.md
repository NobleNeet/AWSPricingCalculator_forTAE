# AWSPricingCalculator_forTAE 仕様書

最終更新: 2026-10-04

本書はユーザーから見た挙動・Projectデータ・出力仕様の正本とする。
料金データ基盤、Service Definition、Pricing Engine、CI/CD等の内部仕様は `docs/PRICING_ARCHITECTURE.md` を正本とする。
過去の `PRICING_ARCHITECTURE_DECISIONS_*` は設計検討履歴であり、現行仕様の正本ではない。

---

## 1. 目的

AWS上のシステム構成について、複数の構成案を同一画面で試行錯誤しながら比較し、月額概算を確認するWebアプリケーションを作る。

主な利用ケースは、ベンダー提案や既存設計に書かれたAWSサービス構成を入力し、その構成を複製・変更しながら代替案を比較することである。

本アプリはAWS Pricing Calculatorの完全互換を目的とせず、初期検討時の比較・概算を簡潔に行うことを優先する。

---

## 2. 料金計算の前提

### 2.1 データソース

料金計算の正本はAWS Public Price List JSONとする。

### 2.2 固定条件

- Currency: USD
- Pricing: On-Demand
- Discount: None
- Tax: Not included
- Savings Plans: 対象外
- Reserved Instances: 対象外
- Spot: 対象外
- 為替換算: 対象外

Free Tierおよび無料利用枠は計算へ反映しない。
Tier pricingは段階計算せず、通常の最初の有料単価を全使用量へ適用する。
このため本アプリは、割引なし・無料枠なしの概算として、実請求額より高めになる場合がある。

Minimum storage duration、early deletion、利用履歴・イベント回数・組織全体利用量等に依存する料金で、月間集計値だけから決定できないものは原則計算しない。過小見積の可能性がある場合はPricing Limitationとして警告する。

### 2.3 Region

Project全体にDefault Regionを持つ。初期値は `ap-northeast-1` (Tokyo) とする。

Service InstanceはProject Regionを継承するのを標準とし、データモデル上は個別Region overrideを持てる。正式対応Region外を指定した場合は料金計算不可とする。

初期正式対応Regionは `ap-northeast-1` とする。

### 2.4 Price Data更新

画面上で使用中のPrice Data publicationDateを確認可能にする。
Project JSONには保存時のPrice Data buildId / publicationDateを監査情報として記録できるが、復元時は現在の有効なPrice Dataで再計算する。

---

## 3. 基本データモデル

```text
Project
  -> Plan
  -> Comparison Row
  -> Service Instance
```

### 3.1 Project

1つの見積検討単位。

保持する主な情報:

- Project ID / 名称
- Default Region
- 共通usage assumptions
- Plan一覧と表示順
- Comparison Row一覧と表示順
- Baseline Plan

### 3.2 Plan

1つのシステム構成案。

- stable IDを持つ
- 名称・メモを編集できる
- 他PlanとService Instanceを共有しない
- 任意のPlanを複製できる
- 差額はBaseline Planとの未丸め金額差から計算する

新規ProjectはPlan 0件から開始できる。
一度Planが作成された後、最後の1Planだけになった場合は削除操作を表示しない。

### 3.3 Comparison Row

RowはAWSの分類ではなく、ユーザーが同じ行で比較したい項目を表す。

1 Row × 1 Planには0または1 Service Instanceを置く。
同じRowで異なるAWSサービスを比較してよい。

Row labelは原則、実際に配置されているサービス名から自動生成する。必要に応じてユーザー定義labelを持てる。

### 3.4 Service Instance

Plan内の1つのAWSサービス設定。

保持する主な情報:

- serviceId
- profileId
- Region inherit / override
- Profile selector値
- Componentごとのenabled状態と入力値

SKU ID、Price Dimension、計算済み金額はProject JSONの正本として保存しない。

---

## 4. 初回操作フロー

### 4.1 0案状態

新規ProjectはPlan 0件から開始できる。

表示例:

- 「構成案はまだありません」
- 「最初の構成案を作る」

### 4.2 最初の構成案

「最初の構成案を作る」で空の案Aを作成する。
その後、必要なAWSサービスを上から順に追加する。

### 4.3 比較案作成

最初の案を複製し、差分だけ変更する操作を主要フローとする。
空の新規Planも追加可能とする。

---

## 5. AWSサービス追加・置換

### 5.1 新しいサービスを追加

各Planから「サービスを追加」を実行できる。
新しいComparison Rowを作成し、そのPlanにService Instanceを追加する。

Service選択後は、詳細パラメータ編集へ進む。

### 5.2 既存Rowへ追加

あるRowで特定Planだけ空の場合、「この行に追加」でそのRowへService Instanceを追加できる。

### 5.3 別サービスへ置換

同じRowのまま別AWSサービスへ置換できる。

例:

- EC2 -> Lambda
- RDS -> Aurora

置換時に意味の異なるService間で設定値を推測コピーしない。

---

## 6. サービス編集

Service Instanceの「編集」から右側Drawerを開く。
DrawerはService Definitionから動的生成する。

入力は主に以下で構成する。

- selector: SKU/料金条件を選ぶ値
- usage input: 使用量
- optional component toggle
- advanced input

値変更時は依存selector、Component有効条件、Price Query、料金計算を再評価する。

親selector変更等で現在値が候補外になった場合、別値へ自動置換せず「要再選択」とする。

無効化された入力・Componentの保存値は保持してよいが、無効中は料金計算へ使用しない。

---

## 7. 比較表示

複数Planを列として横並び表示する。

各Service Instanceについて少なくとも以下を表示する。

- AWSサービス名
- 主な設定値
- 月額概算
- 編集
- 別サービスへ置換
- Planから外す

Serviceが存在しないセルは `—` とする。

各Planの月額合計とBaselineとの差額を表示する。

一部Serviceが計算不能の場合、計算済み金額を完全なPlan totalとして表示しない。

例:

```text
計算済み小計: $120.00
未計算サービス: 1
```

---

## 8. 料金データの状態とユーザー表示

Service Instanceの料金評価状態は少なくとも以下を持つ。

- loading
- ready
- warning
- unavailable
- invalid

### loading

料金データ読込中であることを表示し、旧値や仮値を確定金額として表示しない。

### warning

計算は可能だがPricing Limitation等がある状態。
過小見積の可能性があるwarningは通常noticeより強く表示する。

### unavailable

通信失敗等で必要データを取得できない状態。
対象Serviceを未計算とし、Project編集・保存は継続可能とする。再試行操作を提供可能とする。

### invalid

Definition、Price Data、SKU/Dimension解決、unit等に安全に計算できない不整合がある状態。
近似SKU・旧価格・先頭候補等へのsilent fallbackは禁止する。

### stale

既に正常ロード済みのPrice Dataを利用できるが、最新確認等に失敗した場合は、そのデータで計算を継続しつつ古い可能性を表示する。

---

## 9. Pricing Limitation

本アプリが意図的に計算しない条件は、Pricing Limitationとして管理する。

代表例:

- tier-pricing
- free-tier
- minimum-storage-duration
- early-deletion
- lifecycle-event-charge
- organization-usage-aggregation
- account-specific-discount

Service Drawerで適用中Limitationを確認可能にする。
PDFには適用中Limitationを必ず含める。

---

## 10. 保存・復元

### 10.1 ブラウザ自動保存

編集中Projectを `localStorage` へ自動保存する。
これは同一PC・Browserでの作業再開用であり、正式バックアップではない。

Price DB本体はlocalStorage / IndexedDBへ永続保存しない。

### 10.2 Project JSON

Projectの編集状態をJSONで表現する。

概念構造:

```json
{
  "schemaVersion": 1,
  "project": {
    "id": "project-...",
    "name": "...",
    "defaultRegion": "ap-northeast-1",
    "usageAssumptions": {"hoursPerMonth": 730},
    "baselinePlanId": "plan-a1",
    "planOrder": [],
    "rowOrder": []
  },
  "plans": {},
  "rows": {},
  "serviceInstances": {},
  "savedAt": "...",
  "priceData": {
    "buildId": "...",
    "publicationDate": "..."
  }
}
```

derived total、差額、SKU、unit price等は保存しない。

### 10.3 復元操作

社内環境でファイルアップロードが制限される可能性を考慮し、Project JSONはテキスト欄へのコピー&ペーストで復元可能にする。

fatal error時は現在のProjectを変更しない。

fatal例:

- JSON不正
- 未対応の新しいschemaVersionでmigration pathがない
- migration失敗
- 参照関係が修復不能

未知Service/Profile/Component/field等は、可能な限りデータを保持して部分復元し、warning / invalidとしてRestore Reportへ出す。未知Serviceが含まれるだけでProject全体をfatalにはしない。

安全で意味が同一のrename等だけ自動migrationを許可し、類似SKU・類似instance typeへの推測置換は禁止する。

復元後の料金は現在のDefinition / Price Dataで再計算する。

---

## 11. 出力

### 11.1 PDF

比較結果をPDF出力できるようにする。

PDFには少なくとも以下を含める。

- Project / Plan情報
- Service構成と主要入力
- Component / Service / Planの月額
- 未計算項目
- Pricing Limitation
- Price Data publicationDate

未計算項目を含む場合でも出力自体は許可するが、完全合計ではないことを明示する。

### 11.2 PDF + Project JSON

PDF出力時には復元用Project JSONも同時に出力し、別途バックアップ操作を要求しないことを基本UXとする。

### 11.3 CSV

比較内容を表計算等へ渡すためのCSVを出力する。
CSVは復元用途ではない。

金額は必要に応じて未丸め内部値と表示値を別列にできる。

---

## 12. 表示精度

内部料金計算はDecimal相当の高精度値を使用し、途中で金額丸めを行わない。

通常の月額表示はUSD小数第2位を基本とする。

- exact zero -> `$0.00`
- `0 < amount < $0.01` -> `< $0.01`

Plan差額も未丸め値同士から計算し、最後に表示丸めする。

---

## 13. Service Catalog

Service追加画面のCatalogはService Definitionから自動生成する。
手書きのサービス一覧を正本としない。

Catalogは検索・絞り込みを可能にし、DefinitionとPrice Dataの存在から利用可否を導出する。
Price DB未生成・Definition不正等のServiceを、正常利用可能であるかのように表示しない。

---

## 14. UI方針

- 主要操作は1画面内で完結させる
- 画面遷移を極力使わない
- サービス編集はDrawer、追加・復元はModalを基本とする
- Planが1件の間は自然な構成入力画面として使え、複数件ではそのまま比較表として機能する
- 新しいRowへの追加と既存Rowへの追加を明確に区別する
- 比較のためだけの役割名入力を要求しない
- 初期検討で必要な入力を優先し、特殊項目はadvancedへ寄せる

---

## 15. 非目標

- AWSアカウントへの接続
- 実リソースの自動検出
- CloudFormation / Terraform生成
- RI / Savings Plans / Spotを含む最適化
- 税込み請求額の完全再現
- 為替換算
- AWS Pricing Calculator完全互換
- 組織・アカウント全体の利用量を前提とした正確なTier/Free Tier計算

---

## 16. 実装状況と仕様状態

現行リポジトリは `index.html` / `app.js` 等によるUIモックを含むが、実料金基盤への移行はこれから行う。

ただし以下の内部設計は未決事項ではなく、`docs/PRICING_ARCHITECTURE.md` で確定済みとする。

- AWS Public Price List取得・正規化・更新
- Price DB世代管理とBrowser loader/cache
- Service Definition / Catalog
- Price Query / Calculation DSL
- Tier / Free Tier / billing semantics
- Project restore / migration
- JSON Schema / CI validation / Golden Case
- coverage / normalization
- Node.js CLI / GitHub Actions
- Runtime error/loading contract

実装中にユーザー挙動、Project JSON互換性、料金意味論を変更する必要が生じた場合のみ仕様検討へ戻る。
