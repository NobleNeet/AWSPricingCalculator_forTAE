# Estimate input validation

Scope: improve the inputs identified by the public GUI price audit. AWS Public Price List remains the pricing truth; no rate, tier, allowance, or intermediate rounding behavior changes.

## Input contracts

- EC2, RDS and provisioned Aurora instance counts: positive integers. A zero resource row is removed from its Plan rather than quoted as a valid instance configuration.
- RDS and provisioned Aurora per-instance hours: greater than zero and at most 730. Fractional hours remain valid. Multiple instances are represented by quantity, not by more than 730 hours per instance.
- EBS and enabled RDS storage: positive aggregate GB-month. The physical-volume capacity minimum is not imposed on aggregate usage: short use can validly total less than the minimum provisioned capacity. RDS storage can be explicitly disabled.
- CodeBuild: positive integer builds and positive average billed minutes. Fractional billed averages remain valid.
- Fargate: positive average task duration. Existing minimum billing-duration transforms remain unchanged.
- Lambda: average billed duration at least 1 ms; no execution is represented by zero requests. Existing 900000 ms upper bound remains.
- Limitless: default compute usage becomes 16 ACU × 730 hours = 11680 ACU-hours. Aggregate short-use quantities remain valid; no 11680 ACU-hours minimum is imposed. Enabled Database Insights capacity is at least 16 ACU, with positive hours at most 730.

Authoritative evidence for the Limitless minimum capacity: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/limitless-cluster.html

The AWS physical RDS storage range is described in https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html . That capacity is not equivalent to this app's aggregate GB-month input.

## Generic validation

Definitions retain inclusive `minimum`/`maximum` and gain optional `exclusiveMinimum` and `integer`. Both Pricing Core and browser field feedback use the same decimal-safe validator. Invalid values are preserved for correction, produce `INVALID_INPUT`, suppress the service estimate, and never silently clamp or substitute quantities. Disabled inputs/components retain their values and do not validate or contribute to pricing. JSON restore passes through the same Pricing Core validation.

The browser shows the violated bound near the field and exposes `aria-invalid`; integer inputs expose `step=1`. HTML `min` cannot represent an exclusive bound, so it is not used as a substitute for core validation.

## Verification and publication scope

Affected tests were inventoried by service/control/component and default references. The storage-disabled RDS Golden still tests disabled storage, but uses one valid compute hour. EC2's separate Dedicated fee test continues to test its independent regional fee while verifying the whole estimate is invalid for zero compute instances.

Narrow tests: input validator, Pricing Core, schemas, all service Golden fixtures, Aurora Mapping, CodeBuild, Fargate, EC2 Dedicated fee, and browser invalid/recovery behavior. Then repository-wide test, Definition validation, E2E and site build.

This change necessarily alters the shared input-validation contract (core plus new helper and schemas). Semantic candidate generation now applies the same input constraints. The helper is included in the global pricing-contract fingerprint. A global semantic revalidation is therefore expected, rather than hidden through a publication-only fingerprint or incorrectly scoped as a single service change. Mapping and rate semantics are unchanged. Observe the actual Actions plan before accepting publication success.

Public GUI audit results distinguish invalid-input rejection checks from price comparisons. Rejecting a formerly accepted invalid value does not make its historical price comparison PASS. Valid parent configurations and valid boundary inputs are separately compared.
