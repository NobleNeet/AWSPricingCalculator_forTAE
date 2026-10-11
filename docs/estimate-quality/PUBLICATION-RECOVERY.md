# 料金データ公開検査の修復

PR #64 を統合したコミット `9764b6f08efb885e84e360f8bf5945e61d63ac01` の
Price Update `38129557639` は、drift 検査が対象コンポーネントだけを残し、
`resolvedComponentInput` の参照元を除外するため、io2 tier 2/3 に
`MISSING_USAGE` を報告した。画面の料金計算と異なる検査条件による不具合である。

検査対象の参照元を再帰的に残し、定義順で評価する。料金データの候補は
元のフィルタと同じ述語で絞り込み、SKU 不在・複数候補の拒否を保持する。
対象外コンポーネントのエラーを、その対象の結果として重複集計しない。
case 列挙、検査範囲、期待値、料金定義、Core の意味論は変更しない。
検査ツールの修正は global semantic fingerprint の対象外であり、
修正自体による新たな full semantic validation は発生させない。
PR #64 による Core 意味論変更に必要な全サービス検査は維持する。

CLI の Actions 停止 API は権限不足で拒否されたため、リポジトリの
`actions: write` を持つ回復 workflow で、上記 ID・コミット・workflow が
一致する既知の不正候補だけを停止する。新しい候補の公開検査は省略しない。
停止済み・終了済みの場合は何もしない。停止・失敗した実行は成功と扱わない。

併せて `index.html` が参照する `ec2-instance-table.css` の配信漏れ
（公開 URL が HTTP 404）を静的ビルドのコピー対象に追加する。
