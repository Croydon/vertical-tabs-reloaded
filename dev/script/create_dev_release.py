#!/usr/bin/env python3

import json 
import os 

manifest = None
updates = None
manifestfile = os.path.join("manifest.json")
root_addon_dir = os.path.join("browser-addons-files", "vtr")
updatefile = os.path.join(root_addon_dir, "updates.json")
webpage = os.path.join(root_addon_dir, "index.html")

with open(manifestfile, "r") as manifest_file:
    manifest = json.load(manifest_file)

with open(updatefile, "r") as update_file:
    updates = json.load(update_file)

new_version_filename = f"vtr_developer_version-{manifest['version']}_{manifest['version_name']}.xpi"

os.rename(
    os.path.join(root_addon_dir, "files", f"vtr_developer_version-{manifest['version']}.xpi"),
    os.path.join(root_addon_dir, "files", new_version_filename),
    )

download_url = f"https://files.addons.cr0ydon.eu/vtr/files/{new_version_filename}"

with open(updatefile, "w") as update_file:
    new_version = {
        "version": manifest["version"], 
        "update_link": download_url
        }
    updates["addons"]["vtrbeta@go-dev.de"]["updates"] += [new_version]

    updates = json.dumps(updates, indent=4)
    update_file.write("{}\n".format(updates))


with open(webpage, "w") as update_file:
    data = """<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>VTR (DEVELOPER VERSION)</title>
    </head>
    <body style="height: 100vh;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
            If you don't know what this page is about, go to <a href="https://github.com/Croydon/vertical-tabs-reloaded" title="Vertical Tabs Reloaded">https://github.com/Croydon/vertical-tabs-reloaded</a> instead. 

            <br><br><br>

            <a href="{}" title="Install VTR DEVELOPER VERSION">Install VTR DEVELOPER VERSION</a>
        </div>
    </body>
</html>""".format(download_url)
    update_file.write("{}\n".format(data))
