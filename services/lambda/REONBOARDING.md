# AWS Lambda re-onboarding record

Date: 2026-10-05 / 2026-10-06 JST

## Basis

This service definition was reconstructed under `docs/SERVICE_ONBOARDING.md` re-onboarding mode. The design criterion is what would be implemented if AWS Lambda were added as a new service now; prior Lambda definitions are not treated as authoritative.

Authoritative Calculator URL:

- `https://calculator.aws/#/createCalculator/Lambda`

The user-supplied current AWS Pricing Calculator screenshot is the UI source of truth for this re-onboarding. The visible current UI includes monthly requests, execution duration in milliseconds, allocated memory in MB, and a `Lambda HTTP response streaming` section whose invoke-mode default is buffered. The screenshot explicitly states that buffered responses have no additional response-streaming charge.

The Public Price List source used for mapping verification is generated build `20261005T135802Z-533be22f`, service code `AWSLambda`, including `ap-northeast-1` and `us-east-1`. Mappings intentionally use stable product attributes (`attributes.group`) plus price-dimension unit rather than SKU or region-specific usage-type strings.

## Reconstructed pricing model

| Calculator concept | Price List group | Dimension unit |
| --- | --- | --- |
| Requests | `AWS-Lambda-Requests` | `Request` |
| On-demand duration (x86) | `AWS-Lambda-Duration` | `Lambda-GB-Second` |
| On-demand duration (Arm) | `AWS-Lambda-Duration-ARM` | `Lambda-GB-Second` |
| Ephemeral storage (x86) | `AWS-Lambda-Storage-Duration` | `GB-Seconds` |
| Ephemeral storage (Arm) | `AWS-Lambda-Storage-Duration-ARM` | `GB-Seconds` |
| Provisioned requests | `AWS-Lambda-Requests` | `Request` |
| Provisioned execution duration (x86) | `AWS-Lambda-Duration-Provisioned` | `Lambda-GB-Second` |
| Provisioned execution duration (Arm) | `AWS-Lambda-Duration-Provisioned-ARM` | `Lambda-GB-Second` |
| Provisioned capacity (x86) | `AWS-Lambda-Provisioned-Concurrency` | `Lambda-GB-Second` |
| Provisioned capacity (Arm) | `AWS-Lambda-Provisioned-Concurrency-ARM` | `Lambda-GB-Second` |
| HTTP response streaming processed bytes (x86) | `AWS-Lambda-Processed-Bytes` | `Processed-Gigabytes` |
| HTTP response streaming processed bytes (Arm) | `AWS-Lambda-Processed-Bytes-ARM` | `Processed-Gigabytes` |

## Quantity rules

- On-demand duration: `requests * durationMs * memoryMb / (1000 * 1024)` GB-seconds.
- Ephemeral storage: only configured storage above the included 512 MB is charged; quantity is excess GB multiplied by execution seconds.
- Provisioned Concurrency is modeled independently from the normal Lambda Functions architecture/memory selectors. Capacity quantity is `concurrency * enabledHours * memoryMb / 1024 * 3600` GB-seconds.
- Provisioned execution quantity is `requests * durationMs * memoryMb / (1000 * 1024)` GB-seconds using the Provisioned Concurrency section's architecture and memory.
- HTTP response streaming uses the normal function request count. Buffered mode has no processed-bytes component. Streaming quantity is `requests * max(responseMb - 6, 0) / 1024` processed GB.
- Free Tier and account-specific discounts are not subtracted by this project, consistent with project-wide pricing policy.

## Old-to-new changes

| Previous implementation | Current re-onboarded implementation |
| --- | --- |
| Separate `streamingRequestsPerMonth` input | Removed; response streaming uses the Lambda Functions request count. |
| Response-streaming component could be modeled independently of invoke mode | Explicit `buffered` / `response-stream` invoke mode; buffered disables processed-byte pricing. |
| Provisioned Concurrency architecture/memory coupled to normal function selectors | Separate Provisioned Concurrency architecture and memory selectors. |
| Provisioned ephemeral-storage components | Removed as obsolete standalone components; ephemeral storage remains part of normal invocation duration/storage modeling. |
| SnapStart selectors/components/golden case | Removed from the active service model because the supplied current Calculator UI does not provide authoritative evidence for those inputs. |

## Intentionally excluded Public Price List categories

The AWS Lambda Public Price List contains additional meters beyond the current Calculator UI represented by the supplied evidence, including SnapStart, event poller, durable execution, managed-instance/MicroVM, and related categories. Those meters are not inferred into the UI merely because they exist in the Price List. They remain out of the estimate unless the current Calculator UI exposes a corresponding pricing control and the service is re-onboarded again with that evidence.

The request-unit dropdown is visible with `/month` selected in the authoritative screenshot, but hidden dropdown alternatives are not inferred. The internal input is therefore canonicalized to monthly requests.

## Verification requirements

Completion requires repository validation, Lambda golden mapping verification against the generated Public Price List, CI, scheduled/manual price-update compatibility, and Pages build/deployment checks. Any generated Price DB fingerprint must correspond to the final service definitions rather than an earlier Lambda definition.
