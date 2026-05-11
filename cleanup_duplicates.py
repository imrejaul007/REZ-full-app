#!/usr/bin/env python3
import shutil
from pathlib import Path

services_dir = Path("/Users/rejaulkarim/Documents/ReZ Full App/rez-ai-platform/services")

# Pairs of (empty_dir, populated_dir)
to_clean = [
    ("observability", "rez-observability"),
    ("personalization-engine", "rez-personalization-engine"),
    ("push-service", "rez-push-service"),
    ("recommendation-engine", "rez-recommendation-engine"),
    ("targeting-engine", "rez-targeting-engine"),
    ("support-copilot", "REZ-support-copilot"),
]

for empty, populated in to_clean:
    empty_path = services_dir / empty
    populated_path = services_dir / populated

    if empty_path.exists() and not any(empty_path.iterdir()):
        print(f"Removing empty: {empty_path}")
        shutil.rmtree(empty_path)

    if populated_path.exists():
        # Rename to the clean name
        clean_name = empty if "support-copilot" not in empty else "support-copilot"
        if populated_path.name != clean_name:
            new_path = services_dir / clean_name
            if new_path.exists():
                shutil.rmtree(new_path)
            print(f"Renaming {populated_path} -> {new_path}")
            shutil.move(str(populated_path), str(new_path))

# Remove old rez-copilot and rez-intent-graph if empty
for old_dir in ["rez-copilot", "rez-intent-graph"]:
    old_path = services_dir / old_dir
    if old_path.exists():
        contents = list(old_path.iterdir())
        if not contents:
            print(f"Removing empty: {old_path}")
            shutil.rmtree(old_path)

print("Done!")
