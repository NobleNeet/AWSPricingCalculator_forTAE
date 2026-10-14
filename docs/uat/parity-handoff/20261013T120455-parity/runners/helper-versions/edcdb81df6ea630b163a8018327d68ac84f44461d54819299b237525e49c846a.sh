#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
for mode in lambda-streaming-before6 lambda-streaming-after6; do node /tmp/parity-price.mjs lambda ap-northeast-1 1 "$mode"; done
for mode in s3-boundary-0 s3-boundary-51200 s3-after-51200 s3-boundary-512000 s3-after-512000; do node /tmp/parity-price.mjs s3 ap-northeast-1 '' "$mode"; done
for mode in fargate-boundary-linux-60 fargate-after-linux-60 fargate-boundary-windows-300 fargate-after-windows-300; do node /tmp/parity-price.mjs fargate ap-northeast-1 '' "$mode"; done
node /tmp/parity-price.mjs kms,s3,codebuild,systems-manager,lambda,fargate ap-northeast-1 '' hours
node /tmp/parity-price.mjs kms,s3,amplify,lambda ap-northeast-1 '' zero
node /tmp/parity-price.mjs eventbridge ap-northeast-1 '' scheduler-remaining
node /tmp/parity-price.mjs eventbridge ap-northeast-1 '' event-archive
