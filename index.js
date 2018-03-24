"use strict";

/* global utils log */

function manage_installation(details)
{
    if(details.reason == "install")
    {
        // browser.tabs.create({url: "install-notes.html"});

        browser.runtime.getBrowserInfo().then((info) =>
        {
            browser.sidebarAction.open();

            log.debug(info.version);
            log.debug(info.buildID);
            log.debug(info.name);

            let version = info.version;

            // Enforce debugging, hidden settings and experiment flag to true for Firefox Nightly
            if(version.includes("a"))
            {
                log.debug("You are a Nightly user");
            }
        });
    }

    if(details.reason == "update")
    {
        log.debug("VTR update!");

        get_setting("theme").then(value =>
        {
            if(value == "none")
            {
                save_setting("theme", "dark"); // This is likely irrelvant, but could prevent some race conditions
                restore_default_setting_of("theme");
            }

            if(value == "windows" || value == "linux")
            {
                save_setting("theme", "feather");
            }
        });

        get_setting("runtime.vtr.installedVersion").then((installedVersion) =>
        {
            let previousVersion;
            if(installedVersion == undefined)
            {
                previousVersion = details.previousVersion.split(".");
                browser.sidebarAction.open();
                browser.tabs.create({url: "notes/index.html"});
            }
            else
            {
                previousVersion = installedVersion.split(".");
            }

            log.debug(previousVersion);
            let major = parseInt(previousVersion[0], 10);
            let minor = parseInt(previousVersion[1], 10);
            let patch = parseInt(previousVersion[2], 10);

            if(installedVersion != undefined && (major < 0 || (major == 0 && minor < 9) || (major == 0 && minor == 9 && patch < 0)))
            {
                browser.sidebarAction.open();
                browser.tabs.create({url: "notes/index.html"});
            }
        });
    }

    let manifest = browser.runtime.getManifest();
    log.debug("manifest version" + manifest.version);
    save_setting("runtime.vtr.installedVersion", manifest.version);

    log.debug("manage_installation called");
}

browser.runtime.onInstalled.addListener(manage_installation);

//
// Handle addon settings
//
var settings;

function get_options_file()
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if(xhr.readyState == 4) // 4 == DONE
        {
            settings = xhr.response;

            // FIREFIX: Placeholder. Firefox doesn't support the programmatically opening of sidebars SAFELY
            // Right now it's possible to toggle so we toggeling on the base of good luck
            // and just hoping to end up with an open sidebar
            get_setting("experiment").then(value =>
            {
                if(value == true)
                {
                    // keep-me
                }
            });
        }
    };

    xhr.overrideMimeType("json");
    xhr.responseType = "json";

    xhr.open("GET", "options/options.json", true);
    xhr.send();
}

get_options_file();

/* exported get_options_object */
function get_options_object()
{
    return settings;
}

/* exported restore_default_settings */
function restore_default_settings()
{
    Object.keys(settings).forEach((optionsElement) =>
    {
        restore_default_setting_of(optionsElement);
    });
}

function reset_experimental_features()
{
    Object.keys(settings).forEach((optionsElement) =>
    {
        if(settings[optionsElement]["experimental"] == true)
        {
            restore_default_setting_of(optionsElement);
        }
    });
}

function restore_default_setting_of(optionsElement)
{
    save_setting(settings[optionsElement]["name"], settings[optionsElement]["value"]);
}

function save_setting(name, value)
{
    let settingsObject = {};
    settingsObject[name] = value;

    log.debug("save: " + name + " " + value);

    if(name == "experiment" && value == false)
    {
        reset_experimental_features();
    }

    if(name != "meta.options.time.lastsaved")
    {
        save_setting("meta.options.time.lastsaved", utils.time.getTimestamp());
    }

    browser.storage.local.set(settingsObject).then(error =>
    {
        if(error)
        {
            return false;
        }

        return true;
    });
}

function get_all_settings()
{
    // This is necessary to not only get all actually saved values, but also the default values for unsaved attributes
    return new Promise((fulfill, reject) =>
    {
        let allSettings = {};

        let forEachSetting = (name) =>
        {
            return new Promise((fulfill) =>
            {
                get_setting(name).then(value =>
                {
                    let newValue = {};
                    newValue[name] = value;
                    Object.assign(allSettings, newValue);
                    fulfill(true);
                });
            });
        };

        let allPromises = Object.keys(settings).map(forEachSetting);

        Promise.all(allPromises).then(() =>
        {
            fulfill(allSettings);
        });
    }).catch(
        (reason) =>
        {
            log.debug(reason);
        }
    );
}

function get_setting(name)
{
    if(name == undefined)
    {
        return get_all_settings();
    }

    return new Promise((fulfill, reject) =>
    {
        browser.storage.local.get(name).then(results =>
        {
            let localDebugOutput = "VTR WebExt setting '" + name + "': ";
            let localDebug = false;

            if (!results.hasOwnProperty(name))
            {
                // Debug output for "debug" is causing potentially an endless loop to the extend that browser doesn't react anymore
                // if(name != "debug") { localDebug = true; localDebugOutput += "No user value, use default value. "; }
                if(settings.hasOwnProperty(name))
                {
                    if(name != "debug") { localDebug = true; localDebugOutput += "No user value; default value is '" + settings[name]["value"] + "'. "; }
                    results[name] = settings[name]["value"];
                }
                else
                {
                    if(name != "debug") { localDebug = true; localDebugOutput += "No default value found."; }
                }
            }

            if(localDebug == true) { log.debug(localDebugOutput); }

            fulfill(results[name]);
        }).catch(
            (reason) =>
            {
                log.debug(reason);
            }
        );
    });
}


// browser.runtime.onMessage.addListener(message_handler); // sidebar script listener

setTimeout(() =>
{
    // Set up listener
    // browser.storage.onChanged.addListener(on_options_change);

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

    browser.windows.getCurrent({windowTypes: ["normal", "popup"]}).then((currentWindow) =>
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
            browser.sidebarAction.open();
        }
        else
        {
            utils.windows.setSidebarOpenedStatus(utils.windows.getCurrentWindow(), false);
            browser.sidebarAction.close();
        }
    });

    browser.runtime.getBrowserInfo().then((browserInfo) =>
    {
        let version = browserInfo.version;

        // Enforce debugging, hidden settings and experiment flag to true for Firefox Nightly
        if(version.includes("a"))
        {
            save_setting("showHiddenSettings", true);
            save_setting("debug", true);
            save_setting("experiment", true);
        }

        // Enforce debugging and hidden settings for Firefox Beta
        if(version.includes("b"))
        {
            save_setting("showHiddenSettings", true);
            save_setting("debug", true);
        }
    });
}, 50);
