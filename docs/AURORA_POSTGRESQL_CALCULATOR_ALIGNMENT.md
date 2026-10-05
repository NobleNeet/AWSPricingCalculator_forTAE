# Aurora PostgreSQL Calculator alignment

Reference: https://calculator.aws/#/createCalculator/AuroraPostgreSQL

Checked against the rendered AWS Pricing Calculator screen on 2026-10-05.

## Covered modes and fields

- Aurora PostgreSQL provisioned: Aurora Standard and Aurora I/O-Optimized.
- Aurora Serverless PostgreSQL: Aurora Standard and Aurora I/O-Optimized.
- Amazon Aurora PostgreSQL Limitless Database: Aurora I/O-Optimized.
- Additional backup storage: optional billed GB-month component.
- Snapshot Export: optional processed-GB component; exported object storage in Amazon S3 remains a separate S3 charge.
- Aurora Limitless Database - Database Insights: optional Advanced-mode CloudWatch Database Insights charge, calculated from monitored ACUs x hours using AmazonCloudWatch Public Price List data.

Database Insights Standard mode remains zero additional Database Insights charge for the default rolling 7-day history. Enhanced Monitoring and CloudWatch Logs charges that are automatically associated with Aurora Limitless are separate CloudWatch meters and are not included in the Database Insights component.

## Cross-price-source rule

A Service Definition normally uses `service.priceSource.serviceCode`. When a component is billed by another AWS price-list service, `service.priceSource.componentOverrides` maps the component id to that service code. Runtime and semantic validation load the matching region from each declared service code. This is used by Aurora Limitless Database Insights, which is billed by `AmazonCloudWatch` rather than `AmazonRDS`.
