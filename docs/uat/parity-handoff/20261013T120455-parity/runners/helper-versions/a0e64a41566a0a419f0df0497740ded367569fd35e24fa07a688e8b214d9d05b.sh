#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
PARITY_RERUN=1 node /tmp/parity-price.mjs ec2 ap-northeast-1 0,2 ec2-transfers
PARITY_RETRY_INVALID=1 node /tmp/parity-price.mjs elastic-load-balancing ap-northeast-1 1,2,3,4 elb-gwlb
