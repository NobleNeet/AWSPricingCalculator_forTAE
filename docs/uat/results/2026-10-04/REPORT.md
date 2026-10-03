# UAT実施結果 — 2026-10-04

## Overall result

**PASS** — 定義された全24ケースを実施し、Expected resultとUsability criteriaを満たした。DOM/API自動E2Eの結果は合格根拠にしていない。検証範囲は以下のChromium・デスクトップ環境。別Browser/モバイル/実人間による評価へ一般化しない。

```text
UAT Summary
Total:    24
PASS:     24
FAIL:      0
BLOCKED:   0
SPEC GAP:  0（合否を確定不能にしたケース数）
```

| Journey | 結果 |
|---|---|
| J001 最初の見積を作る | 3/3 PASS |
| J002 構成案を複製・比較する | 3/3 PASS |
| J003 Service設定を編集する | 3/3 PASS |
| J004 作業を保存・復元する | 4/4 PASS |
| J005 料金データ異常から回復する | 4/4 PASS |
| J006 見積結果を出力する | 3/3 PASS |
| J007 安全に操作を発見・取消・削除する | 4/4 PASS |

## 実行環境・方法

- 対象commit: `b6d6f83d65a1e5aea8734df8a68bb9f289112c5f`。アプリ/仕様/期待結果の変更なし。
- 正本をAGENTS → SPEC → UAT README → SPEC_GAPS → 全Journey → 全Caseの順に読んだ。
- 通常環境: `http://127.0.0.1:4180/`、リポジトリの静的配信。障害環境: `http://127.0.0.1:4181/`、同じアプリを配信。公開Pagesで全ケースを再実施したとの主張はしない。
- Chromiumのheadless描画、1440×1000、独立した永続Browser profile。OS全体を操作するComputer Use専用toolではなく、実Browser画面の画像認識と座標入力を使用。スクリーンショットを認識して座標を決定し、マウスクリック・スクロール・キーボードで操作。
- PlaywrightはBrowser起動、スクリーンショット、座標mouse/keyboard、通常navigation/reload、ダウンロード保存だけに使用。locator/selector、DOM、evaluate、内部関数、API直呼び、storage直接操作、ソースからの操作対象特定は不使用。
- JSON本文はGUIでダウンロードしたファイルから取得し、クリックでフォーカスした復元テキスト欄にキーボード経由で貼付。ファイルアップロードや内部state注入なし。
- J004未知要素は外部Project JSON fixtureを用意してGUI貼付。J005は配信サーバだけに遅延/503/料金候補不一致を設定し、アプリ操作と判定はGUI。generated Price DBの実ファイルは変更していない。
- 実際にGUIから取得したPDF/JSON/CSVを証拠として保存。PDFはPopplerで描画して目視し、全ページのテキストも確認。CSV本文は表の列と内容を確認。
- J001→J007順に進行。前提状態はGUI操作で作成。最後にJ004-04の未知input報告と再出力の保持を追加確認した。

## Case matrix

| Case ID | Priority | Result | Summary |
|---|---|---|---|
| UAT-J001-01 | P0 | PASS | 0 Planから作成 |
| UAT-J001-02 | P0 | PASS | EC2追加 |
| UAT-J001-03 | P0 | PASS | 複数Service |
| UAT-J002-01 | P0 | PASS | 複製・独立編集 |
| UAT-J002-02 | P0 | PASS | 同じ行で置換 |
| UAT-J002-03 | P1 | PASS | 既存行へ追加 |
| UAT-J003-01 | P0 | PASS | usage再計算 |
| UAT-J003-02 | P0 | PASS | 親子selector再選択 |
| UAT-J003-03 | P1 | PASS | optional切替 |
| UAT-J004-01 | P0 | PASS | reload再開 |
| UAT-J004-02 | P0 | PASS | JSON貼付復元 |
| UAT-J004-03 | P0 | PASS | fatal保持 |
| UAT-J004-04 | P1 | PASS | 未知要素部分復元 |
| UAT-J005-01 | P0 | PASS | loading |
| UAT-J005-02 | P0 | PASS | unavailable局所化 |
| UAT-J005-03 | P0 | PASS | invalid fallback禁止 |
| UAT-J005-04 | P1 | PASS | stale継続 |
| UAT-J006-01 | P0 | PASS | PDF+JSON |
| UAT-J006-02 | P0 | PASS | 不完全PDF・Limitation |
| UAT-J006-03 | P1 | PASS | CSV |
| UAT-J007-01 | P0 | PASS | 追加の発見 |
| UAT-J007-02 | P0 | PASS | 追加・置換取消 |
| UAT-J007-03 | P1 | PASS | Serviceを外す |
| UAT-J007-04 | P0 | PASS | Plan削除・保護 |

