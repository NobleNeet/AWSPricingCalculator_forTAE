---
id: UAT-J006-01
journey: J006
type: interop
priority: P0
automation: computer-use
---
# UAT-J006-01 — PDF出力とProject JSONを同時に残す
## Preconditions
複数Planの計算済みProject。
## Goal
共有資料と復元情報を1操作で保存する。
## Procedure
PDF + 復元JSONの出力操作を実行する。
## Expected result
PDFとProject JSONの両方を取得できる。PDFにはProject/Plan/Service、主要入力、料金、Price Data publicationDateが含まれる。
## Usability criteria
別のバックアップ操作を追加で要求されない。