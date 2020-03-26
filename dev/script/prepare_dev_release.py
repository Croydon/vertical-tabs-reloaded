#!/usr/bin/env python3

import json 
import os 

manifest = None
manifestfile = os.path.join("manifest.json")

with open(manifestfile, "r") as manifest_file:
    manifest = json.load(manifest_file)

with open(manifestfile, "w") as manifest_file:
    manifest["name"] = "VTR (DEVELOPER VERSION)"
    manifest["sidebar_action"]["default_title"] = "VTR (DEVELOPER VERSION)"
    manifest["applications"]["gecko"]["id"] = "vtrbeta@go-dev.de"
    manifest["applications"]["gecko"]["update_url"] = "https://croydon.github.io/vtr-releases/updates.json"

    manifest = json.dumps(manifest, indent=4)
    manifest_file.write("{}\n".format(manifest))
