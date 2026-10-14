#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
node /tmp/parity-price.mjs ebs ap-northeast-1 '' ebs-gp2
for mode in rds-storage-hours rds-multi-az; do node /tmp/parity-price.mjs rds ap-northeast-1 '' "$mode"; done
for mode in oracle-gp3 oracle-multi-az oracle-license; do node /tmp/parity-price.mjs rds-oracle ap-northeast-1 '' "$mode"; done
node /tmp/parity-price.mjs ec2 ap-northeast-1 '' ec2-storage-normalized
for mode in ec2-os-Windows ec2-os-RHEL ec2-os-SUSE 'ec2-os-Ubuntu Pro' 'ec2-os-Red Hat Enterprise Linux with HA' ec2-software-SQL-Std ec2-software-SQL-Ent ec2-software-SQL-Web ec2-tenancy; do node /tmp/parity-price.mjs ec2 ap-northeast-1 '' "$mode"; done
for mode in glue-ray glue-memory glue-memory-legacy glue-interactive-ray glue-optimization glue-statistics glue-databrew glue-development glue-crawlers glue-catalog; do node /tmp/parity-price.mjs glue ap-northeast-1 0 "$mode"; done
node /tmp/parity-price.mjs codebuild ap-northeast-1 0 codebuild-windows
for mode in amplify-size-Large amplify-size-XLarge; do node /tmp/parity-price.mjs amplify ap-northeast-1 '' "$mode"; done
node /tmp/parity-price.mjs s3 ap-northeast-1 '' s3-strong
node /tmp/parity-price.mjs athena ap-northeast-1 '' athena-strong
node /tmp/parity-price.mjs elastic-load-balancing ap-northeast-1 1,2,3 elb-dominant
