# AWS Pricing Calculator Parity Test 引き継ぎ（2026-10-14）

この資料と同梱記録を後任へ渡し、**検証のみ**を続行する。アプリ・価格DBの修正、価格更新、PR/merge、デプロイは検証中に実行しない。個別FAIL指示書は将来の別修正タスク向けであり、命令形の記載を現在の修正許可と解釈しない。

現在は **PAUSED_BY_USER / INCOMPLETE**。ユーザーがPC増強のため一時停止を指示し、ブラウザ・測定キューは停止済み。今回の指示は引き継ぎ資料のpushのみであり、GUI検証の再開許可ではない。新しい実行環境・セッションでは、ユーザーから検証続行の明示指示を受けて開始する。

## 依頼内容と固定した比較対象

- 依頼: `docs/uat/AWS_CALCULATOR_PARITY.md` に従い、公開版全サービス・全料金関連入力をAWS公式Calculatorと実ブラウザGUIで比較し、結果・証跡を保存し、FAILごとに自己完結した個別修正指示書を生成する。
- 実行ID: `20261013T120455-parity`。開始: 2026-10-13 12:04:55 UTC / 21:04:55 JST。停止状態保存: 2026-10-14 05:53:35 UTC / 14:53:35 JST。
- 公開版: https://nobleneet.github.io/AWSPricingCalculator_forTAE/
- AWS公式: https://calculator.aws/ 。実際にGUI到達したサービスURLは [registry](service-url-registry.json) を参照する。
- 公開build: `20261013T095030Z-78197541`、Price Data: `2026-10-12T23:11:02Z`。
- 当時確認したPages commit: `b51df2118aee65f2631db653e3bd01df56da091a`。GUI内のcommit表示ではなく、成功したPages deployment記録で確認した。
- headed Chromium 153.0.8010.12、Playwright、viewport 1440×1100、`DISPLAY=:0.0`。実入力・click・selectとDOMの表示読取を使用した。内部pricing関数、API値、localStorage直接変更をGUI実測の代用にしていない。
- USD / On-Demand / 割引・税・為替なし。無料枠とtierは現行正本の対象だけを適用。許容差は月額・変更差分とも0.01 USD。未測定値はnullとし、0を補完しない。
- 正式対象Region: Tokyo、Osaka、N. Virginia、Ohio、N. California、Oregon。
- 実行時の仕様版は [EXECUTED_PARITY_SPEC.md](EXECUTED_PARITY_SPEC.md) に凍結保存した。現行mainの文書を上書きしていない。再開時は現行AGENTS・正本・Parity仕様とこの版を照合する。

## 完了済み範囲と未完了の意味

17サービスすべての公式/公開GUIに到達した。公式・公開それぞれを独立に棚卸しし、観測済みの入力和集合から対応表を生成した。観測済みの下限は公式662項目、公開360項目。条件分岐・大量候補の調査が残るため**全項目数の分母は未確定（null）**であり、正確な全体完了率は算出できない。

742件のGUI測定記録と685件の入力欠落・未確認等のケースを合わせ、総記録は1,427件。測定記録の件数は有効な料金比較の完了件数ではない。

| 料金比較判定 | 件数 |
|---|---:|
| PASS（四つの表示月額と対応内訳を確認） | 595 |
| FAIL | 19 |
| BLOCKED | 20 |
| NOT_COMPARABLE | 284 |
| INCOMPLETE | 509 |

入力対応FAILは196ケース。料金FAILとの重複3ケースを除き、**個別FAIL指示書は212件**。入力判定と料金判定は独立であり、金額を測れない入力欠落も入力FAILを維持する。集計ファイルの整合性検査PASSは、全サービス・全入力のParity PASSを意味しない。

## サービス別の現在地

下表の件数はケース記録の料金判定。未完了には入力棚卸しのみのケースと、総額が合っていても内訳確認が終わらない測定を含む。全サービスについて全面完了は宣言していない。

