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
        });
    }

    if(details.reason == "update")
    {
        /* if(details.previousVersion < 57)
        {
            // Update settings
            browser.tabs.create({url: "update-notes.html"});
        }*/
    }

    browser.sidebarAction.open();
    console.log("manage_installation called");
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
                    // browser.sidebarAction.toggleSidebar(); /// FIREFIX FIXME: not landed in Nightly yet
                    // browser.sidebarAction.open();
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
            if (!results.hasOwnProperty(name))
            {
                // Debug output for "debug" is causing potentially an endless loop to the extend that browser doesn't react anymore
                if(name != "debug") { debug_log("VTR WebExt setting '" + name + "': not saved use default value."); }
                if(settings.hasOwnProperty(name))
                {
                    if(name != "debug") { debug_log("VTR default setting for '" + name + "' is '" + settings[name]["value"] + "'"); }
                    results[name] = settings[name]["value"];
                }
                else
                {
                    if(name != "debug") { debug_log("VTR WebExt setting '" + name + "': no default value found."); }
                }
            }

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


// FIXME: Window Mangament missing
setInterval(function()
{
    browser.runtime.getBrowserInfo().then((browserInfo) =>
    {
        if(browserInfo.version >= 56)
        {
            debug_log(browserInfo.version);
            debug_log(browserInfo.buildID);
            debug_log(browserInfo.name);

            let version = browserInfo.version;

            // Enforce debugging, hidden settings and experiment flag to true for Firefox Nightly
            if(version.includes("a"))
            {
                debug_log("You are a Nightly user");
            }
        }
    });

    browser.windows.getCurrent().then(currentWindow =>
    {
        if(typeof this["vtr.windows.state." + currentWindow.id] == undefined)
        {
            this["vtr.windows.state." + currentWindow.id] = "init";
        }

        if(currentWindow.state == "fullscreen")
        {
            if(this["vtr.windows.state." + currentWindow.id] != "fullscreen")
            {
                this["vtr.windows.state." + currentWindow.id] = "fullscreen";
                get_setting("hideInFullscreen").then(value =>
                {
                    if(value == true)
                    {
                        // dummy
                    }
                });
            }
        }
        else
        {
            if(this["vtr.windows.state." + currentWindow.id] == "fullscreen")
            {
                this["vtr.windows.state." + currentWindow.id] = currentWindow.state;
                get_setting("hideInFullscreen").then(value =>
                {
                    if(value == true)
                    {
                        // dummy
                    }
                });
            }
        }
    });
}, 100);


setTimeout(() =>
{
    // Set up listener
    // browser.storage.onChanged.addListener(on_options_change);

    browser.commands.onCommand.addListener((command) =>
    {
        if (command == "toggleTabbrowser")
        {
            // FIXME: not working
            browser.sidebarAction.open();
        }
    });


    browser.browserAction.onClicked.addListener(() =>
    {
        // FIXME: Not working
        browser.sidebarAction.open();
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
}, 100);


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
