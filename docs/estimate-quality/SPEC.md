# 見積品質改善仕様

2026-10-11、ユーザーが推奨順序での修正を承認したため、既存のTier・Scheduler無料枠方針を次の範囲で更新する。

1. EC2組み込みio2: ボリュームごとに最初32,000、次32,000、64,000超のIOPSを別のAWS Public Price List SKUへ対応付ける。境界処理後にボリューム数と時間/730を掛ける。EBSストレージ入力は従来どおり全体のGB/月集計値で、IOPS側の個数・時間を二重に掛けない。
2. S3 Standard: `tiered` modelで連続した同一SKUの有料dimensionを積算する。同じPlan・Regionの行を合算し、表示行順にTier使用量を割り当てる。行配分は順序に依存するが合計は依存しない。見積もり外のアカウント使用量は含まれない。
3. RDS PostgreSQL gp3: 新規行は容量/台×台数×保存時間/730。容量20～65,536 GiB、時間0超～730。保存時間はDB稼働時間以上。既存GB/月の直接入力もAdvancedで保持し、台数×稼働時間×20/730以上を要求する。短期間の小さなGB/月値を一律拒否しない。
4. Aurora Serverless / Limitless: 新規行は平均ACU×利用時間。既存ACU-hourはaggregate入力として保持する。Limitlessの基本構成は最低16 ACU。Database Insights監視ACUとDB容量は独立し、監視側に16 ACU下限を設けない。
5. Dedicated地域料金: 同一Plan・Regionで重複計上を検出したら未計算とし、代表行へ地域利用時間を集約して他行のComponentを無効にするよう案内する。稼働期間の重なりを月間集計値から推測しない。
6. Scheduler: 課金前の総額と無料枠適用後の額を併記する。新規Projectは残り14,000,000回、既存Projectに指定がない場合は0回で旧見積前提を保持。無料枠はPlan全体・全Region共有。単価の異なるRegionへの無料枠配分を確定できない場合は未計算とする。無料枠0を明示すれば控除前見積もりが可能。
7. 公式GUIで同等入力がない項目は、原試験をNOT_COMPARABLEとしたまま公式仕様・Public Price List・独立計算による代替検証を別項目として記録する。代替検証をGUI PASSとして扱わない。
8. Archive: 公開式の二進単位換算を維持し、途中で表示丸めしない。公式GUIの中間丸めと推定される差は仕様差として記録する。原因の実証と推測を区別する。

共有CoreはDOM・networkから独立したまま、使用量式を `product`、`choice`、`resolvedComponentInput` と既存の型付き変換へ限定する。入力間制約は型付き比較で宣言する。任意JavaScript、単価のDefinitionへの転記、曖昧SKUの先頭選択は禁止する。

根拠: [EBS料金](https://aws.amazon.com/ebs/pricing/)、[RDSストレージ](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html)、[Scheduler料金](https://aws.amazon.com/eventbridge/pricing/)。Price List観測はAmazonEC2 `20261009203134`、Tokyoの3つのIOPS SKUを使用した。

試験の判定と今後必要な対応を分けて記録する。実装・単体試験・公開GUIの比較・デプロイの状態を混同しない。
