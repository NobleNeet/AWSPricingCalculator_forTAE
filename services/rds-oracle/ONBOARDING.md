# Amazon RDS for Oracle onboarding evidence

- Calculator URL: https://calculator.aws/#/createCalculator/amazonRDSOracle
- Primary rendered Calculator evidence: user-supplied Tokyo screenshot captured on 2026-10-10.
- Pricing source of truth: AWS Public Price List offer `AmazonRDS`.
- The supplied rendered Calculator section exposes: Nodes, DB instance type, Utilization (%Utilized/Month), Deployment option, Pricing model, License, and Database edition.
- Screenshot defaults are Nodes=1, instance type=`db.m3.2xlarge`, utilization=100%, deployment=Multi-AZ, pricing model=OnDemand, license=Bring your own license, database edition=Enterprise.
- Repository policy fixes purchase plan to On-Demand, so the visible Pricing model field is not duplicated as a selectable drawer input.
- AWS documentation states that RDS for Oracle supports License Included for Standard Edition 2 only, and BYOL for Enterprise Edition and Standard Edition 2. Database edition is therefore discovered from live AmazonRDS products under the selected license/deployment instead of allowing an invalid License Included + Enterprise combination.
- Instance usage is billed by DB-instance hour. The Calculator utilization percentage is represented as `utilizationPct * 730 / 100 * nodes`; 100% for one node is 730 instance-hours/month.
- gp3 database storage is included as the initial storage component because storage is a separately billed RDS resource. Additional gp3 IOPS/throughput, io2/legacy storage classes, backup/snapshot storage, data transfer, monitoring and Extended Support are not approximated; corresponding limitations are surfaced.
- The supplied screenshot does not show the lower, scrollable Calculator sections. Those sections were not treated as visually confirmed. Initial support is deliberately fail-closed rather than inventing unseen inputs.
- No SKU or rateCode is pinned. Instance and storage resolution use semantic AmazonRDS product attributes and On-Demand dimensions.
- Official licensing reference: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Oracle.Concepts.Licensing.html
- Official AWS Price List Bulk API reference: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/using-the-aws-price-list-bulk-api-fetching-price-list-files-manually.html

- Live Price List validation found RDS Custom products sharing Oracle instance attributes; standard RDS for Oracle therefore requires `deploymentModel` to be absent for instance/edition resolution.
- AWS publishes multiple Oracle gp3 storage SKUs for legacy/current Oracle edition operations, but their regional GB-month rate is identical within each configured region. To keep `singleSku` deterministic, gp3 storage uses canonical non-Custom operation `CreateDBInstance:0005`; equivalence was verified in ap-northeast-1, ap-northeast-3, us-east-1, us-east-2, us-west-1, and us-west-2 against the 2026-10 Price List candidate.

## Additional rendered Calculator evidence (2026-10-10)

The second user-supplied screenshot covers the section below instance configuration:

- **Storage**: storage type dropdown, shown as `General Purpose SSD (gp2)`; storage amount numeric, shown as `100`, unit selector shown as `GB`. The Calculator multiplies storage GB by number of DB instances; sample shows 100 GB × 0.276 USD × 1 instance = 27.60 USD per month.
- **CloudWatch Database Insights for RDS provisioned instances**: enable/disable question, shown as `Yes`, billed on vCPU-month basis. The screenshot shows 1 instance × 8 vCPU × 730 hours × 0.0125 USD per vCPU-hour = 73.00 USD.
- Above this section, purchase plan is OnDemand, license is Bring your own license and database edition is Enterprise.
- **Discrepancy**: the current service only prices gp3 database storage (20 GB-month default) and does not model the storage-type selector, gp2 storage or Database Insights. These must be included in re-onboarding after resolving AWS Public Price List product and dimension semantics.
- This screenshot does **not** show the page content below the CloudWatch Database Insights section; backup storage details were subsequently verified in the third screenshot (see below).
- Do not copy sample display rates into Definitions or Pricing Mappings. Instance count must apply to per-instance storage and Insights. Avoid charging Insights when disabled.
- Official RDS Oracle pricing: https://aws.amazon.com/rds/oracle/pricing/
- AWS RDS storage documentation: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html
- AWS Database Insights documentation: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DatabaseInsights.TurningOnAdvanced.html

## Third rendered Calculator screenshot: Additional backup storage (2026-10-10)

- The section immediately following CloudWatch Database Insights is labeled **バックアップストレージ** (Backup storage).
- The input label is **追加のバックアップストレージ** (Additional backup storage), an initially empty numeric field with placeholder `量を入力`.
- There is a **ユニット** (Unit) selector, currently `GB`. The current screenshot confirms `GB` as the selected option; it does not prove any other unit choices.
- With that field empty, the pricing breakdown reads **追加のバックアップストレージコスト (monthly): 0.00 USD**.
- This is *additional billable backup storage*, not total snapshots or total provisioned DB storage. RDS backup allowance behavior must be accounted for conceptually rather than deducting the allowance again from the already-additional input. Official AWS reference: https://docs.aws.amazon.com/aws-backup/latest/devguide/rds-backup.html
- The screenshot shows this section at the end of the visible configuration form above the fixed bottom toolbar; no further estimate input section is visible below it.
- Required Definition: add a separate optional backup-storage pricing component, with GB/month quantity defaulting to zero (no charge). Apply only a verified AmazonRDS backup GB-month price dimension. Do not invent an operation, SKU, or unit, and do not conflate RDS Custom or other engines' backup prices.
- Required tests: zero backup usage, positive backup usage, region switching, no double deduction of free allocation, integration with instance/storage/Database Insights, and validation of a unique AWS Public Price List match.
- The user requests coverage parity across all confirmed On-Demand inputs, including gp2 storage, Database Insights, and additional backup storage. This screenshot completes the known lower-form evidence; option lists not opened (storage types and units) remain unverified.

## Price DB blocker investigation (2026-10-10, current published build)

Inspected published active build `20261010T041918Z-1ac730a0`, in `pricing/generated/builds/<buildId>/indexes/` for Tokyo:

- `AmazonRDS/ap-northeast-1/index.json` includes Oracle and `General Purpose-GP3`, but `volumeType` options omit GP2; searchable `usagetype` values contain only Aurora backup, not a standard Oracle additional-backup meter.
- `AmazonCloudWatch/ap-northeast-1/index.json` includes `DatabaseInsights-ACU-Hours` but no `DatabaseInsights-vCPU-Hours`.
- `pricing/sources.json` already includes both `AmazonRDS` and `AmazonCloudWatch`. Thus changing serviceCodes alone will not supply the missing products.
- `tools/pricing-cli/build.js` publishes filtered product subsets selected by mapping validation. These published indexes are **not** the full AWS bulk Price List and their absence does not establish that AWS lacks the SKU. Need inspect the unfiltered AWS bulk candidates on the onboarding runner and persist verified per-service mappings.
- Do not add a guessed Product matcher or fixed displayed rate. Resolve source productFamily, operation, usageType, attributes, unit, cardinality, and Tokyo/Osaka/US region differences before promotion.
- The existing `storage-gp3` component now multiplies per-instance storage GB-month by `profile.nodes`; this is a separate verified billing-quantity correction, not a substitute for GP2/backup/Insights.

Pending implementation: GP2 storage selector and valid storage coverage/mapping; provisioned Oracle Database Insights with computed instance vCPU×hours×nodes; additional backup GB-month using verified RDS backup meter; tests/Golden/E2E; scoped price publication; release verification.
