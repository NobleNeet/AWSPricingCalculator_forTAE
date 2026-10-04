# Initial Price Data and supported meters

Data is AWS Public Price List **On-Demand USD** for the formally supported Japan and United States regions: Tokyo (`ap-northeast-1`), Osaka (`ap-northeast-3`), N. Virginia (`us-east-1`), Ohio (`us-east-2`), N. California (`us-west-1`), and Oregon (`us-west-2`). Tokyo remains the canonical coverage-reference region. Metadata is fetched before version-pinned regional files, following [AWS Bulk API documentation](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/using-the-aws-price-list-bulk-api-fetching-price-list-files-manually.html). Raw bulk input remains in ignored `.work/raw/`; `tests/fixtures/aws/` contains only small, explicitly selected real AWS Golden evidence samples, not bulk files.

Initial source publications:

| Price source | Version | Publication |
|---|---|---|
| AmazonEC2 | 20260925174521 | 2026-09-25T17:45:21Z |
| AmazonS3 | 20260928230416 | 2026-09-28T23:04:16Z |
| AWSLambda | 20261001184746 | 2026-10-01T18:47:46Z |
| AmazonRDS | 20261001060230 | 2026-10-01T06:02:30Z |

| Application Service | Supported meters | Full source mapped / ignored / unresolved categories |
|---|---|---|
| EC2 | Shared Used Linux/Windows, NA preinstalled software, No License required; instance hours × quantity | 2 / 336 / 0 |
| EBS | gp2/gp3 GB-month; gp3 paid extra IOPS and throughput | 4 / 334 / 0 |
| S3 | Standard GB-month; PUT/COPY/POST/LIST and GET/other requests | 3 / 176 / 0 |
| Lambda | Requests; x86/ARM total billed seconds × memory GB | 3 / 525 / 0 |
| RDS | PostgreSQL Single-AZ/Multi-AZ instance hours × quantity, optional gp3 storage | 4 / 1303 / 0 |

Coverage lists exact observed category identities. Ignored categories have explicit reasons; a new unmapped category blocks validation rather than being silently ignored. Category inventories are temporary CI artifacts. Supported selector variation is exhaustively resolved by validation. Published products/indexes are generated from those successfully resolved mapped branches; unsupported categories are intentionally omitted from Browser downloads after full candidate coverage verification.

EBS extra performance inputs are already paid usage above the included gp3 baseline. This is part of the provisioned meter, not an account Free Tier subtraction. [AWS EBS documentation](https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html) specifies the included 3,000 IOPS and 125 MiB/s. AWS's Tokyo gp3 raw throughput meter uses `GiBps-mo`; the DSL converts MiBps-month with the exact factor `1/1024`.

Lambda accepts **total billed** seconds, not mean runtime; the monthly aggregate cannot reconstruct invocation-level rounding. [AWS Lambda metrics documentation](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics-types.html) describes per-invocation billed rounding. That limitation is declared and visible. RDS extra storage performance, CPU credits, backups and Extended Support are not computed and carry underestimate warnings. [AWS RDS storage documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html) explains performance conditions beyond the storage capacity meter.

S3 and Lambda tiers use the first ordinary paid rate for the entire usage and display `tier-pricing`. No account Free Tier, discounts, tax, Reserved Instances, Savings Plans or Spot is applied. The central limitation registry supplies all user/export notices and underestimate warnings.
