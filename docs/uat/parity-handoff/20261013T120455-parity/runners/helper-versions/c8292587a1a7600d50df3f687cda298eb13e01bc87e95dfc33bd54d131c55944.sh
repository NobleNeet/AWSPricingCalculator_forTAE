#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
export PARITY_RESULT_ROOT=/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/20261013T120455-parity/shards/group-b
PARITY_RETRY_INVALID=1 node /tmp/parity-price-sharded.mjs elastic-load-balancing '' '' retry
python3 /tmp/parity-dedup-evidence.py
node /tmp/parity-price-sharded.mjs elastic-load-balancing '' '' selectors
node /tmp/parity-price-sharded.mjs redshift '' '' serverless
node /tmp/parity-price-sharded.mjs eventbridge '' '' custom-delivery-isolated
node /tmp/parity-price-sharded.mjs eventbridge '' 8,9,10,11,12 rerun
node /tmp/parity-price-sharded.mjs athena '' '' retry
node /tmp/parity-price-sharded.mjs redshift '' 4 rerun
PARITY_RETRY_INVALID=1 node /tmp/parity-price-sharded.mjs redshift '' 0,1,2,3,5 retry
node /tmp/parity-price-sharded.mjs rds-oracle '' 1 rerun
