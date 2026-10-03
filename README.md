# AWSPricingCalculator_forTAE

AWS Public Price List JSON をデータソースにした、構成比較型の料金検討ツール。

## 仕様書

現行仕様の正本は以下です。

- ユーザー向け仕様: [`docs/SPEC.md`](docs/SPEC.md)
- 料金・内部アーキテクチャ仕様: [`docs/PRICING_ARCHITECTURE.md`](docs/PRICING_ARCHITECTURE.md)
- 実装計画: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)
- 設計履歴索引: [`docs/PRICING_ARCHITECTURE_DECISION_HISTORY.md`](docs/PRICING_ARCHITECTURE_DECISION_HISTORY.md)

Codex向けのリポジトリ共通指示は [`AGENTS.md`](AGENTS.md) にあります。

## 現在の内容

ルート階層は今後の本実装用に空け、仕様書・実装計画・Codex指示を中心に配置しています。

仕様検討時に使用した静的UIモックは [`mock/`](mock/) に隔離しています。

`mock/` 内の主なファイル:

- `index.html`
- `styles.css`
- `app.js`
- `onboarding.js`
- `onboarding.css`

モックの料金値はUI確認用ダミー値です。本実装では `mock/` 内のハードコード料金ロジックを拡張せず、`docs/IMPLEMENTATION_PLAN.md` に従ってService Definition / Pricing Core / Price DB基盤を新規実装します。

実料金基盤、Service Definition、Pricing Core、Node.js CLI、GitHub Actions等の仕様は確定済みで、実装フェーズへ移行する段階です。

## モックの確認

GitHub Pages:

https://nobleneet.github.io/AWSPricingCalculator_forTAE/

GitHub Pagesは、本実装へ切り替えるまで `mock/` を公開します。

ローカルで確認する場合:

```bash
python3 -m http.server 8000 -d mock
```

その後 `http://localhost:8000/` を開いてください。

## UIの前提

AWS Pricing Calculator のように入力・保存・出力のたびに画面遷移するのではなく、1つのワークスペース内で構成案を作成・複製・編集・比較し続けることを基本方針としています。
