---
id: UAT-J005-03
journey: J005
type: recovery
priority: P0
automation: computer-use
---
# UAT-J005-03 — invalid料金解決でsilent fallbackしない
## Preconditions
UAT fixtureでSKU 0件/複数件等のinvalid状態を作れる。
## Goal
推測料金を表示しない。
## Procedure
invalid条件のServiceを開く。
## Expected result
invalid状態と未計算が識別され、似たSKU・先頭SKU・旧料金による月額は表示されない。他Serviceは利用可能。
## Usability criteria
問題が当該Serviceに局所化される。