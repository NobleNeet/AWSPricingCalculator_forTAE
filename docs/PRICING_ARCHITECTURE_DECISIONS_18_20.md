# Pricing Architecture Specification — Decisions 18–20

最終更新: 2026-10-04

本書は `docs/PRICING_ARCHITECTURE.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_09_14.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_15_16.md`、`docs/PRICING_ARCHITECTURE_DECISIONS_17.md` の続編として、Decision Bundle 18〜20で確定した Comparison Row、Plan、Project JSON の正式データモデルを定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Comparison Row モデル

### 1.1 基本原則

Comparison Row は AWS Service Definition の一部ではなく、Project 内の比較構造として扱う。

```text
Project
  -> Comparison Row
      -> Plan Cell
          -> Service Instance
```

Row は AWS 上の固定カテゴリではなく、ユーザーが「同じ行で比較したい項目」をまとめるための比較単位である。

例:

```text
Compute
  案A: EC2
  案B: EC2
  案C: Lambda
```

EC2 と Lambda が同じ AWS 分類だから同じ Row に置かれるのではなく、この Project において同じ比較対象として扱いたいから同じ Row に置かれる。

### 1.2 Service Definition との分離

Service Definition に以下のような比較相手情報を持たせない。

```text
EC2 canCompareWith Lambda
RDS canCompareWith Aurora
```

比較関係は Project ごとに異なり得るためである。

### 1.3 comparisonMode

現行モックの `kind: linked / unique` は廃止し、Row の比較意図をより直接的に表す。

初期版では以下を使用する。

- `alternatives`: 同じ Row 内で別 Service への置換を許す
- `fixed-service`: Service 自体は固定し、設定値だけ比較する
- `free`: Service 制約なし

### 1.4 serviceConstraint

Row に配置できる Service の制約は Project Row 側で持つ。

初期版の mode:

- `same`: 最初に設定された Service のみ許可
- `set`: 指定された Service ID 集合のみ許可
- `any`: Catalog 上の active Service を許可

例:

```json
{
  "comparisonMode": "alternatives",
  "serviceConstraint": {
    "mode": "set",
    "serviceIds": ["rds", "aurora"]
  }
}
```

通常の新規 Service 追加時は `same` Row を自動生成する。

別 Service への置換をユーザーが明示した場合、必要に応じて `same` から `set` へ拡張できる。

### 1.5 Row label

Row label は使用 Service から自動生成可能とする。

例:

```text
EC2
EC2 / Lambda
RDS / Aurora
```

ただしユーザーが役割名へ変更できるようにする。

```json
{
  "label": "DB基盤",
  "labelMode": "custom"
}
```

初期値:

- `auto`
- `custom`

### 1.6 Row ID

Row ID は内容に依存しない安定IDとする。

```text
row-<uuid等>
```

`compute`、`database` 等の意味付きIDを永続識別子には使用しない。

Service 構成や label が変更されても Row ID は維持する。

### 1.7 Cell

Row Cell は Service 設定本体を埋め込まず、Service Instance ID を参照する。

```json
{
  "cells": {
    "plan-a": {
      "serviceInstanceId": "svc-101"
    }
  }
}
```

空セルは key 不存在で表す。

### 1.8 配置数制約

初期版では以下を正式制約とする。

```text
1 Row x 1 Plan = 0 または 1 Service Instance
```

1 Cell に複数 Service Instance を置かない。

複合構成を比較したい場合は複数 Row に分ける。

例:

```text
案A: EC2 + ALB
案B: Lambda + API Gateway
```

は以下のように表す。

```text
Compute
  A: EC2
  B: Lambda

Ingress
  A: ALB
  B: API Gateway
```

### 1.9 同一 Service の複数利用

同じ Service を複数 Row に置くことを許可する。

例:

```text
Web Server   -> EC2
Batch Server -> EC2
Jump Host    -> EC2
```

Service ID と Row ID は1:1ではない。

### 1.10 Row 制約と Pricing Engine

`comparisonMode` / `serviceConstraint` は比較 UI・Project 構造のための情報であり、Pricing Engine の料金計算には使用しない。

料金計算は Service Instance と Definition / Price DB だけを参照する。

Row 制約不整合は Project semantic validation で検出する。

### 1.11 自動マージ禁止

同じ Service や似た label の Row が複数存在しても自動的に統合しない。

用途が異なる可能性があるため、ユーザーの明示操作なしに Row をまとめない。

### 1.12 Service 追加 UI

Service 追加時は少なくとも以下の2経路を持てるようにする。

```text
新しい比較行として追加
既存の比較行に追加
```

既存 Row に Constraint 外の Service を追加する場合は、Constraint 拡張をユーザーへ明示する。

---

## 2. Plan データモデル

### 2.1 Plan の位置付け

Plan は Project 内の独立エンティティとする。

