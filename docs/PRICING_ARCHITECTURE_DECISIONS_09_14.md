# Pricing Architecture Specification — Decisions 09–14

最終更新: 2026-10-03

本書は `docs/PRICING_ARCHITECTURE.md` の続編として、Decision Bundle 9〜14で確定した料金基盤・サービス拡張基盤の仕様を定義する。

前提となる既存仕様は `docs/PRICING_ARCHITECTURE.md` を参照する。本書と既存仕様が矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. 未収録サービス追加ワークフロー

### 1.1 基本方針

未収録 AWS サービスの追加は、可能な限りデータ駆動・自動化する。

標準フロー:

```text
対象サービス指定
  -> AWS 公式 Price List 解析
  -> AWS 公式 Pricing / Docs 調査
  -> AWS Pricing Calculator UI 調査
  -> Service / Profile / Component 候補生成
  -> generic DSL で表現可能か判定
  -> Definition JSON 生成
  -> 一時 Price DB 生成
  -> CI validation
  -> Golden Case validation
  -> Pull Request 作成
  -> 人間レビュー / merge
```

ユーザーは原則として「Amazon EFS を追加」のように対象サービスだけを指定できればよい状態を目標とする。

### 1.2 情報源の優先順位

新サービス追加時の情報源は次の順とする。

1. AWS Public Price List JSON
2. AWS 公式 Pricing ページ
3. AWS 公式ドキュメント
4. AWS Pricing Calculator UI

料金値の正本は AWS Public Price List とする。

AWS Pricing Calculator は、ユーザーへ何を入力させるべきか、選択肢、依存関係、デフォルト値、説明文等を把握する補助情報源として利用する。

Pricing Calculator の DOM selector / CSS class / XPath 等は本番 Service Definition へ保存しない。

### 1.3 Price List 解析

新サービス追加時は対象 `serviceCode x region` の Price List から以下を機械抽出する。

- productFamily
- attribute 名一覧
- attribute 値一覧
- operation
- usagetype
- unit
- beginRange / endRange
- SKU 数
- Price Dimension 構造

巨大 JSON を直接人手で読むことを前提にせず、まず料金構造レポートを生成する。

### 1.4 Service / Profile / Component の抽出基準

Service 境界は AWS Price List 内の自然な商品区分および AWS 公式のサービス概念を優先する。

Profile は、同一 Service 内で必要な Pricing Component 構成または主要な課金方式が変わる場合に分ける。

単なる selector の違いは原則 Profile に分けない。

Pricing Component は、ユーザーが使用量を独立して変更でき、その変更によって他の料金要素とは独立に金額が変化する課金要素を基本単位とする。

### 1.5 adapter

まず以下の generic DSL で表現する。

- `unit`
- `tiered`
- `scale`
- `transform`
- `derive`
- `enabledWhen`
- 複数 Component の合算

これらで表現できない場合のみ `adapter.js` を使用する。

adapter 使用時は generic DSL では表現不能な理由を必ず記録する。

単に実装が簡単という理由だけで adapter を採用してはならない。

### 1.6 PR 成果物

新サービス追加 PR は原則以下を含む。

```text
services/<service>/
  service.json
  profiles/*.json
  components/*.json

tests/golden/<service>.json
```

新しい `serviceCode` の場合、PR CI では AWS から一時 Price DB を生成して検証してよいが、その一時データは自動 commit しない。

merge 後、Price Update Workflow が正式な `pricing/generated` を生成する。

### 1.7 PR 解析サマリ

PR または CI Summary に以下を表示できるようにする。

- Service
- Price Source / serviceCode
- Profiles
- Components
- Selectors
- Usage inputs
- matched productFamily
- adapter の有無
- unmapped productFamily / pricing category

自動化の終点は原則 Pull Request 作成までとし、merge は人間レビューを基本とする。

追加済みサービスの将来変更は、通常の Price Update CI が未知属性、料金分岐、unit、range、productFamily 等の変化を検知する。

---

## 2. AWS Pricing Calculator と UI の関係

### 2.1 基本原則

本アプリの出発点は、AWS 公式料金を正確に計算しつつ、既存 AWS Pricing Calculator より入力・比較を分かりやすくすることである。

したがって次を基本原則とする。

