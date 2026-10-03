# J005 — 料金データ異常から回復する

## User intent

Price Dataの読込失敗や不整合が起きても、誤った見積を確定値として扱わず作業を継続する。

## Main flow

loading → ready、または unavailable/invalid/stale → 状態表示 → 未計算subtotal → 編集継続 → 再取得/復旧。

## Success

silent fallbackがなく、障害が局所化され、利用者が「完全な合計ではない」ことを認識できる。