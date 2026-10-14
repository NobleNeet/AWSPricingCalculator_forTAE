#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
while pgrep -f '^bash /tmp/parity-retry-advanced-20261014.sh$' >/dev/null; do sleep 2; done
python3 /tmp/parity-components.py
python3 /tmp/parity-otherinputs.py
python3 /tmp/parity-collect-case-observations.py
python3 /tmp/parity-consolidate.py
python3 /tmp/parity-validator.py
node /tmp/parity-deep-v3.mjs aws-deep-extra
