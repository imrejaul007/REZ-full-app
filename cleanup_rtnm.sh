#!/bin/bash
# RTNM-Group Repository Cleanup Script
# Removes node_modules and .node files from git history

set -e

REPO_PATH="/Users/rejaulkarim/Documents/ReZ Full App/RTNM-Group"
MIRROR_PATH="/tmp/RTNM-Group-mirror"
GITHUB_URL="https://github.com/imrejaul007/RTNM-Group.git"

echo "=== RTNM-Group Repository Cleanup ==="

# Step 1: Navigate to repo
cd "$REPO_PATH" || exit 1
echo "Working in: $(pwd)"

# Step 2: Install git-filter-repo
echo "Installing git-filter-repo..."
pip3 install git-filter-repo

# Step 3: Create bare mirror
echo "Creating mirror..."
rm -rf "$MIRROR_PATH"
git clone --mirror "$GITHUB_URL" "$MIRROR_PATH"

# Step 4 & 5: Filter out node_modules and .node files
cd "$MIRROR_PATH"
echo "Filtering out node_modules and .node files..."
git filter-repo --path-glob '*.node' --invert-paths --force
git filter-repo --path-glob 'node_modules' --invert-paths --force

# Step 6: Push cleaned history
echo "Pushing cleaned history to remote..."
git push --mirror "$GITHUB_URL"

# Step 7: Recreate local repo
cd "$REPO_PATH"
echo "Recreating local repository..."
rm -rf .git
git init
git remote add origin "$GITHUB_URL"
git add -A
git commit -m "Clean repo"
git push -u origin main

echo "=== Cleanup Complete ==="
