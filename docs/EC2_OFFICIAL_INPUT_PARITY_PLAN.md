# EC2 official input parity — temporary implementation plan

Status: IN PROGRESS. Delete after validated deployment.
Reference: https://calculator.aws/#/createCalculator/ec2-enhancement and user screenshot (2026-10-12).

## Constraints
- On-Demand only; omit payment-plan chooser.
- Per docs/SPEC.md section 6.1, omit workload chooser and directly expose monthly hours (0..730).
- Preserve instance quantity, instance selection/filter table, OS, tenancy, regional dedicated fee.
- Do not show duplicate fields from internal calculation components.

## Required functional changes
- EBS: group volume type, storage, applicable IOPS/throughput into one section with volume-dependent visibility and prices. Review volume count, snapshots, and official option labels.
- Detailed monitoring: boolean control, validated regional price meter and computation, zero when disabled.
- Data transfer: separate inbound, inter-region, outbound transfer rows; direction/region, quantity and unit, conditional price. Explicitly handle zero-priced traffic.
- Additional costs: user-defined monthly USD amount included in totals, exports and restore; label as user-supplied and do not fabricate AWS SKU.

## Gates
1. Independently inventory all visible and conditional fields against official screen.
2. Inspect exact AWS Public Price List candidate products and dimensions and mappings.
3. Update definitions, pricing core where necessary, drawer grouping, persistence and migrations.
4. Service-focused unit, Golden and E2E; verify no duplicated inputs and unaffected EC2 behavior.
5. PR and onboarding-ready queue only after tests; then main, pricing publication, Pages verification.

Not complete until all gates pass. Delete this temporary plan at completion.
## Findings and implementation progress (2026-10-13)

- Implemented in WIP branch: EBS input grouping, moving EBS type selector into section, conditional performance-control visibility, hiding internal io2 tier2/tier3 fieldsets while preserving pricing components, regression E2E.
- Implemented: separate user-entered monthly cost, validation with decimal-safe math, total accumulation, project JSON persistence and E2E/unit tests. This is not sourced from AWS Price List.
- Still not implemented: CloudWatch detailed monitoring billing, transfer meters and direction/region combinations; neither should be represented as a guessed flat-price input.
- AWS official CloudWatch billing documentation identifies Detailed Monitoring by UsageType `MetricMonitorUsage` and Operation `MetricStorage:AWS/EC2`; charged by reported metric count and prorated usage (https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_billing.html). Existing AmazonCloudWatch generated DB only contains Database Insights SKUs, not metrics storage SKU, so source data expansion is needed.
- AWS official transfer billing identifies `<Region>-DataTransfer-Regional-Bytes`, `<Region>-DataTransfer-Out-Bytes`, and source-region `<Source>-<Destination>-AWS-Out-Bytes` (https://docs.aws.amazon.com/cur/latest/userguide/cur-data-transfers-charges.html). Internet inbound is free; outbound includes tiers and account-wide aggregated allowances (https://aws.amazon.com/ec2/pricing/on-demand/). Existing EC2 curated price DB lacks these meters.
- The project currently excludes general Free Tier deductions and aggregate shared transfer thresholds; do not silently claim parity for AWS Calculator cases that depend on global aggregate allowances. Resolve applicable estimate convention in code/tests.
- PR must remain draft and must not receive `onboarding-ready` until all four major sections work and validation finishes.

## 2026-10-13 follow-up: provisional monitoring / transfer definitions

- Current branch includes a default-disabled `detailed-monitoring` component with CloudWatch source override and AWS-reported `MetricMonitorUsage` / `MetricStorage:AWS/EC2` discriminators, plus explicit metrics-per-instance input (default 7). This default must be validated against the exact official Calculator calculation and live regional pricing product; it is not evidence of price parity.
- Current branch includes default-disabled `transfer-internet-out` (tiered) and `transfer-regional` components and a zero-rated inbound usage field. Unchecked items are not priced. Selected items must not silently report zero where no matching SKU exists. Verify the exact regional AmazonEC2 Data Transfer product families, usage types, tier ranges and exclusions before ready promotion.
- Not yet covered: arbitrary inter-region origin/destination combinations, the official Calculator's additional transfer rows, accounting-wide free transfer allowance, any destination-specific pricing discrepancies. These are completion blockers.
- Current registered `transfer-internet-out` mapping requires one billable dimension, which likely conflicts with tiered internet egress pricing. Determine actual dimension cardinality per region; update mapping strategy and tests before marking this component complete.
- Do not merge PR #87, publish any Price DB build, or mark onboarding-ready until the above has been addressed and branch CI passes.

## Price DB evidence, 2026-10-13

The currently active published build is `20261012T151525Z-1b3319db` (`pricing/generated/manifest.json`). The actual Tokyo index of `AmazonCloudWatch` contains just `CW-DatabaseInsights` (`APN1-CW:DatabaseInsights-ACU-Hours`, `APN1-CW:DatabaseInsights-vCPU-Hours`); it does not contain `MetricMonitorUsage`. The actual Tokyo `AmazonEC2` index contains no `DataTransfer` and no `AWS-Out-Bytes` usage types. Consequently, newly defined EC2 CloudWatch detailed monitoring and transfer components cannot be priced from that published build. The UI must show invalid/unavailable rather than guessed zero whenever they are enabled. Green app CI is **not** proof of pricing parity.

**Blocker:** Extend targeted AWS offer retrieval/curation to include CloudWatch metrics and the relevant EC2 Data Transfer meter families, validate actual regional product families, operations, billing units, rates, and tier ranges, and republish a validated Price DB build before promotion. Do not launch a full EC2 semantic regeneration merely to discover the new meter categories: scope this work to relevant new SKU families and preserve the existing large EC2 compute collection.

## Targeted published-meter audit

Run `node tools/audit-ec2-pricing-meters.js` to check Tokyo; optionally pass a build ID and comma-separated region IDs: `node tools/audit-ec2-pricing-meters.js <build-id> ap-northeast-1,us-east-1`. Nonzero exit status identifies a missing indexed category. This audit is a **necessary, not sufficient** condition for price parity; it tests presence of UsageType families, not uniqueness, billable dimension tier correctness, official calculator correspondence, or coverage of each interregional route. Run it after targeted price-source validation and publication. It performs no network requests and does not trigger a whole-EC2 update.