```json
{
  "plans": {
    "plan-001": {
      "name": "案A",
      "note": "ベンダー原案"
    }
  }
}
```

### 2.2 Plan ID

Plan ID に A/B/C 等の表示順の意味を持たせない。

```text
plan-<uuid等>
```

を安定IDとして使用する。

UI 上の `案A`、`案B` 等は表示名にすぎない。

### 2.3 Plan name / note

Plan は少なくとも以下を持つ。

- `name`
- `note`

いずれも表示用 metadata であり、料金計算には使用しない。

### 2.4 Plan order

表示順は Plan 本体へ `sortOrder` を持たせず、Project の `planOrder` で管理する。

```json
{
  "planOrder": ["plan-001", "plan-002"]
}
```

ドラッグ並び替えや途中挿入時に Plan 本体を書き換えずに済む構造とする。

### 2.5 Baseline Plan

差分比較の基準案は Project に1つだけ持つ。

```json
{
  "baselinePlanId": "plan-001"
}
```

Baseline は料金計算値自体には影響せず、差額・差額率・UI強調の比較基準だけに使用する。

Baseline Plan を削除した場合は、残っている `planOrder` の先頭 Plan を新しい Baseline にする。

### 2.6 Plan 最低数

Project は最低1つの Plan を持つ。

最後の1 Plan は削除不可とする。

### 2.7 Plan 複製

Plan 複製は完全な独立コピーとする。

複製対象:

- Service Instance
- Profile 選択
- selector
- usage input
- Component enabled state
- Region override
- その他 Service Instance 内のユーザー状態

複製先ではすべて新しい Service Instance ID を発行する。

Plan 間で Service Instance ID を共有しない。

### 2.8 Comparison Row の扱い

Plan 複製時に Comparison Row 自体は複製しない。

既存 Row に target Plan 用の新 Cell を作成し、source Plan Cell の Service Instance を deep copy して参照させる。

### 2.9 空 Plan

空の新規 Plan を追加できる。

空 Plan では既存 Row の Cell を持たない状態から開始する。

UI 上は以下を別操作として扱う。

- 新しい空の案を追加
- 既存案を複製

### 2.10 Plan 削除

Plan 削除時は以下を行う。

1. `plans` から Plan を削除
2. `planOrder` から削除
3. 各 Row の該当 Cell を削除
4. その Plan 専用 Service Instance を削除
5. 全 Plan で空になった Row は必要に応じて削除
6. Baseline なら先頭 Plan を新 Baseline とする

### 2.11 Service Instance 非共有

値が同じであっても Plan 間で同じ Service Instance ID を共有しない。

片方の編集が別 Plan に伝播することを防ぐ。

### 2.12 差額

Plan 差額は未丸め内部値から計算する。

```text
rawTotal(plan) - rawTotal(baseline)
```

表示時のみ丸める。

差額率も表示時に算出可能とする。

Baseline total が 0 の場合は差額率を表示しない。

### 2.13 Plan status

初期版では `draft / final / approved` 等の承認ワークフロー用 status は持たせない。

### 2.14 Plan Region

Plan 単位の Region は設けない。

Region は既定どおり以下で表現する。

```text
Project default Region
+
Service Instance Region override
```

### 2.15 複製履歴

`copiedFromPlanId` 等の系譜情報は初期版では保存しない。

---

## 3. Project JSON 正式データモデル

### 3.1 トップレベル構造

Project JSON は以下のトップレベル構造へ正規化する。

```json
{
  "schemaVersion": 1,
  "project": {},
  "plans": {},
  "rows": {},
  "serviceInstances": {},
  "savedAt": "...",
  "priceData": {}
}
```

Project JSON はユーザーの編集状態・選択値を保存するものであり、Price DB 本体、Definition 本体、計算済み料金を保存しない。

### 3.2 正式例

