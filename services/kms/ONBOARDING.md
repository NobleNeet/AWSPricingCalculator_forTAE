# AWS KMS onboarding evidence

- Calculator URL: https://calculator.aws/#/createCalculator/KMS
- Pricing documentation: https://aws.amazon.com/kms/pricing/
- Pricing source of truth: AWS Public Price List offer `awskms`.
- The Tokyo Public Price List was inspected on 2026-10-06 through a temporary branch workflow and verified six On-Demand meters: customer managed key versions plus five request categories.
- The public Calculator page is a JavaScript SPA; the available HTTP inspection path did not expose its rendered KMS controls. Inputs are therefore modeled from the official KMS pricing categories and directly verified Public Price List meters.
- Free Tier allowances are intentionally not subtracted, consistent with repository policy.
- AWS managed and AWS owned key storage is not charged and has no storage input.
- Key rotation uses the same key-version meter. The UI therefore accepts billable key versions directly: base customer managed keys plus the first and second rotated versions. Current AWS pricing does not add another monthly key-storage charge after the second rotation.
- CloudHSM custom key store and external key store infrastructure charges are external to the KMS Price List meters and are not folded into this service estimate.
