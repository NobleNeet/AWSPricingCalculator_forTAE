---
id: UAT-J002-02
journey: J002
type: task
priority: P0
automation: computer-use
---
# UAT-J002-02 — 同じRowで別Serviceへ置換する
## Preconditions
2 Planがあり同じRowにRDS等がある。
## Goal
片方だけ別Serviceへ置換して比較する。
## Procedure
1. 一方のセルで「別サービスに置換」相当を実行する。2. Aurora等を選び必要設定を行う。
## Expected result
Rowは維持され、対象PlanだけServiceが変わる。元Serviceの意味の異なる設定値が推測コピーされない。Row labelと各料金が更新される。
## Usability criteria
新規Rowを作らず代替Service比較を継続できる。