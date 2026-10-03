# Codex 自律実装運用仕様

最終更新: 2026-10-04

本書は `docs/IMPLEMENTATION_PLAN.md` に定義された Phase 1〜11 を、Codex CLI に対する **1回の `/goal` 指示から人間の追加指示なしで順次完了させるための運用仕様**である。

本書は料金・UI仕様そのものを変更しない。仕様の優先順位は以下とする。

1. `docs/SPEC.md`
2. `docs/PRICING_ARCHITECTURE.md`
3. `docs/AUTONOMOUS_IMPLEMENTATION.md`（実装の進め方）
4. `docs/IMPLEMENTATION_PLAN.md`（Phaseごとの実装内容）

`IMPLEMENTATION_PLAN.md` 内にある各Phase個別の `/goal` 例や「1 Phase = 1 Goal」という旧運用記述と本書が競合する場合は、**本書を優先する**。

---

## 1. 基本運用

通常の実装開始時、人間はCodexへ `/goal` を1回だけ与える。

Codexはその後、以下を自律的に行う。

```text
Phase 1
  -> 実装
  -> test / validation
  -> 不具合修正
  -> Phase完了判定
  -> Phase 2
  -> ...
  -> Phase 11
  -> 最終E2E / hardening
  -> 完了報告
```

Phase間で人間の確認・承認・追加 `/goal` を要求しない。

各Phaseは依存順に進める。後続Phaseに必要な前提が不足している場合は、現在Phaseまたは必要な先行Phaseへ戻って修正し、その後再度前進する。

---

## 2. 自律実行の原則

### 2.1 自分で調査して進める

Codexは実装中に不明点が生じても、まず以下を自分で確認する。

- 現在のrepository tree / code
- `AGENTS.md`
- `docs/SPEC.md`
- `docs/PRICING_ARCHITECTURE.md`
- `docs/IMPLEMENTATION_PLAN.md`
- 既存test / fixture / workflow
- 必要な公式AWS資料

単純な実装上の選択肢について、人間へ質問して停止しない。

### 2.2 自分で修正して再試行する

build/test/validationが失敗した場合、原則として以下を繰り返す。

```text
失敗
-> 原因分析
-> 修正
-> narrow test
-> repository-level test/validation
-> 成功まで反復
```

1回の失敗を理由にPhaseを中断しない。

### 2.3 実装上の裁量

仕様意味論を変えない範囲ではCodexが自律決定してよい。

例:

- module / helper名
- private internal API
- test fixture構造
- logging形式
- retry間隔等の小規模定数
- file分割の細部
- dependencyの選定（仕様制約に適合する範囲）

---

## 3. Phase完了ゲート

各Phaseは `docs/IMPLEMENTATION_PLAN.md` の完了条件を満たすまで次へ進まない。

最低限、各Phase終了時にCodex自身が以下を確認する。

- 当該Phaseの実装項目が完了している
- relevant unit/integration testsがPASS
- repository-level validationがPASS
- known ERRORが残っていない
- 仕様との差分がない
- 後続Phaseが利用するinterfaceが実際に動作する

warningが残る場合は、仕様上許容されるwarningかを確認して記録したうえで続行してよい。

Phase完了時の報告は作業ログとして保持してよいが、**人間の返答を待たずに次Phaseへ進む**。

---

## 4. Phase間の進行

### 4.1 原則直列

基本順序は以下とする。

```text
1 -> 2 -> 3 -> 4 -> 5 -> 6/7 -> 8 -> 9 -> 10 -> 11
```

Phase 6と7は依存関係を満たす範囲で並行・前後入替してよいが、Phase 8開始前に両方を完了する。

### 4.2 前のPhaseへ戻ることを許可する

後続Phaseで先行実装の不足が見つかった場合、先行Phaseのコードを修正してよい。

これはscope逸脱とはみなさない。

ただし、仕様変更を伴う場合は停止条件に従う。

### 4.3 Phaseごとのcommit

可能な限りPhase単位でreview可能なcommitを作る。

推奨:

```text
Phase 1 completion commit
Phase 2 completion commit
...
Phase 11 completion commit
```

