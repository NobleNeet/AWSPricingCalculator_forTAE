---
id: UAT-J007-01
journey: J007
type: discovery
priority: P0
automation: computer-use
---
# UAT-J007-01 — Service追加導線とCatalogから目的Serviceを見つける
## Preconditions
Planが1件ある。
## Goal
説明書なしでService追加へ到達する。
## Procedure
1. 画面を観察しService追加操作を探す。2. Catalogを開く。3. EC2等の目的Serviceを探して選ぶ。
## Expected result
Plan文脈からService追加へ到達でき、Catalogに対応Serviceが表示され、選択後は詳細設定へ進む。
## Usability criteria
AWS serviceCodeや内部IDを知らなくても見つけられる。