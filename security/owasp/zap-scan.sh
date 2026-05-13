#!/bin/bash
# OWASP ZAP Baseline Scan
# Usage: ./zap-scan.sh https://rez.money

TARGET="${1:-https://rez.money}"
echo "OWASP ZAP Scan Target: $TARGET"

docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t "$TARGET" \
  -J zap-report.json \
  -r zap-report.html

echo "Report: zap-report.html"
