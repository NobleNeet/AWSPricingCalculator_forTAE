---
id: UAT-J003-01
journey: J003
type: task
priority: P0
automation: computer-use
---
# UAT-J003-01 — usage変更で料金を再計算する
## Preconditions
計算可能なServiceがある。
## Goal
Drawerからusageを変更し料金差を見る。
## Procedure
1. Service編集を開く。2. 数量/容量/時間等を変更する。
## Expected result
Service月額、Plan total、Baseline deltaが変更内容に応じて更新される。表示値変更前の古い料金を確定値として残さない。
## Usability criteria
変更結果を同じ作業画面で確認できる。