```json
{
  "schemaVersion": 1,
  "project": {
    "id": "project-8c8e",
    "name": "Web更改案比較",
    "defaultRegion": "ap-northeast-1",
    "usageAssumptions": {
      "hoursPerMonth": 730
    },
    "baselinePlanId": "plan-a1",
    "planOrder": ["plan-a1", "plan-b2"],
    "rowOrder": ["row-001"]
  },
  "plans": {
    "plan-a1": {
      "name": "現行案",
      "note": "ベンダー原案"
    },
    "plan-b2": {
      "name": "Serverless案",
      "note": "比較用"
    }
  },
  "rows": {
    "row-001": {
      "label": "Compute",
      "labelMode": "custom",
      "comparisonMode": "alternatives",
      "serviceConstraint": {
        "mode": "set",
        "serviceIds": ["ec2", "lambda"]
      },
      "cells": {
        "plan-a1": {
          "serviceInstanceId": "svc-001"
        },
        "plan-b2": {
          "serviceInstanceId": "svc-002"
        }
      }
    }
  },
  "serviceInstances": {
    "svc-001": {
      "serviceId": "ec2",
      "profileId": "standard",
      "region": {
        "mode": "inherit"
      },
      "profileValues": {},
      "components": {
        "instance": {
          "enabled": true,
          "values": {
            "instanceType": "m7i.large",
            "quantity": 2,
            "hoursPerMonth": 730
          }
        }
      }
    },
    "svc-002": {
      "serviceId": "lambda",
      "profileId": "standard",
      "region": {
        "mode": "inherit"
      },
      "profileValues": {},
      "components": {
        "compute": {
          "enabled": true,
          "values": {
            "requestsPerMonth": 5000000,
            "averageDurationMs": 300,
            "memoryMB": 1024
          }
        }
      }
    }
  },
  "savedAt": "2026-10-04T00:42:00+09:00",
  "priceData": {
    "buildId": "20261003T123456Z-a1b2c3d4",
    "publicationDate": "2026-10-03"
  }
}
```

### 3.3 project

`project` は Project 全体設定だけを持つ。

初期版で少なくとも以下を表現する。

- `id`
- `name`
- `defaultRegion`
- `usageAssumptions`
- `baselinePlanId`
- `planOrder`
- `rowOrder`

`project.id` は将来 Project 間識別に利用できる安定IDとする。

### 3.4 plans

Plan は ID を key とする map で保持する。

```json
{
  "plans": {
    "plan-a1": {
      "name": "案A",
      "note": "..."
    }
  }
}
```

順序は `project.planOrder` に分離する。

### 3.5 rows

Comparison Row も ID を key とする map で保持する。

順序は `project.rowOrder` に分離する。

### 3.6 cells

Row Cell には `serviceInstanceId` のみを保存する。

空 Cell は key 不存在で表す。

`null` を大量に保存する必要はない。

### 3.7 serviceInstances

ユーザーが Project 内で作成した AWS Service の実体を保存する。

Service Instance は Service Definition とは別物である。

最低限以下を表現できるようにする。

- `serviceId`
- `profileId`
- `region`
- `profileValues`
- `components`

### 3.8 profileValues

Profile scope の selector 等の現在値を保存する。

例:

```json
{
  "profileValues": {
    "engine": "Aurora MySQL"
  }
}
```

### 3.9 components

Component ごとの enabled state と入力値を保存する。

```json
{
  "components": {
    "instance": {
      "enabled": true,
      "values": {
        "instanceType": "db.r7g.large",
        "quantity": 1
      }
    }
  }
}
```

selector / usageInput を同じ `values` 内へ保存し、field ID を永続キーとして扱う。

### 3.10 fixedFilter

Definition 上の fixedFilter は Project JSON へ保存しない。

ユーザー状態ではなく、現在の Definition に属する料金解決条件だからである。

復元時に現在の Definition から取得する。

### 3.11 デフォルト値

Service Instance 作成後の現在値は、Definition の default と同じ値であっても Project JSON へ保存する。

例:

```text
hoursPerMonth = 730
```

が default でも保存する。

これにより将来 Definition の default が変更されても、保存時のユーザー状態を維持できる。

### 3.12 unset

未入力状態は key 不存在で表す。

```text
field不存在 = unset
field存在 = 現在値
```

`0`、`false`、空文字等の有効値と unset を混同しない。

### 3.13 derived value

`derive` により計算可能な値は原則保存しない。

例:

```text
hoursPerDay = 8
daysPerMonth = 20
-> derived hoursPerMonth = 160
```

の場合、保存対象は入力元であり、導出結果は復元後に再計算する。

### 3.14 計算結果

以下は Project JSON に保存しない。

- Component total
- Service total
- Plan total
- monthly price
- delta
- delta ratio
- calculated SKU / Price Dimension のコピー

すべて現在の Definition / Price DB から再解決・再計算する。

### 3.15 priceData

保存時の料金データ provenance を監査情報として記録する。

初期版:

```json
{
  "priceData": {
    "buildId": "...",
    "publicationDate": "..."
  }
}
```

必要に応じて `generatedAt` 等を追加可能とする。

復元時に保存時 build を強制使用しない。

### 3.16 Definition metadata

Service Definition 本体や Git commit 全文は Project JSON に埋め込まない。

必要であれば互換性診断用に schemaVersion 等の軽量 metadata のみ保存できる。

---

## 4. Project JSON Schema と検証

### 4.1 Schema

正式 Schema として以下を追加する。

```text
schemas/project.schema.json
```

同じ Schema を以下で共用する。

- Project JSON import
- localStorage restore
- test fixture validation
- CI

### 4.2 二段階 validation

Project restore は以下の2段階で検証する。

```text
1. JSON Schema validation
2. Project semantic validation
```

