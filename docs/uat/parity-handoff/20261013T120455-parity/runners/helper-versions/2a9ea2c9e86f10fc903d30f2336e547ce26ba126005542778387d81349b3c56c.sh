#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
for mode in ec2-monitoring ec2-additional ec2-transfers; do node /tmp/parity-price.mjs ec2 ap-northeast-1 '' "$mode"; done
for mode in glue-version-standard glue-version-interactive; do node /tmp/parity-price.mjs glue ap-northeast-1 '' "$mode"; done
node /tmp/parity-price.mjs glue ap-northeast-1 0,3 glue-flex
node /tmp/parity-price.mjs elastic-load-balancing ap-northeast-1 '' elb-alb-target
node /tmp/parity-price.mjs elastic-load-balancing ap-northeast-1 1,2,3,4 elb-gwlb
