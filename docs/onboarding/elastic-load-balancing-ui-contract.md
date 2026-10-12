# Elastic Load Balancing onboarding — independent UI contract (in progress)

- Official Calculator: https://calculator.aws/#/createCalculator/ElasticLoadBalancing
- Reference: user-supplied Japanese full-page screenshot, 2026-10-12.
- Region shown: Asia Pacific (Tokyo).
- Pricing documentation: https://aws.amazon.com/elasticloadbalancing/pricing/
- Status: **UI contract drafted; Definition, Pricing Mapping, tests, publication NOT complete.**

## Visible screen contract

The screenshot has four load-balancer families, each exposed as a separate toggle. The initial screenshot shows all four enabled simultaneously, with each section containing its own service quantity and usage inputs. **Do not conflate the four types into a single mutually exclusive profile unless independently verified.** The upper region selector is project-level common UI, not a second service-specific region selector.

1. **Application Load Balancer**: mutually exclusive AWS Lambda and EC2 target configurations within the ALB section; ALB count defaults to 1; a group of LCU estimation inputs for traffic/connection duration, processing, and request/rule evaluation, each with the displayed time/unit selector.
2. **Network Load Balancer**: NLB count defaults to 1; separate TCP, UDP, and TLS traffic groups. Each group has traffic bytes, new connections/flows, and average connection/flow duration. Keep each displayed numeric input unique rather than surfacing it again for every internal billing component.
3. **Gateway Load Balancer**: number of gateways per Availability Zone defaults to 1; GLCU estimation from new flows, average flow lifetime and processed traffic; Gateway Load Balancer Endpoint count defaults to 1, with separately estimated data processed by the endpoints.
4. **Classic Load Balancer**: CLB count defaults to 1; processed-data quantity is separately specified.

All sections have a billing-detail/result display which is **not** a separate user input. Default count 1 and blank traffic fields must remain distinguishable. Every visible numeric input requires the adjacent unit/period selector when shown in the screenshot.

## Pricing contract

AWS officially bills ALB by load-balancer hour and consumed LCU; NLB by hour and NLCU; GWLB by hour and GLCU, with endpoints separately billed; Classic LB by load-balancer hour and data GB. See official pricing URL above.

The capacity dimension is computed from the **maximum** of the applicable traffic dimensions, not by summing the dimensions. ALB, NLB, and GWLB require independent throughput/connection normalizers and calculator-to-price dimensional mapping. Reservation options fall outside the project's On-Demand-only scope. Do not hardcode displayed screenshot totals or sample region prices.

## Validation still required before implementing

- Verify switch semantics, Lambda/EC2 conditional fields, hidden fields, all unit dropdown choices and default states in rendered Calculator.
- Fetch actual AWS Public Price List products for Tokyo and other supported regions; identify product attributes, rate dimensions, and price-source overrides for endpoint billing.
- Create `services/elastic-load-balancing/` service/profile/component/mapping/coverage/golden fixtures from **real** product evidence.
- Add Japanese drawer labels, user-facing selector behavior, exact-once field visibility test, no-duplication checks and golden cases.
- Run targeted tests and repository CI; create PR marked `onboarding-ready` only after all relevant checks pass. Await serialized promotion, Price DB publish and Pages deploy before declaring complete.

This document is **not evidence of finished onboarding**. Do not queue for promotion on its own.


## Development log — 2026-10-12 continuation

A generic `maximum` usage expression is now implemented in `src/pricing/calculation.js`, with regression coverage in `tests/pricing/elb-capacity-maximum.test.js`. Its expression form is:

```json
{"value":{"type":"maximum","sources":[{"valueFrom":"component.newConnections"},{"valueFrom":"component.activeConnections"},{"valueFrom":"component.processedBytes"}]}}
```

Each source must first be normalized to the same capacity-unit scale (LCU, NLCU, or GLCU). The value returned is the greatest nonnegative normalized dimension, with decimal-safe comparison. Empty expression lists and missing inputs fail closed. This utility does not itself establish that ELB billing formulas are correctly implemented.

Official pricing semantics confirmed from https://aws.amazon.com/jp/elasticloadbalancing/pricing/ :

- ALB: load-balancer hours and capacity-unit hours; observed consumption depends on the largest applicable capacity metric. Target type affects bytes allowance.
- NLB: load-balancer hours and NLCU, with traffic-protocol-specific metrics.
- GWLB: load-balancer hours and GLCU, plus separately billed Gateway Load Balancer endpoints / processed data. Endpoint price provenance must be independently verified.
- CLB: load-balancer hours and processed GB.
- AWS data transfer is **additional** to ELB metered charges; never count it as included.
- LCU reservation pricing is outside the application's On-Demand-only policy.

**Execution constraint:** The GitHub connector supports branch edits, but this environment currently cannot clone the repository from github.com; therefore no repository test execution or AWS raw-offer inspection has yet occurred. Both are required before READY/promotion. The branch MUST remain unqueued until verification completes.
