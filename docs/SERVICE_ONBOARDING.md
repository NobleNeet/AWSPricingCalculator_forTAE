# AWS Service Onboarding Specification

最終更新: 2026-10-04

本書は、新しいAWSサービスをAWSPricingCalculator_forTAEへ追加する場合、および既存サービスの見積入力項目をAWS Pricing Calculator相当に拡充する場合の一般規則と標準作業フローを定義する。

本書は `docs/PRICING_ARCHITECTURE.md` を補完するService onboardingの正本である。料金計算・Definition DSL・Price DB・Pricing Engineの意味論は `docs/PRICING_ARCHITECTURE.md` に従う。ユーザー向けUI・Project/Plan・保存復元等は `docs/SPEC.md` に従う。

---

## 1. 目的

新サービス追加を、人間が個別に入力項目や料金カテゴリを列挙しなくても再現可能な標準手順にする。

通常の依頼は、Web版ChatGPTの「AWS見積もりツール」Project内で新しいチャットを開始し、例えば次のようにサービス名だけを指定すればよい。

```text
AWS Fargateを追加して
```

この依頼を受けた実装担当は、追加質問を前提にせず、現在のrepositoryと公式AWS情報を自ら調査し、入力項目の選定、Service Definition、Price Data対応、UI、test、validation、commit、GitHub Actions、GitHub Pagesへの反映確認までを一連の作業として実施する。

単なるDefinitionファイル作成を「追加完了」とは扱わない。

---

## 2. 情報源の優先順位

新サービスの仕様を決めるときは、以下を用途別に使い分ける。

### 2.1 見積入力UIの基準

AWS Pricing Calculator (`https://calculator.aws/`) の該当サービス作成画面を、以下を把握するための主要な参照先とする。

- 入力セクション
- 入力項目
- 選択肢
- 初期値
- 項目間の依存関係
- 条件付き表示
- primary / advanced の区分
- quantity / usage / duration 等の入力方法

AWS Pricing Calculator UIは料金値の正本ではない。

#### Calculator URLとSPAの扱い

AWS Pricing Calculatorのサービス作成画面は、例えばLambdaでは次のようなURLで表される。

```text
https://calculator.aws/#/createCalculator/Lambda
```

対象サービスのCalculator URLについては次の規則に従う。

1. ユーザーが対象サービスのCalculator URLを提示している場合は、そのURLを対象画面の参照先として使用する。
2. URLが提示されていない場合は、実装担当がサービス名から該当サービス作成画面を自ら特定する。通常依頼でユーザーによるURL提示を必須条件としてはならない。
3. 対象URLを特定できた場合は、調査記録、実装メモ、test/docs等の適切な場所にURLを残す。
4. `calculator.aws` はSPAであり、`#` 以降のfragmentやサービス固有フォームはJavaScript実行後にブラウザ上で構築される。そのため、単純なHTTP取得でベースHTMLを取得しただけでは対象サービス画面を確認したものとみなさない。
5. primary / advanced / 条件付き項目 / defaults / dependenciesを調査するときは、可能な限りJavaScript実行後のレンダリング済み実画面を確認できるブラウザ環境を使用する。
6. Calculatorの実画面を確認できない場合は、AWS公式service documentation、pricing page、Public Price List等から入力項目と課金意味論を補完する。ただし、確認できていないCalculator固有UIを推測で「存在する」と断定してはならない。
7. 実装担当だけでは対象サービスURLを特定できず、かつ公式資料からも対象画面を確定できない場合に限り、ユーザーへCalculator URLまたは画面情報の提示を求めてよい。

URLを知っていることと、Calculatorのレンダリング済み入力フォームを確認できていることは別の状態として扱う。

### 2.2 料金値の正本

料金値、SKU、Price Dimension、対象region、On-Demand termの正本はAWS Public Price Listとする。

Calculator画面に表示された単価や月額をDefinitionへ転記してはならない。

### 2.3 意味論の確認

Calculator画面だけでは課金意味論が不明確な場合は、AWS公式ドキュメント、AWS pricing page、AWS service documentation等を確認する。

Calculator UI、公式ドキュメント、Public Price Listの間に差異がある場合は次のように扱う。

- 料金値・SKU選択: Public Price Listを優先
- 入力項目・ユーザー操作: Calculator UIを優先
- 課金条件・意味: 公式ドキュメントとPrice Listを突き合わせて決定

根拠が不足する場合は推測による料金計算を実装しない。

---

## 3. On-Demand固定ポリシー

本ツールの通常見積はOn-Demand固定とする。

以下の購入・割引方式は入力項目として取り込まない。

- Reserved Instances / Reserved capacity
- Savings Plans
- Spot
- commitment term
- upfront payment option
- account-specific discount
- negotiated/private pricing

