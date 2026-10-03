---
id: UAT-J006-03
journey: J006
type: interop
priority: P1
automation: computer-use
---
# UAT-J006-03 — 比較結果をCSVへ出力する
## Preconditions
複数Plan/ServiceのProject。
## Goal
表計算で利用可能な比較データを取得する。
## Procedure
CSV出力を実行しファイルを開く。
## Expected result
Plan、Row、Service/Component、料金を識別できる。必要なLimitation/risk情報も保持される。Project復元用JSONとは明確に別用途である。
## Usability criteria
主要比較内容を画面から手転記せず利用できる。