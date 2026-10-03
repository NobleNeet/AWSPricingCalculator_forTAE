---
id: UAT-J005-04
journey: J005
type: recovery
priority: P1
automation: computer-use
---
# UAT-J005-04 — 既取得Price Dataをstaleとして継続利用する
## Preconditions
正常Price Dataを一度ロード済みで、その後最新確認を失敗させられる。
## Goal
既知の正常データで作業を継続しつつ古さを明示する。
## Procedure
正常計算後に最新確認/再取得を失敗させる。
## Expected result
既取得データによる料金計算は継続し、stale/最新確認失敗が識別できる。新buildへ途中で混在しない。
## Usability criteria
利用者が継続可能性と鮮度リスクを区別できる。