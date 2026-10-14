#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
node /tmp/parity-price.mjs lambda ap-northeast-1 '' lambda-streaming
node /tmp/parity-price.mjs lambda ap-northeast-1 '' lambda-invoke-mode
PARITY_RERUN=1 node /tmp/parity-price.mjs aurora-postgresql ap-northeast-1 0 aurora-serverless-standard
PARITY_RERUN=1 node /tmp/parity-price.mjs aurora-postgresql ap-northeast-1 1 aurora-limitless
PARITY_RERUN=1 node /tmp/parity-price.mjs elastic-load-balancing ap-northeast-1 16
