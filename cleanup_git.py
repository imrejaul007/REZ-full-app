#!/usr/bin/env python3
import shutil
from pathlib import Path

services_dir = Path("/Users/rejaulkarim/Documents/ReZ Full App/rez-ai-platform/services")

for service_dir in services_dir.iterdir():
    if service_dir.is_dir():
        git_dir = service_dir / ".git"
        if git_dir.exists():
            print(f"Removing {git_dir}")
            shutil.rmtree(git_dir)
            print(f"Removed {git_dir}")

print("Done cleaning .git directories")
