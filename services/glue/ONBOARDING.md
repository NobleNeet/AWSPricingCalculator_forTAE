# AWS Glue onboarding evidence

- Calculator URL: https://calculator.aws/#/createCalculator/Glue
- AWS Glue pricing: https://aws.amazon.com/glue/pricing/
- AWS Glue documentation: https://docs.aws.amazon.com/glue/
- Pricing source of truth: AWS Public Price List offer `AWSGlue`.
- User-supplied rendered Calculator evidence was captured on 2026-10-12 for Asia Pacific (Tokyo).
- A temporary GitHub Actions probe downloaded the official Tokyo `AWSGlue` offer on 2026-10-12. Publication date: `2026-10-06T19:23:38Z`; version: `20261006192338`; products: 24.
- The current offer contains 24 product groups. Every group is either mapped by `coverage.json` or explicitly ignored only for Free Tier/free-trial dimensions.
- Glue 6.0+ has distinct Public Price List groups for standard, Flex, interactive, and memory-optimized processing. Definitions select exact product groups; no rates are hard-coded.
- ETL/interactive/statistics/optimization/materialized-view/zero-ETL compute inputs are modeled as run count × DPU × duration. One-minute billing minimums are applied per run. Crawlers and development endpoints apply the documented ten-minute minimum.
- DataBrew job usage is modeled as run count × nodes × duration and converted to node-hours.
- Data Catalog request/storage and DataBrew free-trial allowances are not subtracted, consistent with repository Free Tier policy.
- The Tokyo `AWSGlue` offer has no distinct Data Quality SKU. AWS documents Data Quality as DPU-based Glue compute, so the Data Quality component explicitly reuses the standard ETL DPU meter and records that choice in its mapping.
- Golden evidence independently verifies SKU `3GW7GD22UECNTZC9` (`ETL Job Run Glue 6.0+`) from the probed official Price List.
- Related S3, CloudWatch, Redshift, Athena, EMR, and network charges remain separate service estimates.
- The temporary probe workflow is removed before promotion.
