---
id: UAT-J004-04
journey: J004
type: recovery
priority: P1
automation: computer-use
---
# UAT-J004-04 — 未知要素を含むProjectを部分復元する
## Preconditions
未知Service/Profile/fieldを含むテストProject JSONを用意する。
## Goal
局所問題でProject全体をfatalにしない。
## Procedure
JSON本文を復元UIへ貼り適用する。
## Expected result
復元可能なPlan/Serviceは利用でき、未知部分はwarning/invalidとして識別される。Restore Reportで問題を確認できる。
## Usability criteria
利用者が失われた/未解決の範囲を把握できる。