ただし、購入プランではなくOn-Demand料金そのものに影響する設定は取り込む。

例:

- tenancy
- operating system / software
- CPU / memory / instance type
- storage type / capacity / IOPS / throughput
- task count / request count / execution duration
- deployment mode
- data transfer
- public IPv4
- monitoring
- architecture
- redundancy / Multi-AZ

「On-Demand固定」を理由に、通常利用量や構成条件まで省略してはならない。

---

## 4. 入力項目の採用規則

Calculatorの該当サービス画面に存在する入力項目は、原則として実装候補とする。

各項目を次の分類で判断する。

### 4.1 必須採用

以下のいずれかに該当する項目は原則として取り込む。

- SKU選択に影響する
- Price Dimension選択に影響する
- 課金数量に影響する
- 月額に直接影響する
- 同一サービス内の主要な利用方式を切り替える
- Calculator上で通常ユーザーが見積条件として指定する主要項目

### 4.2 共通項目との重複

Project Region等、アプリ全体ですでに共通入力として持つ項目はService内へ重複実装しない。

Service固有overrideが既存仕様で認められている場合は、その仕組みを使用する。

### 4.3 省略可能

次の項目は、料金意味論に影響しないことを確認できる場合に限り省略してよい。

- Calculator UIだけの表示設定
- 説明・ナビゲーション専用項目
- 本ツールですでに別の共通UIとして提供している完全な重複項目
- Reserved / Savings Plans / Spot等、本仕様で明示的に対象外の購入プラン項目

省略理由は実装時の調査記録またはtest/docsに残す。

### 4.4 安全に算定できない項目

Calculatorに存在しても、現在のPrice ListとDSLから安全に料金算定できない場合は、次の順序で対応する。

1. 既存DSLで正確に表現できるか確認
2. Component分割で表現できるか確認
3. generic DSLの小規模拡張が必要か検討
4. Pricing Limitationとして明示可能か検討
5. それでも安全に扱えない場合は未対応として明示

先頭SKU、最安SKU、類似SKU、推測単価へのfallbackは禁止する。

---

## 5. Definitionへのマッピング規則

Calculatorの画面構成をそのまま巨大な1ファイルへ写経しない。

`docs/PRICING_ARCHITECTURE.md` の論理モデルへ変換する。

### 5.1 Profile

料金方式またはComponent構成が大きく変わる利用方式だけをProfileとして分ける。

単にSKU属性が変わるだけならselectorを優先する。

### 5.2 selector

「何を使うか」を選ぶ項目をselectorとする。

例:

- engine
- operating system
- deployment option
- instance type
- storage class
- architecture

### 5.3 usageInput

「どれだけ使うか」をusageInputとする。

例:

- hours/month
- quantity
- GB-month
- requests/month
- vCPU-hours
- GB-hours

### 5.4 Pricing Component

独立した課金メーターはComponent分割する。

Calculator上で1つのサービス画面に含まれていても、料金メーターが異なる場合は複数Componentへ分ける。

例: EC2の場合

```text
instance
EBS
monitoring
data transfer
public IPv4
additional cost
```

UI上のセクション境界とComponent境界は必ずしも1:1でなくてよい。

---

## 6. Calculator画面からの取り込み手順

新サービスごとに最低限次を調査する。

1. Calculatorの該当サービス画面とサービス固有URLを特定する
2. URLを開いただけで完了とせず、SPAのJavaScript実行後にレンダリングされた実画面であることを確認する
3. 全primary入力を列挙する
4. Advancedを開き、追加項目を列挙する
5. 条件変更によって新たに現れる入力を確認する
6. 各入力の初期値と候補を確認する
7. 購入プラン関連項目を識別し、On-Demand固定ポリシーに従い除外する
8. Project共通項目との重複を除外する
9. 残った項目をProfile / selector / usageInput / Componentへ分類する
10. Public Price List上のSKU・attributes・dimensionsへ対応付ける
11. Calculatorにはあるが安全に対応できない項目をLimitation/未対応として整理する

画面を一度見ただけで項目一覧を確定してはならない。条件付き項目とAdvanced項目も確認する。

Calculatorのレンダリング済み実画面を取得できない場合は、その事実を調査記録に明記し、公式資料で確認できた事実と、Calculator UIでは未確認の事項を区別する。

---

## 7. 新サービス追加の標準作業フロー

ユーザーがサービス追加を依頼した場合、以下を1つの作業として連続実行する。

