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