> 料金条件・SKU 解決は AWS 公式仕様へ忠実にする。一方、画面構成や操作体系は AWS Pricing Calculator をそのまま複製せず、見積比較・入力・変更のしやすさを優先する。

AWS Pricing Calculator に存在する入力項目であっても、必ず同じ配置・同じ画面構成で表示する必要はない。

### 2.2 UI visibility

selector / usageInput は以下の表示レベルを持てる。

- `primary`: 通常画面に常時表示
- `advanced`: 詳細設定で表示
- `hidden`: ユーザーには表示せず Definition 上で固定・内部利用

例:

```json
{
  "id": "tenancy",
  "ui": {
    "visibility": "advanced"
  }
}
```

UI に表示しない属性でも料金条件として必要なら Definition 内に保持する。

### 2.3 デフォルト値

デフォルト値の優先順位は以下とする。

1. AWS Pricing Calculator の公式デフォルト
2. AWS 公式ドキュメント上の標準値
3. Price Data から一意に導ける値
4. 本アプリ独自の合理的デフォルト
5. デフォルトなし

必要に応じてデフォルトの出典区分を記録できるようにする。

```json
{
  "default": 730,
  "defaultSource": "app"
}
```

本アプリ独自の値を無根拠に暗黙設定しない。

### 2.4 required usage

必須 usage が未設定なら料金を計算済み扱いにしない。

```json
{
  "required": true
}
```

required / primary 入力はサービス追加後の設定画面で確認できるようにする。

### 2.5 内訳と差額

詳細画面では Component 単位の料金内訳を表示できるようにする。

例:

```text
DB instance      $120.00
Storage           $11.50
Provisioned IOPS  $24.00
Backup             $3.20
------------------------
Total             $158.70
```

入力変更に伴う Component 単位の差額も即時計算可能な構造とする。

---

## 3. Project JSON と Definition 変更への耐性

### 3.1 保存方針

Project JSON は編集状態の復元を目的とし、Definition 本体、Price DB 本体、SKU 全文、Price Dimension 全文を保存しない。

保存対象の中心は以下とする。

- serviceId
- profileId
- componentId
- selector / usageInput の field ID
- ユーザー選択値 / 入力値
- Region 設定
- 保存日時
- 保存時 Price List metadata

例:

```json
{
  "serviceId": "aurora",
  "profileId": "provisioned",
  "profileValues": {
    "engine": "Aurora MySQL"
  },
  "components": {
    "instance": {
      "enabled": true,
      "values": {
        "instanceType": "db.r7g.large",
        "quantity": 2,
        "hoursPerMonth": 730
      }
    }
  }
}
```

復元後は現在の Definition と現在の Price DB に対して再解決・再計算する。

### 3.2 ID 安定性

一度公開した以下の ID は永続識別子として扱い、意味を変更して再利用しない。

- serviceId
- profileId
- componentId
- selector ID
- usageInput ID

不要になった ID は廃止または deprecated とし、別の意味には新しい ID を発行する。

### 3.3 保存時 metadata

Project JSON には監査・診断用として以下を記録できる。

- savedAt
- Price List publicationDate
- Price DB manifest version / identifier
- Definition schemaVersion

これは古い Price DB を固定再現するためではなく、保存時と復元時のデータ差をユーザーへ説明するために使用する。

### 3.4 復元検証

復元時は以下の順で検証する。

1. Service / Profile / Component Definition が存在するか
2. 保存された field ID が現在も存在するか
3. 保存された selector 値が現在も有効か
4. 現在の Price Query で料金を解決できるか

一部 Service / Component が復元不能でも Project 全体を拒否しない。

復元状態:

- `valid`: 現在の Definition / Price DB で完全に再解決可能
- `warning`: 計算可能だが意味ある変更・migration が発生
- `invalid`: 現在の条件では料金計算不能

### 3.5 migration

意味が完全に同じ field / ID rename 等については宣言的 migration を許可する。

料金条件そのものが変わる自動置換は禁止する。

例として、廃止 instance type を似た新 instance type に自動置換してはならない。その場合は invalid / 要再選択とする。

### 3.6 保存時金額

Project JSON は計算済み月額を正本として保存しない。

正式な見積結果の記録は PDF 等の出力物で扱う。

復元時には保存時 Price List 日付と現在の Price List 日付が異なる場合、現在の料金データで再計算されていることを通知する。

