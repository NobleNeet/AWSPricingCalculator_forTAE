# CI / Price Update の検証範囲と並列実行

## 通常 CI

`Application and Definition CI` は単体テスト、Golden、公開データの checksum / schema / index / identity / Catalog、E2E、静的サイトビルドを実行する。

`tools/ci-validation-scope.js` が push の before SHA または PR の merge base から変更ファイルを取得し、次の範囲を判定する。

- **application**: `src/app/`、`tests/`、`docs/`、`mock/` と明示的に列挙した表示・文書ファイルだけの変更で、公開 Price DB の Definition fingerprint が一致する。公開済み semantic baseline を再利用し、全組み合わせ検証を省略する。Golden と公開データ整合性の検証は残す。
- **published**: fingerprint は一致するが、上記以外の変更、比較履歴なし、未知のファイル、または手動実行。公開データの全組み合わせ検証を別 workflow で実行する。
- **candidate**: fingerprint が不一致。Definition validation を行い、価格候補の取得・scoped semantic / Golden / drift 検証は Scheduled Price Update に委譲する。active manifest は変更しない。従来の候補検証・Pages defer 方針を保持する。

fingerprint は既存の共通 Pricing Core / semantic contract とサービス Definition / Mapping / normalization を含む。判定のために fingerprint の範囲を変更しない。

`node tools/ci-validate.js --plan` は軽い検証を実行して Actions output に `scope` / `heavy` / `directory` を出力する。`--plan` なしは必要な semantic 検証もローカルで実行する。比較履歴のないローカル実行は安全側で全件を選ぶ。

## 共通の semantic workflow

`.github/workflows/price-validation.yml` は公開を伴わない再利用可能 workflow で、通常 CI と Scheduled Price Update から呼ぶ。

1. 同一 checkout / 同一候補データを対象に case 数を数え、25,000 case を目安に分割する。
2. 最大8ジョブで検証する。runner 内は1 workerとし、過剰な CPU / メモリー競合を避ける。
3. 全ジョブの report を統合する。予定 source task、連続した case range、case 数、source / region / batch の同一性、構造・default・coverage チェックの割り当てを確認する。欠落・重複・余分な結果・検証エラーは失敗とする。

価格更新時の incremental / onboarding scope、および publication-only 修復時の zero-batch baseline reuse は既存の `update-scope.js` を使い、そのまま保持する。workflow 間の artifact は prefix で区別する。

## データ取得と正規化

Scheduled Price Update の prepare を次の段階に分ける。

```text
check: AWS source URL / version と Definition refresh 範囲を固定
  → download-source: 変更のある source / region のみ最大8ジョブで取得・正規化
  → prepare: 結果の完全性を確認し、未変更データと組み合わせる
  → semantic / Golden / drift
  → finalize / publish / Pages
```

各取得ジョブは固定 URL を使用し、offerCode / version を検証する。AWS metadata の再取得によってジョブ間で版が混ざることを防ぐ。正規化結果・chunk と Golden の raw evidence だけを artifact にし、巨大な raw bulk 全体は転送・commitしない。

Golden evidence は該当 source / region の全サービスの verification 条件に合致する raw SKU / On-Demand terms を保持する。既存の tolerant evidence refresh と Golden validation が曖昧さや不一致を検出し、古い価格で代替して成功させない。

統合時に source plan と metadata、全 source 結果の存在、ファイル一覧・SHA-256 を照合する。未変更 source のコピー、Definition / inventory / Golden evidence preparation は統合後に行う。refresh source 範囲と semantic validation 範囲を別々に保持し、取得ジョブを分けたことを理由に全サービス検証へ拡大しない。

ローカルの `node tools/price-update-matrix.js prepare` は従来どおり一連の処理を実行できる。workflow は `check`、`tools/price-source-batches.js`、`assemble` を使う。

## 検証

- `tests/pricing/ci-scope.test.js`: 表示変更、fingerprint不一致、共通処理・未知ファイル・比較履歴なしの安全な判定。
- `tests/pricing/parallel-ci.test.js`: range / report 欠落・不一致、実 planner / worker / CLI / merge、取得版固定、raw Golden evidence、artifact欠落・checksum破損。
- 既存 `source` / `semantic-chunking` / `update-scope` / `scoped-refresh` テスト: bounded concurrency と既存 scope 最適化を保持。

参考計測: 変更前の run `38117145227` は validate に67分53秒（965,263 case、2 worker）を要した。高速化後の所要時間は変更範囲、runner待ち、artifact転送によって変わるため、実際の Actions で確認する。
