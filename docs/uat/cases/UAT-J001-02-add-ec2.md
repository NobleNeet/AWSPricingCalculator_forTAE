---
id: UAT-J001-02
journey: J001
type: task
priority: P0
automation: computer-use
---
# UAT-J001-02 — EC2を追加して料金を得る
## Preconditions
空のPlanが1件ある。Price Dataが利用可能。
## Goal
EC2を追加し利用条件に応じた月額を確認する。
## Procedure
1. PlanのService追加を開く。2. EC2を選ぶ。3. 必須selector/usageを設定する。4. 編集を完了する。
## Expected result
EC2が新しいRowに表示され、確定した設定概要とUSD月額が表示される。Plan totalに同額が反映される。
## Usability criteria
SKU IDやrateCodeを利用者に入力させない。