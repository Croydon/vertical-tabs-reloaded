/* ***** BEGIN LICENSE BLOCK *****
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

// SDK
var simplePrefs = require("sdk/simple-prefs");
var preferences = simplePrefs.prefs;
var preferencesService = require("sdk/preferences/service");
var windows = require("sdk/windows");
var windowUtils = require("sdk/window/utils");
var hotkey = require("sdk/hotkeys").Hotkey;
var { viewFor } = require("sdk/view/core");
var { Services }  = require("resource://gre/modules/Services.jsm");

// WebExtension
const webExtension = require("sdk/webextension");
var webextPort;

// Modules
var { unload } = require("./lib/unload.js");
var { VerticalTabsReloaded } = require("./lib/verticaltabs.js");

let packageJSON = require("./package.json");
const PREF_BRANCH = "extensions."+packageJSON['preferences-branch']+".";


// Reset the preferences
function setDefaultPrefs() 
{
	for (let aPreference of preferencesService.keys(PREF_BRANCH))
	{
		preferencesService.reset(aPreference);
	}
	
	// Reset hidden preferences not inited in package.json
	if (preferences["debug"] == true)
	{
		preferences["debug"] = false;
	}
}
simplePrefs.on("setDefaultPrefs", setDefaultPrefs);

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

simplePrefs.on("toggleDrawInTitlebar", toggleDrawInTitlebar);

unload(function() {
	simplePrefs.off("setDefaultPrefs", setDefaultPrefs);
	simplePrefs.off("toggleDrawInTitlebar", toggleDrawInTitlebar);
});

// Hotkeys
var GLOBAL_SCOPE = this;
function initHotkeys() {
	var objectScope = GLOBAL_SCOPE;
	let toggleKey = preferences["toggleDisplayHotkey"];
	let windowUtilsx = windowUtils;
	GLOBAL_SCOPE.vtToggleDisplayHotkey = hotkey({
		combo: toggleKey,
		onPress: function() {
			let windowID = windowUtilsx.getOuterId(windowUtilsx.getToplevelWindow(windowUtilsx.getFocusedWindow()));
			objectScope["vt"+windowID].toggleDisplayState();
		}
	});
}
	
function destroyHotkey() {
	GLOBAL_SCOPE.vtToggleDisplayHotkey.destroy();
}

function changeHotkey() {
	destroyHotkey(); 
	initHotkeys();
}

//
// WebExtenions Communication 
//

// Send message to WebExtension
function webext_sendMsg(message)
{
    webextPort.postMessage(message);
}

// Handle messages from WebExtension
function webext_replyHandler(message, sender, sendResponse)
{  
    if(message.type == "settings.get") 
    {
        webext_sendChangedSetting(message.name);
    }
}

// Changed addon preferences, send to WebExtension
function webext_sendChangedSetting(settingName)
{
    webext_sendMsg({
        type: "settings.post",
        name: settingName,
        value: preferences[settingName]
    });
}

function observPrefs(settingName)
{        
    for (let window of windows.browserWindows) 
    {
        let lowLevelWindow = viewFor(window);
        let windowID = windowUtils.getOuterId(lowLevelWindow);
        GLOBAL_SCOPE["vt"+windowID].onPreferenceChange(settingName);
    }
    
    webext_sendChangedSetting(settingName);
}
  
// Entry point
exports.main = function (options, callbacks) {
	//debugOutput(options.loadReason);
    if (options.loadReason == "install") {
		preferencesService.set("browser.tabs.drawInTitlebar", false);
	}
	else if (options.loadReason == "upgrade") {
		// v0.4.0 -> v0.5.0, remove when most use >= v0.5.0 
		if(preferences["theme"] == "winnt") {
			preferences["theme"] = "windows";
		}
    }
	
	// Back up 'browser.tabs.animate' pref before overwriting it
	preferences["animate"] = preferencesService.get("browser.tabs.animate");
	preferencesService.set("browser.tabs.animate", false);
	
	unload(function () {
		preferencesService.set("browser.tabs.animate", preferences["animate"]);
	});

    // WebExtension startup + communication
    webExtension.startup().then(api => 
    {
        const {browser} = api;
        browser.runtime.onConnect.addListener((port) => 
        {
            webextPort = port; // make it global
        });   
        
        browser.runtime.onMessage.addListener((msg, sender, sendResponse) => 
        {
            webext_replyHandler(msg, sender, sendResponse);
        });
    
        // Initialize VerticalTabsReloaded object for each window.
        
        for (let window of windows.browserWindows) {
            let lowLevelWindow = viewFor(window);
            let windowID = windowUtils.getOuterId(lowLevelWindow);
            GLOBAL_SCOPE["vt"+windowID] = new VerticalTabsReloaded(lowLevelWindow);
            unload(GLOBAL_SCOPE["vt" + windowID].unload.bind(GLOBAL_SCOPE["vt"+windowID]), lowLevelWindow);
        }

        windows.browserWindows.on('open', function(window) {
            let lowLevelWindow = viewFor(window);
            let windowID = windowUtils.getOuterId(lowLevelWindow);
            GLOBAL_SCOPE["vt"+windowID] = new VerticalTabsReloaded(lowLevelWindow);
            unload(GLOBAL_SCOPE["vt" + windowID].unload.bind(GLOBAL_SCOPE["vt"+windowID]), lowLevelWindow);
        });

        windows.browserWindows.on('close', function(window) {
            let lowLevelWindow = viewFor(window);
            let windowID = windowUtils.getOuterId(lowLevelWindow);
            GLOBAL_SCOPE["vt"+windowID].unload();
            delete GLOBAL_SCOPE["vt"+windowID];
        });

        initHotkeys();
        simplePrefs.on("toggleDisplayHotkey", changeHotkey);
        
        simplePrefs.on("", observPrefs);

        unload(function() {
            destroyHotkey();
            simplePrefs.off("toggleDisplayHotkey", changeHotkey);
            simplePrefs.on("", observPrefs);
        });
    });
}

exports.onUnload = function (reason) {
	//debugOutput("onUnload:" + reason);
	if(reason == "disable")
    {
        debugOutput("VTR disabled");
    }
	
	unload();
	
	// Unloaders might want access to prefs, so do this last
    if (reason == "uninstall") {
        // Delete all settings
        Services.prefs.getDefaultBranch(PREF_BRANCH).deleteBranch("");
		debugOutput("VTR uninstalled");
    }
}

function debugOutput(output) {
	if (preferences["debug"] == true) {
		console.log(output);
	}
}

