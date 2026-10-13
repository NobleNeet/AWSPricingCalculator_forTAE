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
