#!/bin/bash
# Comprehensive Audit Script for REZ Ecosystem

echo "=========================================="
echo "REZ ECOSYSTEM COMPREHENSIVE AUDIT"
echo "=========================================="
echo ""

AUDIT_DIR="audit/comprehensive"
mkdir -p "$AUDIT_DIR"

# 1. Count all services
echo "=== SERVICE INVENTORY ==="
total=0
has_src=0
has_build=0
has_dist=0

for dir in rez-*/; do
  if [[ "$dir" == *"backup"* ]] || [[ "$dir" == *"-DELETED"* ]]; then continue; fi
  ((total++))
  
  if [ -d "$dir/src" ]; then
    ((has_src++))
    if [ -f "$dir/package.json" ]; then
      if grep -q '"build"' "$dir/package.json" 2>/dev/null; then
        ((has_build++))
      fi
    fi
  fi
  
  if [ -d "$dir/dist" ]; then
    ((has_dist++))
  fi
done

echo "Total services: $total"
echo "With src/: $has_src"
echo "With build script: $has_build"
echo "With dist/: $has_dist"

# 2. Services missing src/
echo ""
echo "=== SERVICES MISSING src/ ==="
for dir in rez-*/; do
  if [[ "$dir" == *"backup"* ]] || [[ "$dir" == *"-DELETED"* ]]; then continue; fi
  if [ ! -d "$dir/src" ]; then
    echo "  $dir"
  fi
done

# 3. Services with missing index.ts
echo ""
echo "=== SERVICES MISSING src/index.ts ==="
for dir in rez-*/; do
  if [[ "$dir" == *"backup"* ]] || [[ "$dir" == *"-DELETED"* ]]; then continue; fi
  if [ -d "$dir/src" ] && [ ! -f "$dir/src/index.ts" ]; then
    echo "  $dir"
  fi
done

# 4. Check package.json files
echo ""
echo "=== SERVICES MISSING package.json ==="
for dir in rez-*/; do
  if [[ "$dir" == *"backup"* ]] || [[ "$dir" == *"-DELETED"* ]]; then continue; fi
  if [ ! -f "$dir/package.json" ]; then
    echo "  $dir"
  fi
done

# 5. Get PORT from each service
echo ""
echo "=== SERVICE PORTS (from source) ==="
for dir in rez-*/; do
  if [[ "$dir" == *"backup"* ]] || [[ "$dir" == *"-DELETED"* ]]; then continue; fi
  if [ -f "$dir/src/index.ts" ]; then
    port=$(grep -oP "process\.env\.PORT.*?'\K[0-9]+" "$dir/src/index.ts" 2>/dev/null | head -1)
    if [ -z "$port" ]; then
      port=$(grep -oP "parseInt\(process\.env\.PORT.*?'\K[0-9]+" "$dir/src/index.ts" 2>/dev/null | head -1)
    fi
    if [ -n "$port" ]; then
      echo "  $dir: $port"
    fi
  fi
done | sort -t: -k2 -n

# 6. Check docker-compose services
echo ""
echo "=== docker-compose.yml SERVICE COUNT ==="
docker_count=$(grep -c "^[a-z].*:" docker-compose.yml 2>/dev/null || echo "0")
echo "Services in docker-compose.yml: $docker_count"

# 7. Dependency conflicts
echo ""
echo "=== DEPENDENCY CHECK ==="
echo "Checking zod versions..."
for dir in rez-*/; do
  if [[ "$dir" == *"backup"* ]] || [[ "$dir" == *"-DELETED"* ]]; then continue; fi
  if [ -f "$dir/package.json" ]; then
    zod=$(grep -oP '"zod":\s*"\K[^"]+' "$dir/package.json" 2>/dev/null)
    if [ -n "$zod" ]; then
      echo "  $dir: zod=$zod"
    fi
  fi
done

echo ""
echo "Audit complete. Results saved to $AUDIT_DIR/"