---

## 4. Region モデル

### 4.1 Region の正本

Region の永続識別子は AWS Region Code とする。

例:

- `ap-northeast-1`
- `ap-northeast-3`
- `us-east-1`

`Asia Pacific (Tokyo)` 等の `location` 文字列は表示・補助検証用途とし、主キーとして使用しない。

### 4.2 Region Mode

Pricing Component / Service の Region 処理は以下の4モードを表現可能にする。

- `project`: Project Region を継承
- `global`: Project Region を料金解決へ使用しない
- `selector`: Component / Service 側で別 Region を指定
- `pair`: source / destination の2地点で料金が決まる

通常の EC2 / RDS / Aurora / EBS 等は `project` を基本とする。

### 4.3 Service instance の Region override

Service instance は Project Region を継承するのを標準とする。

```json
{
  "region": {
    "mode": "inherit"
  }
}
```

必要な場合は override 可能なデータモデルとする。

```json
{
  "region": {
    "mode": "override",
    "value": "ap-northeast-3"
  }
}
```

初期 UI では Advanced 項目としてよい。

### 4.4 Region pair

Data Transfer 等の複数地域料金は独立 Pricing Component とし、source / destination を保持する。

例:

```json
{
  "regionMode": "pair",
  "source": {
    "valueFrom": "project.region"
  },
  "destination": {
    "valueFrom": "component.destination"
  }
}
```

EC2 本体等へ転送料を暗黙加算しない。

### 4.5 対応 Region

AWS が提供する Region 一覧と、本アプリが正式対応する Region 一覧を分離する。

初期正式対応 Region は以下のみとする。

```text
ap-northeast-1 (Tokyo)
```

設計・データモデルは multi-region 対応とし、Region 追加時は enabledRegions、Price DB 生成、Golden Case 検証等で拡張できるようにする。

共通 Data Transfer Component の抽象化は、複数サービスの実例が揃ってから判断する。

---

## 5. 月額・稼働時間・usage 正規化

### 5.1 基本表示期間

初期版の比較・見積出力単位は月額とする。

Project に共通 assumption として標準月間時間を持つ。

```json
{
  "usageAssumptions": {
    "hoursPerMonth": 730
  }
}
```

730 は常時稼働を表す初期値であり、固定の課金前提ではない。

### 5.2 稼働時間入力

EC2、RDS 等の「動作している時間に応じて課金される」サービスでは、AWS Pricing Calculator と同様に稼働時間をユーザーが設定可能にする。

時間課金 Component は少なくとも月間稼働時間を直接入力できるようにする。

例:

```json
{
  "id": "hoursPerMonth",
  "label": "稼働時間 / 月",
  "type": "number",
  "unit": "hours",
  "defaultFrom": "project.usageAssumptions.hoursPerMonth",
  "minimum": 0
}
```

必要に応じて次の入力形式から月間時間を導出できるようにする。

- hoursPerMonth
- hoursPerDay x daysPerMonth
- utilization x hoursPerMonth

730 時間は常時稼働時のデフォルトにすぎず、ユーザーが変更可能である。

### 5.3 Lambda 等の複合 usage

Lambda 等は、実行回数、平均実行時間、メモリ量等の複数入力から課金 usage を生成する。

例:

```text
requestsPerMonth
x averageDuration
x memory
-> GB-seconds 等の課金 usage
```

AWS Pricing Calculator で重要な usage 入力としてユーザーに露出している値は、原則として本アプリでも設定可能にする。

ただし UI 配置は公式 Calculator のコピーではなく、比較しやすい形へ再構成する。

### 5.4 derive

任意 JavaScript 式は禁止するが、usage 導出のために限定的な演算 DSL を許可する。

初期演算:

- `multiply`
- `divide`
- `add`
- `subtract`

例:

```text
project.hoursPerMonth x component.utilization
```

や

```text
requestsPerMonth / 1000000
```

等を表現できるようにする。

### 5.5 単位正規化

Pricing Engine はユーザー入力 usage を Price Dimension の unit へ正規化してから料金計算する。

例:

- hours -> seconds
- GB -> TB
- requests -> thousand requests
- requests -> million requests

AWS 課金仕様上の minimum / rounding / step は Component の `transform` として適用する。

