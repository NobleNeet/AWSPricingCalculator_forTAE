# 公式GUIの比較制約と代替検証

調査日: 2026-10-11。画面の再調査は `runs/20261011-quality/` に保存する。過去の全件監査ファイルは今回のcheckoutに存在しないため、過去件数の再集計ではなく、対象分類ごとの新しい検証を記録する。

| 対象 | 同条件のGUI比較が難しい理由 | 今回の対応・代替根拠 |
|---|---|---|
| Aurora Serverless / Limitless 短時間ACU | 公式はACU数から通月使用量を計算し、独立した短時間の入力がない | 容量×時間モードを追加。集計ACU-hourも保持。短時間は公式仕様とPrice ListのACU-Hr単価で独立検証。通月に変更した値を原ケースのPASSとして扱わない |
| Aurora Standard I/O 0/1回 | 公式はBaseline/Peak rateと時間から構成し、極小合計回数を再現できない場合がある | 0回を有効な無課金使用量として保持。I/O>0かつストレージ0は入力エラー。実使用量1回はPrice ListのIOs単価で検証 |
| RDS 小さい集計GB/月 | 台数・稼働時間に対し実容量20 GiB未満となる組み合わせは実構成にならない | 物理容量モードと組み合わせ検証を追加。短時間で実現する小さな集計値は保持 |
| Dedicated 独立した地域時間 | 公式GUIの地域追加料金がComputeの時間に連動する | 地域時間の独立性を保持し、同じPlan/Regionでの重複を拒否。期間の重なりを推測しない |
| Fargate Linux 32 vCPU | 公式GUIのCPU selector候補と現行サービス仕様の候補に差がある | 32 vCPUを削除せず、AWS公式仕様の60/120/244 GiB・Linux platform 1.4.0以上という条件を記録。[公式構成表](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html)とPublic Price ListのvCPU-hour/GB-hourで独立検証 |
| Fargate Windows追加Storage | Windows選択時に同じ追加Storage設定がGUIに出ない場合がある | 20～200 GiBを保持。[公式Storage仕様](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-storage.html)はWindows platform 1.0.0以上の拡張を明記。bind mount非対応とStorage拡張非対応を混同しない |
| Aurora Serverless Snapshot Export | 公式Serverless画面に同じExport入力が出ない | [Snapshot Exportの対応Region/Engine](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.Aurora_Fea_Regions_DB-eng.Feature.ExportSnapshotToS3.html)とPostgreSQL SnapshotExport SKUで検証。live cluster exportの制約やSQL aws_s3 exportをSnapshot Exportの根拠として代用しない。S3/KMS料金は別途 |
| EventBridge Archive処理・保存の独立量 | 公式は同じイベント数から処理GBと保存GB/月を生成する | 処理のみ/既存Archiveの保存のみを有効な利用形態として保持。各SKUと[公式料金式](https://aws.amazon.com/eventbridge/pricing/)で独立検証 |

代替検証の記録には `guiVerdict` と `alternativeVerdict` を別々に持たせる。`ALTERNATIVE_VERIFIED` が付いてもGUI試験の `NOT_COMPARABLE` は残る。GUI欠落を製品不具合として入力を削除することはしない。

## Archiveの小payload差

公開式は `イベント数 × KB / (1024 × 1024)`。アプリはこの式を途中で丸めずに計算する。2026-10-11の公式GUI実測は、Tokyoで1 KB・100百万イベントが15.50 USD、1000百万イベントが155.00 USD。処理/保存の単価はPublic Price Listから取得する。

7桁のGB/イベントへの中間丸めで過去の差を再現できた、という仮説と、GUIで観測した表示額は区別する。公式の内部実装を確認した事実はない。差は通常の0.01 USDを超えるが、公式の公開式を維持する方針を明示して、GUIの途中丸めをアプリへ導入しない。

## 対応が残るもの

ここに挙げた機能は価格照合と入力意味の検証を進める。元の全件試験に残る別分類（gp3 throughputや微小payloadの原因調査、Fargateの丸め許容差等）を、今回の新規検証の件数へ混ぜて解消済みとしない。
