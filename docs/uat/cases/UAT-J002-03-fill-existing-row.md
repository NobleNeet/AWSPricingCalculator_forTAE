---
id: UAT-J002-03
journey: J002
type: task
priority: P1
automation: computer-use
---
# UAT-J002-03 — 空セルを既存Rowへ参加させる
## Preconditions
複数PlanのRowで1セルが空。
## Goal
新規Rowではなく既存比較項目へServiceを追加する。
## Procedure
空セルの「この行に追加」相当を実行しService設定を完了する。
## Expected result
新しいRowは増えず、対象セルにServiceが追加される。他Planのセルは変わらない。
## Usability criteria
「新しいサービス追加」と「既存Rowへ追加」の違いを操作から判断できる。