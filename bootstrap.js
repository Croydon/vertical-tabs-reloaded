/* ***** BEGIN LICENSE BLOCK *****
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * The Initial Developer of the Original Code is
 * Philipp von Weitershausen (Copyright 2011).
 *
 * ***** END LICENSE BLOCK ***** */

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/Services.jsm");

const RESOURCE_HOST = "verticaltabsreloaded";
const PREF_BRANCH = "extensions.verticaltabs.";
const DEFAULT_PREFS = {
  "extensions.verticaltabs.width": 250,
  "extensions.verticaltabs.right": false,
  "extensions.verticaltabs.tabsOnTop": false,
  "browser.tabs.drawInTitlebar": false,
  "extensions.verticaltabs.theme": 'default',
  "extensions.verticaltabs.hideInFullscreen": true
};

/**
 * Load and execute another file.
 */
let GLOBAL_SCOPE = this;
function include(src) {
  Services.scriptloader.loadSubScript(src, GLOBAL_SCOPE);
}

/**
 * Declare a bunch of default preferences.
 */
function setDefaultPrefs() {
  let branch = Services.prefs.getDefaultBranch("");
  for (let [name, value] in Iterator(DEFAULT_PREFS)) {
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

function install() {
}

function startup(data, reason) {
  // Load helpers from utils.js.
  include(data.resourceURI.spec + "utils.js");

  // Back up 'browser.tabs.animate' pref before overwriting it.
  try {
    Services.prefs.getBoolPref("extensions.verticaltabs.animate");
  } catch (ex if (ex.result == Components.results.NS_ERROR_UNEXPECTED)) {
    let animate = Services.prefs.getBoolPref("browser.tabs.animate");
    Services.prefs.setBoolPref("extensions.verticaltabs.animate", animate);
    Services.prefs.setBoolPref("browser.tabs.animate", false);
  }
  unload(function () {
    let animate = Services.prefs.getBoolPref("extensions.verticaltabs.animate");
    Services.prefs.setBoolPref("browser.tabs.animate", animate);
  });

  // Set default preferences.
  setDefaultPrefs();

  // Register the resource:// alias.
  let resource = Services.io.getProtocolHandler("resource")
                         .QueryInterface(Ci.nsIResProtocolHandler);
  resource.setSubstitution(RESOURCE_HOST, data.resourceURI);
  unload(function () {
    resource.setSubstitution(RESOURCE_HOST, null);
  });

  // Initialize VerticalTabs object for each window.
  Cu.import("resource://verticaltabsreloaded/verticaltabs.jsm");
  watchWindows(function(window) {
    let vt = new VerticalTabs(window);
    unload(vt.unload.bind(vt), window);
  }, "navigator:browser");
};

function shutdown(data, reason) {
  if (reason == APP_SHUTDOWN) {
    return;
  }
  unload();
  // Unloaders might want access to prefs, so do this last
  Services.prefs.getDefaultBranch(PREF_BRANCH).deleteBranch("");
}
