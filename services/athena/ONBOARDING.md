# Amazon Athena onboarding evidence

- Calculator: https://calculator.aws/#/createCalculator/Athena
- Japanese screenshot supplied 2026-10-12, Asia Pacific (Tokyo).
- AWS pricing: https://aws.amazon.com/athena/pricing/
- AWS FAQs: https://aws.amazon.com/athena/faqs/
- AWS Public Price List offer: `AmazonAthena`.
- Price List publication date: 2026-09-11T12:44:08Z, version `20260911124408`.
- Provenance: GitHub Actions probe run 38212728198 (raw Tokyo offer); cross-region audit run 38213488806.

## Actual Tokyo SKU/dimension evidence

| Billing component | Usage class | Product family | Product identity | Unit | AWS SKU (evidence only) | Tokyo USD rate |
| --- | --- | --- | --- | --- | --- | --- |
| SQL per query | DataScannedInTB | Athena Queries | attributes.description = Charged for total data scanned per query with a minimum 10MB for each successful or cancelled queries | Terabytes | 6R553MKD6KWECHEK | 5.00/TB |
| SQL capacity reservation | ReservedCapacityInDPUHours | Athena Queries | attributes.description = Data Processing Units (DPU) in hours | DPU-Hour | KRCG7FCJWPMHSB6T | 0.43/DPU-hour |
| Spark | CodeExecutionInDPUHours | Athena Spark | operation = Spark_Execution | DPU-Hour | QTA8S2PW7FAED2GX | 0.50/DPU-hour |

The service maps stable semantic product attributes; it does **not** pin SKU IDs or rate codes.

### Regional availability

The scoped six-region audit identified that only SQL scans and SQL capacity reservation meters exist in Osaka (ap-northeast-3) and Northern California (us-west-1). Spark must be disabled in those two regions. Tokyo, Virginia, Ohio and Oregon contain all three meters. Do not fallback to another region's prices.

## UI / calculations

- SQL: クエリの合計数 with 1日/1週間/1か月 selection and クエリごとにスキャンされるデータ量 (GB).
- Capacity: DPU の数 and キャパシティがアクティブである期間 (時間/月).
- Spark: スパークセッションの合計数 with 1日/1週間/1か月 selection and セッションあたりのコード実行 (DPU 時間).
- The period selector is modeled at Profile level; conditionally enabled daily, weekly or monthly components prevent double charging. Daily consumption is converted to a 30-day month; weekly usage uses 52/12 weeks per month (as a decimal approximation in Calculation DSL).
- SQL scan charge rounds *each query* upward to the nearest MB, with a 10 MB minimum, then scales MB to 1024² MB per TB. Free DDL queries and failed queries should not be counted in SQL query estimates.
- Capacity billing multiplies DPU count by active hours. Official minimum is 4 DPU, and capacity should be selected in multiples of 4; current numeric form documents this constraint but does not enforce an increment step. 
- Spark bills entered DPU-hours per session times session count. User's DPU-hour estimate must already reflect session duration/rounding; the calculator screen does not provide a separate wall-clock time field.
- S3 request/storage, Glue Data Catalog and federated Lambda usage are separate charges, not included in this Athena definition.

## Limitations / outstanding follow-up

- The screenshot shows GB and hours/month by default; any other choices in those particular unit selectors require an interactive rendered UI check.
- The daily/weekly to monthly conversion convention must be checked against the official calculator for numerical parity; calendar month length is approximated.
- Numeric DPU input does not yet reject counts that are not a multiple of four; track this as a UI-contract issue.
- Publication and Pages availability require successful branch CI, promotion queue and Price DB validation.
