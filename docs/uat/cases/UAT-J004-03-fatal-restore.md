---
id: UAT-J004-03
journey: J004
type: recovery
priority: P0
automation: computer-use
---
# UAT-J004-03 — fatalな復元入力で現Projectを保持する
## Preconditions
現在Projectに識別可能なデータがある。
## Goal
壊れたJSONで作業を失わない。
## Procedure
1. 復元UIを開く。2. JSONとして不正な文字列を貼る。3. 適用する。
## Expected result
エラーが表示され、現在ProjectのPlan/Service/値は変更されない。
## Usability criteria
失敗理由が利用者に理解可能で、再入力できる。