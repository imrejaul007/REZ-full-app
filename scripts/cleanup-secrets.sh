#!/bin/bash
# SECURITY: Remove committed secrets from git history
# WARNING: This will rewrite git history. Make sure to backup and coordinate with team.

set -e

echo "=========================================="
echo "Git History Secret Cleanup Script"
echo "=========================================="
echo ""
echo "WARNING: This script will rewrite git history."
echo "Make sure to:"
echo "  1. Backup your repository"
echo "  2. Coordinate with team members"
echo "  3. Force push after completion"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Identifying files with secrets..."

# Files to remove from history
FILES_TO_REMOVE=(
    "**/hotel-management.env"
    "**/hotel-management-1.env"
    "**/REZ-MIND-CONFIG.env"
    "Hotel OTA/**/.env"
    "Hotel-OTA/**/.env"
    "REZ-*/.env"
    "**/.env"
)

# Create a temporary git filter
echo ""
echo "Step 2: Removing secrets from git history..."
echo "This may take a while for large repositories..."

# Use git filter-repo (recommended) or git filter-branch (legacy)
if command -v git-filter-repo &> /dev/null; then
    echo "Using git-filter-repo..."
    git filter-repo --path-glob '*.env' --invert-paths --force
else
    echo "Using git filter-branch (slower)..."
    echo "Consider installing git-filter-repo for faster execution:"
    echo "  pip install git-filter-repo"

    for pattern in "${FILES_TO_REMOVE[@]}"; do
        echo "Processing pattern: $pattern"
        git filter-branch --force --index-filter \
            "git rm --cached --ignore-unmatch '$pattern'" \
            --prune-empty --tag-name-filter cat -- --all 2>/dev/null || true
    done
fi

echo ""
echo "Step 3: Cleaning up reflog..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "=========================================="
echo "Cleanup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Review the changes: git log --oneline -5"
echo "  2. Force push: git push origin --force --all"
echo "  3. Notify team to re-clone: rm -rf <repo> && git clone <url>"
echo "  4. ROTATE ALL EXPOSED SECRETS IMMEDIATELY"
echo ""
echo "Secrets that need rotation:"
echo "  - JWT_SECRET values"
echo "  - MongoDB passwords"
echo "  - Redis passwords"
echo "  - Stripe keys"
echo "  - SMTP credentials"
echo "  - Encryption keys"
echo "  - All third-party API keys"
echo ""
