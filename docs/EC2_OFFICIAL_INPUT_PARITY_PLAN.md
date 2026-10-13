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