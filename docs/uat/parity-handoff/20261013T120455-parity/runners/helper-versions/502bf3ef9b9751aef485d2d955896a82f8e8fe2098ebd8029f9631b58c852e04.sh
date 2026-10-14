#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
for os in linux rhel; do for sql in Std Ent Web; do node /tmp/parity-price.mjs ec2 ap-northeast-1 '' "ec2-combination-$os:$sql"; done; done
for sql in Std Ent; do node /tmp/parity-price.mjs ec2 ap-northeast-1 '' "ec2-combination-ha:$sql"; done
for type in arm1.large arm1.medium arm1.small arm1.xlarge general1.2xlarge general1.large general1.medium general1.small general1.xlarge gpu1.large gpu1.small; do node /tmp/parity-price.mjs codebuild ap-northeast-1 '' "codebuild-compute-$type"; done
for cpu in 0.25 0.5 1 2 4 8 16 32; do node /tmp/parity-price.mjs fargate ap-northeast-1 '' "fargate-cpu-$cpu"; done
for mode in athena-period-day athena-period-week; do node /tmp/parity-price.mjs athena ap-northeast-1 '' "$mode"; done
