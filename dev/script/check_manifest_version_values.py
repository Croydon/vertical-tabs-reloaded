#!/usr/bin/env python3

import json 
import os
import sys

manifest = None
manifestfile = os.path.join("manifest.json")

with open(manifestfile, "r") as manifest_file:
    manifest = json.load(manifest_file)


version_three_digits = ".".join(manifest["version"].split(".")[:3])
if version_three_digits != manifest["version_name"]:
    print("Error in manifest.json: The first three digit parts of `version` have to be identical to `version_schema`")
    print(f"Error in manifest.json: The first three digit parts of `version` are: {version_three_digits}")
    print(f"Error in manifest.json: `version_schema` is: {manifest['version_name']}")
    sys.exit(1)
