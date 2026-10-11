# 見積品質改善・公開版再試験

実行ID: 20261011-quality。報告生成: 2026-10-11T14:55:15.063Z。

公開サイト: https://nobleneet.github.io/AWSPricingCalculator_forTAE/

実装PR: https://github.com/NobleNeet/AWSPricingCalculator_forTAE/pull/64。公開検査修復PR: https://github.com/NobleNeet/AWSPricingCalculator_forTAE/pull/65、https://github.com/NobleNeet/AWSPricingCalculator_forTAE/pull/66。一覧読込修復PR: https://github.com/NobleNeet/AWSPricingCalculator_forTAE/pull/67。公開コミット・Price DB・Actionsの証跡: [deployment.json](deployment.json)。

## 試験の判定

| 試験 | 判定内訳 |
|---|---|
| 公式GUIとの料金比較 | PASS 21件 / 比較条件が異なる 31件 / FAIL 0件 / 操作不能 0件 / 未完了 0件 |
| GUI PASSの精度内訳 | 表示額・変化量の完全一致 14件 / 0.01 USD以内 6件 / 1セント未満の表示範囲確認 1件 |
| GUI比較できない構成の独立Price List検証 | 検証済み 31件 / FAIL 0件 / 操作不能 0件 |
| 公開GUIの入力制約 | 成功 15件 / FAIL 0件 / 操作不能 0件 |

公開版の追加E2E: 6/6件成功、失敗0件。今回の67ケースとは別集計。

NOT_COMPARABLEはGUI比較条件が等価でないという判定。ALTERNATIVE_VERIFIEDは別の検証結果であり、GUI PASSへ読み替えない。微小な表示額はUPPER_BOUND_ONLYとし、1セント未満という範囲だけを確認する。

今回の選定対象の実施率: 67/67。GUI FAIL 0件・BLOCKED 0件・INCOMPLETE 0件。全サービス全入力の検査率ではない。

料金比較では表示額と基準からの変化量を原則0.01 USD以内で照合。io2は公式EBS画面に対応するEBS関連コンポーネント小計を比較し、EC2全体総額の一致とは扱わない。

## 今後必要な対応

| 区分 | 今回の件数 | 意味 |
|---|---:|---|
| 修正・動作確認済み | 36 | 今回の対象修正が公開GUIで確認できた |
| 比較制約の根拠記録・独立検証済み | 31 | 公式GUIの制約または公開式との差を記録し、独立検証を実施。GUI一致のための機能削除や丸め変更は行わない |

Archiveは公開式のKB/1024²換算を途中で丸めない。公式GUIの100百万件・1 KBは15.50 USD、1000百万件は155.00 USD。公式の表示された計算詳細が0.000001 GB/イベントを使うことを確認し、その値で合計を再現した。今回の自作側表示額と差は下表およびJSONに記録する。任意payloadでの丸め方式や公式内部コードを確認したという意味ではない。

Schedulerの小数百万回入力は公式が拒否するが、単位selectorを「回/月」に切り替えると整数で同条件を設定できた。13,999,999・14,000,000・14,000,001・20,000,000回をこの方法で再測定。最初の拒否記録はofficial-extra-initial-rejected-decimals.jsonとして保存し、判定には採用しない。1回だけの課金は公式の計算詳細で確認し、金額表示はUPPER_BOUND_ONLY（1セント未満）として完全一致と区別する。

## サービス別の今回対象

| サービス | ケース | 検証した入力キー数 | GUI PASS | NOT_COMPARABLE | 代替検証済 | 入力制約確認済 | 最大GUI表示額差 USD |
|---|---:|---:|---:|---:|---:|---:|---:|
| ec2 | 13 | 7 | 11 | 2 | 2 | 0 | 0 |
| s3 | 6 | 3 | 6 | 0 | 0 | 0 | 0.01 |
| fargate | 10 | 7 | 0 | 10 | 10 | 0 | — |
| aurora-postgresql | 17 | 14 | 0 | 11 | 11 | 6 | — |
| eventbridge | 12 | 4 | 4 | 8 | 8 | 0 | 0 |
| rds | 9 | 6 | 0 | 0 | 0 | 9 | — |

入力キー数は今回の代表ケースの対象数であり、各サービスの全入力棚卸し件数ではない。最大額差は等価条件でGUI比較できたケースだけを集計し、Archiveなどの比較不可の差を含めない。

## ケース一覧