| Service | 総ケース | 料金PASS | 料金FAIL | BLOCKED | 比較不能 | 未完了 |
|---|---:|---:|---:|---:|---:|---:|
| athena | 36 | 9 | 3 | 13 | 2 | 9 |
| aurora-postgresql | 118 | 41 | 0 | 0 | 4 | 73 |
| ebs | 44 | 15 | 0 | 0 | 7 | 22 |
| ec2 | 152 | 46 | 0 | 0 | 53 | 53 |
| eventbridge | 103 | 73 | 7 | 0 | 2 | 21 |
| rds-oracle | 56 | 21 | 0 | 0 | 7 | 28 |
| rds | 56 | 20 | 0 | 0 | 5 | 31 |
| redshift | 67 | 4 | 0 | 0 | 37 | 26 |
| s3 | 204 | 26 | 0 | 0 | 111 | 67 |
| amplify | 52 | 42 | 0 | 0 | 1 | 9 |
| codebuild | 48 | 25 | 0 | 0 | 16 | 7 |
| fargate | 59 | 43 | 4 | 1 | 0 | 11 |
| glue | 127 | 46 | 0 | 0 | 5 | 76 |
| kms | 47 | 43 | 0 | 0 | 0 | 4 |
| lambda | 104 | 77 | 1 | 0 | 8 | 18 |
| systems-manager | 69 | 13 | 0 | 6 | 24 | 26 |
| elastic-load-balancing | 85 | 51 | 4 | 0 | 2 | 28 |

詳細は [summary.json](summary.json)、[CSV](summary.csv)、[coverage](coverage-matrix.json)、[入力対応表](field-correspondence.json)、[全ケース索引](cases.json) を参照する。[サービス別の小さなケース索引](service-case-indexes/) からも辿れる。1,427件すべての現在の個別JSONは `cases/<serviceId>/<caseId>.json` に同梱した。

## 確認済みFAILと誤判定を避ける注意点

- ELB/GWLB: 有効なEndpoint入力で公開GUIが `gwlbe-hour` / `gwlbe-bytes` の `AmazonVPC` price source missingを表示し、サービス月額が「—」になる。公式は月額を表示する。公開の未計算サービスをPlanの計算済み小計$0.00で置き換えない。価格ソース・ロード・Mappingの調査が必要だが、検証中は修正しない。別にGWLB台数と公式AZ数の意味不一致を入力FAILとして記録した。
- Athena: day/week変換差。Spark 10/day・1 DPU-hourでは公開Spark内訳$150.00、公式$152.00、サービス合計$151.77対$153.77を観測した。公式は730/24から304.17件へ換算後、304件へroundingする。公開は30日換算、週次は52/12を使用することを当時のPages commitの読取調査で補足確認した。ソース調査はGUI金額の代用ではない。月次モードの成功例を日次・週次全体のPASSへ拡張しない。
- EventBridge: cross-account custom deliveryの料金差を複数Regionと分離ケースで記録。単価の不具合と断定せず、入力等価性と現行Mappingを調査する。
- Fargate: Linux 60秒・Windows 300秒の最低課金境界で、公式の表示計算時間と公開の秒単位計算による差を観測。公式へ合わせるためだけに中間金額を丸めない。SPECの計算契約と公式側の計算を先に確認する。
- 入力候補/欠落: standalone EBSのボリューム候補、CodeBuildの非commitmentモデル、EC2 Dedicated Hosts、Oracleストレージ候補、Redshift Base RPU、S3の多数の機能、Systems Managerの機能、Lambda SnapStart/Edge等に個別記録がある。候補欠落と対応済み候補の単価一致を別判定にする。大量候補の観測件数を全候補数とみなさない。
- EC2 Linux/RHEL/HA＋SQLで見つかった差は、公式GUIがOS変更時に別インスタンスを選び直したためだった。同じインスタンスを再選択したTokyoの8組み合わせは再測定で差額$0.00。古い試行を現行の料金FAILに戻さない。
- EC2 qty/timeとEBS: 公開の集計GB-monthと公式の台数当たりGB×時間を合わせてから比較する。regional transferは公開の送受信両課金量と公式の片方向物理転送量を換算する。換算前の異なる数量から単価バグを判定しない。
- Oracle utilization: 公開は承認済み仕様でInsightsを利用率按分し、公式はOn-Demand instance costのみ按分してmonitoringを730時間で計算する。これは料金前提の不等価としてNOT_COMPARABLEへ再分類した。compute/storageの部分比較と全体一致を分ける。
- EventBridge Archive: binary換算と公式decimal換算の現行仕様差によりNOT_COMPARABLE。単なる表示総額PASSを全体Parity PASSへ戻さない。
- 無効入力、未ロード、親selector不一致、公式インスタンス自動変更、未確認内訳のケースはPASSへ昇格しない。無効入力の表示金額を受入判定に使わない。

