#!/bin/bash
# =============================================================================
# REZ Ecosystem - Secrets Rotation Script
# =============================================================================
# This script generates new secrets to replace exposed credentials.
# Run this to rotate all secrets that were committed to git.
#
# WARNING: After running, update all environment variables in:
#   - Render Dashboard
#   - Vercel Environment Variables
#   - Local .env files
#
# Usage:
#   ./scripts/rotate-exposed-secrets.sh
# =============================================================================

set -e

echo "=============================================="
echo "REZ Ecosystem - Secrets Rotation Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to generate and display secrets
generate_secret() {
    local name="$1"
    local length="${2:-64}"
    local secret=$(openssl rand -hex "$length")
    echo "$secret"
}

# Function to display secret with masking
show_secret() {
    local name="$1"
    local secret="$2"
    local masked="${secret:0:8}...${secret: -8}"
    echo -e "${GREEN}$name${NC}: $masked"
    echo "  Full: $secret"
    echo ""
}

echo -e "${YELLOW}Generating new secrets...${NC}"
echo ""

# ============================================
# 1. MONGODB ATLAS PASSWORDS
# ============================================
echo "--- MongoDB Atlas Passwords ---"
echo ""

# Cluster 0 (main RABTUL services)
MONGODB_CLUSTER0_NEW=$(generate_secret "MONGODB_CLUSTER0_PASSWORD" 32)
show_secret "MONGODB_CLUSTER0_NEW_PASSWORD" "$MONGODB_CLUSTER0_NEW"

# Cluster for rez-intent-graph
MONGODB_INTENT_NEW=$(generate_secret "MONGODB_INTENT_PASSWORD" 32)
show_secret "MONGODB_INTENT_PASSWORD" "$MONGODB_INTENT_NEW"

# ============================================
# 2. JWT SECRETS
# ============================================
echo "--- JWT Secrets ---"
echo ""

JWT_SECRET=$(generate_secret "JWT_SECRET" 64)
show_secret "JWT_SECRET" "$JWT_SECRET"

JWT_MERCHANT_SECRET=$(generate_secret "JWT_MERCHANT_SECRET" 64)
show_secret "JWT_MERCHANT_SECRET" "$JWT_MERCHANT_SECRET"

JWT_ADMIN_SECRET=$(generate_secret "JWT_ADMIN_SECRET" 64)
show_secret "JWT_ADMIN_SECRET" "$JWT_ADMIN_SECRET"

JWT_REFRESH_SECRET=$(generate_secret "JWT_REFRESH_SECRET" 64)
show_secret "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET"

# ============================================
# 3. INTERNAL SERVICE TOKENS
# ============================================
echo "--- Internal Service Tokens ---"
echo ""

INTERNAL_SERVICE_TOKEN=$(generate_secret "INTERNAL_SERVICE_TOKEN" 32)
show_secret "INTERNAL_SERVICE_TOKEN" "$INTERNAL_SERVICE_TOKEN"

# Service-specific tokens (JSON format)
INTERNAL_SERVICE_TOKENS_JSON=$(cat <<EOF
{
  "payment-service": "$(generate_secret 'PAYMENT_TOKEN' 32)",
  "wallet-service": "$(generate_secret 'WALLET_TOKEN' 32)",
  "order-service": "$(generate_secret 'ORDER_TOKEN' 32)",
  "auth-service": "$(generate_secret 'AUTH_TOKEN' 32)",
  "intent-graph": "$(generate_secret 'INTENT_TOKEN' 32)"
}
EOF
)
echo -e "${GREEN}INTERNAL_SERVICE_TOKENS_JSON${NC}:"
echo "$INTERNAL_SERVICE_TOKENS_JSON"
echo ""

# ============================================
# 4. OTP/MFA SECRETS
# ============================================
echo "--- OTP/MFA Secrets ---"
echo ""

OTP_HMAC_SECRET=$(generate_secret "OTP_HMAC_SECRET" 64)
show_secret "OTP_HMAC_SECRET" "$OTP_HMAC_SECRET"

OTP_TOTP_ENCRYPTION_KEY=$(generate_secret "OTP_TOTP_ENCRYPTION_KEY" 32)
show_secret "OTP_TOTP_ENCRYPTION_KEY" "$OTP_TOTP_ENCRYPTION_KEY"

# ============================================
# 5. RAZORPAY KEYS
# ============================================
echo "--- Razorpay Keys ---"
echo ""
echo -e "${YELLOW}NOTE: Rotate Razorpay keys in Razorpay Dashboard${NC}"
echo "https://dashboard.razorpay.com/app/keys"
echo ""
echo "Generate new keys and update:"
echo "  RAZORPAY_KEY_ID"
echo "  RAZORPAY_KEY_SECRET"
echo "  RAZORPAY_WEBHOOK_SECRET"
echo ""

# ============================================
# 6. REDIS CREDENTIALS
# ============================================
echo "--- Redis Credentials ---"
echo ""

REDIS_PASSWORD=$(generate_secret "REDIS_PASSWORD" 32)
show_secret "REDIS_PASSWORD" "$REDIS_PASSWORD"

# ============================================
# 7. SENTRY DSN
# ============================================
echo "--- Sentry DSN ---"
echo ""
echo -e "${YELLOW}NOTE: Rotate Sentry DSN in Sentry Dashboard${NC}"
echo "https://sentry.io/settings/"
echo ""
echo "Generate new DSN and update:"
echo "  SENTRY_DSN"
echo ""

# ============================================
# SUMMARY
# ============================================
echo "=============================================="
echo "SECRETS GENERATION COMPLETE"
echo "=============================================="
echo ""
echo -e "${RED}ACTION REQUIRED:${NC}"
echo "1. Update MongoDB Atlas passwords:"
echo "   https://cloud.mongodb.com/v/clusters"
echo ""
echo "2. Update all environment variables in:"
echo "   - Render Dashboard"
echo "   - Vercel Environment Variables"
echo "   - Local .env files (copy from .env.example)"
echo ""
echo "3. Update Razorpay keys in Razorpay Dashboard"
echo ""
echo "4. Update Sentry DSN in Sentry Dashboard"
echo ""
echo "5. Restart all affected services"
echo ""

# Save to a secure location
SECRETS_FILE="./generated-secrets-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "REZ Ecosystem - Generated Secrets"
    echo "Generated: $(date)"
    echo ""
    echo "MONGODB_CLUSTER0_PASSWORD=$MONGODB_CLUSTER0_NEW"
    echo "MONGODB_INTENT_PASSWORD=$MONGODB_INTENT_NEW"
    echo ""
    echo "JWT_SECRET=$JWT_SECRET"
    echo "JWT_MERCHANT_SECRET=$JWT_MERCHANT_SECRET"
    echo "JWT_ADMIN_SECRET=$JWT_ADMIN_SECRET"
    echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
    echo ""
    echo "INTERNAL_SERVICE_TOKEN=$INTERNAL_SERVICE_TOKEN"
    echo ""
    echo "OTP_HMAC_SECRET=$OTP_HMAC_SECRET"
    echo "OTP_TOTP_ENCRYPTION_KEY=$OTP_TOTP_ENCRYPTION_KEY"
    echo ""
    echo "REDIS_PASSWORD=$REDIS_PASSWORD"
} > "$SECRETS_FILE"

echo -e "${GREEN}Secrets saved to: $SECRETS_FILE${NC}"
echo -e "${RED}DELETE THIS FILE AFTER UPDATING ALL SERVICES!${NC}"
echo ""
