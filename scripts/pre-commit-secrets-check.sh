#!/bin/bash
# =============================================================================
# REZ Ecosystem - Pre-commit Secret Check Hook
# =============================================================================
# This script runs before every commit to prevent accidentally committing secrets.
#
# Install:
#   cp scripts/pre-commit-secrets-check.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Or use as a shared hook:
#   git config core.hooksPath scripts/hooks
# =============================================================================

set -e

echo "🔍 Checking for secrets before commit..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BLOCKED=0

# Patterns that indicate secrets (case-insensitive)
PATTERNS=(
    # AWS Keys
    "AKIA[0-9A-Z]{16}"
    # Generic API keys (hex strings 32+ chars)
    "[a-f0-9]{32,}"
    # Password assignments in code
    "password\s*=\s*['\"][^'\"]{8,}['\"]"
    "secret\s*=\s*['\"][^'\"]{8,}['\"]"
    # MongoDB URIs with credentials
    "mongodb\+srv://[^:]+:[^@]+@"
    # JWT secrets (base64 or hex)
    "jwt.*secret.*=.*['\"][A-Za-z0-9+/=]{32,}['\"]"
    # Private keys
    "-----BEGIN.*PRIVATE KEY-----"
    # Connection strings with passwords
    "postgres://[^:]+:[^@]+@"
    "redis://[^:]*:[^@]+@"
)

# Files to check
FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$FILES" ]; then
    echo -e "${GREEN}✓ No files to check${NC}"
    exit 0
fi

echo "Checking ${FILES}..."

for pattern in "${PATTERNS[@]}"; do
    MATCHES=$(echo "$FILES" | xargs grep -lE "$pattern" 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
        echo -e "${RED}✗ BLOCKED: Secret pattern detected: $pattern${NC}"
        echo "Found in:"
        for file in $MATCHES; do
            echo "  - $file"
            # Show the offending line (with masking)
            grep -nE "$pattern" "$file" 2>/dev/null | head -3 | sed 's/^/    /'
        done
        BLOCKED=1
    fi
done

# Check for .env files being committed
ENVS=$(echo "$FILES" | grep -E "^\.env$" || true)
if [ -n "$ENVS" ]; then
    echo -e "${RED}✗ BLOCKED: .env file(s) being committed:${NC}"
    for file in $ENVS; do
        echo "  - $file"
    done
    echo "Use .env.example as a template instead."
    BLOCKED=1
fi

# Check for known exposed credentials
EXPOSED_PASSWORDS=(
    "RmptskyDLFNSJGCA"
    "ZAFYAYH1zK0C74Ap"
)

for cred in "${EXPOSED_PASSWORDS[@]}"; do
    EXPOSED=$(echo "$FILES" | xargs grep -l "$cred" 2>/dev/null || true)
    if [ -n "$EXPOSED" ]; then
        echo -e "${RED}✗ BLOCKED: Known exposed credential detected${NC}"
        echo "Found in:"
        for file in $EXPOSED; do
            echo "  - $file"
        done
        BLOCKED=1
    fi
done

if [ $BLOCKED -eq 1 ]; then
    echo ""
    echo -e "${RED}Commit blocked due to security concerns.${NC}"
    echo "Remove secrets and use environment variables instead."
    echo ""
    echo "To bypass this check (NOT RECOMMENDED):"
    echo "  git commit --no-verify -m 'message'"
    exit 1
fi

echo -e "${GREEN}✓ No secrets detected${NC}"
exit 0
