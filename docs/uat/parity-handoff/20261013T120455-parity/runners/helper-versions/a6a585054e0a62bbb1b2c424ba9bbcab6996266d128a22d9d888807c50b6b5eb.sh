#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
export PARITY_RESULT_ROOT=/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/20261013T120455-parity/shards/group-a
PARITY_RETRY_INVALID=1 node /tmp/parity-price-sharded.mjs aurora-postgresql,glue '' '' retry
for mode in aurora-provisioned-io aurora-serverless-standard aurora-serverless-io aurora-limitless; do node /tmp/parity-price-sharded.mjs aurora-postgresql '' '' "$mode"; python3 /tmp/parity-dedup-evidence.py; done
node /tmp/parity-price-sharded.mjs fargate '' '' windows
node /tmp/parity-price-sharded.mjs lambda,fargate '' '' selectors
node /tmp/parity-price-sharded.mjs lambda,amplify '' '' strong
