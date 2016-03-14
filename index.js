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
var { viewFor } = require("sdk/view/core");

//let { Services } = require("Services");
var { Cc, Ci, Cu } = require('chrome');
Cu.import("resource://gre/modules/Services.jsm");

// Modules
var { unload } = require("./lib/utils.js");
var { VerticalTabs } = require("./lib/verticaltabs.js");

const PREF_BRANCH = "extensions.@verticaltabsreloaded.";

/* "browser.tabs.drawInTitlebar": false, */

// Reset the preferences
function setDefaultPrefs() 
{
	for (let aPreference of preferencesService.keys(PREF_BRANCH))
	{
		preferencesService.reset(aPreference);
	}
}


exports.main = function (options, callbacks) {
    // if (options.loadReason == "install") {
        
    // } else if (options.loadReason == "upgrade") {
        
    // }
	
	// Back up 'browser.tabs.animate' pref before overwriting it
	if(preferencesService.has(PREF_BRANCH + "animate") == false)
	{
		let animate = preferencesService.get("browser.tabs.animate");
		preferences["animate"] = animate;
		preferencesService.set("browser.tabs.animate", false);
	}
	
	unload(function () {
		let animate = preferences["animate"];
		preferencesService.set("browser.tabs.animate", animate);
	});


	// Initialize VerticalTabs object for each window.
	
	for (let window of windows.browserWindows) {
		let lowLevelWindow = viewFor(window);
		let vt = new VerticalTabs(lowLevelWindow);
		//unload(vt.installStylesheet("chrome://browser/content/tabbrowser.css"));
		unload(vt.unload.bind(vt), lowLevelWindow);
	}

	windows.browserWindows.on('open', function(window) {
		let lowLevelWindow = viewFor(window);
		let vt = new VerticalTabs(lowLevelWindow);
		unload(vt.unload.bind(vt), lowLevelWindow);
	});
};

exports.onUnload = function (reason) {
	if(reason == "shutdown")
	{
		return;
	}
    else if(reason == "disable")
    {
        console.log("VTR disabled");
    }  
	
	unload();
	
    if (reason == "uninstall") {
        // Unloaders might want access to prefs, so do this last
        // Delete all settings
		console.log("VTR uninstall");
        Services.prefs.getDefaultBranch(PREF_BRANCH).deleteBranch("");
    }
}
