# Redshift pricing research / implementation gates
Date: 2026-10-12. This is research, NOT a verified Price List mapping.
Official AWS sources:
- https://aws.amazon.com/redshift/pricing/
- https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing.html
- https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing-on-demand.html

## Established billing behavior
- Provisioned Redshift: On-Demand node-hours; node selection and node count matter.
- Serverless: compute in RPU-hours with per-second charges and 60-second minimum; Spectrum is included and must not be a separately charged input.
- Redshift Managed Storage (RMS) is charged separately on compatible managed-storage node families such as RA3/RG and on Serverless. DC/DS storage is node-local and not separately RMS-billed.
- Backup snapshot charges depend on node family, retained data, and allowances; do not equate snapshot usage with RMS.
- The screenshot labels transfer as IN. Do not substitute an outward transfer charge or assume a paid SKU exists.
- Region and operating mode are mutually exclusive selectors; no cross-mode charges or duplicated UI inputs.

## Unverified: blocking gates for implementation and publication
- Inspect AWS Public Price List actual Tokyo offer: https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRedshift/current/ap-northeast-1/index.json
- Confirm real product attributes, usage types, units, OnDemand price dimensions, one-to-one matcher cardinality for node compute, RPU-hours, RMS, backup, Spectrum, and transfer direction. Check separate AWSDataTransfer source if required.
- Verify dc2.8xlarge and Serverless RPU options against currently offered Tokyo products and official interactive dropdown options.
- Confirm applicable storage node families and backup allowance logic.
- Verify other supported regions against same meaning contract; never substitute another region's price.
- Convert the screenshot's daily runtime to monthly RPU-hours using an explicitly documented calendar convention. Do not claim session-level 60-second minimum accuracy when only aggregated daily hours are known.
- UI acceptance tests must compare actually visible fields with independent services/redshift/ui-contract.json, including section order, labels, count, default and conditional visibility.
- Tests first: service-specific unit + E2E, repository validation, then queued promotion, DB publication, Pages.
- Keep expensive semantic validation scoped to Redshift and its actual price sources. Never blanket-update EC2 absent a proven global semantic change.
- Do not tag onboarding-ready or merge until mappings, golden scenarios and deployment gates are passed.

## Status
Price List download was not available from this execution environment. Neither a SKU nor a paid rate has been verified. No Service Definition, Pricing Mapping, or deployable Redshift implementation should be represented as complete.