## FAIL一覧

なし。派生FAILもなし。

## BLOCKED一覧

なし。J005はUAT専用の配信fixtureで実行可能にした。

## SPEC GAP一覧

既存G001〜G006は[正本](../../SPEC_GAPS.md)を適用し、Case FAILとは別扱いにした。

- G001: 実際に表示された再試行から回復を確認。文言/配置を独自固定しない。
- G002: PDF必須内容で判定。ファイル名/ページ構成をFAIL理由にしない。
- G003: CSV列の意味で判定。列順/ファイル名を独自固定しない。
- G004: 表示名検索でEC2へ到達。UIの具体形を独自固定しない。
- G005: Tokyo継承を確認。個別Region override露出を必須にしない。
- G006: 新本実装の保存/reloadのみ必須。historical mock migrationを追加必須にしない。

新規の合否判定不能なSPEC GAPはなし。既存gapは6項目あるが、SummaryのSPEC GAPは未判定ケース数なので0。

## Usability findings（仕様違反・Case FAILとは分離）

1. **英語の入力・エラー表示**: `Hours / month`、`GB-month`、`Expected one SKU; matched none.`、`Unknown profile.`、Restore Reportの詳細が英語。状態は識別できるが、非技術利用者の理解を助ける日本語説明を推奨。
2. **内部的な名前の露出**: Lambda architectureの`AWS-Lambda-Duration`、設定概要の`gbMonths`/`instanceType`、PDFの入力JSON等。SKU入力は不要だが、x86/ARM等の利用者向け名称と単位付きラベルが望ましい。
3. **取消の表現**: Catalogの×で取消成功。検索中にEscapeを試したが閉じなかった。Escape対応と「取消」文言があると操作意図を伝えやすい。Escape必須という仕様はないためFAILにしない。
4. **即時編集と閉じる操作**: Drawer入力が即時反映され、×で閉じる。保存/取消の区別を期待する利用者向けに即時反映の説明があるとよい。未定義のrollback義務はUAT側で追加しない。
5. **削除に確認/Undoがない**: セル内とPlanヘッダで対象は区別でき、対象外を保持した。誤クリック後の回復を助けるUndo等を推奨。確認Modal必須という独自基準でFAILにしない。
6. **PDF reader互換性の補助所見**: Popplerがembedded font警告を出した。今回の描画では日本語・金額・制約は読め、内容確認は成功。[警告記録](evidence/pdf-reader-warnings.txt)を保存。別readerでの互換性調査候補であり、今回の内容欠落としては判定しない。

## 各ケースの操作・観測・期待結果・差異・証拠

### UAT-J001-01 — 0 Planから作成

- Priority: P0
- Result: **PASS**
- 実行操作: 初期画面を観察し「最初の構成案を作る」をクリック。
- Observed result: 「構成案はまだありません」から1構成案・0比較行へ遷移。Service料金なし。Tokyo既定。
- Expected result（Case原文）: Plan 0件状態が明示され、操作後は空の最初のPlanが1件表示される。まだService料金は表示されない。
- Usability確認: 役割名や比較条件の事前入力なし。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J001-01-before.png](evidence/J001-01-before.png), [J001-01-after.png](evidence/J001-01-after.png)

### UAT-J001-02 — EC2追加

