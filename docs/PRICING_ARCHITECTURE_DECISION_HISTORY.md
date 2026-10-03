# Pricing Architecture Decision History

最終更新: 2026-10-04

本書はPricing Architecture設計検討の履歴索引であり、現行仕様の正本ではない。

現行仕様:

- ユーザー向け仕様: `docs/SPEC.md`
- 料金・内部アーキテクチャ仕様: `docs/PRICING_ARCHITECTURE.md`

過去の個別 `PRICING_ARCHITECTURE_DECISIONS_*` 文書は、検討途中の旧案・後続Decisionで上書きされた記述・「次に決定する事項」を含むため、現行treeから除去した。必要な場合はGit履歴から参照する。

## Decision領域一覧

- Decisions 1–8: GitHub Pages / AWS Public Price List / browser persistence / export等の基本構成
- Decisions 9–14: Service onboarding原則、Project restore、Region、usage、Decimal精度
- Decisions 15–16: Price DB build consistency、cache、runtime failure states
- Decision 17: Service Catalog
- Decisions 18–20: Comparison Row、Plan、Project JSON
- Decisions 21–25: migration、Tier非計算、billing semantics、Free Tier非計算、Pricing Limitation
- Decisions 26–27: SKU / Price Dimension用語、singleSku resolution
- Decision 28: Service / Profile / Component decomposition
- Decisions 29–31: Service onboarding automation、Golden Case、Price List drift classification
- Decisions 32–33: Price DB publication manifest、normalized products.json
- Decisions 34–38: index.json、Price Query DSL、Calculation DSL、enabledWhen、validation layering
- Decisions 39–40: Definition package、coverage category identity
- Decision 41: usageTypeClass / category normalizer
- Decision 42: GitHub Actions Price Update Workflow
- Decision 43: common CLI / validator interface
- Decision 44: Node.js / Browser shared Pricing Core
- Decisions 45–48: Browser Price DB loader、DefinitionStore、runtime UI contract、design freeze

## 主な後続変更

設計検討中に特に大きく上書きされた事項:

- `tiered` Pricing Modelは廃止し、Tierは計算せず最初の通常有料単価を使用する。
- `multipleSkus`を正常系として扱う方針は廃止し、初期版は`singleSku`のみとする。
- Price Queryは単一`filters`ではなく`productFilters` / `dimensionFilters`へ分離する。
- Free Tier / free allowanceは計算へ反映しない。
- 異種paid Price Dimensionsの自動合算は禁止する。
- Calculation DSLは任意derive演算ではなく`unit` + bounded transformsへ限定する。
- Price DBは`builds/<buildId>/` immutable build + top-level active manifest方式とする。
- Python builder案は廃止し、Node.js CLI + Browser共有Pricing Coreとする。

これらはすべて `docs/PRICING_ARCHITECTURE.md` の記述を正式仕様とする。
