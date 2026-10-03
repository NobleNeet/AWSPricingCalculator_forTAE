---
id: UAT-J002-01
journey: J002
type: task
priority: P0
automation: computer-use
---
# UAT-J002-01 — Planを複製して独立編集する
## Preconditions
複数Serviceを持つPlan Aがある。
## Goal
元案を保持した代替案を作る。
## Procedure
1. Plan Aを複製する。2. 複製PlanのService usageを変更する。
## Expected result
複製直後は構成・値が一致する。複製側変更後もPlan Aは変化しない。両Planのtotal/deltaが別々に更新される。
## Usability criteria
複製後に同じ入力を再作成する必要がない。