- Priority: P0
- Result: **PASS**
- 実行操作: Planの「サービスを追加」→Amazon EC2→Linux/t3.micro、730時間、1台→Drawerを閉じる。
- Observed result: EC2の設定概要と$9.93、Plan合計$9.93を確認。
- Expected result（Case原文）: EC2が新しいRowに表示され、確定した設定概要とUSD月額が表示される。Plan totalに同額が反映される。
- Usability確認: SKU/rateCode入力なし。追加後に詳細入力へ進めた。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [ec2-drawer.png](evidence/ec2-drawer.png), [J001-02-ready.png](evidence/J001-02-ready.png)

### UAT-J001-03 — 複数Service

- Priority: P0
- Result: **PASS**
- 実行操作: 同じPlanの追加からS3を選び200 GB-month、続いてRDSを追加。
- Observed result: 3比較行。EC2 $9.93、S3 $5.01、RDS $21.01、合計$35.95。
- Expected result（Case原文）: Serviceごとに独立Rowが作られ、各月額とPlan totalが表示される。totalは各計算済みServiceの合計と整合する。
- Usability確認: 既存Service編集なしでPlanの追加を繰り返せた。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [s3-drawer.png](evidence/s3-drawer.png), [rds-drawer.png](evidence/rds-drawer.png), [J002-01-duplicate.png](evidence/J002-01-duplicate.png), [J002-01-independent.png](evidence/J002-01-independent.png)

### UAT-J002-01 — 複製・独立編集

- Priority: P0
- Result: **PASS**
- 実行操作: Planを複製。複製側EC2の730時間を365時間へ変更。
- Observed result: 複製直後は3行のService・設定・料金が一致。変更後元EC2 $9.93/合計$35.95、複製EC2 $4.96/合計$30.98、delta -$4.96。
- Expected result（Case原文）: 複製直後は構成・値が一致する。複製側変更後もPlan Aは変化しない。両Planのtotal/deltaが別々に更新される。
- Usability確認: 元入力を再作成せず独立編集できた。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J002-01-duplicate.png](evidence/J002-01-duplicate.png), [J002-01-independent.png](evidence/J002-01-independent.png)

### UAT-J002-02 — 同じ行で置換

- Priority: P0
- Result: **PASS**
- 実行操作: 複製側RDSの「別サービスへ置換」→AWS Lambda。新Serviceの詳細設定を確認し閉じる。
- Observed result: 3比較行を維持。元RDS $21.01は不変、複製だけLambda $0.41。行名RDS/Lambda。RDSの20 GB storage/instance値はコピーされずLambda固有のrequests/seconds/memory入力になる。
- Expected result（Case原文）: Rowは維持され、対象PlanだけServiceが変わる。元Serviceの意味の異なる設定値が推測コピーされない。Row labelと各料金が更新される。
- Usability確認: 新規Rowを作らず比較できた。Auroraは必須指定でなく例示のため対応済みLambdaを使用。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J002-02-catalog.png](evidence/J002-02-catalog.png), [J002-02-lambda.png](evidence/J002-02-lambda.png), [J002-02-after.png](evidence/J002-02-after.png)

### UAT-J002-03 — 既存行へ追加

- Priority: P1
- Result: **PASS**
- 実行操作: 複製側S3をPlanから外して空セルを作る。「この行に追加」→EBS。
- Observed result: 3比較行のままS3/EBS比較になる。元S3 $5.01不変、追加EBS100 GB-month $9.60。
- Expected result（Case原文）: 新しいRowは増えず、対象セルにServiceが追加される。他Planのセルは変わらない。
- Usability確認: Planヘッダの追加と空セルの追加を表示文言・位置から区別できた。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J002-03-empty.png](evidence/J002-03-empty.png), [J002-03-ebs.png](evidence/J002-03-ebs.png), [J002-03-after.png](evidence/J002-03-after.png)

### UAT-J003-01 — usage再計算

- Priority: P0
- Result: **PASS**
- 実行操作: 複製側EBSの編集Drawerで100→200 GB-month。
- Observed result: EBS $9.60→$19.20、複製Plan $14.97→$24.57、delta -$20.97→-$11.37。元Plan $35.95不変。
- Expected result（Case原文）: Service月額、Plan total、Baseline deltaが変更内容に応じて更新される。表示値変更前の古い料金を確定値として残さない。
- Usability確認: 同じ比較画面とDrawerで反映確認。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J003-01-before.png](evidence/J003-01-before.png), [J003-01-after.png](evidence/J003-01-after.png)

