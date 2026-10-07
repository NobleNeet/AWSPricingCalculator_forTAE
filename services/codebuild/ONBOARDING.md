# AWS CodeBuild onboarding evidence

- Calculator URL: https://calculator.aws/#/createCalculator/codebuild
- CodeBuild pricing documentation: https://aws.amazon.com/codebuild/pricing/
- CodeBuild compute type documentation: https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-compute-types.html
- Pricing source of truth: AWS Public Price List offer `CodeBuild`.
- User-supplied rendered Calculator evidence was captured on 2026-10-07 for Asia Pacific (Tokyo). The visible fleet mode is On-Demand EC2.
- The rendered screen confirms these estimate inputs: number of builds per month, average build time, duration unit, searchable instance/compute type, and operating system.
- The supplied example selects `arm1.2xlarge`, Linux, 1 build/month and 10 minutes/build. The Calculator displays 48 vCPU and 96 GiB for the selected compute type.
- AWS Public Price List semantics for the captured fleet are `productFamily=Compute`, `computeFamily=OnDemand-EC2`, `computeType=<selected type>`, `operatingSystem=<selected OS>`, with a `minutes` price dimension.
- The Calculator-displayed amount is used only as a sanity check. Rates are never copied into the Service Definition; the current Price DB resolves the rate.
- Build duration is billed in minute increments for On-Demand EC2. The implementation rounds each average build duration up to a whole minute before multiplying by the monthly build count.
- Free Tier is intentionally not subtracted, consistent with repository policy.
- On-Demand Lambda, Docker, Sandbox and Reserved Capacity are not inferred from the supplied EC2 screen. They remain explicit coverage exclusions until their Calculator UI and billing inputs are independently captured and onboarded.
- CloudWatch Logs, S3 artifacts, KMS, CodePipeline and other related-service charges are not folded into the CodeBuild build-minute component and should be estimated as their own services where applicable.
