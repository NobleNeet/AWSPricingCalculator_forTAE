---
id: UAT-J007-02
journey: J007
type: destructive
priority: P0
automation: computer-use
---
# UAT-J007-02 — Service追加/置換を取消して元状態を保つ
## Preconditions
既存Plan/Rowがある。
## Goal
誤って開始した変更を安全に取消す。
## Procedure
1. Service追加を開始し途中で取消す。2. 既存Serviceの置換を開始し途中で取消す。
## Expected result
取消後、Row数、既存Service、入力値、料金が開始前から変化しない。
## Usability criteria
取消操作が破壊的変更を確定しない。