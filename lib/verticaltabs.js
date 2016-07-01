/* ***** BEGIN LICENSE BLOCK *****
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

// SDK
var { Services } = require("resource://gre/modules/Services.jsm");
var self = require("sdk/self");
var simplePrefs = require("sdk/simple-prefs");
var preferences = simplePrefs.prefs;
//var tabsSDK = require("sdk/tabs");
//var tabsUtils = require("sdk/tabs/utils");
var stylesheetUtils = require("sdk/stylesheet/utils");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const TAB_DROP_TYPE = "application/x-moz-tabbrowser-tab";

exports.VerticalTabsReloaded = VerticalTabsReloaded;

/*
 * Vertical Tabs Reloaded
 *
 * Main entry point of this add-on.
 */
function VerticalTabsReloaded(window) {
	this.window = window;
	this.document = window.document;
	this.changedDisplayState = false;
	this.unloaders = [];
	this.init();
}

VerticalTabsReloaded.prototype = {
	init: function() {
		this.window.VerticalTabsReloaded = this;
		this.unloaders.push(function() {
			delete this.window.VerticalTabsReloaded;
		});

		this.rearrangeUI();
		this.observePrefs();
		this.initEventListeners();
	},

	installStylesheet: function(uri) {
		uri = Services.io.newURI(uri, null, null);
		stylesheetUtils.loadSheet(this.window, uri);
	},
	
	removeStylesheet: function(uri) {
		uri = Services.io.newURI(uri, null, null);
		stylesheetUtils.removeSheet(this.window, uri);
	},

	applyThemeStylesheet: function() {
		this.theme = preferences["theme"];
		if(this.theme != "none") {
			this.installStylesheet(this.getThemeStylesheet(this.theme));
		}
	},

	removeThemeStylesheet: function() {
		if(this.theme != "none") {
			this.removeStylesheet(this.getThemeStylesheet(this.theme));
		}
	},

	getThemeStylesheet: function(theme) {
		var stylesheet;
		switch (theme) {
			default:
				stylesheet = "theme/"+theme+"/index.css";
				break;
		}

		return self.data.url(stylesheet);
	},

	rearrangeUI: function() {
		const window = this.window;
		const document = this.document;

		// Ugly workaround: save the label of the first tab for later…
		let tabs = document.getElementById("tabbrowser-tabs");
		let label = tabs.firstChild.label;

		// Injecting CSS and init gruesome XBL binding
		this.installStylesheet(self.data.url("override-bindings.css"));
		this.installStylesheet(self.data.url("theme/base.css"));
		this.applyThemeStylesheet();
		if (preferences["compact"] == true) {
			this.installStylesheet(self.data.url("compact.css"));
		}

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
		
		if (preferences["right"]) {
			browserbox.dir = "reverse";
		}

		tabs.setAttribute("data-vertical", true);
		leftbox.insertBefore(tabs, leftbox.firstChild);
		tabs.orient = "vertical";
		tabs.mTabstrip.orient = "vertical";
		tabs.tabbox.orient = "horizontal"; // probably not necessary

		// Restore width of tab bar from previous session
		tabs.setAttribute("width", preferences["width"]);

		// Move the tabs toolbar into the tab strip
		let toolbar = document.getElementById("TabsToolbar");
		toolbar.setAttribute("collapsed", "false"); // no more vanishing new tab toolbar
		toolbar._toolbox = null; // reset value set by constructor
		toolbar.setAttribute("toolboxid", "navigator-toolbox");
		
		if (preferences["tabtoolbarPosition"] == "top") {
			leftbox.insertBefore(toolbar, leftbox.firstChild);
		} else {
			leftbox.appendChild(toolbar);
		}

		// Init every tab
		tabs.addEventListener("TabOpen", this, false);
		for (let i=0; i < tabs.childNodes.length; i++) {
			this.initTab(tabs.childNodes[i]);
		}

		// And restore the label here.
		console.log("label: "+label);
		tabs.firstChild.label = label;
		
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

			// Put the tabs back up
			toolbar.insertBefore(tabs, new_tab_button);
			tabs.removeAttribute("data-vertical");
			tabs.orient = "horizontal";
			tabs.mTabstrip.orient = "horizontal";
			tabs.tabbox.orient = "vertical"; // probably not necessary
			tabs.removeAttribute("width");

			// Restore all individual tabs.
			tabs.removeEventListener("TabOpen", this, false);
			for (let i = 0; i < tabs.childNodes.length; i++) {
				let tab = tabs.childNodes[i];
				tab.removeAttribute("align");
				tab.maxWidth = tab.minWidth = "";
			}

			// Remove everything we added.
			splitter.removeEventListener("mouseup", this, false);
			browserbox.removeChild(leftbox);
			browserbox.removeChild(splitter);
			browserbox.dir = "normal";
			leftbox = splitter = null;

			vt.removeStylesheet(self.data.url("override-bindings.css"));
			vt.removeStylesheet(self.data.url("theme/base.css"));
			vt.removeThemeStylesheet();
			if (preferences["compact"] == true) {
				this.removeStylesheet(self.data.url("compact.css"));
			}
		});
	},

	initTab: function(aTab) {
		aTab.setAttribute("align", "stretch");
		aTab.maxWidth = 65000;
		aTab.minWidth = 0;
	},

	setPinnedSizes: function() {
		console.log("set pinned sizes!");
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
		function onChange(prefName) { vt.onPreferenceChange(prefName); }
		simplePrefs.on("", onChange);
		this.unloaders.push(function() {
			simplePrefs.off("", onChange);
		});
	},

	onPreferenceChange: function(prefName) {
		switch (prefName) {
			case "right":
				let browserbox = this.document.getElementById("browser");
				if (browserbox.dir != "reverse") {
					browserbox.dir = "reverse";
				} else {
					browserbox.dir = "normal";
				}
				break;
			case "theme":
				this.removeThemeStylesheet();
				this.applyThemeStylesheet();
				break;
			case "hideInFullscreen":
				this.onSizeModeChange();
				break;
			case "compact":
				if (preferences["compact"] == true) {
					this.installStylesheet(self.data.url("compact.css"));
				} else {
					this.removeStylesheet(self.data.url("compact.css"));
				}
				break;
			case "tabtoolbarPosition":
				// Position toggle/move of the tabtoolbar
				let toolbar = this.document.getElementById("TabsToolbar");
				let leftbox = this.document.getElementById("verticaltabs-box");
				if (preferences["tabtoolbarPosition"] == "top") {
					leftbox.insertBefore(toolbar, leftbox.firstChild);
				} else {
					leftbox.appendChild(toolbar);
				}
				break;
		}
	},

	initEventListeners: function() {
		// Note: Not all eventsListener are set up here
		this.window.addEventListener("sizemodechange", this, false);
		this.window.addEventListener("resize", this, false);
		
		this.unloaders.push(function() {
			this.window.removeEventListener("sizemodechange", this, false);
			this.window.removeEventListener("resize", this, false);
		});
	},
	
	// Event handlers
	handleEvent: function(aEvent) {
		//console.log("aEvent.type: "+aEvent.type);
		switch (aEvent.type) {
		case "TabOpen":
			this.initTab(aEvent.target);
			this.setPinnedSizes();
			return;
		case "mouseup":
			if (aEvent.target.getAttribute("id") == "verticaltabs-splitter") {
				this.onTabbarResized();
			}
			return;
		case "sizemodechange":
			this.onSizeModeChange();
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
	
	unload: function() {
		this.unloaders.forEach(function(func) {
			func.call(this);
		}, this);
		
		this.unloaders = [];
	}
 
};