| ケース | GUI | 代替/入力制約 | 今後の対応 | 表示額差 USD | 証跡 |
|---|---|---|---|---:|---|
| io2-31999 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-31999.png) |
| io2-32000 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-32000.png) |
| io2-32001 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-32001.png) |
| io2-63999 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-63999.png) |
| io2-64000 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-64000.png) |
| io2-64001 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-64001.png) |
| io2-80000 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-80000.png) |
| io2-256000 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-256000.png) |
| io2-80000-2vol-365h | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-80000-2vol-365h.png) |
| io2-80000-1vol-365h | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-80000-1vol-365h.png) |
| io2-80000-2vol-730h | PASS | — | RESOLVED | 0 | [画面](screenshots/public-io2-80000-2vol-730h.png) |
| s3-51199 | PASS | — | RESOLVED | 0.01 | [画面](screenshots/public-s3-51199.png) |
| s3-51200 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-s3-51200.png) |
| s3-51201 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-s3-51201.png) |
| s3-512000 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-s3-512000.png) |
| s3-512001 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-s3-512001.png) |
| s3-60000 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-s3-60000.png) |
| dedicated-independent-region-hours-1 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-dedicated-independent-region-hours-1.png) |
| dedicated-independent-region-hours-100 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-dedicated-independent-region-hours-100.png) |
| fargate-32-x86-60 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | -0.003983333333333333333333333333333333333333333333333333333333333333333333333334 | [画面](screenshots/public-fargate-32-x86-60.png) |
| fargate-32-x86-120 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | -0.006233333333333333333333333333333333333333333333333333333333333333333333333334 | [画面](screenshots/public-fargate-32-x86-120.png) |
| fargate-32-x86-244 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | -0.003550000000000000000000000000000000000000000000000000000000000000000000000001 | [画面](screenshots/public-fargate-32-x86-244.png) |
| fargate-32-ARM-60 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0.002166666666666666666666666666666666666666666666666666666666666666666666666666 | [画面](screenshots/public-fargate-32-ARM-60.png) |
| fargate-32-ARM-120 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | -0.004333333333333333333333333333333333333333333333333333333333333333333333333334 | [画面](screenshots/public-fargate-32-ARM-120.png) |
| fargate-32-ARM-244 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | -0.005100000000000000000000000000000000000000000000000000000000000000000000000001 | [画面](screenshots/public-fargate-32-ARM-244.png) |
| fargate-32-x86-short | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0.008008333333333333333333333333333333333333333333333333333333333333333333333332 | [画面](screenshots/public-fargate-32-x86-short.png) |
| fargate-windows-storage-20 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-fargate-windows-storage-20.png) |
| fargate-windows-storage-21 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | — | [画面](screenshots/public-fargate-windows-storage-21.png) |
| fargate-windows-storage-200 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0.001825 | [画面](screenshots/public-fargate-windows-storage-200.png) |
| aurora-serverless-standard-short-capacity | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0.005 | [画面](screenshots/public-aurora-serverless-standard-short-capacity.png) |
| aurora-serverless-io-optimized-short-capacity | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-aurora-serverless-io-optimized-short-capacity.png) |
| aurora-limitless-io-optimized-short-capacity | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-aurora-limitless-io-optimized-short-capacity.png) |
| aurora-limitless-short-aggregate | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-aurora-limitless-short-aggregate.png) |
| aurora-one-io-with-storage | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | — | [画面](screenshots/public-aurora-one-io-with-storage.png) |
| archive-processing-only-1m | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | -0.0039776611328125 | [画面](screenshots/public-archive-processing-only-1m.png) |
| archive-processing-only-100m | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0.00223388671875 | [画面](screenshots/public-archive-processing-only-100m.png) |
| archive-processing-only-1000m | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0.0023388671875 | [画面](screenshots/public-archive-processing-only-1000m.png) |
| archive-existing-storage-only-1 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0.005 | [画面](screenshots/public-archive-existing-storage-only-1.png) |
| archive-existing-storage-only-100 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-archive-existing-storage-only-100.png) |
| archive-existing-storage-only-1000 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-archive-existing-storage-only-1000.png) |
| scheduler-13.999999 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-scheduler-13.999999.png) |
| scheduler-14 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-scheduler-14.png) |
| scheduler-14.000001 | PASS | — | RESOLVED | — | [画面](screenshots/public-scheduler-14.000001.png) |
| scheduler-20 | PASS | — | RESOLVED | 0 | [画面](screenshots/public-scheduler-20.png) |
| archive-100m-1kb | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | -0.72 | [画面](screenshots/public-archive-100m-1kb.png) |
| archive-1000m-1kb | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | -7.18 | [画面](screenshots/public-archive-1000m-1kb.png) |
| validation-rds-2-nodes-physical | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-rds-2-nodes-physical.png) |
| validation-rds-storage-duration-too-short | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-rds-storage-duration-too-short.png) |
| validation-rds-storage-duration-recovered | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-rds-storage-duration-recovered.png) |
| validation-rds-capacity-under-minimum | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-rds-capacity-under-minimum.png) |
| validation-rds-capacity-over-maximum | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-rds-capacity-over-maximum.png) |
| validation-rds-capacity-recovered | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-rds-capacity-recovered.png) |
| validation-rds-aggregate-under-physical-minimum | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-rds-aggregate-under-physical-minimum.png) |
| validation-rds-aggregate-at-physical-minimum | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-rds-aggregate-at-physical-minimum.png) |
| validation-rds-short-duration-small-aggregate | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-rds-short-duration-small-aggregate.png) |
| validation-aurora-limitless-under-minimum | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-aurora-limitless-under-minimum.png) |
| validation-aurora-limitless-short-capacity | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-aurora-limitless-short-capacity.png) |
| validation-aurora-limitless-short-aggregate | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-aurora-limitless-short-aggregate.png) |
| validation-aurora-zero-storage-zero-io | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-aurora-zero-storage-zero-io.png) |
| validation-aurora-io-with-zero-storage | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-aurora-io-with-zero-storage.png) |
| validation-aurora-io-with-storage-recovered | 対象外 | FUNCTIONAL_PASS | RESOLVED | — | [画面](screenshots/public-validation-aurora-io-with-storage-recovered.png) |
| aurora-serverless-standard-export-0 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-aurora-serverless-standard-export-0.png) |
| aurora-serverless-standard-export-1 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | -0.002 | [画面](screenshots/public-aurora-serverless-standard-export-1.png) |
| aurora-serverless-standard-export-100000 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-aurora-serverless-standard-export-100000.png) |
| aurora-serverless-io-optimized-export-0 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-aurora-serverless-io-optimized-export-0.png) |
| aurora-serverless-io-optimized-export-1 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | -0.002 | [画面](screenshots/public-aurora-serverless-io-optimized-export-1.png) |
| aurora-serverless-io-optimized-export-100000 | NOT_COMPARABLE | ALTERNATIVE_VERIFIED | COMPARISON_LIMIT_DOCUMENTED | 0 | [画面](screenshots/public-aurora-serverless-io-optimized-export-100000.png) |

