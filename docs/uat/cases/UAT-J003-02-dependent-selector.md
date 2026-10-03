---
id: UAT-J003-02
journey: J003
type: recovery
priority: P0
automation: computer-use
---
# UAT-J003-02 — 親selector変更で無効値を要再選択にする
## Preconditions
親子依存するselectorを持つServiceがある。
## Goal
候補外になった既存値を黙って置換しないことを確認する。
## Procedure
1. 子selectorを有効な値にする。2. 親selectorを変更し、その子値が無効になる条件を作る。
## Expected result
子値は別候補へ自動変更されず「要再選択」等の未解決状態になる。解決まで料金を安全な確定値として扱わない。
## Usability criteria
利用者が何を再選択すべきか認識できる。