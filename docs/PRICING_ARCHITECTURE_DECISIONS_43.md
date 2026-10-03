# Pricing Architecture Specification — Decision 43

最終更新: 2026-10-04

本書は既存の Pricing Architecture Specification 群の続編として、Decision Bundle 43で確定した共通CLI / Validatorインターフェースを定義する。

既存仕様と矛盾する場合は、本書で後から明示的に変更した事項を優先する。

---

## 1. Decision 43 — 共通CLI / Validatorインターフェース

### 1.1 基本方針

Definition PR CIとscheduled Price Update Workflowは、別々の検証ロジックを持たず、同一の共通CLI群を使用する。

概念的な実行入口:

```text
pricing-tool <command> [options]
```

GitHub Actions YAMLには料金判定、SKU判定、coverage判定、Golden判定等の業務ロジックを埋め込まない。

Workflowの責務は原則以下に限定する。

- 実行環境準備
- CLI実行
- artifact upload / download
- Job Summary生成
- validated buildのrepository promotion / Pages deploy

### 1.2 基本command

初期版の基本command候補:

- `check-source`
- `download`
- `normalize`
- `inventory`
- `validate-definitions`
- `validate-price-data`
- `run-golden`
- `classify-change`
- `build`

便利wrapper commandを追加してもよいが、上記基本commandを正本処理とする。

### 1.3 machine-readable output

CLIの正式出力はJSONとする。

例:

```bash
pricing-tool validate-definitions \
  --services services \
  --schemas schemas \
  --output report.json
```

標準出力は人間向けsummaryとして利用可能だが、CIや後続commandはJSON reportを参照する。

### 1.4 共通report envelope

各commandのreportは共通envelopeを持つ。

```json
{
  "schemaVersion": 1,
  "command": "validate-price-data",
  "status": "failed",
  "summary": {
    "info": 2,
    "warning": 1,
    "error": 1
  },
  "issues": []
}
```

`status`初期候補:

- `passed`
- `passed-with-warnings`
- `failed`

### 1.5 共通issue format

全validatorでmachine-readable issue形式を統一する。

```json
{
  "severity": "error",
  "code": "AMBIGUOUS_SKU",
  "serviceId": "rds",
  "profileId": "provisioned",
  "componentId": "instance",
  "path": "priceQuery.productFilters",
  "message": "Expected one SKU but matched 3.",
  "details": {}
}
```

CI判定や自動処理は`message`自由文ではなく`code`等の安定fieldを使用する。

### 1.6 exit code

初期版では以下程度に限定する。

```text
0 = success（warningのみを含む）
1 = validation error
2 = tool / environment / input failure
```

料金の正当性に関わるERRORはstrict mode有無に関係なくexit 1とする。

### 1.7 validate-definitions

入力:

- `services/`
- `schemas/`

責務:

- Decision 38 Layer 1: JSON Schema validation
- Decision 38 Layer 2: reference / dependency validation

Price Dataは参照しない。

代表出力:

```text
definition-validation.json
```

### 1.8 validate-price-data

入力:

- Service Definitions
- candidate normalized products / index
- coverage definitions
- Pricing Limitation registry

責務:

- Decision 38 Layer 3 semantic validation
- selector attribute検証
- `singleSku`検証
- Price Dimension解決検証
- unit整合
- coverage / unmapped category検証
- Limitation検証

代表出力:

```text
price-validation.json
coverage-report.json
```

### 1.9 run-golden

入力:

- Service Definitions
- normalized candidate Price Data
- raw Price Listまたは独立verification source
- Golden Cases

責務:

- Decision 38 Layer 4
- Decision 30 Structure Golden
- independent Price Verification

Pricing EngineとGolden expected verifierは同一Price Query / Calculation実装をそのまま共有しない。

代表出力:

```text
golden-report.json
```

### 1.10 inventory

入力:

- normalized products
- normalization rules

出力:

```text
category-inventory.json
normalization-report.json
```

AWS `serviceCode`単位で対象を限定可能にする。

### 1.11 normalize

入力:

- raw AWS Price List
- normalization configuration
- region

出力:

- normalized `products.json`
- derived `index.json`

candidate normalization段階では正式buildIdを確定しなくてもよい。正式buildIdや生成時刻metadataは`build`段階で付与する。

### 1.12 classify-change

入力:

- active build
- candidate data/build
- validation reports
- inventory diff

出力例:

```json
{
  "classification": "STRUCTURE_WARNING",
  "changes": []
}
```

Decision 31の`PRICE_ONLY / STRUCTURE_WARNING / STRUCTURE_BREAKING`分類ロジックはCLI側へ一本化する。

### 1.13 build

入力:

- validated candidate data
- source metadata
- Definition commit SHA等の監査情報

出力:

```text
staging/<buildId>/
build-report.json
```

`build` command自体はtop-level `manifest.json`を更新しない。

### 1.14 publishはCLI責務外

repository write、Git commit、branch操作、Pages deploy等を伴うpublishはpricing CLIへ含めない。

```text
pricing-tool
= deterministicな取得補助・正規化・生成・検証

GitHub Actions
= validated artifactのrepository promotion / deploy
```

と分離する。

### 1.15 offline実行

`check-source`と`download`以外は原則としてローカルファイルだけで実行可能にする。

これにより以下で同一ロジックを利用する。

- local development
- Definition PR CI
- scheduled price update
- ChatGPT / CodexによるService Definition追加検証

### 1.16 deterministic output

同一のraw Price List、Definition、normalizer configを与えた場合、原則同じnormalized output / validation resultを生成する。

`generatedAt`等の非決定的metadataはbuild段階に限定する。

### 1.17 explicit output path

各commandはoutput directory / output fileを明示指定可能にする。

例:

```bash
pricing-tool normalize \
  --input /tmp/aws.json \
  --output-dir /tmp/normalized
```

固定temp pathへ依存しない。

### 1.18 App ServiceとAWS serviceCodeの区別

CLI optionでも両者を混同しない。

```text
--service efs
= App Service Definition単位

--service-code AmazonEFS
= AWS Public Price List source単位
```

Normalizer / source download / inventoryは主に`serviceCode`、Golden / Definition validationは主にApp Service IDを扱う。

### 1.19 region

Regionは明示指定可能とする。

```text
--region ap-northeast-1
```

初期UIのdefault regionが東京であっても、CIや内部workflowでは可能な限りregionを明示する。

### 1.20 strict mode

必要に応じて`--strict`を持たせてよい。

通常warningとなる補助的問題をCI用途でerrorへ昇格できるが、料金正当性に関わるERRORのseverityをstrict有無で弱めてはならない。

### 1.21 wrapper command

ローカル開発用に、例えば以下のwrapper commandを追加してよい。

```text
pricing-tool validate-service efs
```

内部では基本command群を順番に呼び出す。

wrapper固有の料金判定ロジックは持たせない。
