---
id: UAT-J005-01
journey: J005
type: recovery
priority: P0
automation: computer-use
---
# UAT-J005-01 — Price Data loading中に仮価格を見せない
## Preconditions
Price Data取得を意図的に遅延できるUAT環境。
## Goal
読込中を確定料金と誤認しない。
## Procedure
Serviceを追加/表示し、Price Data取得完了前を観察する。
## Expected result
loading状態が識別でき、旧値・0円・ダミー値が確定月額として表示されない。取得完了後readyへ遷移する。
## Usability criteria
待機中であることが画面だけで判断できる。