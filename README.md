# AWSPricingCalculator_forTAE

AWS Public Price List JSON をデータソースにした、構成比較型の料金検討ツール（設計中）。

## 現在の内容

`index.html` / `styles.css` / `app.js` はUI議論用の静的モックです。

- 複数の構成案を横並び比較
- EC2 / RDS / S3 / EBS を同一画面で表示
- 構成案の複製
- サービスセルから右側Drawerで編集
- EC2/RDSのタイプ・数量変更で料金を即時再計算
- S3/EBS容量変更で料金を即時再計算
- 構成案ごとの合計額と基準案との差額を常時表示
- PDF / CSV / JSON は現時点ではUIのみ
- 表示料金はUI確認用のダミー値

## モックの確認

依存ライブラリはありません。リポジトリを取得後、`index.html` をブラウザで直接開けます。

またはローカルWebサーバーを使う場合:

```bash
python3 -m http.server 8000
```

その後 `http://localhost:8000/` を開いてください。

## UIの前提

AWS Pricing Calculator のように入力・保存・出力のたびに画面遷移するのではなく、1つのワークスペース内で構成案を複製・編集・比較し続けることを基本方針としています。
