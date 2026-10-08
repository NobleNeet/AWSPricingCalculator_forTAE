# UAT Design

本ディレクトリは `uat-design` の方針に従い、仕様書を正本としてGUI利用者視点のJourney/UATを管理する。

## Source of truth

1. `AGENTS.md`
2. `docs/SPEC.md`
3. `docs/PRICING_ARCHITECTURE.md`
4. `docs/IMPLEMENTATION_PLAN.md`
5. `docs/uat/**`

未記載の挙動をUAT側で発明しない。不足は `SPEC_GAPS.md` に記録する。

## Execution policy

- UATは実際のブラウザGUIだけを操作して実施する。
- source code、DevTools内部状態、localStorage直接編集、API直叩き等を合格証拠にしない。
- Expected resultは画面・ダウンロード物等、利用者が外部から観測可能な結果に限定する。
- 実装後はComputer Use等で自動実行可能な粒度を維持する。

## Journeys

| ID | Journey | 主対象 |
|---|---|---|
| J001 | 最初の見積を作る | 0 Plan、Plan作成、Service追加 |
| J002 | 構成案を複製・比較する | Plan複製、Row、置換、delta |
| J003 | Service設定を編集する | Drawer、selector、usage、再計算 |
| J004 | 作業を保存・復元する | localStorage、Project JSON、Restore Report |
| J005 | 料金データ異常から回復する | loading/unavailable/invalid/stale |
| J006 | 見積結果を出力する | PDF、Project JSON、CSV、Limitation |
| J007 | 安全に操作を発見・取消・削除する | Catalog、取消、破壊操作 |

## Coverage summary

- task completion: J001/J002/J003
- persistence/reopen: J004
- interruption/error recovery: J005
- import/export/interoperability: J004/J006
- destructive action/cancellation: J007
- discoverability: J007
- correction/reselection: J003/J004

`cases/` の各ケースは安定ID `UAT-Jnnn-nn` を持つ。
## AWS Pricing Calculator parity test（明示指示時のみ）

AWS公式Calculatorと公開Pagesの全サービス・全料金関連入力項目をGUIで比較する独立した最上位検証は、[AWS_CALCULATOR_PARITY.md](AWS_CALCULATOR_PARITY.md) を正本とする。

- ユーザーが明示的に実行を指示したときのみ実施する。通常のUAT、CI、オンボーディング、価格更新、デプロイから自動起動しない。
- 差額だけで不具合と断定せず、仕様差と実装不具合を区別する。
- FAILごとにCodexへそのまま渡せる修正指示書を保存し、修正担当は最新版の`AGENTS.md`等を参照する。
- テスト担当は修正・再テストを自動開始しない。
