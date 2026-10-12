# Amazon Athena onboarding evidence (in progress)

- Official calculator: https://calculator.aws/#/createCalculator/Athena
- Screenshot: user-provided rendered Japanese screen, 2026-10-12; Region: Asia Pacific (Tokyo).
- Official pricing: https://aws.amazon.com/athena/pricing/
- Official FAQs: https://aws.amazon.com/athena/faqs/
- Pricing offer to inspect: `AmazonAthena`, AWS Public Price List; use real product and dimension attributes, not guessed matches.

## Calculator input inventory
- SQL query pay-per-query: クエリの合計数 (count; period 1日/1週間/1か月), クエリごとにスキャンされるデータ量 (GB shown; other unit choices unverified).
- SQL query capacity-based: DPU の数 (4 minimum, multiples of 4 per screen), キャパシティがアクティブである期間 (時間/月 shown; other units unverified).
- Spark: スパークセッションの合計数 (count; period 1日/1週間/1か月), セッションあたりのコード実行 (DPU 時間).
- Region uses shared project-level region.

## Billing semantics requiring verification
- Query scanned bytes: per-query 10 MB minimum and 1 MB rounding; account-specific discounts and Free Tier excluded.
- Capacity Reservations: billed in DPU-hours; minimum 4 DPU.
- Spark: DPU-hour usage; per-second billing rounded up to nearest minute (see Athena FAQs); do not invent per-session duration breakdown if the calculator provides only aggregated DPU-hours.
- S3, Glue Catalog, federated Lambda usage are separate services and not counted here.

## Current implementation state
- The source-of-truth regional Price List product and dimension matching has not yet been verified.
- Service may not be marked available until all three meters match real Tokyo and supported regional offers, schema tests, golden cases and CI pass.
- Scope semantic validation to Athena only, preserve existing EC2 and other sources.
