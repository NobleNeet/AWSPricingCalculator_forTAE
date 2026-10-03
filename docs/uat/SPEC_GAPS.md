# UAT Specification Gaps

UAT設計時に見つかった、仕様から一意に合否を定められない事項を記録する。ここにある項目は実装を勝手に決める根拠ではない。

## G001 — Retry UIの具体形

`unavailable` 時に再試行操作を提供可能とされているが、必須配置・文言・回数は固定されていない。

- UATでは「利用者が再試行できる場合、その操作で同じ作業を継続できる」を確認対象とする。
- ボタン名や配置は合否条件にしない。

## G002 — PDFレイアウト/ファイル名

PDFに含める情報は定義済みだが、ページ構成・ファイル名は固定されていない。

- UATでは内容の存在と誤認防止表示だけを確認する。

## G003 — CSV列順・ファイル名

必要情報は実装計画で示されているが、列順やファイル名は固定されていない。

- UATでは意味のある列が取得でき、Project復元用途と混同しないことを確認する。

## G004 — Service Catalogの検索UI詳細

CatalogがDefinitionから生成されることは確定しているが、検索・絞り込みの具体UIは厳密には固定されていない。

- UATでは目的のServiceへ合理的に到達できることを確認する。

## G005 — Service Instance単位Region overrideの露出

データモデル上はoverride可能だが、初期UIで必ず一般表示するかは固定されていない。

- 初期UATではProject Default Regionの継承を必須とし、個別overrideは受入必須ケースにしない。

## G006 — historical mock localStorage migration

実装計画ではbest-effort migration候補だが、仕様正本の必須UXではない。

- 新本実装のProject persistenceだけをUAT必須とする。