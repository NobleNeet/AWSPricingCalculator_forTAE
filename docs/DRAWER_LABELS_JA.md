# ドロワー項目名の日本語表記

確認日: 2026-10-11

ドロワーの項目名は AWS Pricing Calculator の日本語表示を基準とする。
表示文言は `src/app/drawer-labels-ja.js` にサービス・Profile・Component・入力の安定 ID をキーとして管理する。
`renderDrawer` だけが表示用の Definition view を使い、Pricing Core、DefinitionStore のキャッシュ、保存値、検証条件、Price DB fingerprint は元の Definition を使う。
新サービス追加・入力追加時は表示カタログも更新する。全サービスの棚卸しテストは未翻訳入力を検出する。
オンボーディング時の必須ルールと完成条件は [SERVICE_ONBOARDING.md §3.1.1](SERVICE_ONBOARDING.md#311-ドロワー項目名の日本語表記必須) を参照する。本書の参照先・例外は、調査と表記設定の実例として使用する。

## 参照先

ブラウザーで言語メニューから「日本語」を選択し、各サービス画面を確認した。
折りたたみ・条件付き項目の文言は、同じ画面が読み込む公式 `ja_JP.json` と `en_US.json` の同一フィールドを照合した。
公式配信元は `https://d1qsjq9pzbk1k6.cloudfront.net/data/<serviceCode>/ja_JP.json`、共通 UI 文言は `data/aWSPricingCalculatorStrings/ja_JP.json`。
公式 JSON 全体や価格は repository に転記しない。実行時の公式ツールへの通信は不要。

| アプリのサービス | 公式画面 | 公式 serviceCode |
|---|---|---|
| EC2 | https://calculator.aws/#/createCalculator/ec2-enhancement | ec2Enhancement、aWSPricingCalculatorStrings |
| EBS | https://calculator.aws/#/createCalculator/EBS | amazonElasticBlockStore |
| S3 | https://calculator.aws/#/createCalculator/S3 | amazonSimpleStorageServiceGroup、amazonS3Standard |
| Lambda | https://calculator.aws/#/createCalculator/Lambda | aWSLambda |
| RDS PostgreSQL | https://calculator.aws/#/createCalculator/RDSPostgreSQL | amazonRDSPostgreSQLDB |
| RDS Oracle | https://calculator.aws/#/createCalculator/amazonRDSOracle | amazonRdsForOracle |
| Aurora PostgreSQL | https://calculator.aws/#/createCalculator/AuroraPostgreSQL | amazonRDSAuroraPostgreSQLCompatibleDB |
| Fargate | https://calculator.aws/#/createCalculator/Fargate | awsFargate |
| CodeBuild | https://calculator.aws/#/createCalculator/codebuild | awsCodeBuild |
| KMS | https://calculator.aws/#/createCalculator/KMS | awsKeyManagementService |
| EventBridge | https://calculator.aws/#/createCalculator/eventbridge | amazonEventBridge |
| Amplify | https://calculator.aws/#/createCalculator/Amplify | awsAmplify |
| Systems Manager | https://calculator.aws/#/createCalculator/SystemsManager | awsSystemsManager、justInTimeNodeAccess、awsSystemsManagerIncidentManager |

`#/createCalculator/EC2` は現時点でエラーになるため、有効な `ec2-enhancement` で確認した。

## 表記と入力意味

- 公式の項目名を使用し、固定の入力単位や重複する項目の対象を括弧で併記する。例: Fargate「タスクまたはポッドの数 (件/日)」「平均期間 (時間)」、Lambda「各リクエストの実行時間 (ミリ秒単位)」。月間リクエストの件数と EventBridge の 100 万件単位を区別する。
- Profile は「利用方式」、Region は「リージョン」、Advanced は「詳細設定」、任意 Component のトグルは「この項目を有効にする」と表示する。
- 公式に同一入力がない独自項目は意味を保って日本語化する。EC2 のプリインストールソフトウェア分離・専有リージョン料金、EBS の基本料金を超える有料 IOPS/月・MiB/s/月、Aurora の月間集計 ACU 時間・I/O 回数・モニタリング時間、EventBridge のアーカイブ容量が該当する。
- Aurora の ACU 時間を「ACU の数」に変更しない。EBS の有料追加性能を「ボリュームあたりのプロビジョニング IOPS」に変更しない。これらは公式のリソース容量入力とは意味が異なる。
- EC2 の公式オンデマンド欄は日本語表示でも `Expected utilization` が英語のままだが、公式の日本語説明と共通 UI の「想定使用量」を使い、時間/月を明示する。
- RDS/Aurora の使用率欄は本アプリでは月間時間を直接指定するため、時間/月を明示する。Aurora のノード数は writer と reader の合計という既存入力の意味を維持する。
- 公式の S3 読み取り欄は GET、SELECT、その他のリクエストをまとめている。S3 Select の処理データ量は本アプリに入力欄がなく、今回は入力・料金対応の拡充を行わない。
- Amplify と Systems Manager の既存日本語入力名は、公式配信データと一致しているので保持する。
- 選択肢の内部値（例: `Shared`、`Linux`、`gp3`、`minutes`）は保持する。今回の対象は項目名・見出しであり、SKU 値の翻訳や新しい選択肢の追加ではない。

## 検証

- `tests/app/drawer-labels-ja.test.js`: 全 Profile/Component/入力の表記を棚卸しし、表示前後で label 以外の全 Definition 内容が同じこと、元のキャッシュを変更しないことを検証する。
- `tests/e2e/drawer-labels-ja.spec.js`: 13 サービスの全 Profile、詳細・条件付き入力をブラウザーで確認する。
- `tests/e2e/app.spec.js`: KMS の公式名、Lambda の詳細設定と条件付き Component を日本語表記へ更新し、既存の編集・料金再計算・保存復元を検証する。
- 料金契約に変更がないため Price DB の再生成・公開は不要。通常の Application CI と Pages デプロイを適用する。
