/* ***** BEGIN LICENSE BLOCK *****
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

// SDK
var { Cc, Ci, Cu } = require('chrome');

var hotkey = require("sdk/hotkeys").Hotkey;
var simplePrefs = require("sdk/simple-prefs");
var preferences = simplePrefs.prefs;
//var tabsSDK = require("sdk/tabs");
//var tabsUtils = require("sdk/tabs/utils");
var stylesheetUtils = require("sdk/stylesheet/utils");

// Modules
//var { VTTabDataStore, VTTabIDs } = require("./tabdatastore.jsm");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const TAB_DROP_TYPE = "application/x-moz-tabbrowser-tab";

exports.VerticalTabs = VerticalTabs;

/*
 * Vertical Tabs Reloaded
 *
 * Main entry point of this add-on.
 */
function VerticalTabs(window) {
	this.window = window;
	this.document = window.document;
	this.toggleDisplayHotkey;
	this.changedDisplayState = false;
	this.unloaders = [];
	this.init();
}

VerticalTabs.prototype = {
	init: function() {
		this.window.VerticalTabs = this;
		this.unloaders.push(function() {
			delete this.window.VerticalTabs;
		});

		this.ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

		this.installStylesheet("resource://verticaltabsreloaded/data/override-bindings.css");
		this.installStylesheet("resource://verticaltabsreloaded/data/skin/base.css");
		this.applyThemeStylesheet();
		this.unloaders.push(this.removeThemeStylesheet);

		this.rearrangeXUL();
		this.observePrefs();
		this.initHotkeys();

		//let tabs = this.document.getElementById("tabbrowser-tabs");
		//this.tabIDs = new VTTabIDs(tabs);
		//this.unloaders.push(function() {
			//this.tabIDs.unload();
		//});
	
		this.window.addEventListener("sizemodechange", this, false);
		this.unloaders.push(function unloadSizeModeChangeListener() {
			this.window.removeEventListener("sizemodechange", this, false);
		});
	},

	installStylesheet: function(uri) {
		uri = this.ios.newURI(uri, null, null);
		stylesheetUtils.loadSheet(this.window, uri);
	},

	applyThemeStylesheet: function() {
		this.theme = preferences["theme"];
		this.installStylesheet(this.getThemeStylesheet(this.theme));
	},

	removeThemeStylesheet: function() {
		var uri = this.ios.newURI(this.getThemeStylesheet(this.theme), null, null);
		stylesheetUtils.removeSheet(this.window, uri);
	},

	getThemeStylesheet: function(theme) {
		var stylesheet;
		switch (theme) {
			case "winnt":
				stylesheet = "resource://verticaltabsreloaded/data/skin/win7/win7.css";
				break;
			case "darwin":
				stylesheet = "resource://verticaltabsreloaded/data/skin/osx/osx.css";
				break;
			case "linux":
				stylesheet = "resource://verticaltabsreloaded/data/skin/linux/linux.css";
				break;
			case "light":
				stylesheet = "resource://verticaltabsreloaded/data/skin/light/light.css";
				break;
			case "dark":
			default:
				stylesheet = "resource://verticaltabsreloaded/data/skin/dark/dark.css";
				break;
		}

		return stylesheet;
	},

	rearrangeXUL: function() {
		const window = this.window;
		const document = this.document;

		// Move the bottom stuff (findbar, addonbar, etc.) in with the
		// tabbrowser.  That way it will share the same (horizontal)
		// space as the browser.  In other words, the bottom stuff no
		// longer extends across the whole bottom of the window.
		let contentbox = document.getElementById("appcontent");
		let bottom = document.getElementById("browser-bottombox");
		contentbox.appendChild(bottom);

		// Create a box next to the app content. It will hold the tab
		// bar and the tab toolbar.
		let browserbox = document.getElementById("browser");
		let leftbox = document.createElementNS(NS_XUL, "vbox");
		leftbox.id = "verticaltabs-box";
		browserbox.insertBefore(leftbox, contentbox);

		let splitter = document.createElementNS(NS_XUL, "splitter");
		splitter.id = "verticaltabs-splitter";
		splitter.className = "chromeclass-extrachrome";
		browserbox.insertBefore(splitter, contentbox);
		// Hook up event handler for splitter so that the width of the
		// tab bar is persisted.
		splitter.addEventListener("mouseup", this, false);

		// Move the tabs next to the app content, make them vertical,
		// and restore their width from previous session
		if (preferences["right"]) {
			browserbox.dir = "reverse";
		}

		let tabs = document.getElementById("tabbrowser-tabs");
		leftbox.insertBefore(tabs, leftbox.firstChild);
		tabs.orient = "vertical";
		tabs.mTabstrip.orient = "vertical";
		tabs.tabbox.orient = "horizontal"; // probably not necessary
		tabs.setAttribute("width", preferences["width"]);

		// Move the tabs toolbar into the tab strip
		let toolbar = document.getElementById("TabsToolbar");
		toolbar.setAttribute("collapsed", "false"); // no more vanishing new tab toolbar
		toolbar._toolbox = null; // reset value set by constructor
		toolbar.setAttribute("toolboxid", "navigator-toolbox");
		leftbox.appendChild(toolbar);

		let toolbar_context_menu = document.getElementById("toolbar-context-menu");
		toolbar_context_menu.firstChild.collapsed = true;
		toolbar_context_menu.firstChild.nextSibling.collapsed = true; // separator

		tabs.addEventListener("TabOpen", this, false);
		for (let i=0; i < tabs.childNodes.length; i++) {
			this.initTab(tabs.childNodes[i]);
		}

		this.window.addEventListener("resize", this, false);

        let vt = this; 
		this.unloaders.push(function() {
			// Move the bottom back to being the next sibling of contentbox.
			browserbox.insertBefore(bottom, contentbox.nextSibling);

			// Move the tabs toolbar back to where it was
			toolbar._toolbox = null; // reset value set by constructor
			toolbar.removeAttribute("toolboxid");
			let toolbox = document.getElementById("navigator-toolbox");
			let navbar = document.getElementById("nav-bar");
			//toolbox.appendChild(toolbar);

			// Restore the tab strip.
			toolbox.insertBefore(toolbar, navbar);

			let new_tab_button = document.getElementById("new-tab-button");

			// Put the tabs back up dur
			toolbar.insertBefore(tabs, new_tab_button);
			tabs.orient = "horizontal";
			tabs.mTabstrip.orient = "horizontal";
			tabs.tabbox.orient = "vertical"; // probably not necessary
			tabs.removeAttribute("width");
			tabs.removeEventListener("TabOpen", this, false);

			toolbar_context_menu.firstChild.collapsed = false;
			toolbar_context_menu.firstChild.nextSibling.collapsed = false; // separator

			// Restore all individual tabs.
			for (let i = 0; i < tabs.childNodes.length; i++) {
				let tab = tabs.childNodes[i];
				tab.removeAttribute("align");
				tab.maxWidth = tab.minWidth = "";
			}

			// Remove all the crap we added.
			splitter.removeEventListener("mouseup", this, false);
			browserbox.removeChild(leftbox);
			browserbox.removeChild(splitter);
			browserbox.dir = "normal";
			leftbox = splitter = null;

            vt.installStylesheet("resource://verticaltabsreloaded/data/undo-binding.css"); 
            vt.installStylesheet("chrome://browser/content/tabbrowser.css"); 
		});
	},

	initHotkeys: function() {
		let vt = this; let toggleKey = preferences["toggleDisplayHotkey"];
		vt.toggleDisplayHotkey = hotkey({
			combo: toggleKey,
			onPress: function() {
				vt.toggleDisplayState();
			}
		});
		
		this.unloaders.push(function() {
			vt.toggleDisplayHotkey.destroy();
		});
	},
	
	initTab: function(aTab) {
		aTab.setAttribute("align", "stretch");
		aTab.maxWidth = 65000;
		aTab.minWidth = 0;
	},

	setPinnedSizes: function() {
		let tabs = this.document.getElementById("tabbrowser-tabs");
		// awfulness //- Thank you, unknown commentator, for this helpful note.
		let numPinned = tabs.tabbrowser._numPinnedTabs;

		if (tabs.getAttribute("positionpinnedtabs")) {
			let width = tabs.boxObject.width;
			for (let i = 0; i < numPinned; ++i) {
				tabs.childNodes[i].style.width = tabs.boxObject.width + "px";
			}
		} else {
			for (let i = 0; i < numPinned; ++i) {
				tabs.childNodes[i].style.width = "";
			}
		}
	},

	onTabbarResized: function() {
		let tabs = this.document.getElementById("tabbrowser-tabs");
		this.setPinnedSizes();
		this.window.setTimeout(function() {
			preferences.width = tabs.boxObject.width;
		}, 10);
	},

	observePrefs: function() {
		let vt = this;
		simplePrefs.on("", function(prefName) { vt.onPreferenceChange(prefName, vt); });
		this.unloaders.push(function() {
			simplePrefs.on("", function(prefName) { vt.onPreferenceChange(prefName, vt); });
		});
	},

	onPreferenceChange: function(prefName, vt) {
		// vt = this;
		switch (prefName) {
			case "right":
				let browserbox = vt.document.getElementById("browser");
				if (browserbox.dir != "reverse") {
					browserbox.dir = "reverse";
				} else {
					browserbox.dir = "normal";
				}
				break;
			case "theme":
				vt.removeThemeStylesheet();
				vt.applyThemeStylesheet();
				break;
			case "hideInFullscreen":
				vt.onSizeModeChange();
				break;
			case "toggleDisplayHotkey":
				vt.toggleDisplayHotkey.destroy();
				vt.initHotkeys();
				break;
		}
	},

	unload: function() {
		this.unloaders.forEach(function(func) {
			func.call(this);
		}, this);
		
		this.unloaders = [];
	},

	// Event handlers
	handleEvent: function(aEvent) {
		switch (aEvent.type) {
		case "DOMContentLoaded":
			this.init();
			return;
		case "TabOpen":
			this.initTab(aEvent.target);
			this.setPinnedSizes();
			return;
		case "mouseup":
			this.onMouseUp(aEvent);
			return;
		case "sizemodechange":
			this.onSizeModeChange(aEvent);
			return;
		//case "popupshowing":
			//return;
		case "resize":
			this.setPinnedSizes();
			return;
		}
	},

	toggleDisplayState: function() {
		const document = this.document;
		
		if(document.getElementById("verticaltabs-box").style.display == "")
		{
			this.changeDisplayState("none");
			this.changedDisplayState = true;
		}
		else
		{
			this.changeDisplayState("");
			this.changedDisplayState = false;
		}
	},
	
	changeDisplayState: function(display) {
		const document = this.document;
		
		let tabs = document.getElementById("verticaltabs-box").style;
		let splitter = document.getElementById("verticaltabs-splitter").style;

		if (tabs.display == display && splitter.display == display) {
			return;
		}

		tabs.display = splitter.display = display;
	},
	
	/* 
	* The size of the window changed, check if we entered/left fullscreen and
	* hide/show tabs according to user setting
	*/
	onSizeModeChange: function() {
		if(this.changedDisplayState == true) 
		{
			return;
		}
		
		const window = this.window;
		const document = this.document;

		let hideOk = preferences["hideInFullscreen"];
		let display = hideOk && window.windowState == window.STATE_FULLSCREEN ? "none" : "";

		this.changeDisplayState(display);
	},

	onMouseUp: function(aEvent) {
		if (aEvent.target.getAttribute("id") == "verticaltabs-splitter") {
			this.onTabbarResized();
		}
	},
 
};
