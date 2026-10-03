---
id: UAT-J007-04
journey: J007
type: destructive
priority: P0
automation: computer-use
---
# UAT-J007-04 — Plan削除と最後の1Plan保護
## Preconditions
2 Plan以上ある。
## Goal
不要Planを削除し、意図せずPlan 0件へ戻さない。
## Procedure
1. 非Baseline Planを削除する。2. Baseline Plan削除も確認する。3. 最後の1Planだけの状態を確認する。
## Expected result
削除対象Planと専有Service Instanceが除去される。Baseline削除時は残存先頭Planが新Baselineになる。最後の1Planでは削除操作が表示されない。
## Usability criteria
破壊結果を事前に理解できるUIになっている。