JSON Schema は構造・型・enum 等を検証する。

semantic validation は cross-reference と現在の Definition / Price DB との整合を検証する。

### 4.3 semantic validation

最低限以下を検証する。

- `baselinePlanId` が `plans` に存在する
- `planOrder` の参照先が存在する
- `planOrder` と `plans` の重複・欠落がない
- `rowOrder` の参照先が存在する
- `rowOrder` と `rows` の重複・欠落がない
- Row Cell の Plan ID が存在する
- `serviceInstanceId` が存在する
- Service Instance が複数 Cell から不正共有されていない
- 孤立 Service Instance が存在しない
- Row の `serviceConstraint` と配置 Service が矛盾していない
- Service ID が現在の Catalog / Definition で解決可能か
- Profile / Component / field ID が現在の Definition で解決可能か

### 4.4 孤立 Service Instance

どの Row Cell からも参照されない Service Instance は invalid とする。

これは通常の古い Definition 互換問題ではなく、Project 保存構造の不整合とみなす。

### 4.5 未知 Service / field

未知 Service ID、Profile ID、Component ID、field ID は JSON Schema の構造エラーとはしない。

Project JSON 自体は構造上有効とし、restore semantic validation で unresolved / invalid Service Instance として扱う。

これにより Project 全体を拒否せず部分復元可能にする。

### 4.6 unresolved data preservation

現在の Definition で解釈できない field/value を import 時に削除しない。

再保存時も unresolved data を可能な限り保持する。

将来 migration が追加された際に復元できる可能性を残すためである。

### 4.7 import 適用順序

Project JSON の貼り付け・import は次の順で処理する。

```text
parse
  ↓
JSON Schema validation
  ↓
semantic validation
  ↓
migration
  ↓
restore report generation
  ↓
user/application apply
```

致命的な parse / schema validation エラーがある場合、現在開いている Project を変更しない。

現在 Project の置換は validation 完了後にのみ行う。

---

## 5. 本Decisionで確定した事項

1. Comparison Row は Project データとして管理する。
2. Row は「同じ役割を比較する箱」として扱う。
3. Service Definition に比較相手情報を持たせない。
4. `linked / unique` を廃止する。
5. `comparisonMode` は `alternatives / fixed-service / free` とする。
6. `serviceConstraint.mode` は `same / set / any` とする。
7. 通常の新規 Service 追加では `same` Row を自動生成する。
8. 別 Service への置換時に Constraint を `set` へ拡張できる。
9. Row label は自動生成可能かつユーザー編集可能とする。
10. Row ID は内容非依存の安定IDとする。
11. Cell は Service Instance ID を参照する。
12. 同じ Service を複数 Row で利用可能とする。
13. `1 Row x 1 Plan = 0 または 1 Service Instance` とする。
14. 複合構成比較は複数 Row で表現する。
15. Row 制約は Pricing Engine に影響させない。
16. 同種 Row を自動マージしない。
17. Plan は Project 内の独立エンティティとする。
18. Plan ID は表示名と分離した安定IDとする。
19. Plan 順序は `planOrder` で管理する。
20. 基準案は `baselinePlanId` として Project に1つ持つ。
21. Project は最低1 Plan を必須とする。
22. Plan 複製は Service Instance まで完全 deep copy する。
23. Comparison Row 自体は Plan 複製時に複製しない。
24. 空 Plan 追加と Plan 複製を別操作とする。
25. Service Instance を Plan 間で共有しない。
26. Plan 差額は未丸め内部値から計算する。
27. Plan 単位 Region は持たせない。
28. Project JSON を `project / plans / rows / serviceInstances` へ正規化する。
29. Cell は `serviceInstanceId` のみ保持する。
30. fixedFilter は Project JSON に保存しない。
31. default と同じ現在値も保存する。
32. unset は field 不存在で表す。
33. derived value は保存しない。
34. 計算済み料金は保存しない。
35. `priceData.buildId / publicationDate` を監査情報として保存する。
36. `schemas/project.schema.json` を正式 Schema とする。
37. Project restore は JSON Schema + semantic validation の二段階とする。
38. 孤立 Service Instance は invalid とする。
39. 未知 Service / field は Project 全体の構造エラーにせず部分復元対象とする。
40. unresolved data は再保存時にも保持する。
41. validation 失敗時は現在 Project を変更しない。

---

## 6. 次に決定する事項

次の仕様検討では、Project restore 時の migration と restore report を具体化する。

特に以下を決める。

- Project `schemaVersion` migration の形式
- Service/Profile/Component/field ID rename の宣言形式
- selector value rename の migration
- safe migration と unsafe migration の境界
- `valid / warning / invalid` の判定単位
- Service Instance 単位・Project 全体の restore report 表示
- unresolved field / deprecated Service の扱い
- migration 後の Project JSON 再保存方針
