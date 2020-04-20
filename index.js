"use strict";

/* global utils */

function manage_installation(details)
{
    utils.options.get_options_file().then(() =>
    {
        if(details.reason == "install")
        {
            // FIXME
            // browser.tabs.create({url: "install-notes.html"});
            // browser.sidebarAction.open();
        }

        if(details.reason == "update")
        {
            utils.log.debug("VTR update!");

            utils.options.get_setting("theme").then(value =>
            {
                if(value == "none")
                {
                    utils.options.save_setting("theme", "dark"); // This is likely irrelvant, but could prevent some race conditions
                    utils.options.restore_default_setting_of("theme");
                }

                if(value == "windows" || value == "linux")
                {
                    utils.options.save_setting("theme", "feather");
                }
            });

            // Migrate toggleDisplayHotkey from legacy (pre-WebExtension format) to WebExtension FF60+ format
            utils.options.get_setting("toggleDisplayHotkey").then(value =>
            {
                // While this only replaces the - with + it triggers an option change which in turns triggers the default
                // hotkey validation check in utils/options.js; if it's invalid we reset to default hotkey
                utils.options.save_setting("toggleDisplayHotkey", value.replace(/-/g, "+"));
            });

            utils.options.get_setting("runtime.vtr.installedVersion").then((installedVersion) =>
            {
                let previousVersion;
                if(installedVersion == undefined)
                {
                    previousVersion = details.previousVersion.split(".");
                    if(typeof browser.sidebarAction != "undefined" && typeof browser.sidebarAction.open != "undefined")
                    {
                        browser.sidebarAction.open();
                    }
                    browser.tabs.create({url: "notes/index.html"});
                }
                else
                {
                    previousVersion = installedVersion.split(".");
                }

                utils.log.debug(previousVersion);
                let major = parseInt(previousVersion[0], 10);
                let minor = parseInt(previousVersion[1], 10);
                let patch;
                if(previousVersion[2].includes("a"))
                {
                    patch = -1; // lets make alpha versions comparable in a more easy way
                }
                else
                {
                    patch = parseInt(previousVersion[2], 10);
                }

                if(installedVersion != undefined && (major < 0 || (major == 0 && minor < 13) || (major == 0 && minor == 13 && patch < 0)))
                {
                    if(typeof browser.sidebarAction != "undefined" && typeof browser.sidebarAction.open != "undefined")
                    {
                        browser.sidebarAction.open();
                    }
                    browser.tabs.create({url: "notes/index.html"});
                }
            });
        }

        let manifest = browser.runtime.getManifest();
        utils.log.debug("manifest version" + manifest.version);
        utils.options.save_setting("runtime.vtr.installedVersion", manifest.version);

        utils.log.debug("manage_installation called");
    });
}

// Set up listener

browser.runtime.onInstalled.addListener(manage_installation);

browser.runtime.onConnect.addListener((port) =>
{
    if(port.sender.id == browser.runtime.id)
    {
        port.onDisconnect.addListener((port) =>
        {
            let portInfo = port.name.split("-");
            if(portInfo[0] == "sidebarAction")
            {
                utils.windows.setSidebarOpenedStatus(portInfo[1], false);
            }
        });

        port.onMessage.addListener((message) =>
        {
            if(message["message"]["type"] == "sidebarAction")
            {
                utils.windows.setSidebarOpenedStatus(message["message"]["windowID"], true);
            }
        });
    }
});

browser.storage.onChanged.addListener(utils.options.on_options_change);

browser.windows.onCreated.addListener((window) =>
{
    utils.windows.add(window.id);
});

browser.windows.onRemoved.addListener((windowID) =>
{
    utils.windows.remove(windowID);
});

browser.windows.getAll({windowTypes: ["normal", "popup"]}).then((windowInfoArray) =>
{
    for (let windowInfo of windowInfoArray)
    {
        utils.windows.add(windowInfo.id);
    }
});

browser.windows.onFocusChanged.addListener((windowID) =>
{
    utils.windows.setCurrentWindow(windowID);
});

browser.windows.getCurrent().then((currentWindow) =>
{
    utils.windows.setCurrentWindow(currentWindow.id);
});

/* browser.commands.onCommand.addListener((command) =>
{
     if (command == "toggleTabbrowser")
    {
        // FIREFIX: FIXME: Firefox dones't count hotkeys as "user input" therefore dones't allow us here to toggle the sidebar... stupid.
         if(utils.windows.getSidebarOpenedStatus(utils.windows.getCurrentWindow()) == false)
        {
            utils.windows.setSidebarOpenedStatus(utils.windows.getCurrentWindow(), true);
            browser.sidebarAction.open();
        }
        else
        {
            utils.windows.setSidebarOpenedStatus(utils.windows.getCurrentWindow(), false);
            browser.sidebarAction.close();
        }
    }
}); */


browser.browserAction.onClicked.addListener(() =>
{
    if(utils.windows.getSidebarOpenedStatus(utils.windows.getCurrentWindow()) == false)
    {
        utils.windows.setSidebarOpenedStatus(utils.windows.getCurrentWindow(), true);
        // FIXME: Create "does function exists utils module" to tackle different browsers+versions
        if(typeof browser.sidebarAction == "undefined" || typeof browser.sidebarAction.open == "undefined")
        {
            return;
        }
        browser.sidebarAction.open();
    }
    else
    {
        utils.windows.setSidebarOpenedStatus(utils.windows.getCurrentWindow(), false);
        if(typeof browser.sidebarAction == "undefined" || typeof browser.sidebarAction.close == "undefined")
        {
            return;
        }
        browser.sidebarAction.close();
    }
});

if(typeof browser.runtime.getBrowserInfo == "undefined")
{
    // This likely means we are running in Opera, set same setting as in Firefox Nightly
    utils.options.set_alpha_settings();
}
else
{
    browser.runtime.getBrowserInfo().then((browserInfo) =>
    {
        let version = browserInfo.version;

        // Enforce debugging, hidden settings and experiment flag to true for Firefox Nightly
        if(version.includes("a"))
        {
            utils.options.set_alpha_settings();
        }

        // Enforce debugging and hidden settings for Firefox Beta
        if(version.includes("b"))
        {
            utils.options.set_beta_settings();
        }
    });
}

// FIXME: Once we are removing FF 60 (ESR) support and the legacy hotkey import, we can just use utils.options.update_hotkey() here
// Setting hotkey for toggeling the sidebar
utils.options.get_setting("toggleDisplayHotkey").then((value) =>
{
    browser.commands.update({"name": "_execute_sidebar_action", "shortcut": value});
});
