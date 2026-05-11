#!/bin/bash
# =============================================================================
# Data Migration Script
# Migrates data from legacy services to unified services
# =============================================================================

set -e

LEGACY_INTENT_URL="${LEGACY_INTENT_URL:-http://localhost:3005}"
NEW_INTENT_URL="${NEW_INTENT_URL:-http://localhost:4009}"

echo "🚀 Data Migration: Legacy → Unified Services"
echo "============================================"
echo "Legacy URL: $LEGACY_INTENT_URL"
echo "New URL: $NEW_INTENT_URL"

# Check services are running
check_service() {
    local url=$1
    local name=$2
    if curl -sf "$url/health" > /dev/null 2>&1; then
        echo "✅ $name is running"
        return 0
    else
        echo "❌ $name is not running"
        return 1
    fi
}

echo ""
echo "Checking services..."
check_service "$LEGACY_INTENT_URL" "Legacy Intent Service" || exit 1
check_service "$NEW_INTENT_URL" "New Intent Service" || exit 1

# Migration functions
migrate_users() {
    echo ""
    echo "📦 Migrating users..."

    # Get all users from legacy
    local users=$(curl -s "$LEGACY_INTENT_URL/api/users" | jq -c '.[]' 2>/dev/null || echo "")

    if [ -z "$users" ]; then
        echo "No users to migrate"
        return
    fi

    local count=0
    for user in $users; do
        local userId=$(echo "$user" | jq -r '.userId')

        # Migrate user profile
        curl -s -X POST "$NEW_INTENT_URL/api/profiles/$userId" \
            -H "Content-Type: application/json" \
            -d "$user" > /dev/null

        ((count++))
    done

    echo "Migrated $count users"
}

migrate_intents() {
    echo ""
    echo "📦 Migrating intents..."

    local intents=$(curl -s "$LEGACY_INTENT_URL/api/intents" | jq -c '.[]' 2>/dev/null || echo "")

    if [ -z "$intents" ]; then
        echo "No intents to migrate"
        return
    fi

    local count=0
    for intent in $intents; do
        local userId=$(echo "$intent" | jq -r '.userId')

        # Re-capture each signal
        curl -s -X POST "$NEW_INTENT_URL/api/signals/capture" \
            -H "Content-Type: application/json" \
            -d "$intent" > /dev/null

        ((count++))
    done

    echo "Migrated $count intents"
}

migrate_segments() {
    echo ""
    echo "📦 Migrating segments..."

    # Get segments from legacy
    local segments=$(curl -s "$LEGACY_INTENT_URL/api/segments" | jq -c '.[]' 2>/dev/null || echo "")

    if [ -z "$segments" ]; then
        echo "No segments to migrate"
        return
    fi

    local count=0
    for segment in $segments; do
        local segmentId=$(echo "$segment" | jq -r '.id')
        curl -s -X POST "$NEW_INTENT_URL/api/segments" \
            -H "Content-Type: application/json" \
            -d "$segment" > /dev/null
        ((count++))
    done

    echo "Migrated $count segments"
}

migrate_campaigns() {
    echo ""
    echo "📦 Migrating campaigns..."

    local campaigns=$(curl -s "$LEGACY_AD_URL/api/campaigns" | jq -c '.[]' 2>/dev/null || echo "")

    if [ -z "$campaigns" ]; then
        echo "No campaigns to migrate"
        return
    fi

    local count=0
    for campaign in $campaigns; do
        curl -s -X POST "$NEW_AD_URL/api/campaigns" \
            -H "Content-Type: application/json" \
            -d "$campaign" > /dev/null
        ((count++))
    done

    echo "Migrated $count campaigns"
}

# Verify migration
verify_migration() {
    echo ""
    echo "🔍 Verifying migration..."

    local legacy_count=$(curl -s "$LEGACY_INTENT_URL/api/users" | jq '. | length' 2>/dev/null || echo "0")
    local new_count=$(curl -s "$NEW_INTENT_URL/api/users" | jq '. | length' 2>/dev/null || echo "0")

    echo "Legacy users: $legacy_count"
    echo "New users: $new_count"

    if [ "$new_count" -ge "$legacy_count" ]; then
        echo "✅ Migration verified!"
    else
        echo "⚠️ Some users may not have migrated"
    fi
}

# Rollback function
rollback() {
    echo ""
    echo "⚠️ Rolling back..."

    # Clear new service data
    curl -s -X POST "$NEW_INTENT_URL/api/maintenance/clear" > /dev/null || true

    echo "Rollback complete"
}

# Main
case "${1:-migrate}" in
    migrate)
        migrate_users
        migrate_intents
        migrate_segments
        verify_migration
        ;;
    rollback)
        rollback
        ;;
    *)
        echo "Usage: $0 {migrate|rollback}"
        exit 1
        ;;
esac

echo ""
echo "✅ Migration script complete!"