## 未解決の過去分類と集計の限界

過去の全件試験1592ケースの元ファイルはこのcheckoutにないため、今回の再試験で旧件数を差し引いた新しい全件集計は作っていない。今回の対象を完全な全サービス・全パラメータ検証済みとは表現しない。

今回の6段階と別に、過去に原因調査としたgp3 throughput 5件とEventBridge微小payload 2件、許容差判断としたFargate 7件は、今回の結果へ混ぜて解消済みにしていない。

公式GUIの機能欠落・条件差の詳細: [COMPARISON-LIMITS.md](../../COMPARISON-LIMITS.md)。機械可読な全入力・基準/変更後画面・金額・差・理由: [public-results.json](public-results.json)、[results.csv](results.csv)。独立検証の原データ・SKU・単価・計算式: [alternative-cases.json](alternative-cases.json)。

## 実装・公開の確認

最終修復後の単体147件・ローカルブラウザ32件が成功。統合候補CI、Price DB semantic/Golden/drift検証、Pagesの結果はdeployment.jsonへ記録。公開版のPlan横断課金、Region混在、730時間制約、一覧読み込みの追加E2Eはpublic-e2e-results.jsonとtraceを参照。

追加修復PR #68: https://github.com/NobleNeet/AWSPricingCalculator_forTAE/pull/68。東京以外のRegion継承で個別指定optionもselectedとなる表示を修復し、新しい行の読み込みと入力反映を待つ検査を追加した。公開E2Eの初回5成功・1失敗と再試行失敗は別ファイルに保存し、最終実行と混ぜていない。Snapshot Exportの初回6件は無効な入力欄へ有効化前に入力しようとして操作不能となったため、toggleを先に操作して同じ値・期待値で再測定した。public-initial-results.jsonに保存し、最終public-results.jsonは再測定結果を含む。

更新前の公開GUIではio2 256,000 IOPSの公式との差が7,956.48 USD、S3 60,000 GBの差が8.80 USD。画面・入力・比較額はpre-deployment-results.jsonとして保存し、更新後の件数には混ぜていない。旧公開候補のdrift検査は参照元コンポーネントを除外してMISSING_USAGEとなったため、PR #65で検査処理を修復した。失敗候補の証跡はfailed-price-publication/へ保存し、成功として集計していない。

共有Coreの計算契約変更に伴い、既存workflowが66料金ソース（11コード×6Region）を再materializeし、全サービスの意味検証を選択した。局所修正のscopeを変更して回避していない。
