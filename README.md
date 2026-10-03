# AWSPricingCalculator_forTAE

AWS Public Price List JSON をデータソースにした、構成比較型の料金検討ツール（設計中）。

## 仕様書

現在までに確定している画面・操作・保存/復元・料金計算前提は [`docs/SPEC.md`](docs/SPEC.md) にまとめています。

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

## モックの確認

GitHub Pages:

https://nobleneet.github.io/AWSPricingCalculator_forTAE/

依存ライブラリはありません。リポジトリを取得後、`index.html` をブラウザで直接開けます。

またはローカルWebサーバーを使う場合:

```bash
python3 -m http.server 8000
```

その後 `http://localhost:8000/` を開いてください。

## UIの前提

AWS Pricing Calculator のように入力・保存・出力のたびに画面遷移するのではなく、1つのワークスペース内で構成案を作成・複製・編集・比較し続けることを基本方針としています。
