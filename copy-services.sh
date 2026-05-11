#!/bin/bash
set -e

BASE="/Users/rejaulkarim/Documents/ReZ Full App"
DEST="$BASE/rez-ai-platform/services"

# Function to copy directory contents
copy_service() {
    local src_name="$1"
    local dest_name="$2"
    local src="$BASE/$src_name"
    local dest="$DEST/$dest_name"

    echo "Copying $src_name -> $dest_name"

    # Find all files excluding node_modules
    find "$src" -type f ! -path "*/node_modules/*" | while read -r file; do
        # Get relative path
        relpath="${file#$src/}"
        # Create destination directory
        dest_file="$dest/$relpath"
        dest_dir="$(dirname "$dest_file")"
        mkdir -p "$dest_dir"
        # Copy file
        cp "$file" "$dest_file"
    done
    echo "Done: $dest_name"
}

# Copy all services
copy_service "REZ-support-copilot" "support-copilot"
copy_service "rez-push-service" "push-service"
copy_service "rez-observability" "observability"
copy_service "rez-personalization-engine" "personalization-engine"
copy_service "rez-recommendation-engine" "recommendation-engine"
copy_service "rez-targeting-engine" "targeting-engine"

echo "All services copied successfully!"