### UAT-J003-02 — 親子selector再選択

- Priority: P0
- Result: **PASS**
- 実行操作: EC2 Instance typeを一覧先頭a1.2xlargeに選択。OS Linux→Windows。
- Observed result: a1.2xlargeを別値へ置換せず「要再選択(a1.2xlarge)」。Instance type名を挙げた赤い要再選択、未計算、Plan小計・未計算1。Linuxへ明示的に戻して解決。
- Expected result（Case原文）: 子値は別候補へ自動変更されず「要再選択」等の未解決状態になる。解決まで料金を安全な確定値として扱わない。
- Usability確認: 再選択すべき入力を具体名で識別できた。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J003-02-child.png](evidence/J003-02-child.png), [J003-02-invalid.png](evidence/J003-02-invalid.png)

### UAT-J003-03 — optional切替

- Priority: P1
- Result: **PASS**
- 実行操作: RDS gp3 storageを100 GB-monthにする。Componentチェックを外し再チェック。
- Observed result: 有効storage $13.80/Service $32.05→無効Service $18.25→再有効$32.05。無効中も100を保持し、無効中は計算除外の説明あり。
- Expected result（Case原文）: 無効中は当該Component料金が加算されない。再有効化時は仕様上保持可能な既存値が復元される。
- Usability確認: enabled切替がusage=0と区別できた。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J003-03-enabled.png](evidence/J003-03-enabled.png), [J003-03-disabled.png](evidence/J003-03-disabled.png), [J003-03-reenabled.png](evidence/J003-03-reenabled.png)

### UAT-J004-01 — reload再開

- Priority: P0
- Result: **PASS**
- 実行操作: 複製PlanをBaselineに設定し待機、通常reload。
- Observed result: 2 Plan・3 Row、全Service設定、RDS100、EC2730/365、複製Baselineを保持。再計算後元$224.52、複製$24.57、delta $199.95/$0.00。
- Expected result（Case原文）: Plan、Rows、Service設定、Baseline等の編集状態が復元される。Price Dataは現在利用可能なものから再計算される。
- Usability確認: 手動バックアップなしで再開。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J004-01-before.png](evidence/J004-01-before.png), [J004-01-after.png](evidence/J004-01-after.png)

### UAT-J004-02 — JSON貼付復元

- Priority: P0
- Result: **PASS**
- 実行操作: GUI Project JSONを取得。Project名を変更し、復元Modalへ取得したJSON本文を貼り「復元する」。
- Observed result: 「復元完了」。元Project名・2 Plan・3行・Baseline・設定・金額を復元。保存JSONには料金正本なし。
- Expected result（Case原文）: 保存時の編集状態が復元され、料金は現在のDefinition/Price Dataで再計算される。保存済み金額をそのまま信頼しない。
- Usability確認: ファイルアップロードなしでテキスト欄だけを使用。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [1791070819523-aws-project.json](evidence/1791070819523-aws-project.json), [restore-modal.png](evidence/restore-modal.png), [J004-02-report.png](evidence/J004-02-report.png), [J004-02-restored.png](evidence/J004-02-restored.png)

### UAT-J004-03 — fatal保持

- Priority: P0
- Result: **PASS**
- 実行操作: 現構成を記憶。不正な文字列{broken JSONを復元欄へ挿入し復元を実行。
- Observed result: 「復元失敗（現在のProjectは変更されません）」とJSON構文エラー。閉じた後2 Plan、Service、値、$224.52/$24.57、Baselineが不変。
- Expected result（Case原文）: エラーが表示され、現在ProjectのPlan/Service/値は変更されない。
- Usability確認: 失敗と現Project保持は日本語で識別でき、同じ入力欄から再入力できた。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J004-03-fatal.png](evidence/J004-03-fatal.png), [J004-03-unchanged.png](evidence/J004-03-unchanged.png)

### UAT-J004-04 — 未知要素部分復元

