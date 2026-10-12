# Elastic Load Balancing onboarding evidence

- Calculator: https://calculator.aws/#/createCalculator/ElasticLoadBalancing
- Screenshot: Japanese UI provided 2026-10-12 (ALB/NLB/GWLB/CLB all toggled on).
- Official AWS pricing: https://aws.amazon.com/jp/elasticloadbalancing/pricing/
- Official AWS bulk price offers: https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/index.json
- Audited by Actions run 38258596934 (Tokyo), run 38260106368 (raw fixture export), run 38261712858 (6-region cardinality).
- Raw fixtures: `tests/fixtures/aws/AWSELB.json`, `tests/fixtures/aws/AmazonVPC.json`.
- AWSELB offer 20260911124544, 2026-09-11T12:45:44Z. AmazonVPC offer 20260917190528, 2026-09-17T19:05:28Z.

## Price evidence

| Component | serviceCode | Official Tokyo metering rate (USD) |
| --- | --- | ---: |
| ALB hours | AWSELB | 0.0243 / Hrs |
| ALB LCU | AWSELB | 0.008 / LCU-Hrs |
| NLB hours | AWSELB | 0.0243 / Hrs |
| NLB NLCU (all protocols) | AWSELB | 0.006 / LCU-Hrs |
| GWLB hours | AWSELB | 0.0135 / Hrs |
| GWLB GLCU | AWSELB | 0.004 / LCU-Hrs |
| Gateway LB Endpoint hours | AmazonVPC | 0.014 / Hrs |
| Gateway LB Endpoint data | AmazonVPC | 0.0035 / GB |
| Classic LB hours | AWSELB | 0.027 / Hrs |
| Classic LB data | AWSELB | 0.008 / GB |

Prices listed here document the AWS offer probe; **runtime prices must always come from the Price DB**. All 12 mapping definitions match exactly one intended product and one billable dimension in the 6 supported regions (Tokyo, Osaka, N. Virginia, Ohio, N. California, Oregon): 72/72 matched. NLB TCP, UDP and TLS share one AWS capacity SKU and independently contribute metered usage.

## Calculation logic

- ALB: maximum of new connections, active connections, processed GB (EC2 vs Lambda target allowance), and paid rule evaluations, then capacity-hours. The initial 10 rules are excluded from LCU rule evaluation.
- NLB: for each protocol TCP/UDP/TLS, maximum of connection/flow rate, active flows, processed bytes, then sum the three NLCU bills.
- GWLB: maximum of new flows, active flows and processing volume; add LB-hour, GWLB Endpoint-hour and Endpoint GB charges.
- Classic: LB-hour and processed GB charges.
- No reserved LCU, private discount, tax, or free-tier offset. General AWS data transfer and public IPv4 charges are not included; network-transfer limitation warns that the estimate may be lower.
- Raw SKU IDs are evidence only; stable semantic product attributes and Dimension units are the matching contract.

## UI reference and limitations

The screenshot establishes four simultaneously enabled families, quantities defaulting to 1, ALB target type choice, three protocol groups within NLB, Gateway endpoint meters, Classic LB bytes, and visible unit selectors. The implementation normalizes quantities to per-second connections, seconds of duration, GB/hour or GB/month, and uses a single field for each semantic input. Exact official dropdown option sets, alternate unit conversion choices, and full rendered visual parity have **not yet been independently verified in a live browser**. These must not be called screenshot-identical based solely on the E2E check against the local drawer.

Local mocked browser E2E uses real Tokyo AWS offer fixture and verifies all four family quantity defaults and no duplicate semantic input. Branch CI is distinct from promotion/Price DB/Pages verification.


## Drawer layout revision (2026-10-13)

- The first ELB-specific control block is a four-checkbox type selection group: Application, Network, Gateway, and Classic Load Balancer; each family may be enabled independently.
- Each enabled family appears exactly once as its own parameter fieldset, preserving existing profile selector IDs, defaults, saved values, and pricing calculations.
- Detailed billing Components are not separate empty fieldsets: their Japanese display labels and calculated amount appear as rows at the **end of that family's parameter fieldset**.
- Disabled families' fieldsets and price lines are hidden, rather than displayed as inaccessible configuration fields; data remain saved and reappear when re-enabled.
- The 12 internal Pricing Components, their mappings and Price DB identities are unchanged; this is a UI-only re-onboarding.
- Automated browser acceptance: `tests/e2e/elb-contract.spec.js` verifies all four checkboxes, zero duplicate inputs, all 12 price rows, the ordering after inputs, and the family toggle behavior.
