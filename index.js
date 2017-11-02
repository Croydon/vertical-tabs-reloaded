"use strict";

function manage_installation(details)
{
    if(details.reason == "install")
    {
        // browser.tabs.create({url: "install-notes.html"});

        browser.runtime.getBrowserInfo().then((info) =>
        {
            // / FIREFIX FIXME: not landed in stable yet
            if(info.version >= 57)
            {
                browser.sidebarAction.open();
            }

            if(info.version >= 56)
            {
                debug_log(info.version);
                debug_log(info.buildID);
                debug_log(info.name);

                let version = info.version;

                // Enforce debugging, hidden settings and experiment flag to true for Firefox Nightly
                if(version.includes("a"))
                {
                    debug_log("You are a Nightly user");
                }
            }
        });
    }

    if(details.reason == "update")
    {
        if(details.previousVersion < 57)
        {
            browser.sidebarAction.open();
            // Update settings
            browser.tabs.create({url: "update-notes.html"});
        }
    }

    debug_log("manage_installation called");
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
        save_setting(settings[optionsElement]["name"], settings[optionsElement]["value"]);
    });
}

function save_setting(name, value)
{
    let settingsObject = {};
    settingsObject[name] = value;

    debug_log("save: " + name + " " + value);

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
            debug_log(reason);
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
                if(name != "debug") { localDebug = true; localDebugOutput += "No user value, use default value. "; }
                if(settings.hasOwnProperty(name))
                {
                    if(name != "debug") { localDebug = true; localDebugOutput += "Default value is '" + settings[name]["value"] + "'. "; }
                    results[name] = settings[name]["value"];
                }
                else
                {
                    if(name != "debug") { localDebug = true; localDebugOutput += "No default value found."; }
                }
            }

            if(localDebug == true) { debug_log(localDebugOutput); }

            fulfill(results[name]);
        }).catch(
            (reason) =>
            {
                debug_log(reason);
            }
        );
    });
}


// browser.runtime.onMessage.addListener(message_handler); // sidebar script listener


let managedWindows = {};
// Windows Management
var windowutils = class windowutils
{
    static add(windowID)
    {
        debug_log("add window " + windowID);
        managedWindows[windowID] = {"sidebarOpened": false};
    }

    static remove(windowID)
    {
        delete managedWindows[windowID];
    }

    static setSidebarOpenedStatus(windowID, newSidebarOpenedStatus)
    {
        debug_log("set window status " + windowID);
        managedWindows[windowID]["sidebarOpened"] = newSidebarOpenedStatus;
    }

    static getSidebarOpenedStatus(windowID)
    {
        return managedWindows[windowID]["sidebarOpened"];
    }
};


setTimeout(() =>
{
    // Set up listener
    // browser.storage.onChanged.addListener(on_options_change);

    browser.windows.onCreated.addListener((window) =>
    {
        windowutils.add(window.id);
    });

    browser.windows.onRemoved.addListener((windowID) =>
    {
        windowutils.remove(windowID);
    });

    browser.windows.getAll({windowTypes: ["normal", "popup"]}).then((windowInfoArray) =>
    {
        for (let windowInfo of windowInfoArray)
        {
            windowutils.add(windowInfo.id);
        }
    });

    browser.windows.onFocusChanged.addListener((windowID) =>
    {
        managedWindows["currentWindow"] = windowID;
    });

    browser.windows.getCurrent({windowTypes: ["normal", "popup"]}).then((currentWindow) =>
    {
        managedWindows["currentWindow"] = currentWindow.id;
    });

    browser.commands.onCommand.addListener((command) =>
    {
        /* if (command == "toggleTabbrowser")
        {
            // FIREFIX: FIXME: Firefox dones't count hotkeys as "user input" therefore dones't allow us here to toggle the sidebar... stupid.
             if(windowutils.getSidebarOpenedStatus(managedWindows["currentWindow"]) == false)
            {
                windowutils.setSidebarOpenedStatus(managedWindows["currentWindow"], true);
                browser.sidebarAction.open();
            }
            else
            {
                windowutils.setSidebarOpenedStatus(managedWindows["currentWindow"], false);
                browser.sidebarAction.close();
            }
        }  */
    });


    browser.browserAction.onClicked.addListener(() =>
    {
        if(windowutils.getSidebarOpenedStatus(managedWindows["currentWindow"]) == false)
        {
            windowutils.setSidebarOpenedStatus(managedWindows["currentWindow"], true);
            browser.sidebarAction.open();
        }
        else
        {
            windowutils.setSidebarOpenedStatus(managedWindows["currentWindow"], false);
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


// Utils
function debug_log(output)
{
    get_setting("debug").then(value =>
    {
        if(value == true)
        {
            console.log(output);
        }
    });
}
