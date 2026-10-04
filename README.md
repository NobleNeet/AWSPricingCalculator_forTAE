# AWSPricingCalculator_forTAE

AWS Public Price List JSON をデータソースにした、構成比較型の料金検討ツール。

## 仕様書

現行仕様の正本は以下です。

- ユーザー向け仕様: [`docs/SPEC.md`](docs/SPEC.md)
- 料金・内部アーキテクチャ仕様: [`docs/PRICING_ARCHITECTURE.md`](docs/PRICING_ARCHITECTURE.md)
- Codex自律実装運用: [`docs/AUTONOMOUS_IMPLEMENTATION.md`](docs/AUTONOMOUS_IMPLEMENTATION.md)
- 実装計画: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)
- UAT設計: [`docs/uat/README.md`](docs/uat/README.md)
- 設計履歴索引: [`docs/PRICING_ARCHITECTURE_DECISION_HISTORY.md`](docs/PRICING_ARCHITECTURE_DECISION_HISTORY.md)

Codex向けのリポジトリ共通指示は [`AGENTS.md`](AGENTS.md) にあります。

通常の実装開始時は、Codex CLIへ総合 `/goal` を1回だけ与えます。Codexは `docs/AUTONOMOUS_IMPLEMENTATION.md` に従い、`docs/IMPLEMENTATION_PLAN.md` の Phase 1〜11 を内部sub-goalへ分解し、Phase間で人間の承認を待たず最終E2Eまで順次実行します。

実装完了後の受入確認は `docs/uat/` のJourney / UAT Caseを基準とし、実際のブラウザGUIから検証します。

## 実装

[GitHub Pages](https://nobleneet.github.io/AWSPricingCalculator_forTAE/) はルートの本実装を公開します。旧UIモックは [`mock/`](mock/) に参照用として保持しています。

TokyoのEC2・EBS・S3 Standard・Lambda・RDS for PostgreSQLに対応しています。料金はAWS Public Price ListのUSD On-Demandから計算し、RI/Savings Plans/Spot/税/無料枠控除は対象外です。Tierは最初の通常有料単価を全usageへ適用します。対応範囲・source publication・過小見積警告は [`docs/PRICE_SOURCES.md`](docs/PRICE_SOURCES.md) を参照してください。

0 Planからの作成、複製・同じRowでの追加/置換、Definition駆動Drawer、Baseline差額、未計算時の小計、Browser自動保存、JSON貼付復元、PDF + JSON同時出力、CSVを実装しています。

```text
src/pricing/       Browser/Node共通の純粋な料金Core
src/runtime/       build pinning・lazy load・memory cache
src/app/           Project・比較UI・restore・PDF/CSV
services/          Service/Profile/Component・coverage・Golden
schemas/           中央JSON Schema
pricing/           normalization・limitations・immutable Price DB
tools/             共通CLI・update・promotion・static packaging
tests/             unit/integration・AWS evidence samples・Browser E2E
mock/              保存した旧モック
```

## 開発・検証

Node.js 22以上、native ES Modules。bundlerや常設backendはありません。

```bash
npm ci
npm test
npm run validate
npx playwright install chromium
npm run test:e2e
npm run build:site
python3 -m http.server 8000
```

`http://localhost:8000/` で確認できます。Price DBのchecksum検証にはHTTPSまたはlocalhostが必要です。`npm run validate` はSchema/reference/DAG、2,491 selector解決、11件の独立AWS Golden、build/checksum/index/catalog整合を検証します。件数はDefinitionにより変わります。

## Price Update・新Service

```bash
npm run price:update
```

metadata check → changed-source download → normalize → inventory → Definition/price validation → Golden → drift classification → immutable buildを同じNode CLIで実行します。AWS metadataとDefinition fingerprintがともに同じならbulkを取得しません。Definition変更時は新しい対応meterを発見するためfull sourceを再検証します。raw/analysis/candidateは `.work/` の一時データです。

`build` はactive manifestを更新しません。別の `tools/publish-price-build.js` がvalidation proof・checksum・現在activeの一致を再確認し、current + previousを保持して最後にmanifestをatomicに更新します。`STRUCTURE_BREAKING`/ERRORは公開しません。

新Serviceは `services/<id>/` のDefinition、明示coverage、独立Golden/evidenceを追加します。新しいprice sourceはpackageから導出します。通常の料金はgeneric DSLで表現し、必要なusage suffix分類だけ `pricing/normalization/services/` に宣言します。PR CIはtemporary candidateを検証し、generated DBやactive manifestをPRから書き換えません。

Workflow:

- `ci.yml`: push/PRのunit・Definition candidate・Browser E2E・静的artifact
- `price-update.yml`: 毎日02:23 UTC/手動、直列prepare → artifact → promotion/bot commit → Pages
- `pages.yml`: main push/手動/reusable、検証済み本実装を公開

進捗・最終検証・commitは [`docs/PROGRESS.md`](docs/PROGRESS.md) と [`docs/VERIFICATION.md`](docs/VERIFICATION.md) に記録します。

## UIの前提

AWS Pricing Calculator のように入力・保存・出力のたびに画面遷移するのではなく、1つのワークスペース内で構成案を作成・複製・編集・比較し続けることを基本方針としています。
