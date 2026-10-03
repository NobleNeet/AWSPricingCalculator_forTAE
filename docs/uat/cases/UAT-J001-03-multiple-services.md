---
id: UAT-J001-03
journey: J001
type: task
priority: P0
automation: computer-use
---
# UAT-J001-03 — 複数Serviceを積み上げる
## Preconditions
EC2を含むPlanがある。
## Goal
複数AWS Serviceを順に追加して構成を作る。
## Procedure
1. S3等の別Serviceを追加する。2. 必要入力を設定する。3. さらに1 Service追加する。
## Expected result
Serviceごとに独立Rowが作られ、各月額とPlan totalが表示される。totalは各計算済みServiceの合計と整合する。
## Usability criteria
既存Serviceを編集しなくてもPlan末尾から追加を継続できる。