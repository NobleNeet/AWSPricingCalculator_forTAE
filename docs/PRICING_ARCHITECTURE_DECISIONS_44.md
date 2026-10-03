# Pricing Architecture Specification — Decision 44

最終更新: 2026-10-04

本書は既存の Pricing Architecture Specification 群の続編として、Decision Bundle 44で確定したCLI実装言語、Browser / Node間のPricing Core共有範囲、モジュール境界を定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Decision 44 — CLI実装言語とBrowser側Pricing Engineとの共有範囲

### 1.1 CLI実装言語

共通Pricing CLIはNode.jsで実装する。

目的は、Browser runtimeとCI / CLIでDefinition semantics、Price Query semantics、Dimension resolution、Calculation semanticsの実装差を作らないことである。

初期版ではPython等へ料金ロジックを二重実装しない。

### 1.2 Shared Pricing Core

BrowserとNode CLIから共通利用するPricing Coreを独立モジュールとして実装する。

主な共有対象:

- filter evaluator
- `enabledWhen` / condition evaluator
- selector dependency evaluation
- Price Query
- Price Dimension resolution
- Tier / Free Tier policy
- Calculation DSL
- Decimal handling
- runtime issue format
- Definitionのruntime解釈

概念構成:

```text
Browser Application Layer
        |
        v
Shared Pricing Core
        ^
        |
Node CLI / Validator Layer
```

### 1.3 Shared Coreの純粋性

Shared Pricing Coreは可能な限りpure functionとして実装し、以下へ直接依存しない。

- DOM
- `window`
- `document`
- `localStorage`
- network / `fetch`
- filesystem
- Git / GitHub Actions

入力済みのDefinition、Price Data、Project/runtime contextを受け取り、結果objectを返す構造とする。

### 1.4 Browser専用責務

以下はBrowser Application Layerの責務とする。

- `manifest.json` / Price DBのfetch
- Service Definitionのfetch
- Project state管理
- `localStorage`
- UI state
- DOM rendering
- PDF / CSV / Project JSON UI連携

Pricing Coreはこれらを直接操作しない。

### 1.5 Node CLI専用責務

以下はNode CLI側の責務とする。

- AWS Public Price List metadata確認
- source download
- raw Price List normalization
- category inventory生成
- filesystem I/O
- CLI argument parsing
- JSON Schema validation orchestration
- change classification
- Price DB build生成
- CI report生成

### 1.6 Golden verifierの独立性

Golden expected値を生成・検証する独立verifierは、Production Pricing CoreのPrice Query / Calculation実装をそのまま再利用しない。

目的は、Production側の実装バグと同じバグがGolden verifierにも入り、誤ってPASSすることを防ぐことである。

Golden verifierは、raw / normalized Price Dataを対象にした明示的semantic lookupと単純なexpected calculationを独立経路で行う。

### 1.7 推奨モジュール構造

概念構造:

```text
src/
  pricing/
    filter.js
    conditions.js
    price-query.js
    dimensions.js
    calculation.js
    decimal.js
    definition-loader.js

tools/
  pricing-cli/
    cli.js
    commands/
      check-source.js
      download.js
      normalize.js
      inventory.js
      validate-definitions.js
      validate-price-data.js
      run-golden.js
      classify-change.js
      build.js
```

具体的なファイル分割は実装時に調整可能だが、Browser / Node共有Coreと環境依存処理を分離する原則を維持する。

### 1.8 app.jsへの直接増築を避ける

Pricing Architectureの実装を既存`app.js`へ一体化しない。

少なくとも以下を論理的に分離する。

- UI state / rendering
- Price DB loading
- Definition loading
- Pricing Core

### 1.9 ES Modules

新規Pricing基盤はES Modulesを標準とする。

```js
import ...
export ...
```

BrowserとNode.jsで同じmodule形式を利用する。

### 1.10 package.json

Pricing基盤実装時に`package.json`を導入する。

初期用途:

- Node CLI entry point
- JSON Schema validator依存
- Decimal library依存
- test runner
- common scripts

`type: module`を基本とする。

### 1.11 Bundler

初期版ではVite / Webpack等のbundlerを必須にしない。

GitHub Pages上ではnative browser ES Modulesを利用可能な構造を優先する。

bundlerが必要になった場合は後から導入する。

### 1.12 Decimal

金額、usage、transform、unit price等の内部計算はJavaScript `Number`へ依存しない。

BrowserとNode CLIで同じDecimal実装を利用する。

具体的ライブラリは実装時に選定可能だが、Browser / Nodeで計算実装を分けない。

### 1.13 TypeScript

初期版ではTypeScriptを必須にしない。

現行plain JavaScript構成からの移行コストを抑えるため、JavaScript + JSON Schemaを基本とする。

Shared CoreにはJSDoc型注釈を推奨する。

将来Pricing Coreが大型化した場合のTypeScript移行は妨げない。

### 1.14 NormalizerはNode専用でよい

raw AWS Price List normalization、category inventory生成、source download等はBrowserと共有する必要はない。

これらはNode CLI専用実装とする。

### 1.15 実装原則まとめ

- CLIはNode.js。
- Browser / NodeでPricing Coreを共有する。
- Shared Coreは環境依存I/Oから分離する。
- Browser専用処理とNode専用処理をCore外へ置く。
- ES Modulesを利用する。
- `package.json`を導入する。
- 初期版ではbundlerを必須にしない。
- Golden verifierはProduction Coreから独立させる。
- Decimal実装をBrowser / Nodeで共通化する。
- 初期版ではTypeScriptを必須にしない。
- raw normalization等はNode専用でよい。
