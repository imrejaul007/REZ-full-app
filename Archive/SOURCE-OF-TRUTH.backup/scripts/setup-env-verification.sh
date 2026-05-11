#!/bin/bash
# Environment Variable Verification Script
# Run this to check if all required environment variables are set

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "REZ Platform - Environment Verification"
echo "=========================================="
echo ""

# Counters
TOTAL=0
PASSED=0
FAILED=0
WARNINGS=0

check_var() {
    local name=$1
    local value=$2
    local required=$3  # "required", "optional", or "placeholder"

    TOTAL=$((TOTAL + 1))

    if [[ -z "$value" ]] || [[ "$value" == "REQUIRED_BEFORE_LAUNCH" ]] || [[ "$value" == *"your_"* ]] || [[ "$value" == *"example"* ]]; then
        if [[ "$required" == "required" ]]; then
            echo -e "${RED}[FAIL]${NC} $name - Missing or placeholder value"
            FAILED=$((FAILED + 1))
        else
            echo -e "${YELLOW}[WARN]${NC} $name - Not configured (optional)"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${GREEN}[PASS]${NC} $name - Configured"
        PASSED=$((PASSED + 1))
    fi
}

echo "=== REZ Consumer App (rez-app-consumer) ==="
check_var "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" "${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:-$(grep -o 'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.*' eas.json 2>/dev/null | cut -d'"' -f2 2>/dev/null || echo '')}" "required"
check_var "EXPO_PUBLIC_OPENCAGE_API_KEY" "${EXPO_PUBLIC_OPENCAGE_API_KEY:-$(grep -o 'EXPO_PUBLIC_OPENCAGE_API_KEY.*' eas.json 2>/dev/null | cut -d'"' -f2 2>/dev/null || echo '')}" "required"
check_var "EXPO_PUBLIC_RAZORPAY_KEY_ID" "${EXPO_PUBLIC_RAZORPAY_KEY_ID:-$(grep -o 'EXPO_PUBLIC_RAZORPAY_KEY_ID.*' eas.json 2>/dev/null | cut -d'"' -f2 2>/dev/null || echo '')}" "required"
check_var "EXPO_PUBLIC_FIREBASE_API_KEY" "${EXPO_PUBLIC_FIREBASE_API_KEY:-$(grep -o 'EXPO_PUBLIC_FIREBASE_API_KEY.*' eas.json 2>/dev/null | cut -d'"' -f2 2>/dev/null || echo '')}" "required"
check_var "EXPO_PUBLIC_CLOUDINARY_API_KEY" "${EXPO_PUBLIC_CLOUDINARY_API_KEY:-$(grep -o 'EXPO_PUBLIC_CLOUDINARY_API_KEY.*' eas.json 2>/dev/null | cut -d'"' -f2 2>/dev/null || echo '')}" "required"
echo ""

echo "=== Apple App Store Credentials ==="
check_var "ascAppId (Consumer)" "${ASC_APP_ID_CONSUMER:-$(grep -o '"ascAppId".*' rez-app-consumer/eas.json 2>/dev/null | cut -d'"' -f4 2>/dev/null || echo '')}" "required"
check_var "appleTeamId (Consumer)" "${APPLE_TEAM_ID_CONSUMER:-$(grep -o '"appleTeamId".*' rez-app-consumer/eas.json 2>/dev/null | cut -d'"' -f4 2>/dev/null || echo '')}" "required"
check_var "ascAppId (Admin)" "${ASC_APP_ID_ADMIN:-$(grep -o '"ascAppId".*' rez-app-admin/eas.json 2>/dev/null | cut -d'"' -f4 2>/dev/null || echo '')}" "required"
check_var "appleTeamId (Admin)" "${APPLE_TEAM_ID_ADMIN:-$(grep -o '"appleTeamId".*' rez-app-admin/eas.json 2>/dev/null | cut -d'"' -f4 2>/dev/null || echo '')}" "required"
echo ""

echo "=== Google Play Console ==="
if [[ -f "rez-app-consumer/google-service-account.json" ]]; then
    echo -e "${GREEN}[PASS]${NC} google-service-account.json (Consumer) - Found"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}[FAIL]${NC} google-service-account.json (Consumer) - Not found"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

if [[ -f "rez-app-admin/google-service-account.json" ]]; then
    echo -e "${GREEN}[PASS]${NC} google-service-account.json (Admin) - Found"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}[FAIL]${NC} google-service-account.json (Admin) - Not found"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))
echo ""

echo "=== Integration Endpoints ==="
check_var "REZ Merchant Webhook Secret" "${REZ_MERCHANT_WEBHOOK_SECRET:-}" "optional"
check_var "OAuth Partner Client ID" "${PARTNER_RENDEZ_CLIENT_ID:-}" "optional"
check_var "OAuth Partner Client Secret" "${PARTNER_RENDEZ_CLIENT_SECRET:-}" "optional"
echo ""

echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo -e "Total Checks: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}Some required variables are missing. App submission will fail.${NC}"
    exit 1
elif [[ $WARNINGS -gt 0 ]]; then
    echo -e "${YELLOW}Some optional variables are not set. Features may be limited.${NC}"
    exit 0
else
    echo -e "${GREEN}All required variables are configured!${NC}"
    exit 0
fi
