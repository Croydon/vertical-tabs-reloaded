/* ***** BEGIN LICENSE BLOCK *****
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

var { Cc, Ci, Cu } = require('chrome');

Cu.import("resource://gre/modules/Services.jsm");

const RESOURCE_HOST = "verticaltabsreloaded";
const PREF_BRANCH = "extensions.@verticaltabsreloaded.";

// Load and execute another file.
let GLOBAL_SCOPE = this;
function include(src) {
    Services.scriptloader.loadSubScript(src, GLOBAL_SCOPE);
}

let DEFAULT_PREFS = new Map([
    ["extensions.@verticaltabsreloaded.width", 250],
    ["extensions.@verticaltabsreloaded.right", false],
    ["extensions.@verticaltabsreloaded.tabsOnTop", false],
    ["extensions.@verticaltabsreloaded.theme", "linux"],
    ["extensions.@verticaltabsreloaded.hideInFullscreen", true],
    ["extensions.@verticaltabsreloaded.toggleDisplayHotkey", "control-alt-v"]
]);

/* "browser.tabs.drawInTitlebar": false, */

// Declare a bunch of default preferences.
function setDefaultPrefs() {
    let branch = Services.prefs.getDefaultBranch("");
    for (let [name, value] of DEFAULT_PREFS) {
        if(Services.prefs.prefHasUserValue(name) == false) {
            /* The user didn't set yet a custom value */
            switch (typeof value) {
              case "boolean":
                branch.setBoolPref(name, value);
                break;
              case "number":
                branch.setIntPref(name, value);
                break;
              case "string":
                branch.setCharPref(name, value);
                break;
            }
        }
    }
}

exports.main = function (options, callbacks) {
    
    // if (options.loadReason == "install") {
        
    // } else if (options.loadReason == "upgrade") {
        
    // }

	// TODO/FIX ME:
	// Register the resource:// alias.
	// TODO: Fix this in appropriated way, currently it's getting workarounded by an entry in the chrome.manifest file 
	// I have literally no idea what the following functions are doing, nor could I find a complete documentation
	// Contributions are welcome
	
		// let resource = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler); // Something cryptical
		// resource.setSubstitution(RESOURCE_HOST, data.resourceURI); // Original, data is a bootstrap data struct, not available anymore (I guess)
		
		// //-- var self = require("sdk/self");  // attempt, failed
		// //-- resource.setSubstitution(RESOURCE_HOST, self.uri); // attempt, failed

	// Load helpers from utils.js.
	include("resource://verticaltabsreloaded/lib/utils.js");
	
	// Back up 'browser.tabs.animate' pref before overwriting it.
	try {
		Services.prefs.getBoolPref("extensions.@verticaltabsreloaded.animate");
	} catch (ex if (ex.result == Components.results.NS_ERROR_UNEXPECTED)) {
		let animate = Services.prefs.getBoolPref("browser.tabs.animate");
		Services.prefs.setBoolPref("extensions.@verticaltabsreloaded.animate", animate);
		Services.prefs.setBoolPref("browser.tabs.animate", false);
	}
	unload(function () {
		let animate = Services.prefs.getBoolPref("extensions.@verticaltabsreloaded.animate");
		Services.prefs.setBoolPref("browser.tabs.animate", animate);
	});

	// Set default preferences.
	setDefaultPrefs();

	// Unload event for deletion of resource:// alias
	unload(function () {
		resource.setSubstitution(RESOURCE_HOST, null);
	});

	// Initialize VerticalTabs object for each window.
	include("resource://verticaltabsreloaded/lib/verticaltabs.jsm");
	
	watchWindows(function(window) {
		let vt = new VerticalTabs(window);
		//unload(vt.unload.installStylesheet("chrome://browser/content/tabbrowser.css"));
		unload(vt.unload.bind(vt), window);
	}, "navigator:browser");
};

exports.onUnload = function (reason) {
	if(reason == "shutdown")
	{
		return;
	}
    else if(reason == "disable")
    {
        console.log("disabled");
    }  
	
	unload();
	
    if (reason == "uninstall") {
        // Unloaders might want access to prefs, so do this last
        // Delete all settings
        Services.prefs.getDefaultBranch(PREF_BRANCH).deleteBranch("");
    }
}
