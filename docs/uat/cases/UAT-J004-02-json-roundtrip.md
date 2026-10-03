---
id: UAT-J004-02
journey: J004
type: interop
priority: P0
automation: computer-use
---
# UAT-J004-02 — Project JSONをコピー&ペースト復元する
## Preconditions
識別しやすい複数Plan構成がある。
## Goal
ファイルアップロードなしで正式バックアップから復元する。
## Procedure
1. Project JSONを取得する。2. 画面状態を変更する。3. 復元UIへJSON本文を貼る。4. 適用する。
## Expected result
保存時の編集状態が復元され、料金は現在のDefinition/Price Dataで再計算される。保存済み金額をそのまま信頼しない。
## Usability criteria
JSON本文の貼付だけで復元できる。