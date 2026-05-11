#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Running TypeScript type checking..."

cd "$ROOT_DIR"

# Type check shared-types
if [ -d "packages/shared-types" ]; then
  echo "Checking shared-types..."
  npx tsc --noEmit -p packages/shared-types/tsconfig.json
fi

# Type check rez-ai-types
if [ -d "packages/rez-ai-types" ]; then
  echo "Checking rez-ai-types..."
  npx tsc --noEmit -p packages/rez-ai-types/tsconfig.json
fi

# Type check services
for service in packages/*/; do
  if [ -f "${service}tsconfig.json" ]; then
    service_name=$(basename "$service")
    echo "Checking $service_name..."
    npx tsc --noEmit -p "${service}tsconfig.json" || exit 1
  fi
done

echo "Type checking complete!"
