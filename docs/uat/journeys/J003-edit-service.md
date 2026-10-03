# J003 — Service設定を編集する

## User intent

既存Serviceのselectorやusageを変更し、料金への影響を即座に確認する。

## Main flow

Service編集 → Drawer → selector/usage変更 → 依存候補再評価 → Price再計算 → 必要なら要再選択 → optional Component切替。

## Success

変更が当該Service、Plan total、deltaへ一貫して反映され、無効値を勝手に別値へ置換しない。