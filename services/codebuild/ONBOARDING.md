# AWS CodeBuild onboarding evidence

- Calculator URL: https://calculator.aws/#/createCalculator/codebuild
- CodeBuild pricing documentation: https://aws.amazon.com/codebuild/pricing/
- CodeBuild compute type documentation: https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-compute-types.html
- Pricing source of truth: AWS Public Price List offer `CodeBuild`.
- User-supplied rendered Calculator evidence was captured on 2026-10-07 for Asia Pacific (Tokyo). The visible fleet mode is On-Demand EC2.
- The rendered screen confirms these estimate inputs: number of builds per month, average build time, duration unit, searchable instance/compute type, and operating system.
- The supplied example selects `arm1.2xlarge`, Linux, 1 build/month and 10 minutes/build. The Calculator displays 48 vCPU and 96 GiB and a monthly estimate of USD 1.20.
- A temporary GitHub Actions probe inspected the Tokyo `CodeBuild` Public Price List on 2026-10-07. AWS publication date was `2026-09-11T12:46:25Z`, version `20260911124625`.
- The probe independently verified SKU `6Q5BZ5WQT9QPDGZ7` for `arm1.2xlarge` / Linux with `productFamily=Compute`, `computeFamily=OnDemand-EC2`, `computeType=arm1.2xlarge`, `operatingSystem=Linux`, unit `minutes`, and USD 0.12/minute. This reproduces the supplied Calculator sample: 1 × 10 × 0.12 = USD 1.20.
- The same current Tokyo Price List exposes On-Demand EC2 `general1.*`, `arm1.*`, and `gpu1.*` Linux types plus Windows `general1.medium/large/xlarge/2xlarge`; selector options are therefore data-driven instead of hard-coded.
- Public Price List rate values are not copied into Service Definitions; they are resolved from the current Price DB. The captured rate exists only in the test fixture as independently verified Golden evidence.
- Build duration is billed in minute increments for On-Demand EC2. The implementation rounds each average build duration up to a whole minute before multiplying by the monthly build count.
- Free Tier is intentionally not subtracted, consistent with repository policy.
- On-Demand Lambda, Docker, Sandbox and Reserved Capacity are not inferred from the supplied EC2 screen. They remain explicit coverage exclusions until their Calculator UI and billing inputs are independently captured and onboarded.
- CloudWatch Logs, S3 artifacts, KMS, CodePipeline and other related-service charges are not folded into the CodeBuild build-minute component and should be estimated as their own services where applicable.
