#!/usr/bin/env python3
import os
import shutil
from pathlib import Path

base = "/Users/rejaulkarim/Documents/ReZ Full App"
dest_base = f"{base}/rez-ai-platform/services"

services = [
    ("REZ-support-copilot", "REZ-support-copilot"),
    ("rez-push-service", "rez-push-service"),
    ("rez-observability", "rez-observability"),
    ("rez-personalization-engine", "rez-personalization-engine"),
    ("rez-recommendation-engine", "rez-recommendation-engine"),
    ("rez-targeting-engine", "rez-targeting-engine"),
]

for src_name, dest_name in services:
    src = Path(f"{base}/{src_name}")
    dest = Path(f"{dest_base}/{dest_name}")
    dest.mkdir(parents=True, exist_ok=True)

    for item in src.rglob("*"):
        if "node_modules" in str(item):
            continue
        if item.is_file():
            rel_path = item.relative_to(src)
            dest_file = dest / rel_path
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, dest_file)
            print(f"Copied: {dest_name}/{rel_path}")

print("Done!")