- Priority: P1
- Result: **PASS**
- 実行操作: 取得JSONから未知Service/Profileを含む外部テストファイルを用意し本文貼付復元。追加確認でEC2 inputsにuatUnknownUsageを入れた外部JSONも貼付復元。
- Observed result: 未知Service/ProfileはReportにUNKNOWN_SERVICE/UNKNOWN_PROFILE、保持の説明。正常EC2/RDS/EBS計算継続、未知部分は未計算、小計と未計算件数表示。未知inputもUNKNOWN_FIELD: Unknown input uatUnknownUsage; preservedと報告。再出力JSONで123保持。
- Expected result（Case原文）: 復元可能なPlan/Serviceは利用でき、未知部分はwarning/invalidとして識別される。Restore Reportで問題を確認できる。
- Usability確認: 復元不能部分と正常部分を区別できた。トップレベル拡張メタデータの表示義務を独自基準にはしない。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [partial-restore-input.json](evidence/partial-restore-input.json), [J004-04-report.png](evidence/J004-04-report.png), [J004-04-partial.png](evidence/J004-04-partial.png), [unknown-field-only-input.json](evidence/unknown-field-only-input.json), [J004-04-unknown-field-report.png](evidence/J004-04-unknown-field-report.png), [1791071392555-aws-project.json](evidence/1791071392555-aws-project.json)

### UAT-J005-01 — loading

- Priority: P0
- Result: **PASS**
- 実行操作: UAT配信サーバでS3 productsだけ12秒遅延。通常reloadし完了前後の画面を観察。
- Observed result: S3は「—」「料金データ読込中...」、正常EC2/EBSは料金表示。取得完了後S3 $5.01へ遷移。仮値/旧値/0円確定表示なし。
- Expected result（Case原文）: loading状態が識別でき、旧値・0円・ダミー値が確定月額として表示されない。取得完了後readyへ遷移する。
- Usability確認: 画面から待機中と判断できた。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J005-01-loading.png](evidence/J005-01-loading.png), [J005-01-ready.png](evidence/J005-01-ready.png)

### UAT-J005-02 — unavailable局所化

- Priority: P0
- Result: **PASS**
- 実行操作: S3 productsだけHTTP503の環境でreload。正常RDSを2台に編集しreload。環境を正常へ戻しGUI「再試行」。
- Observed result: S3「Price Dataを取得できません。未計算」、小計$219.51、未計算1。編集後RDS $50.30、小計$237.76、reload後保持。他Planの$24.57は継続。再試行でS3料金復旧。
- Expected result（Case原文）: 正常Serviceは料金表示を継続し、失敗Serviceは未計算。Planは「計算済み小計 + 未計算件数」等で不完全性を明示する。編集/保存は継続可能。
- Usability確認: 完全totalと誤認しない。編集・自動保存・再試行継続可能。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J005-02-unavailable.png](evidence/J005-02-unavailable.png), [J005-02-edit-resume.png](evidence/J005-02-edit-resume.png), [J005-02-retry.png](evidence/J005-02-retry.png)

### UAT-J005-03 — invalid fallback禁止

- Priority: P0
- Result: **PASS**
- 実行操作: 配信fixtureでS3 Storageの分類属性を変え、チェックサムをfixture内容に一致させた配信manifestとともに提供。通常reload。
- Observed result: S3「Expected one SKU; matched none.」、料金—、小計$237.76/未計算1。元$5.01を使わず、EC2/RDS/EBS/Lambda計算継続。
- Expected result（Case原文）: invalid状態と未計算が識別され、似たSKU・先頭SKU・旧料金による月額は表示されない。他Serviceは利用可能。
- Usability確認: 問題をS3に局所化。初回の形式エラーfixtureとは別に、SKU0件解決まで確認した。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J005-03-invalid.png](evidence/J005-03-invalid.png), [J005-03-no-sku.png](evidence/J005-03-no-sku.png)

### UAT-J005-04 — stale継続

