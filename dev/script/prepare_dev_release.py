#!/usr/bin/env python3

import json 
import os

manifest = None
manifestfile = os.path.join("manifest.json")

with open(manifestfile, "r") as manifest_file:
    manifest = json.load(manifest_file)

version_three_digits = ".".join(manifest["version"].split(".")[:3])
version_fourth_digit = ".".join(manifest["version"].split(".")[3:])

with open(manifestfile, "w") as manifest_file:
    manifest["name"] = "VTR (DEVELOPER VERSION)"
    manifest["version_name"] = f"{version_three_digits}-alpha.{version_fourth_digit}"
    manifest["sidebar_action"]["default_title"] = "VTR (DEVELOPER VERSION)"
    manifest["browser_specific_settings"]["gecko"]["id"] = "vtrbeta@go-dev.de"
    manifest["browser_specific_settings"]["gecko"]["update_url"] = "https://files.addons.cr0ydon.eu/vtr/updates.json"

    manifest = json.dumps(manifest, indent=4)
    manifest_file.write("{}\n".format(manifest))
