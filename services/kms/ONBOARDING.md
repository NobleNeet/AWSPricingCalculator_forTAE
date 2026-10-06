# AWS KMS onboarding evidence

- Calculator URL: https://calculator.aws/#/createCalculator/KMS
- Pricing documentation: https://aws.amazon.com/kms/pricing/
- Pricing source of truth: AWS Public Price List offer `awskms`.
- Re-onboarding reference: rendered AWS Pricing Calculator KMS screen supplied on 2026-10-06.
- The rendered Calculator screen exposes these six service-setting inputs, in this order:
  1. Number of customer managed customer master keys (CMK)
  2. Number of symmetric requests
  3. Number of asymmetric requests other than RSA 2048
  4. Number of asymmetric requests related to RSA 2048
  5. Number of ECC GenerateDataKeyPair requests
  6. Number of RSA GenerateDataKeyPair requests
- The Calculator example defaults shown in the supplied rendered screen are 5 customer managed CMKs and 2,000,000 symmetric requests. The remaining request fields are empty in the Calculator UI; this application initializes them to numeric 0 because the current Definition/runtime number-input contract requires a concrete numeric default.
- The existing Tokyo Public Price List mapping was inspected on 2026-10-06 and resolves the same six On-Demand meters: customer managed keys plus five request categories. No service-specific pricing mapping change is required for this UI alignment.
- Free Tier allowances are intentionally not subtracted, consistent with repository policy.
- AWS managed and AWS owned key storage is not charged and has no storage input.
- The official Calculator KMS screen does not expose a separate key-rotation-version input. Re-onboarding therefore treats the first field strictly as the number of customer managed CMKs; rotated key versions are not requested separately in the drawer.
- CloudHSM custom key store and external key store infrastructure charges are external to the KMS Price List meters and are not folded into this service estimate.
