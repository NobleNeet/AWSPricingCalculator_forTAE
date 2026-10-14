#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
for combo in linux:Std linux:Ent linux:Web rhel:Std rhel:Ent rhel:Web ha:Std ha:Ent; do
 PARITY_RERUN=1 node /tmp/parity-price.mjs ec2 ap-northeast-1 '' "ec2-combination-$combo"
 python3 /tmp/parity-dedup-evidence.py
done
for cpu in 0.25 8 16; do
 PARITY_RERUN=1 node /tmp/parity-price.mjs fargate ap-northeast-1 '' "fargate-cpu-$cpu"
done
for period in day week; do
 PARITY_RERUN=1 node /tmp/parity-price.mjs athena ap-northeast-1 '' "athena-period-$period"
done
python3 /tmp/parity-dedup-evidence.py
bash /tmp/parity-complete-known.sh
