# Amazon EventBridge onboarding evidence

- Calculator URL: https://calculator.aws/#/createCalculator/eventbridge
- Pricing documentation: https://aws.amazon.com/eventbridge/pricing/
- Pricing source of truth: AWS Public Price List offer `AWSEvents`.
- User-supplied rendered Calculator evidence was captured on 2026-10-06. The visible classic EventBridge controls are payload size, AWS management events, AWS opt-in data events, and custom events, with event counts shown in millions/month and payload in KB.
- A temporary branch probe inspected the Tokyo `AWSEvents` Public Price List on 2026-10-06. AWS publication date was `2026-09-24T16:39:03Z`, version `20260924163903`, with 23 On-Demand price dimensions.
- Classic meters verified in Tokyo include custom/partner ingestion, cross-account management/custom/partner delivery, API Destinations, archive processing/storage, Pipes, Schema Discovery, and Scheduler.
- AWS management-event ingestion is free and therefore remains a UI/profile input without a paid ingestion component.
- Classic EventBridge, Pipes, API Destinations, and replay events are billed in 64 KB chunks. Schema Discovery uses 8 KB chunks. Per-event chunk rounding is performed before multiplying by the monthly event count.
- Scheduler's first 14 million invocations and Schema Discovery's first 5 million events are AWS free allowances. Repository policy intentionally does not subtract Free Tier; their paid meters are used and the `free-tier` limitation is surfaced.
- Event replay archive processing is estimated from monthly archived event count and payload size. Archive storage is entered as GB-month because the supplied screenshot does not expose a reliable retention-period control.
- AWS launched an enhanced Custom event bus in September 2026 with EventsV2 ingress/egress/storage/evaluation meters. Those meters are present in the current Public Price List, but the supplied Calculator evidence is the classic EventBridge calculator. EventsV2 categories are therefore explicitly classified as unsupported rather than silently mixed into the classic estimate.
- Hidden alternatives in the Calculator payload-unit dropdown were not inferred; the supplied authoritative screenshot visibly shows KB.
- Data transfer, PrivateLink, and VPC Lattice charges are outside the EventBridge service meters and are not folded into this estimate.