[個別FAIL指示書一覧](fix-all.md) の212件を読む。全入力・条件・四つの金額/null・差分・内訳・出典・将来の修正担当向け確認事項を個別に含めている。旧/撤回済み指示書は今回のGit同梱から除外した。

## 未完了の作業と推奨する再開順

1. 新環境に実ブラウザGUI操作と証跡保存手段があるか確認する。GitHubのファイル読取だけではGUI比較を実行できない。元PCの絶対パスがWork環境でも存在するとは仮定しない。
2. ユーザーの検証続行指示と、現行Parity仕様・AGENTS・正本を確認する。公開サービス一覧、build、対応Region、公式URLを実GUIで再確認する。公開buildが変わった場合は**新run/snapshotとして分離**し、過去PASSを今回のPASSへ流用しない。
3. 条件付き入力を双方向に再棚卸しする。optional機能の内側のselector、新しく現れる子・孫項目、Profile/Region別可用性を確認する。手元のDefinitionや既存ケースだけから公式側母集団を作らない。
4. 全Profile・未測定Regionを埋める。特にAuroraの他Profile、Redshift provisioned/serverless、Fargate Windows/ARM、ELBの残Region、AthenaのGUI setup再試行、Lambda/Amplifyの大きめ使用量等。新たに見つかった入力もcase/coverageへ追加する。
5. 数値ごとの有効な0・最小・一般値・大値・課金/換算境界、有限selectorの全候補、相互作用を実測する。大量SKU候補は意味の異なる代表集合と省略した候補・理由を列挙する。初期first/middle/lastだけでは意味網羅を完了扱いしない。
6. 総額/差分だけ成功した測定のcomponentComparisonsを確認し、GUI内訳ラベルの読取不足・物理量不等価・無効入力を解消する。アプリを修正して結果を合わせない。auxiliary別サービスGUIを使うならcomponent scopeとして登録し、親サービス全面PASSにしない。
7. quiescentな状態で集計・逆引き・個別FAIL指示書を更新し、件数・四つの金額/null・内訳・証跡参照・case/row IDを検証する。全項目分母を確定できるまで `fullScopeCompleted=false` を維持する。

## 停止時の並行実行と手順上の落とし穴

2本のheaded browser workerを別サービス群・別保存先で実行した。group-aはAurora/Glue/Fargate/Lambda/Amplify、group-bはELB/EventBridge/Athena/Redshift/Oracle。共有する記録ファイルへ同時に書かなかった。停止前に完了した45新ケースを、service所有範囲・seed timestamp・FINISHED状態・証跡衝突を検査してcanonicalへ統合済み。

**旧shard seed planで再度mergeしない。** 現在のcanonicalから新shardを作り、保存先とseedを更新する。worker中に同じmeasured-cases.jsonを書き換えるprocessorを起動しない。独立inventoriesも途中読込＋全書換え方式なので、同じinventoryへ複数writerを起動しない。

ヘルパーは [runners/helper-versions/latest-index.json](runners/helper-versions/latest-index.json) に原 `/tmp` パス、SHA、保存された版の対応がある。`runners/versions/` はケースに記録した実行ソースのSHA版であり、最新ヘルパーと取り違えない。既存スクリプトを環境確認なしにまとめて起動しない。

元環境のパス `/home/ubnadmin/AWSPricingCalculator_forTAE`、node_modulesの絶対import、`DISPLAY`、出力root、`/tmp/aws-parity-current` は新環境向けに**検証ハーネスのみ**を適応する必要がある。sharded/numeric runnerは `PARITY_RESULT_ROOT` を持つが、他のhelperにも固定パスがある。adapter改善がアプリ/価格DB変更を含まないことを確認する。

元PCで同じrunを再開する場合、先に `runners/parity-resume-detach.py` を実行して停止snapshotと共有する可変ファイルを分離する。これは元PCのhardlink snapshot保護用であり、別環境ではclone/コピー方法に応じて判断する。十分な永続容量を確保してから実行する。

凍結ソースのSHAと元CSVのCRLFを維持するため、このパッケージ内だけの `.gitattributes` で保存済みPythonソースのwhitespace検査とCSVのCR-at-EOLを扱っている。アプリや通常CIのルールは変更していない。

