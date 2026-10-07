# Codex 自律実装運用仕様

最終更新: 2026-10-07

本書は `docs/IMPLEMENTATION_PLAN.md` に定義されたPhase実装、および新サービス追加・既存サービス拡充を、人間の追加指示なしで完了させるための運用仕様である。

本書は料金・UI仕様そのものを変更しない。仕様の優先順位は以下とする。

1. `docs/SPEC.md`
2. `docs/PRICING_ARCHITECTURE.md`
3. `docs/SERVICE_ONBOARDING.md`（新サービス追加・既存サービス拡充時）
4. `docs/AUTONOMOUS_IMPLEMENTATION.md`（実装の進め方）
5. `docs/IMPLEMENTATION_PLAN.md`（Phaseごとの実装内容）

`IMPLEMENTATION_PLAN.md` 内にある各Phase個別の `/goal` 例や「1 Phase = 1 Goal」という旧運用記述と本書が競合する場合は、**本書を優先する**。

---

## 1. 基本運用

通常の実装開始時、人間はCodexへ `/goal` を1回だけ与える。

Codexはその後、必要な作業を内部sub-goalへ分解し、自律的に実行する。

大規模初期実装では次のPhase進行を使う。

```text
Phase 1
  -> 実装
  -> test / validation
  -> 不具合修正
  -> Phase完了判定
  -> Phase 2
  -> ...
  -> 最終Phase
  -> 最終E2E / hardening
  -> 完了報告
```

新サービス追加・既存サービス拡充では `docs/SERVICE_ONBOARDING.md` のend-to-endフローを使う。

通常の実装ステップ間で人間の確認・承認・追加 `/goal` を要求しない。

後続作業に必要な前提が不足している場合は、必要な先行実装へ戻って修正し、その後再度前進する。

---

## 2. 自律実行の原則

### 2.1 自分で調査して進める

Codexは実装中に不明点が生じても、まず以下を自分で確認する。

- 現在のrepository tree / code
- `AGENTS.md`
- `docs/SPEC.md`
- `docs/PRICING_ARCHITECTURE.md`
- `docs/SERVICE_ONBOARDING.md`（service onboarding時）
- `docs/IMPLEMENTATION_PLAN.md`
- 既存test / fixture / workflow
- 必要な公式AWS資料
- AWS Pricing Calculatorの該当サービス画面（service onboarding時）
- AWS Public Price List

単純な実装上の選択肢について、人間へ質問して停止しない。

### 2.2 自分で修正して再試行する

build/test/validation/Actions/deployが失敗した場合、原則として以下を繰り返す。

```text
失敗
-> 原因分析
-> 修正
-> narrow test
-> repository-level test/validation
-> 必要ならcommit/push
-> Actions/deploy再確認
-> 成功まで反復
```

1回の失敗を理由に作業を中断しない。

### 2.2.1 修復時も既存のscope最適化を保全する

失敗修正のためにworkflow、fingerprint、Price DB builder、publication処理、validation orchestrationを変更する場合、**「直すこと」を優先して既存のscope制御を見落としてはならない**。

修正前に最低限次を確認する。

- 現在どの条件でfull validation / scoped validationが選ばれるか
- onboarding/re-onboarding時に対象Serviceを限定する入力がどこから渡るか
- 変更するfingerprintがsemantic validation範囲、AWS source refresh範囲、build再生成範囲のどれに影響するか
- 修正により`scope = all`へ退化しないか
- EC2等のcase数が大きいServiceが新たに対象へ入らないか

修復の目的がPrice DBの再生成、chunk/materialization、publish/retentionの訂正である場合、semantic意味論まで変わらない限り、全Service semantic validationを副作用として発生させない。

実装担当は、修正後のActionsを起動する前または遅くとも重いmatrix job生成前に、plan summaryの対象Service、source数、case数、batch数を確認する。想定より大幅に広い場合は、そのまま処理を継続する前にscope判定の実装を再検討する。

修復で一時的なfull rebuildが必要な場合も、次を別々に判断する。

```text
raw sourceを再取得する範囲
Price DBを再materializeする範囲
semantic validationを再実行する範囲
drift validationを再実行する範囲
```

これらを単一のglobal fingerprint変更でまとめて全件化してはならない。既存のscope最適化を意図的に外す必要がある場合は、その必要性を仕様・PR・実行ログのいずれかへ明示する。

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
- Calculator項目を既存Profile/Component/selector/usageInputへどう分割するか

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

Service onboardingでは `docs/SERVICE_ONBOARDING.md` の完成条件も同じく内部ゲートとして扱う。

---

## 4. Phase間の進行

### 4.1 原則直列

大規模初期実装の基本順序は `docs/IMPLEMENTATION_PLAN.md` に従う。

依存関係を満たす範囲で並行・前後入替してよいが、後続Phase開始前に必要な先行Phaseを完了する。

### 4.2 前のPhaseへ戻ることを許可する

