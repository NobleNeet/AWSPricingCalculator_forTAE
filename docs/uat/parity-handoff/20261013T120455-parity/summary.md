ユーザー指示により **一時停止中**。再開情報は [PAUSED.md](PAUSED.md)。

# AWS Calculator Parity Test 20261013T120455-parity

状態: **INCOMPLETE**。公開版・公式の17サービスへ実ブラウザで到達したが、全料金関連項目・全条件の検査完了ではない。未確認/未測定をPASSに数えない。アプリ・Price DBの修正、push/deployは実施していない。

公開Price Data build: `20261013T095030Z-78197541`。UTC開始 2026-10-13 12:04:55、JST開始 2026-10-13 21:04:55。許容差0.01 USD/月。

| Service | Input FAIL | Price PASS | Price FAIL | BLOCKED | NOT_COMPARABLE | INCOMPLETE | 観測済み公式項目 | 観測済み公開項目 | 最大実測差 USD |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| athena | 2 | 9 | 3 | 13 | 2 | 9 | 12 | 20 | 2.0 |
| aurora-postgresql | 4 | 41 | 0 | 0 | 4 | 73 | 43 | 32 | 0.01 |
| ebs | 7 | 15 | 0 | 0 | 7 | 22 | 22 | 8 | 0.0 |
| ec2 | 4 | 46 | 0 | 0 | 53 | 53 | 76 | 41 | 2.88 |
| eventbridge | 0 | 73 | 7 | 0 | 2 | 21 | 30 | 20 | 0.95 |
| rds-oracle | 1 | 21 | 0 | 0 | 7 | 28 | 17 | 25 | 36.5 |
| rds | 5 | 20 | 0 | 0 | 5 | 31 | 23 | 22 | 0.01 |
| redshift | 1 | 4 | 0 | 0 | 37 | 26 | 19 | 25 | 2.71 |
| s3 | 111 | 26 | 0 | 0 | 111 | 67 | 175 | 7 | 0.0 |
| amplify | 1 | 42 | 0 | 0 | 1 | 9 | 12 | 10 | 0.01 |
| codebuild | 16 | 25 | 0 | 0 | 16 | 7 | 22 | 9 | 0.0 |
| fargate | 0 | 43 | 4 | 1 | 0 | 11 | 13 | 13 | 26.29 |
| glue | 4 | 46 | 0 | 0 | 5 | 76 | 57 | 61 | 8.8 |
| kms | 0 | 43 | 0 | 0 | 0 | 4 | 7 | 10 | 0.0 |
| lambda | 6 | 77 | 1 | 0 | 8 | 18 | 35 | 17 | 0.01 |
| systems-manager | 24 | 13 | 0 | 6 | 24 | 26 | 50 | 7 | 0.0 |
| elastic-load-balancing | 2 | 51 | 4 | 0 | 2 | 28 | 49 | 33 | 0.01 |

入力対応と料金比較は別集計。全項目数は未確定であり、表の項目数は観測済みの下限。公式確認率・料金検査率の完全な分母はnull。分子と観測済み分母は summary.json を参照せよ。Profile/Region範囲、個別項目分類、未確認条件、0測定の項目も coverage-matrix.json と field-correspondence.json に保持した。

[FAIL個別修正指示書一覧](fix-all.md)、[ケース一覧](cases.json)、[入力対応表](field-correspondence.json)、[網羅性](coverage-matrix.json)、[未完了棚卸し条件](inventory-remaining.json)、[機械可読集計](summary.json)を参照せよ。元GUI入力・表示・証跡は個別cases JSONおよびobservations配下へ保存した。

保管先: manifest.json の storage.durableArchive に最新のリポジトリ外チェックポイントとSHAを保持している。保存日時・状態・取得手順を確認せよ。