730 時間等の月間前提と、AWS の最低課金時間 / 最低課金単位は別概念として扱う。

### 5.6 usage の意味

- Storage: 月間平均使用量を基本とする
- Requests: 月間総リクエスト数
- Data Transfer: 月間総転送量
- 時間課金: 月間稼働時間またはそれに換算可能な usage

Price Dimension が Month 単位の場合は、その unit をそのまま利用する。

初期版では年額を `月額 x 12` として自動表示しない。

---

## 6. 計算精度・丸め・表示

### 6.1 内部精度

AWS Price List の `pricePerUnit` は文字列の原値を保持し、料金計算では JavaScript の通常 `Number` のみに依存せず Decimal 相当の高精度演算を使用する。

内部料金値は計算途中で丸めない。

Price Dimension -> Component -> Service -> Plan の各集計は未丸め値で処理する。

### 6.2 表示

通常の月額表示は USD 小数第2位を基本とする。

```text
$123.45 / month
```

Unit Price 等、小数点以下の精度が意味を持つ値は必要に応じてより多くの桁を表示する。

単価を一律2桁に丸めない。

### 6.3 1 cent 未満

正確にゼロの場合と、0より大きいが表示上1 cent未満の場合を区別する。

```text
exact zero            -> $0.00
0 < amount < $0.01    -> < $0.01
```

### 6.4 PDF / CSV

PDF の月額 Component / Service / Plan 合計は原則小数第2位表示とする。

CSV は必要に応じて未丸め内部値と表示値を両方出せる構造とする。

例:

```text
monthly_price_usd,monthly_price_display
12.3456789,12.35
```

内部値は Decimal 値を文字列として出力する。

### 6.5 差額

比較案の差額は、丸め後表示値の差ではなく未丸め内部値同士から計算し、最後に表示丸めする。

```text
round(rawA - rawB)
```

とし、

```text
round(rawA) - round(rawB)
```

とはしない。

表示丸めと、AWS 課金仕様上の usage rounding / minimum / step は別処理とする。

---

## 7. 本書で追加確定した事項

1. 新サービス追加は AWS Price List の機械解析から開始する。
2. AWS Pricing Calculator は UI 入力仕様を把握する補助情報源とする。
3. Calculator の DOM 情報は本番 Definition へ保存しない。
4. Service / Profile / Component を可能な限り自動抽出する。
5. ChatGPT / 自動処理は Definition、Golden Case、PR 作成までを自動化可能とする。
6. merge は原則人間レビューとする。
7. AWS 料金精度を優先し、UI は AWS Calculator をそのまま複製しない。
8. UI visibility は `primary / advanced / hidden` とする。
9. Project JSON は ID とユーザー入力を保存し、Price DB / Definition 本体は保存しない。
10. Project 復元は現在の Definition / Price DB で再解決する。
11. 復元状態を `valid / warning / invalid` で管理する。
12. 意味を変える自動 migration は行わない。
13. Region の正本は AWS Region Code とする。
14. Region 処理は `project / global / selector / pair` を表現可能にする。
15. Service instance 単位の Region override をデータモデル上許容する。
16. 初期正式対応 Region は `ap-northeast-1` のみとする。
17. 初期版の比較期間は月額とする。
18. 730h/month は常時稼働の標準初期値であり固定値ではない。
19. EC2 / RDS 等の時間課金サービスでは稼働時間をユーザーが設定可能にする。
20. Lambda 等は複数 usage から課金単位を導出できるようにする。
21. `derive` は限定演算 `multiply / divide / add / subtract` のみ許可する。
22. 内部料金計算は Decimal 相当の高精度値を使用し途中丸めしない。
23. 通常月額表示は USD 小数第2位とする。
24. 1 cent 未満の正の料金は `< $0.01` と表示する。
25. 差額計算は未丸め値から行う。

---

## 8. 次に決定する事項

次の仕様検討では Price DB の配信整合性を定義する。

特に以下を決める。

- `manifest.json` と `products.json` / `index.json` の世代整合性
- GitHub Pages deploy 中に旧世代・新世代ファイルが混在する可能性への対策
- Price DB の versioned path / immutable asset 方針
- browser cache と manifest cache の扱い
- Price DB 取得失敗時の UI behavior
- stale data の許容範囲
