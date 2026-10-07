# AWS Fargate onboarding evidence

- Calculator URL: https://calculator.aws/#/createCalculator/Fargate
- Pricing documentation: https://aws.amazon.com/fargate/pricing/
- ECS Fargate sizing documentation: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-tasks-services.html
- Pricing source of truth: AWS Public Price List offer `AmazonECS`.
- User-supplied rendered Calculator evidence was captured on 2026-10-07. Visible controls confirm On-Demand, Operating system (Linux), CPU architecture (x86), and Tasks or pods with a value/unit control set to 1 / day. The screenshot states that Fargate Spot and Compute Savings Plans are not supported by the AWS Pricing Calculator.
- A temporary GitHub Actions probe inspected the Tokyo `AmazonECS` Public Price List on 2026-10-07. AWS publication date was `2026-09-11T12:44:25Z`, version `20260911124425`.
- Tokyo On-Demand Fargate meters verified directly from the Public Price List are Linux x86 vCPU/memory, Linux ARM vCPU/memory, Windows x86 vCPU/memory/OS license, and additional ephemeral storage.
- The verified products use productFamily `Compute`. Linux x86 is identified by perCPU/perGB with no cpuArchitecture/operatingSystem attribute, ARM by `cpuArchitecture=ARM`, Windows by `operatingSystem=Windows`, and extra ephemeral storage by `storagetype=default`.
- Public Price List rate values are not copied into Service Definitions; they are resolved from the current Price DB.
- Billing is per second with a 1-minute minimum for Linux and a 5-minute minimum for Windows. Components apply these minimums to average task/pod duration.
- 20 GB of ephemeral storage is included. Only storage above 20 GB is billed; input range is 20-200 GB.
- Linux supports x86 and ARM. Windows Fargate is x86 only. Current AWS task sizing supports Linux through 32 vCPU and Windows at 1/2/4 vCPU.
- The supplied screenshot confirms the /day task-frequency choice but not hidden dropdown alternatives. This implementation therefore models tasks/pods per day and converts it using 30 days/month.
- Fargate Spot, Compute Savings Plans, public IPv4, data transfer, CloudWatch, ECR, EBS, and other service charges are not folded into these Fargate meters.
