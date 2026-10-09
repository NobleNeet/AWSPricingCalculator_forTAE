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
- The implementation models tasks/pods per day. Public Calculator GUI evidence captured on 2026-10-09 shows the conversion `730 hours in a month / 24 hours in a day`; the former fixed 30-day coefficient was inconsistent with that assumption. Every Fargate meter now converts daily tasks using Project `hoursPerMonth / 24`, with 730 hours as the Project default. A 30-day estimate remains expressible using 720 common monthly hours.
- The existing generic source-level scale transform expresses the hours-to-days conversion using an 80-significant-digit decimal coefficient for 1/24. No intermediate display rounding or service-specific Pricing Core branch is introduced. Stored daily usage values remain unchanged; restored estimates use the current Definition and may increase by approximately 1.389% at 730 monthly hours.
- Fargate Spot, Compute Savings Plans, public IPv4, data transfer, CloudWatch, ECR, EBS, and other service charges are not folded into these Fargate meters.

## Monthly-usage correction verification (2026-10-09)

- Test impact inventory: all nine calculation sources, both Golden cases, `tests/pricing/fargate.test.js`, and browser common-hours behavior. Existing EC2/Lambda and restore/export browser contracts retain their behavior.
- Narrow Fargate checks verify 0/24/720/730/744 common hours for every resource meter and minimum task durations before aggregation. All 114 repository unit tests, Definition validation, both Golden cases, six-region mapping validation, all 12 browser tests, and static site build passed locally.
- A browser test changes common hours through the normal GUI: it closes the modal Drawer, edits Project hours, and reopens the service. Editing an inert control behind the modal does not represent a user operation.
- CPU/memory test generation must use the documented supported combinations, including Linux 32 vCPU with 60/120/244 GB. The Drawer help now lists those combinations. It continues to calculate aggregate resource usage and does not claim complete resource-creation validation.
- Pricing Core, schema, Pricing Mappings and AWS source selection remain unchanged. Publication validation is scoped to the Fargate/AmazonECS contract rather than introducing a global semantic fingerprint change.
