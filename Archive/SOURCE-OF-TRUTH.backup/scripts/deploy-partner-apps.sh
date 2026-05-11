#!/bin/bash
# Partner Apps Deployment Script
# Deploys Rendez, AdBazaar, and Hotel OTA to production

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get the parent directory (full repo root)
# Script is in SOURCE-OF-TRUTH/scripts/, so go up 2 levels
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "=========================================="
echo "REZ Platform - Partner Apps Deployment"
echo "=========================================="
echo ""

# Function to deploy an app
deploy_app() {
    local app_name=$1
    local app_path=$2
    local deploy_cmd=$3

    echo -e "${BLUE}[$app_name]${NC} Checking..."

    if [[ ! -d "$app_path" ]]; then
        echo -e "${RED}[$app_name]${NC} Path not found: $app_path"
        return 1
    fi

    cd "$app_path"

    if [[ -d ".git" ]]; then
        echo -e "${GREEN}[$app_name]${NC} Git repo found"

        # Check if there are uncommitted changes
        if [[ -n "$(git status --porcelain)" ]]; then
            echo -e "${YELLOW}[$app_name]${NC} Warning: Uncommitted changes exist"
            read -p "Commit before deploying? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git add -A
                git commit -m "Auto-commit before deployment"
                git push
            fi
        fi

        # Check remote
        if git remote get-url origin &>/dev/null; then
            echo -e "${GREEN}[$app_name]${NC} Remote configured"
        else
            echo -e "${YELLOW}[$app_name]${NC} Warning: No remote configured"
        fi
    fi

    echo -e "${BLUE}[$app_name]${NC} Deployment command: $deploy_cmd"
    echo ""

    return 0
}

# Rendez Deployment
echo -e "${BLUE}=== Rendez ===${NC}"
if [[ -d "$REPO_ROOT/Rendez" ]]; then
    cd "$REPO_ROOT/Rendez"

    echo "Checking Rendez deployment readiness..."
    echo ""

    # Check environment file
    if [[ -f "rendez-backend/.env.example" ]]; then
        echo -e "${GREEN}[Rendez]${NC} .env.example found in rendez-backend"

        if [[ ! -f "rendez-backend/.env" ]]; then
            echo -e "${YELLOW}[Rendez]${NC} Warning: .env not found, copying from example"
            cp rendez-backend/.env.example rendez-backend/.env 2>/dev/null || true
        fi
    fi

    # Render deployment
    if command -v render &> /dev/null; then
        echo -e "${GREEN}[Rendez]${NC} Render CLI found"
        # render deploy --service-id=<id>
    else
        echo -e "${YELLOW}[Rendez]${NC} Render CLI not found. Install with: npm install -g @render/cli"
    fi

    echo ""
else
    echo -e "${RED}[Rendez]${NC} Not found at $REPO_ROOT/Rendez"
fi

# AdBazaar Deployment
echo -e "${BLUE}=== AdBazaar ===${NC}"
if [[ -d "$REPO_ROOT/adBazaar" ]]; then
    cd "$REPO_ROOT/adBazaar"

    echo "Checking AdBazaar deployment readiness..."
    echo ""

    # Check environment file
    if [[ -f ".env.example" ]]; then
        echo -e "${GREEN}[AdBazaar]${NC} .env.example found"

        if [[ ! -f ".env" ]]; then
            echo -e "${YELLOW}[AdBazaar]${NC} Warning: .env not found"
        fi
    fi

    # Check for OAuth integration
    if grep -q "PARTNER_RENDEZ_CLIENT_ID" ".env.example" 2>/dev/null; then
        echo -e "${GREEN}[AdBazaar]${NC} OAuth partner variables documented"
    fi

    echo ""
else
    echo -e "${RED}[AdBazaar]${NC} Not found at $REPO_ROOT/adBazaar"
fi

# Hotel OTA Deployment
echo -e "${BLUE}=== Hotel OTA ===${NC}"
if [[ -d "$REPO_ROOT/Hotel OTA" ]]; then
    cd "$REPO_ROOT/Hotel OTA"

    echo "Checking Hotel OTA deployment readiness..."
    echo ""

    # Check environment file
    if [[ -f "apps/api/.env.example" ]]; then
        echo -e "${GREEN}[Hotel OTA]${NC} .env.example found"

        if [[ ! -f "apps/api/.env" ]]; then
            echo -e "${YELLOW}[Hotel OTA]${NC} Warning: .env not found"
        fi
    fi

    # Check booking sync is registered
    if grep -q "bookingSyncRoutes" "apps/api/src/index.ts" 2>/dev/null; then
        echo -e "${GREEN}[Hotel OTA]${NC} Booking sync routes registered"
    fi

    # Check OAuth integration
    if grep -q "PARTNER_STAY_OWEN_CLIENT_ID" "apps/api/.env.example" 2>/dev/null; then
        echo -e "${GREEN}[Hotel OTA]${NC} OAuth partner variables documented"
    fi

    echo ""
else
    echo -e "${RED}[Hotel OTA]${NC} Not found at $REPO_ROOT/Hotel OTA"
fi

# Summary
echo "=========================================="
echo "Deployment Checklist"
echo "=========================================="
echo ""
echo "Before deploying, ensure:"
echo "1. All .env files are configured with real values"
echo "2. All required API keys are set"
echo "3. Git remotes are configured"
echo "4. Render/hosting services are set up"
echo ""
echo "Quick Commands:"
echo "  Rendez:     cd $REPO_ROOT/Rendez && render deploy"
echo "  AdBazaar:   cd $REPO_ROOT/adBazaar && vercel --prod"
echo "  Hotel OTA:  cd '$REPO_ROOT/Hotel OTA' && render deploy"
echo ""