- Priority: P1
- Result: **PASS**
- 実行操作: 正常配信でreloadして料金を得る。配信側のactive manifestだけHTTP503に変更。画面の更新確認をクリック。
- Observed result: stale（新buildまたは最新確認失敗。使用中buildで計算）表示。同じbuildId/日付、Service価格とPlan $242.77/$24.57を保持。
- Expected result（Case原文）: 既取得データによる料金計算は継続し、stale/最新確認失敗が識別できる。新buildへ途中で混在しない。
- Usability確認: 継続可能で最新確認に失敗したことを識別できた。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J005-04-before.png](evidence/J005-04-before.png), [J005-04-stale.png](evidence/J005-04-stale.png), [J005-04-prices.png](evidence/J005-04-prices.png)

### UAT-J006-01 — PDF+JSON

- Priority: P0
- Result: **PASS**
- 実行操作: 2 Plan計算済み状態で「PDF + JSON」を1回クリック。実取得PDFを開き内容確認。付属JSONを変更後の復元Modalへ貼付。
- Observed result: PDFとJSONの2ファイル取得。PDFにProject/Plan/Service/主要usage/Component・Service・Plan料金、公表日2026-10-01T18:47:46Z。付属JSONで元状態を復元。
- Expected result（Case原文）: PDFとProject JSONの両方を取得できる。PDFにはProject/Plan/Service、主要入力、料金、Price Data publicationDateが含まれる。
- Usability確認: 追加バックアップ操作なし。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J006-01-output.png](evidence/J006-01-output.png), [1791071080384-aws-comparison.pdf](evidence/1791071080384-aws-comparison.pdf), [J006-01-pdf.txt](evidence/J006-01-pdf.txt), [J006-01-pdf-page1.png](evidence/J006-01-pdf-page1.png), [1791071080385-aws-project.json](evidence/1791071080385-aws-project.json), [J006-01-json-restored.png](evidence/J006-01-json-restored.png)

### UAT-J006-02 — 不完全PDF・Limitation

- Priority: P0
- Result: **PASS**
- 実行操作: SKU0件fixtureでS3未計算状態をGUI表示しPDF+JSON出力。取得PDFの全テキストと描画ページを確認。
- Observed result: Plan小計$237.76/未計算1、S3 Service未計算・storage invalid、差額比較不可、完全合計ではない説明。Pricing Limitationと過小見積riskを明記。
- Expected result（Case原文）: 未計算項目、完全合計でない旨、適用中Pricing Limitation、過小見積riskが必要に応じて記載される。
- Usability確認: 第三者が未計算と見積制約を識別できた。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [1791071123093-aws-comparison.pdf](evidence/1791071123093-aws-comparison.pdf), [J006-02-pdf.txt](evidence/J006-02-pdf.txt), [J006-02-pdf-page2.png](evidence/J006-02-pdf-page2.png), [1791071123094-aws-project.json](evidence/1791071123094-aws-project.json)

### UAT-J006-03 — CSV

- Priority: P1
- Result: **PASS**
- 実行操作: GUIのCSVをクリックし取得したCSV本文を開く。
- Observed result: Plan/Row/Service/Component、rawとdisplay料金、Service金額、state、limitation_ids、has_underestimate_risk、入力、Region/publication/buildの列。未計算S3料金は空でinvalid、正常分は画面価格と一致。
- Expected result（Case原文）: Plan、Row、Service/Component、料金を識別できる。必要なLimitation/risk情報も保持される。Project復元用JSONとは明確に別用途である。
- Usability確認: 転記なしで表形式データ取得。復元JSONとは別ボタン・形式。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [1791071133805-aws-comparison.csv](evidence/1791071133805-aws-comparison.csv)

### UAT-J007-01 — 追加の発見

- Priority: P0
- Result: **PASS**
- 実行操作: 1 Plan画面を観察。「サービスを追加」を選び、検索欄へEC2と入力、表示されたAmazon EC2を選択。
- Observed result: Plan内のラベル付きボタンからCatalogへ。検索結果EC2を選ぶと詳細Drawer。
- Expected result（Case原文）: Plan文脈からService追加へ到達でき、Catalogに対応Serviceが表示され、選択後は詳細設定へ進む。
- Usability確認: 見えているPlan/ボタン/検索文字で3操作以内に到達。AWS serviceCodeやDOMを利用せず。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J007-01-before.png](evidence/J007-01-before.png), [J007-01-search.png](evidence/J007-01-search.png), [J007-01-detail.png](evidence/J007-01-detail.png)