```text
ユーザー: 「AWS <Service>を追加して」
        |
        v
[1] 最新main / AGENTS / 正本docsを確認
        |
        v
[2] calculator.aws 該当サービスURLを特定し、レンダリング済み実画面を調査
    - primary
    - advanced
    - 条件付き項目
    - defaults / dependencies
        |
        v
[3] AWS公式docs + Public Price Listを調査
        |
        v
[4] On-Demand固定ポリシーで採用項目を決定
        |
        v
[5] Profile / Component / selector / usageInputを設計
        |
        v
[6] 必要ならnormalization / generic UIを拡張
        |
        v
[7] services/<serviceId>/ を実装
        |
        v
[8] unit / Definition / Price Data / Golden testを追加
        |
        v
[9] repository-level validation / E2Eを実行
        |
        v
[10] 失敗を原因分析して修正し、成功まで反復
        |
        v
[11] commit / push
        |
        v
[12] GitHub Actionsを確認
        |
        v
[13] Price DB更新が必要なら生成・検証・publishを完了
        |
        v
[14] GitHub Pages deploy成功を確認
        |
        v
[15] 公開版で代表操作を確認して完了報告
```

途中の通常の実装判断についてユーザーへ確認を求めない。

---

## 8. Web版ChatGPT Projectでの標準依頼

このrepositoryを扱うWeb版ChatGPTの「AWS見積もりツール」Projectでは、次のような短い依頼を新サービス追加の完全な実装依頼として解釈する。

```text
AWS Fargateを追加して
```

```text
Amazon DynamoDBを追加して
```

```text
Lambdaの見積項目を公式Calculator相当にして
```

特段の限定がなければ、この依頼は次を含む。

- 現在のrepository確認
- Calculator URLの自律的な特定
- Calculatorのレンダリング済みUI調査
- 公式AWS資料調査
- Public Price List調査
- 採用項目の自律決定
- Definition/UI/必要なgeneric codeの実装
- automated tests
- Price DB validation/build/publish
- commit/push
- Actions監視
- Pages deploy確認
- 失敗時の継続修正

「コードだけ書く」「Definitionだけ追加する」「調査結果だけ返す」という意味には解釈しない。

ユーザーが明示的に「設計だけ」「調査だけ」「実装はしない」等と指定した場合だけ範囲を縮小する。

Calculator URLは、ユーザーが提示した場合は利用するが、通常依頼において提示必須とはしない。実装担当が自力で特定可能な限り、自律的に調査を続行する。

---

## 9. 人間へ質問してよい条件

通常は追加質問なしで進める。

質問して停止してよいのは、`docs/AUTONOMOUS_IMPLEMENTATION.md` のblocker条件に加え、次のような場合に限定する。

- AWS公式資料同士が明白に矛盾し、安全な解釈を決定できない
- Calculator UIの意味が公式資料とPrice Listのどちらからも確定できない
- 対象サービスのCalculator URLを実装担当だけでは特定できず、公式資料からも対象画面を確定できないため、ユーザーからURLまたは画面情報を得なければ調査を進められない
- 既存DSLの意味論変更が不可避で、複数の非互換案から製品判断が必要
- 外部権限不足によりcommit/publish/deployを続行できない

単にCalculatorがSPAである、単純なHTTP取得でフォームHTMLを取得できない、項目数が多い、Price Listが巨大、testが失敗した、UI実装が複雑、といった理由では停止しない。可能なブラウザ手段や公式資料による調査へ進む。

---

## 10. 検証と完成条件

新サービス追加は最低限以下を満たして完了とする。

- Calculatorの主要On-Demand見積項目が棚卸し済み
- 対象Calculator URLが特定済み、または特定不能理由が記録済み
- Calculator UIをレンダリング済み実画面で確認済み、または確認不能範囲が明示済み
- 採用/除外理由が本仕様と整合している
- Definition schema/reference/dependency validationがPASS
- 対応regionのPrice DataからSKUが決定論的に解決できる
- ambiguous / missing SKUをfallbackで隠していない
- representative Golden casesがPASS
- generic pricing coreの既存testを壊していない
- 必要なUI操作がE2Eまたは同等の検証を通過
- Price DB更新が必要な場合はvalidated buildがpublish済み
- GitHub Actionsのrequired workflowが成功
- GitHub Pages deployが成功
- 公開版でサービスを追加・編集・再計算できる

Calculatorとの金額比較はsanity checkとして利用してよいが、Calculator表示額を料金正本にはしない。

---

## 11. 既存サービスの拡充

既存サービスについて「公式Calculatorより入力項目が不足している」と判明した場合も、新サービス追加と同じ規則を適用する。

既存Definitionを最小実装のまま固定せず、Calculatorの現在UIを再調査し、On-Demand対象の主要項目を追加する。

既存Project JSONとの互換性が必要な変更では、default値・optional Component・migration/restore semanticsを確認し、既存保存データを不必要に破壊しない。