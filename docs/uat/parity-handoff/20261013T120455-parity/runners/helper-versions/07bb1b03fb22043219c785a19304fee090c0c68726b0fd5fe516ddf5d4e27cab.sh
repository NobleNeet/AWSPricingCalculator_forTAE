#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
PARITY_RERUN=1 node /tmp/parity-price.mjs ec2 ap-northeast-1 1 ec2-transfers
for type in gp2 st1 sc1 io1 io2; do node /tmp/parity-price.mjs ec2 ap-northeast-1 '' "ec2-volume-$type"; done
for mode in ec2-io1 ec2-io2 ec2-io2-boundary-32000 ec2-io2-after-32000 ec2-io2-boundary-64000 ec2-io2-after-64000; do node /tmp/parity-price.mjs ec2 ap-northeast-1 '' "$mode"; done
for mode in ebs-volumes ebs-duration; do node /tmp/parity-price.mjs ebs ap-northeast-1 '' "$mode"; done
PARITY_RERUN=1 node /tmp/parity-price.mjs elastic-load-balancing ap-northeast-1 '' elb-alb-target
