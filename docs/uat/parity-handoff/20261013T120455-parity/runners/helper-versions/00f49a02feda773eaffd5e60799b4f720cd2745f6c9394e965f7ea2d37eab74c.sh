#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
for mode in aurora-provisioned-io aurora-serverless-standard aurora-serverless-io aurora-limitless; do
  node /tmp/parity-price.mjs aurora-postgresql ap-northeast-1 0 "$mode"
done
node /tmp/parity-price.mjs redshift ap-northeast-1 0 serverless
node /tmp/parity-price.mjs fargate ap-northeast-1 0 windows
node /tmp/parity-price.mjs lambda,fargate,elastic-load-balancing ap-northeast-1 0 selectors
node /tmp/parity-price.mjs eventbridge ap-northeast-1 '' custom-delivery-isolated