細かな中間commitを追加してもよい。

人間のmerge承認をPhase間ゲートにはしない。同一作業branch上で最終Phaseまで継続してよい。

---

## 5. 人間に質問せず処理する事項

以下では停止せず、自律的に合理的な選択を行う。

- package/library選定
- test runner設定
- fixtureの作り方
- module分割
- internal function signature
- CSS/DOM実装の細部
- temporary file配置
- retry/backoffの小規模調整
- test failureの修正
- lint/build warningの修正
- 既存コードの必要なrefactor
- docsの実装状況更新

「どちらでも仕様を満たす」選択肢は、保守性・単純性・testabilityを優先して決める。

---

## 6. 停止を許可する条件

人間の追加判断を要求して停止してよいのは、**自力では安全に決定できない真のblocker**に限定する。

### 6.1 仕様の明白な矛盾

以下の正本同士が同時に満たせず、実装方法では解消できない場合。

- `docs/SPEC.md`
- `docs/PRICING_ARCHITECTURE.md`

この場合、推測で一方を選ばない。

### 6.2 仕様意味論の変更が不可避

次を変更しないと実装不能な場合。

- Project JSON互換性
- Service Definition DSL semantics
- Price Query semantics
- Calculation semantics
- Free Tier / Tier方針
- 主要UIフロー
- restore fail-open / fail-closed
- Price DB publication consistency

### 6.3 外部権限が物理的に不足

例:

- repository write権限がなくcommit不能
- GitHub Actions設定変更に必要な権限がない
- 必須外部サービスへ認証できない

ただし、権限なしでもfixture/local implementationまで進められる場合は、進められる範囲を先に完了する。

### 6.4 破壊的操作が必要

大量データ消去、履歴破壊、force push等、仕様から当然には導けない破壊的操作が不可避な場合。

---

## 7. 停止してはいけない条件

以下は停止理由にしない。

- testが一度失敗した
- dependency導入方法を選ぶ必要がある
- module名を決める必要がある
- minor UI detailが未指定
- formatter/linter warning
- 実装量が多い
- 1 Phaseが想定より大きくなった
- 後続Phaseで先行Phaseの修正が必要になった
- AWS Price List fixtureの追加が必要

これらはCodexが自律的に解決する。

---

## 8. 進捗管理

Codexは長時間実装で現在地を失わないため、Phase状態を継続的に管理する。

推奨状態:

```text
pending
in_progress
completed
blocked
```

必要ならrepository内に一時的または永続的なprogress fileを作成してよい。

ただし、progress fileそのものを仕様の正本にはしない。

Phase完了時には最低限以下を記録する。

- completed Phase
- 主な変更
- tests / validations
- warning
- 次Phase

その後、返答待ちせず次Phaseを開始する。

---

## 9. 外部情報の利用

Phase 4/7等でAWSの現在情報が必要な場合、Codexは公式AWS資料・Price List等を自ら参照して進める。

人間へURLや料金カテゴリの調査を依頼しない。

料金値の正本は常に仕様どおりAWS Public Price Listとする。

---

## 10. 最終完了条件

Phase 11終了後、`docs/IMPLEMENTATION_PLAN.md` の「完成判定」をすべて検証する。

一部条件がFAILなら、該当Phaseへ戻って修正し、再度Phase 11検証を行う。

全条件がPASSした時点でのみ実装完了とする。

最終報告には以下を含める。

- Phase 1〜11の完了状態
- 実装した主要機能
- test / validation / E2E結果
- GitHub Actions結果または検証状況
- 残存warning / known limitation
- 仕様変更の有無
- 最終commit一覧または主要commit

---

## 11. Codexへ渡す総合 `/goal` の前提

通常運用では、各Phase個別 `/goal` は使用しない。

人間は「Phase 1から11まで自律実行する」という1回の総合 `/goal` を与える。

Codexはその総合goalを、Phaseごとの内部sub-goalへ自分で分解して実行する。

`docs/IMPLEMENTATION_PLAN.md` に記載されたPhase個別 `/goal` 文面は、デバッグ・再開・特定Phaseのみ再実行する際の参考テンプレートとして扱う。
