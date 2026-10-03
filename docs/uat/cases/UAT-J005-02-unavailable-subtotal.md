---
id: UAT-J005-02
journey: J005
type: recovery
priority: P0
automation: computer-use
---
# UAT-J005-02 — 一部Service unavailable時にsubtotalを表示する
## Preconditions
Planに正常Serviceと取得失敗ServiceがあるUAT環境。
## Goal
未計算を0円として完全totalに混ぜない。
## Procedure
1 ServiceだけPrice Data取得失敗させる。
## Expected result
正常Serviceは料金表示を継続し、失敗Serviceは未計算。Planは「計算済み小計 + 未計算件数」等で不完全性を明示する。編集/保存は継続可能。
## Usability criteria
不完全Planが安価な完全見積に見えない。