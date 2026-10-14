#!/bin/bash
set -e
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
while pgrep -f '^bash /tmp/parity-next-phase-20261014.sh$' >/dev/null; do sleep 2; done
node /tmp/parity-deep-local-v3.mjs local
python3 /tmp/parity-components.py
python3 /tmp/parity-otherinputs.py
python3 /tmp/parity-collect-case-observations.py
python3 /tmp/parity-consolidate.py
python3 /tmp/parity-validator.py
bash /tmp/parity-ebs-tier-smoke-20261014.sh
bash /tmp/parity-selector-smoke-20261014.sh
bash /tmp/parity-boundary-smoke-20261014.sh