### UAT-J007-02 — 追加・置換取消

- Priority: P0
- Result: **PASS**
- 実行操作: 4行/$34.50の状態を記録。追加CatalogでS3検索後×をクリック。既存EC2置換Catalogも×で閉じる。
- Observed result: 4行、EC2各設定（365/730時間）、EBS200、Lambda、全Service金額、合計$34.50、delta $0.00が前後一致。
- Expected result（Case原文）: 取消後、Row数、既存Service、入力値、料金が開始前から変化しない。
- Usability確認: ×という可視の取消経路で変更を確定しない。Escapeは閉じず、×へ切替えて成功（UX所見）。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J007-02-before.png](evidence/J007-02-before.png), [J007-02-add-open.png](evidence/J007-02-add-open.png), [J007-02-add-cancel.png](evidence/J007-02-add-cancel.png), [J007-02-replace-open.png](evidence/J007-02-replace-open.png), [J007-02-after.png](evidence/J007-02-after.png)

### UAT-J007-03 — Serviceを外す

- Priority: P1
- Result: **PASS**
- 実行操作: Planを複製。最下段EC2の右セルだけを「Planから外す」、続いて左セルも外す。
- Observed result: 最初は右セルだけ—/この行に追加、左EC2 $9.93維持。元合計$34.50/右$24.57・delta -$9.93。両方除去後行が消え3比較行、両合計$24.57。
- Expected result（Case原文）: 対象セルだけ空になり他Planは変わらない。全Planで空になったRowは不要な空Rowとして残らない。total/deltaが更新される。
- Usability確認: セル内Planから外すとヘッダのPlan削除を区別。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J007-03-before.png](evidence/J007-03-before.png), [J007-03-one-cell.png](evidence/J007-03-one-cell.png), [J007-03-row-removed.png](evidence/J007-03-row-removed.png), [J007-04-before.png](evidence/J007-04-before.png)

### UAT-J007-04 — Plan削除・保護

- Priority: P0
- Result: **PASS**
- 実行操作: 非Baseline Plan専有のS3行を追加後、そのPlanを削除。残存Planを複製し、今度は左Baseline Planを削除。
- Observed result: 非Baselineと専有S3行が消え残存構成不変/$24.57。Baseline削除後残存先頭PlanがBaseline。1 PlanのヘッダにPlanを削除なし、合計$24.57/delta0。
- Expected result（Case原文）: 削除対象Planと専有Service Instanceが除去される。Baseline削除時は残存先頭Planが新Baselineになる。最後の1Planでは削除操作が表示されない。
- Usability確認: Plan列の削除ラベルと対象位置で操作対象を識別。最後のPlanへの削除導線なし。確認/Undo追加はUX提案として分離。
- 差異: 期待結果との差異なし。UX改善所見は別記。
- 証拠: [J007-04-exclusive-before.png](evidence/J007-04-exclusive-before.png), [J007-04-nonbaseline-deleted.png](evidence/J007-04-nonbaseline-deleted.png), [J007-04-baseline-before.png](evidence/J007-04-baseline-before.png), [J007-04-baseline-after.png](evidence/J007-04-baseline-after.png), [J007-04-final.png](evidence/J007-04-final.png)

## 証拠の保存と再実行

[case-results.json](case-results.json)に機械可読のケース結果、[evidence/](evidence/)にスクリーンショット・実ダウンロード・入力fixture・PDFの描画を保存。証拠のSHA-256一覧は[evidence-sha256.json](evidence-sha256.json)。

[harness/gui.cjs](harness/gui.cjs)は画像取得/座標入力用の補助。座標を事前定義した自動E2Eではなく、都度画像を観察して操作した。[harness/fault-server.py](harness/fault-server.py)は配信障害再現用。起動後`.work/uat/mode`を`normal`/`delay`/`unavailable`/`invalid`/`stale`へ設定する。これらは試験環境の制御であり、アプリの状態注入ではない。再実行ではBrowserの既存状態に応じてGUIから前提を作る。

このgoalでは結果・証拠のみを追加し、アプリコードの修正は行っていない。
