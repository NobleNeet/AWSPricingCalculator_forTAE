---
id: UAT-J003-03
journey: J003
type: task
priority: P1
automation: computer-use
---
# UAT-J003-03 — optional Componentを無効化・再有効化する
## Preconditions
切替可能なComponentを持つServiceがある。
## Goal
無効Componentを料金から除外し、再有効化時に入力を保持する。
## Procedure
1. Component値を設定する。2. 無効化する。3. totalを確認する。4. 再有効化する。
## Expected result
無効中は当該Component料金が加算されない。再有効化時は仕様上保持可能な既存値が復元される。
## Usability criteria
無効化とusage=0を混同しない。