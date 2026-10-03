---
id: UAT-J004-01
journey: J004
type: persistence
priority: P0
automation: computer-use
---
# UAT-J004-01 — Browser reload後に作業を再開する
## Preconditions
複数Plan/Serviceを編集済み。
## Goal
同一Browserで作業状態を継続する。
## Procedure
1. 状態を変更する。2. 保存完了を待つ。3. ページをreloadする。
## Expected result
Plan、Rows、Service設定、Baseline等の編集状態が復元される。Price Dataは現在利用可能なものから再計算される。
## Usability criteria
手動バックアップ操作なしで通常のreloadから続行できる。