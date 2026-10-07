# AWS Amplify onboarding evidence

- Calculator URL: https://calculator.aws/#/createCalculator/Amplify
- Pricing documentation: https://aws.amazon.com/amplify/pricing/
- Pricing source of truth: AWS Public Price List offer `AWSAmplify`.
- User-supplied rendered Calculator evidence was captured on 2026-10-07. The visible `Web app hosting` controls are build instance size, build minutes per month, stored data per month, served data per month, SSR requests per hour, and execution duration per request in milliseconds.
- The supplied Calculator evidence shows Standard (8 GB memory, 4 vCPU) as the default build size. Current AWS Amplify documentation also defines Large (16 GB, 8 vCPU) and XLarge (72 GB, 36 vCPU) build sizes.
- Current AWS Amplify pricing documents Standard at USD 0.01/minute, Large at USD 0.025/minute, XLarge at USD 0.10/minute, storage at USD 0.023/GB-month, data transfer out at USD 0.15/GB, SSR requests at USD 0.30 per million requests, and SSR duration at USD 0.20/GB-hour.
- Public Price List semantics use `BuildDuration`, `BuildDuration-Large16GB`, `BuildDuration-XLarge72GB`, `DataStorage`, `DataTransferOut`, `HostingComputeRequestCount`, and `HostingComputeRequestDuration`. Build-size products are distinguished by `instancetype` values `Standard8GB`, `Large16GB`, and `XLarge72GB`.
- SSR request count is entered per hour in the Calculator, so monthly request quantity is requests/hour multiplied by the project hours/month setting.
- Amplify Hosting WEB_COMPUTE currently has a fixed 1024 MB SSR runtime allocation. Therefore the Calculator's request duration input maps directly to 1 GB multiplied by monthly request-seconds, yielding the Public Price List `GB-Seconds` quantity.
- AWS Free Tier allowances are intentionally not subtracted under repository policy. Components that AWS advertises with free allowances surface the `free-tier` limitation instead.
- Amplify WAF integration has its own `AmplifyWAF` Public Price List meter. The supplied authoritative Calculator screenshot does not expose a WAF input, so that category is explicitly classified as unsupported rather than adding an unverified drawer control. AWS WAF rule/request charges are separate in any case.
- Backend resources used by Amplify applications (for example Cognito, AppSync, DynamoDB, Lambda, and S3) are priced by their own services and are not folded into this Amplify Hosting estimate.
- The Price DB workflow must validate current regional products/dimensions and the Tokyo golden fixture before promotion. No SKU or rateCode is pinned.