元環境の集計順は `parity-components.py` → `parity-otherinputs.py` → `parity-collect-case-observations.py` → `parity-consolidate.py` → `parity-validator.py`。全writer停止後に行う。新環境で欠けた画像を捏造してvalidatorを通さない。

候補キュー `parity-complete-known.sh`、`parity-next-full-20261014.sh`、numeric runner、`parity-deep-v4.mjs` は保存済み。ただしnumeric大値/minimum候補は未実行・未検証のものを含む。すべてが有効入力を保証する完成済み試験計画とは扱わず、短いGUI smokeから確認する。Redshiftのdefault-profile menuを補うv4棚卸しは停止前に完了している。

## GitHubへ渡したもの／元PCに残る全証跡

Gitへ同梱: 現行1,427ケースJSON、212個別指示書とcomparison、取得済みのactive FAIL画面複製、集計/対応表/coverage、独立棚卸しのgzip、DOM/menu観測の圧縮JSONL、実行ソース/再開helper、実行時仕様版。

`observations.jsonl.gz` は各行 `{path, data}`。展開時は安全な結果root内へ元の相対pathで復元する。`aws-field-inventory.json.gz` / `local-field-inventory.json.gz` は無損失圧縮JSON。個別指示書の棚卸しリンクだけを `.json.gz` に合わせた。その他の原ケース値は変更していない。

**元の `screenshots/` 全件、過去attempts、撤回済み指示書、shard全体はGitへ含めていない。** 原ケースの `screen` / `totalScreen` は元結果root基準の参照であり、Gitに全リンク先があるという意味ではない。[original-screenshot-references.json](original-screenshot-references.json) に参照元case・SHA・転送状態を明記した。active FAILの画面は `failures/<caseId>/` のコピーを参照できる。完全な証跡継続には、元PCのsnapshotを別途アクセス可能な保存先へ移すか、新runとしてGUI証跡を取り直す。

元PCの永続保存先:

- 現行記録: `/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/20261013T120455-parity`
- 停止時全snapshot: `/home/ubnadmin/parity-reports/20261013T120455-parity.paused-20261014T055335Z`
- snapshotの `SNAPSHOT-SHA256.json`: 30,086ファイル、論理1,615,324,460 bytes。hardlink共有なのでディスク占有とは異なる。ファイルごとのSHAを保存し、停止後に最終整合性報告のtimestamp entryのみ更新済み。
- 古い中間tar: `/home/ubnadmin/parity-reports/20261013T120455-parity.checkpoint-20261014T0510.tar.gz`、SHA `b3d8384a90a07892754bb284d21d366ca2d10ceee2aeea3add14be87d4b1d5ac`。停止後の最新版ではないため、最新ケースの根拠として使わない。

停止後の永続ディスク空きは約146MBだった。途中で一時領域quotaによりブラウザがクラッシュしたが、重複checkpointを無損失圧縮して領域を解放した後にGUI測定成功を再確認した。pip/Chromium cacheの一時移動は停止時に元の永続パスへ復元済み。新環境では容量・GUI安定性を確認する。

[handoff-package.json](handoff-package.json) が同梱範囲の正本、`PACKAGE-SHA256.json` がこのGitパッケージのSHA一覧。原PCの全snapshotの検証結果と、この部分転送パッケージの検証結果を取り違えない。

## Workへ渡す検証続行依頼文

以下はユーザーが続行を明示依頼するときのテンプレートであり、この資料の存在だけで実試験を開始しない。

```text
AWS Pricing Calculator Parity Testの検証を続行してください。
docs/uat/AWS_CALCULATOR_PARITY.md と
 docs/uat/parity-handoff/20261013T120455-parity/HANDOFF.md を読み、
引き継ぎデータと、実際に使えるブラウザGUI・保存先・証跡アクセスを確認してください。
公開版の全サービス・全料金関連入力が対象です。
公開build変更時は新しいrunへ分離し、過去PASSを今回のPASSに流用しないでください。
アプリ・価格DBの修正、price update、PR/merge、デプロイは実施しないでください。
入力判定と料金判定を分離し、同等入力の基準値/変更後月額・内訳・差分と証跡を保存し、
FAILごとに個別修正指示書を更新してください。
実ブラウザGUI操作または必要な証跡へのアクセスができなければ、
取得済み情報と実際の不足条件を報告し、API/内部関数で実測を代用しないでください。
```
