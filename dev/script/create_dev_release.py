#!/usr/bin/env python3

import json 
import os 

manifest = None
updates = None
manifestfile = os.path.join("manifest.json")
updatefile = os.path.join("vtr-releases", "updates.json")

with open(manifestfile, "r") as manifest_file:
    manifest = json.load(manifest_file)

with open(updatefile, "r") as update_file:
    updates = json.load(update_file)

with open(updatefile, "w") as update_file:
    new_version = {
        "version": manifest["version"], 
        "update_link": "https://croydon.github.io/vtr-releases/files/vtr_developer_version-{}-an+fx.xpi".format(manifest["version"])
        }
    updates["addons"]["vtrbeta@go-dev.de"]["updates"].append(new_version)

    updates = json.dumps(updates, indent=4)
    update_file.write("{}\n".format(updates))
