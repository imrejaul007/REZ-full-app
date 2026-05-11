#!/usr/bin/env python3
import shutil
from pathlib import Path

services_dir = Path("/Users/rejaulkarim/Documents/ReZ Full App/rez-ai-platform/services")

for service_dir in services_dir.iterdir():
    if service_dir.is_dir():
        contents = list(service_dir.iterdir())
        if not contents:
            print(f"Removing empty: {service_dir}")
            shutil.rmtree(service_dir)

print("Done!")
