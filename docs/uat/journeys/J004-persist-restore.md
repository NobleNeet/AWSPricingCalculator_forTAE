# J004 — 作業を保存・復元する

## User intent

作業途中を同じBrowserで再開し、正式バックアップとしてProject JSONから復元する。

## Main flow

編集 → 自動保存 → reload → 状態継続。Project JSON出力 → 別状態からJSON貼付復元 → 現在Price Dataで再計算 → Restore Report確認。

## Success

正常データは維持され、fatal入力は現Projectを破壊せず、未知要素は可能な限り部分復元される。