後続Phaseで先行実装の不足が見つかった場合、先行Phaseのコードを修正してよい。

これはscope逸脱とはみなさない。

ただし、仕様変更を伴う場合は停止条件に従う。

### 4.3 Phaseごとのcommit

可能な限りreview可能な単位でcommitを作る。

細かな中間commitを追加してもよい。

人間のmerge承認を通常の実装ゲートにはしない。同一作業branchまたは許可されたmain更新上で完了まで継続してよい。

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
- Calculator画面の入力項目棚卸し
- On-Demand固定ポリシーに基づく購入プラン項目の除外
- Project共通項目との重複除外
- Service Definitionへの標準的なマッピング

「どちらでも仕様を満たす」選択肢は、保守性・単純性・testabilityを優先して決める。

---

## 6. 停止を許可する条件

人間の追加判断を要求して停止してよいのは、**自力では安全に決定できない真のblocker**に限定する。

### 6.1 仕様の明白な矛盾

以下の正本同士が同時に満たせず、実装方法では解消できない場合。

- `docs/SPEC.md`
- `docs/PRICING_ARCHITECTURE.md`
- service onboarding時の `docs/SERVICE_ONBOARDING.md`

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
- Calculatorの入力項目が多い
- Price Listが巨大
- Price DB再生成に時間がかかる
- GitHub Actionsが一度失敗した

これらはCodexが自律的に解決する。

---

## 8. 進捗管理

Codexは長時間実装で現在地を失わないため、Phaseまたはonboarding stepの状態を継続的に管理する。

推奨状態:

```text
pending
in_progress
completed
blocked
```

必要ならrepository内に一時的または永続的なprogress fileを作成してよい。

ただし、progress fileそのものを仕様の正本にはしない。

区切りごとに最低限以下を記録する。

- completed step / Phase
- 主な変更
- tests / validations
- warning
- 次step

その後、返答待ちせず次作業を開始する。

---

## 9. 外部情報の利用

AWSの現在情報が必要な場合、Codexは公式AWS資料・AWS Pricing Calculator・Public Price List等を自ら参照して進める。

人間へURL、入力項目、料金カテゴリ、SKU、単価の調査を依頼しない。

料金値の正本は常に仕様どおりAWS Public Price Listとする。

Service onboardingでは、Calculator UIを入力項目・依存関係・初期値・primary/advanced区分の主要参照先とし、Price Listを料金値の正本とする。両者だけで意味が不明な場合は公式AWS docsで補完する。

---

## 10. 最終完了条件

大規模初期実装では `docs/IMPLEMENTATION_PLAN.md` の完成判定をすべて検証する。

Service onboardingでは `docs/SERVICE_ONBOARDING.md` の完成条件をすべて検証する。

一部条件がFAILなら、該当実装へ戻って修正し、再度最終検証を行う。

全条件がPASSした時点でのみ実装完了とする。

最終報告には以下を含める。

- 実装した主要機能または追加サービス
- Calculatorから採用した主要入力項目
- 明示的に除外した項目と理由
- test / validation / E2E結果
- Price DB build/publish結果（該当時）
- GitHub Actions結果
- GitHub Pages deploy結果
- 残存warning / known limitation
- 仕様変更の有無
- 最終commit一覧または主要commit

---

## 11. Codexへ渡す総合 `/goal` の前提

通常運用では、各Phase個別 `/goal` は使用しない。

人間は1回の総合 `/goal` を与える。

Codexはその総合goalを内部sub-goalへ自分で分解して実行する。

`docs/IMPLEMENTATION_PLAN.md` に記載されたPhase個別 `/goal` 文面は、デバッグ・再開・特定Phaseのみ再実行する際の参考テンプレートとして扱う。

---

## 12. 新サービス追加依頼の標準解釈

Web版ChatGPTの「AWS見積もりツール」Project、Codex、その他repositoryへ書き込み可能な実装エージェントに対して、例えば次の依頼が与えられた場合:

```text
AWS Fargateを追加して
```

これは設計相談ではなく、特段の限定がない限り **end-to-endの実装依頼** と解釈する。

実装担当は次を自律実行する。

1. 最新mainと正本docsを確認
2. `docs/SERVICE_ONBOARDING.md` に従ってCalculator画面を調査
3. 公式AWS docsとPublic Price Listを調査
4. On-Demand固定で採用項目を決定
5. Definition / UI / 必要なgeneric codeを実装
6. test / Golden / validation / E2Eを追加・実行
7. 失敗を修正して全required checkを通す
8. commit/push
9. GitHub Actionsを追跡
10. Price DB更新が必要ならvalidated buildをpublish
11. GitHub Pages deploy成功まで追跡
12. 公開版の代表操作を確認
13. 完了報告

途中で「次に進めてよいか」を人間へ確認しない。

ユーザーが `調査だけ`、`設計だけ`、`Definitionだけ`、`デプロイしない` 等と明示した場合のみ、その指定に合わせてscopeを縮小する。
