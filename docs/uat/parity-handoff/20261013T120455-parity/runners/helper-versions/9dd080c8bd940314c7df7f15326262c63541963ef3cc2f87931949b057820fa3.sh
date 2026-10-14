#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
run_numeric() {
 available=$(df -Pk / | awk 'NR==2 {print $4}')
 if [ "$available" -lt 100000 ]; then printf 'Audit disk space gate: preserve evidence before further cases.\n'; return 77; fi
 PARITY_NUMERIC_PROBE="$1" node /tmp/parity-price-numeric.mjs "$2" ap-northeast-1 '' "${3:-}"
 python3 /tmp/parity-dedup-evidence.py
}
for mode in large minimum; do
 for service in kms s3 codebuild systems-manager lambda amplify athena ebs ec2 fargate rds rds-oracle redshift aurora-postgresql glue elastic-load-balancing eventbridge; do run_numeric "$mode" "$service"; done
 for variant in aurora-provisioned-io aurora-serverless-standard aurora-serverless-io aurora-limitless; do run_numeric "$mode" aurora-postgresql "$variant"; done
 run_numeric "$mode" redshift serverless
 for variant in glue-ray glue-memory glue-interactive-ray glue-optimization glue-statistics glue-development glue-databrew glue-catalog glue-flex; do run_numeric "$mode" glue "$variant"; done
 run_numeric "$mode" lambda lambda-streaming
 run_numeric "$mode" fargate windows
 done
