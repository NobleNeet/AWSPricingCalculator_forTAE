#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
PARITY_RETRY_INVALID=1 node /tmp/parity-price.mjs aurora-postgresql,glue,elastic-load-balancing '' '' retry
PARITY_RERUN=1 node /tmp/parity-price.mjs aurora-postgresql ap-northeast-1 0 aurora-serverless-standard
PARITY_RERUN=1 node /tmp/parity-price.mjs aurora-postgresql ap-northeast-1 1 aurora-limitless
for mode in aurora-provisioned-io aurora-serverless-standard aurora-serverless-io aurora-limitless; do
 node /tmp/parity-price.mjs aurora-postgresql '' '' "$mode"
done
node /tmp/parity-price.mjs redshift '' '' serverless
node /tmp/parity-price.mjs fargate '' '' windows
node /tmp/parity-price.mjs lambda,fargate,elastic-load-balancing '' '' selectors
node /tmp/parity-price.mjs lambda,amplify '' '' strong
node /tmp/parity-price.mjs eventbridge '' '' custom-delivery-isolated
node /tmp/parity-price.mjs eventbridge '' 8,9,10,11,12 rerun
node /tmp/parity-price.mjs athena '' '' retry
node /tmp/parity-price.mjs redshift '' 4 rerun
PARITY_RETRY_INVALID=1 node /tmp/parity-price.mjs redshift '' 0,1,2,3,5 retry
node /tmp/parity-price.mjs rds-oracle '' 1 rerun
