#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
PARITY_RETRY_BLOCKED=1 node /tmp/parity-price.mjs ec2 ap-northeast-1 '' ec2-software-SQL-Ent
for mode in glue-ray glue-memory glue-memory-legacy glue-interactive-ray glue-optimization; do PARITY_RETRY_BLOCKED=1 node /tmp/parity-price.mjs glue ap-northeast-1 0 "$mode"; done
for mode in glue-development glue-catalog; do PARITY_RERUN=1 node /tmp/parity-price.mjs glue ap-northeast-1 0 "$mode"; done
PARITY_RETRY_BLOCKED=1 node /tmp/parity-price.mjs amplify ap-northeast-1 '' amplify-size-XLarge
