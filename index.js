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

// Modules
var { unload } = require("./lib/utils.js");
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

// Entry point
exports.main = function (options, callbacks) {
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
	let animate = preferencesService.get("browser.tabs.animate");
	preferences["animate"] = animate;
	preferencesService.set("browser.tabs.animate", false);
	
	unload(function () {
		let animate = preferences["animate"];
		preferencesService.set("browser.tabs.animate", animate);
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
		unload(GLOBAL_SCOPE["vt"+windowID].unload.bind(GLOBAL_SCOPE["vt"+windowID]), lowLevelWindow);
	});

	windows.browserWindows.on('close', function(window) {
		let lowLevelWindow = viewFor(window);
		let windowID = windowUtils.getOuterId(lowLevelWindow);
		GLOBAL_SCOPE["vt"+windowID].unload();
		delete GLOBAL_SCOPE["vt"+windowID];
	});

	
	initHotkeys();
	simplePrefs.on("toggleDisplayHotkey", changeHotkey);
	
	unload(function() {
		destroyHotkey();
		simplePrefs.off("toggleDisplayHotkey", changeHotkey);
	});
	
};

exports.onUnload = function (reason) {
	console.log("onUnload:" + reason);
	if(reason == "disable")
    {
        console.log("VTR disabled");
    }
	
	unload();
	
	// Unloaders might want access to prefs, so do this last
    if (reason == "uninstall") {
        // Delete all settings
        Services.prefs.getDefaultBranch(PREF_BRANCH).deleteBranch("");
		console.log("VTR uninstalled");
    }
}
