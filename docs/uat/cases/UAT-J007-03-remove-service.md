---
id: UAT-J007-03
journey: J007
type: destructive
priority: P1
automation: computer-use
---
# UAT-J007-03 — ServiceをPlanから外す
## Preconditions
複数PlanのRowにServiceがある。
## Goal
1 PlanだけからServiceを除去する。
## Procedure
対象セルの「Planから外す」相当を実行する。
## Expected result
対象セルだけ空になり他Planは変わらない。全Planで空になったRowは不要な空Rowとして残らない。total/deltaが更新される。
## Usability criteria
Service削除とPlan削除を混同しない。