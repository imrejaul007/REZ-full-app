#!/bin/bash
# generate-sentry-dsn.sh
# Generate placeholder Sentry DSN values for all services
# Update these with actual DSNs from sentry.io

set -e

echo "=========================================="
echo "ReZ Sentry DSN Generator"
echo "=========================================="
echo ""

SENTRY_ORG="${SENTRY_ORG:-your-org}"
SENTRY_PROJECT_PREFIX="${SENTRY_PROJECT_PREFIX:-rez}"

echo "Organization: $SENTRY_ORG"
echo "Project Prefix: $SENTRY_PROJECT_PREFIX"
echo ""

# List of all services
SERVICES=(
    "rez-ads-service"
    "rez-auth-service"
    "rez-automation-service"
    "rez-catalog-service"
    "rez-corpperks-service"
    "rez-feedback-service"
    "rez-finance-service"
    "rez-gamification-service"
    "rez-hotel-service"
    "rez-insights-service"
    "rez-karma-service"
    "rez-marketing-service"
    "rez-merchant-intelligence-service"
    "rez-merchant-service"
    "rez-order-service"
    "rez-payment-service"
    "rez-procurement-service"
    "rez-push-service"
    "rez-scheduler-service"
    "rez-search-service"
    "rez-user-intelligence-service"
    "rez-wallet-service"
)

echo "To create Sentry projects:"
echo ""
echo "1. Go to https://sentry.io/organizations/$SENTRY_ORG/projects"
echo "2. Create a new project for each service:"
echo ""

for service in "${SERVICES[@]}"; do
    project_name="${service#rez-}"
    project_name="${project_name%-service}"
    echo "  - $SENTRY_PROJECT_PREFIX-$project_name"
done

echo ""
echo "3. Get the DSN for each project and update .env:"
echo ""
for service in "${SERVICES[@]}"; do
    project_name="${service#rez-}"
    project_name="${project_name%-service}"
    echo "  $service:"
    echo "    SENTRY_DSN=https://xxx@sentry.io/yyy"
done

echo ""
echo "After creating projects, update SENTRY_DSN in each service's environment."
