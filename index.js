/* ***** BEGIN LICENSE BLOCK *****
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

// SDK
var preferencesService = require("sdk/preferences/service");
var windows = require("sdk/windows");
var windowUtils = require("sdk/window/utils");
var { viewFor } = require("sdk/view/core");

// WebExtension
const webExtension = require("sdk/webextension");
var webextPort;
var webextPreferences = {};
var tabsAnimatePrefBackup = false;

// Modules
var { VerticalTabsReloaded } = require("./lib/verticaltabs.js");


// Toggle function of browser.tabs.drawInTitlebar for preference page
function toggleDrawInTitlebar() {
	if(preferencesService.get("browser.tabs.drawInTitlebar", true))
	{
		preferencesService.set("browser.tabs.drawInTitlebar", false);
	}
	else
	{
		preferencesService.set("browser.tabs.drawInTitlebar", true);
	}
}


var GLOBAL_SCOPE = this;

//
// WebExtenions Communication
//

// Send message to WebExtension
function webext_sendMsg(message)
{
    webextPort.postMessage(message);
}


var sdk_inited = false;
// Handle messages from WebExtension
function webext_replyHandler(message)
{
    if(message.type == "settings.migrate")
    {
        if(preferencesService.get("extensions.@verticaltabsreloaded.animate") != undefined)
        {
           webext_sendChangedSetting("compact");
           webext_sendChangedSetting("debug");
           webext_sendChangedSetting("hideInFullscreen");
           webext_sendChangedSetting("right");
           webext_sendChangedSetting("tabtoolbarPosition");
           webext_sendChangedSetting("theme");
           webext_sendChangedSetting("toggleDisplayHotkey");
           webext_sendChangedSetting("width");
           preferencesService.reset("extensions.@verticaltabsreloaded.animate");
        }
        else
        {
            // Delete all settings
            var prefKeys = preferencesService.keys("extensions.@verticaltabsreloaded.");
            for (var i = 0; i < prefKeys.length; i++)
            {
                preferencesService.reset(prefKeys[i]);
            }
        }
    }

    if(message.type == "settings.post")
    {
        // Get settings from WebExt
        debugOutput(message.name + " new value SDK: " + message.value);
        observPrefs(message.name);
    }

    if(message.type == "settings.post-all")
    {
        // Get all settings from WebExt
        webextPreferences = message.value;
        if(sdk_inited == "prepared")
        {
            sdk_inited = true;
            sdk_init();
        }
        else if(sdk_inited == false)
        {
            sdk_inited = "prepared";
        }

        observPrefs("");
    }

    if(message.type == "settings.toggleDrawInTitlebar")
    {
        toggleDrawInTitlebar();
    }

	if(message.type == "event.fullscreen")
	{
		let windowID = windowUtils.getOuterId(windowUtils.getFocusedWindow());
		GLOBAL_SCOPE["vt"+windowID].changeFullscreenMode(message.value);
	}

	if(message.type == "event.toggleTabbrowser")
	{
		let windowID = windowUtils.getOuterId(windowUtils.getToplevelWindow(windowUtils.getFocusedWindow()));
		GLOBAL_SCOPE["vt"+windowID].toggleDisplayState();
	}
}

// Send setting to WebExtension
function webext_sendSetting(settingName, value)
{
    webext_sendMsg({
        type: "settings.post",
        name: settingName,
        value: value
    });
}
// Changed addon preferences, send to WebExtension
function webext_sendChangedSetting(settingName)
{
    webext_sendSetting(settingName, preferencesService.get("extensions.@verticaltabsreloaded." + settingName));
}

function observPrefs(settingName)
{
    for (let window of windows.browserWindows)
    {
        let lowLevelWindow = viewFor(window);
        let windowID = windowUtils.getOuterId(lowLevelWindow);
        debugOutput("observPrefs: " + settingName);
        GLOBAL_SCOPE["vt"+windowID].onPreferenceChange(settingName, webextPreferences);
    }
}

//
// End of WebExtenions Communication
//

function initialize_window(window)
{
    let lowLevelWindow = viewFor(window);
    let windowID = windowUtils.getOuterId(lowLevelWindow);
    GLOBAL_SCOPE["vt"+windowID] = new VerticalTabsReloaded(lowLevelWindow, webextPort, webextPreferences);
}

function deinitialize_window(window)
{
    let lowLevelWindow = viewFor(window);
    let windowID = windowUtils.getOuterId(lowLevelWindow);
    GLOBAL_SCOPE["vt"+windowID].unload();
    delete GLOBAL_SCOPE["vt"+windowID];
}

function sdk_init()
{
    // Initialize VerticalTabsReloaded object for each window.

    for (let window of windows.browserWindows)
    {
        initialize_window(window);
    }

    windows.browserWindows.on('open', function(window)
    {
        initialize_window(window);
    });

    windows.browserWindows.on('close', function(window)
    {
        deinitialize_window(window)
    });
}

// Entry point of the add-on
exports.main = function (options, callbacks) {
    // WebExtension startup + communication
    webExtension.startup().then(api =>
    {
        const {browser} = api;

        browser.runtime.onMessage.addListener((msg, sender, sendResponse) =>
        {
            webext_replyHandler(msg);
        });

        browser.runtime.onConnect.addListener((port) =>
        {
            webextPort = port; // make it global

           	//debugOutput(options.loadReason);
            if (options.loadReason == "install") {
                preferencesService.set("browser.tabs.drawInTitlebar", false);
            }

            // Back up 'browser.tabs.animate' pref before overwriting it
            tabsAnimatePrefBackup = preferencesService.get("browser.tabs.animate");

            preferencesService.set("browser.tabs.animate", false);

            if(sdk_inited == "prepared")
            {
                sdk_inited = true;
                sdk_init();
            }
            else if(sdk_inited == false)
            {
                sdk_inited = "prepared";
            }
        });
    });
}

exports.onUnload = function (reason) {
	//debugOutput("onUnload:" + reason);

    for (let window of windows.browserWindows)
    {
        deinitialize_window(window);
    }

	preferencesService.set("browser.tabs.animate", tabsAnimatePrefBackup);

    if (reason == "uninstall")
    {
		console.log("VTR uninstalled");
    }
}

function debugOutput(output)
{
    webext_sendMsg({
        type: "debug.log",
        value: output
    });
}
