# AWSPricingCalculator_forTAE

AWS Public Price List JSON をデータソースにした、構成比較型の料金検討ツール。

## 仕様書

現行仕様の正本は以下の2冊です。

- ユーザー向け仕様: [`docs/SPEC.md`](docs/SPEC.md)
- 料金・内部アーキテクチャ仕様: [`docs/PRICING_ARCHITECTURE.md`](docs/PRICING_ARCHITECTURE.md)

実装順序とCodex `/goal` 用のPhase別指示は [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) にまとめています。

設計検討の履歴索引は [`docs/PRICING_ARCHITECTURE_DECISION_HISTORY.md`](docs/PRICING_ARCHITECTURE_DECISION_HISTORY.md) にあります。

## 現在の内容

`index.html` / `styles.css` / `app.js` / `onboarding.js` はUI議論用の静的モックです。

- 0案状態から最初の構成案を作成
- 構成案ごとにAWSサービスを追加
- 複数の構成案を横並び比較
- 構成案の追加・複製・削除
- 同じ比較行でサービス種別を置換して比較
- サービスセルから右側Drawerでパラメータ編集
- 変更時に構成案合計と基準案との差額を即時更新
- Project Regionを共通条件として設定
- ブラウザへの自動保存
- 復元JSONの本文を貼り付けて状態復元
- PDF出力時に復元JSONも同時出力する想定
- CSV出力は今後実装
- 表示料金は現時点ではUI確認用のダミー値

実料金基盤、Service Definition、Pricing Core、Node.js CLI、GitHub Actions等の仕様は確定済みで、これから実装へ移行する段階です。

## モックの確認

GitHub Pages:

https://nobleneet.github.io/AWSPricingCalculator_forTAE/

現行モックは依存ライブラリなしで、リポジトリ取得後に `index.html` をブラウザで直接開けます。

またはローカルWebサーバーを使う場合:

```bash
python3 -m http.server 8000
```

その後 `http://localhost:8000/` を開いてください。

## UIの前提

AWS Pricing Calculator のように入力・保存・出力のたびに画面遷移するのではなく、1つのワークスペース内で構成案を作成・複製・編集・比較し続けることを基本方針としています。
