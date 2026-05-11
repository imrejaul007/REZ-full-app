#!/bin/bash
# Quick start for developers

set -e

echo "Setting up REZ..."

# Install
npm install

# Build
npm run build

# Start
docker-compose up -d

echo "REZ is ready at http://localhost:3000"
