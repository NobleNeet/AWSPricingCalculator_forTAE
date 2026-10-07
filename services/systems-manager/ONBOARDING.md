# AWS Systems Manager onboarding evidence

- Calculator URL: https://calculator.aws/#/createCalculator/SystemsManager
- Pricing documentation: https://aws.amazon.com/systems-manager/pricing/
- Pricing source of truth: AWS Public Price List offer `AWSSystemsManager`.
- User-supplied rendered Calculator evidence was captured on 2026-10-07.
- The supplied Calculator screen exposes two estimate sections: Just-in-time node access and Incident Manager.
- Just-in-time node access exposes `System Manager マネージドノードの時間数`; this maps to managed-node hours.
- Incident Manager exposes response-plan count plus active hours per response plan. The Calculator default for hours per response plan is 730 / month.
- Current AWS Public Price List publication `20261004202730` was probed for Tokyo and N. Virginia during onboarding. Tokyo has paid JIT product `APN1-JustInTimeAccessHour` with operation `JustInTimeAccessHour`, trial=FALSE, unit `hours`, and four paid tiers beginning at 0 / 72,000 / 720,000 / 7,200,000 hours. A separate `APN1-JustInTimeAccessHour-Trial` zero-price product exists with trial=TRUE.
- Repository policy does not integrate tier ladders. Therefore JIT uses the first normal paid tier for all input hours and surfaces `tier-pricing`. The promotional trial is not subtracted and surfaces `free-tier`.
- Tokyo Incident Manager response-plan product uses `APN1-IM-ResponsePlan-Months-Tier1`, discriminator `response=response-plan-months`, unit `Months`, and USD 7.00 per response-plan month.
- Incident Manager active hours are converted to response-plan months as `responsePlanCount * activeHoursPerPlan / 730`, matching the Calculator's 730-hours/month input model and AWS's prorated monthly pricing example.
- Up to 100 SMS/voice messages included with Incident Manager and additional country-dependent message charges are described by the Calculator/pricing documentation, but the supplied Calculator screen has no message-quantity input. Additional message charges are therefore outside this drawer and the Incident Manager component carries `unsupported-pricing-category`.
- Incident Manager is no longer open to new customers; existing customers can continue to use it. The input is retained because the authoritative Calculator screen still exposes it and existing customers can incur the charge.
- Other Systems Manager paid categories (for example OpsCenter, Parameter Store advanced parameters, Automation, Change Manager, and related meters) are not exposed by the supplied authoritative Calculator screen. They are explicitly covered as unsupported instead of being inferred into this estimate.
- No SKU or rateCode is pinned by the service Definition or Pricing Mapping. The concrete SKU/rateCode values in the AWS fixture are evidence only.

- Region availability is fail-closed from live Public Price List validation. In the currently configured application regions, paid JIT meters resolve in Tokyo, N. Virginia, Ohio, N. California, and Oregon, but not Osaka. Incident Manager response-plan months resolve in Tokyo, N. Virginia, Ohio, and Oregon, but not Osaka or N. California. Pricing components are disabled where their matching paid meter is absent instead of fabricating a fallback price. Profile inputs remain reachable in every configured region because repository semantic validation requires at least one reachable selector branch; unsupported-region components resolve as disabled rather than as a fabricated price.
