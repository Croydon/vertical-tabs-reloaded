/* ***** BEGIN LICENSE BLOCK *****
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

// SDK
var ioServices = require("resource://gre/modules/Services.jsm").Services.io;
var stylesheetUtils = require("sdk/stylesheet/utils");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const TAB_DROP_TYPE = "application/x-moz-tabbrowser-tab";

/* Object injected for every window */

var VerticalTabsReloaded = class VerticalTabsReloaded
{
    constructor(window, webextPortP, webExtPreferences)
    {
        this.webextPort = webextPortP;
        this.window = window;
        this.document = window.document;
        this.webExtPreferences = webExtPreferences;
        this.changedDisplayState = false;
        this.unloaders = [];
        this.init();
    }

    init()
    {
        this.window.VerticalTabsReloaded = this;
        this.unloaders.push(function() {
            delete this.window.VerticalTabsReloaded;
        });

        this.rearrangeUI();
        this.initEventListeners();
    }

    preferences(settingName)
    {
        this.debugOutput(settingName + " (sdk lib): " + this.webExtPreferences[settingName]);
        return this.webExtPreferences[settingName];
    }

    webext_sendMsg(message)
    {
        // Send message to WebExtension
        this.webextPort.postMessage(message);
    }

    webext_sendChangedSetting(settingName, newValue)
    {
        // Changed addon preferences
        this.webext_sendMsg({
            type: "settings.post",
            name: settingName,
            value: newValue
        });
    }

    installStylesheet(uri)
    {
        uri = ioServices.newURI(uri, null, null);
        stylesheetUtils.loadSheet(this.window, uri);
        // this.debugOutput(uri);
    }

    removeStylesheet(uri)
    {
        uri = ioServices.newURI(uri, null, null);
        stylesheetUtils.removeSheet(this.window, uri);
        // this.debugOutput(uri);
    }

    applyThemeStylesheet()
    {
        if(this.preferences("theme") != "none")
        {
            this.installStylesheet(this.getThemeStylesheet(this.preferences("theme")));
        }
    }

    removeThemeStylesheet()
    {
        if(this.preferences("theme") != "none")
        {
            this.debugOutput("remove: " + this.getThemeStylesheet(this.preferences("theme")));
            this.removeStylesheet(this.getThemeStylesheet(this.preferences("theme")));
        }
    }

    getThemeStylesheet(theme)
    {
        var stylesheet;
        switch (theme)
        {
            default:
                stylesheet = "theme/"+theme+"/index.css";
                break;
        }

        return this.preferences("dataPath") + stylesheet;
    }

    rearrangeUI()
    {
        const window = this.window;
        const document = this.document;

        // Ugly workaround: save the label of the first tab for later…
        let tabs = document.getElementById("tabbrowser-tabs");
        let label = tabs.firstChild.label;

        // Injecting CSS and init gruesome XBL binding
        this.installStylesheet(this.preferences("dataPath") + "override-bindings.css");
        this.installStylesheet(this.preferences("dataPath") + "theme/base.css");
        this.applyThemeStylesheet();
        if (this.preferences("compact") == true)
        {
            this.installStylesheet(this.preferences("dataPath") + "compact.css");
        }

        if (this.preferences("style.tab.status") == true)
        {
            this.debugOutput("style.tab.status true");
            this.installStylesheet(this.preferences("dataPath") + "status.css");
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

        if (this.preferences("right"))
        {
            browserbox.dir = "reverse";
        }

        tabs.setAttribute("data-vertical", true);
        leftbox.insertBefore(tabs, leftbox.firstChild);
        tabs.orient = "vertical";
        tabs.mTabstrip.orient = "vertical";
        tabs.tabbox.orient = "horizontal"; // probably not necessary

        // Restore width of tab bar from previous session
        tabs.setAttribute("width", this.preferences("width"));

        // Move the tabs toolbar into the tab strip
        let toolbar = document.getElementById("TabsToolbar");
        toolbar.setAttribute("collapsed", "false"); // no more vanishing new tab toolbar
        toolbar._toolbox = null; // reset value set by constructor
        toolbar.setAttribute("toolboxid", "navigator-toolbox");

        if (this.preferences("tabtoolbarPosition") == "top")
        {
            leftbox.insertBefore(toolbar, leftbox.firstChild);
        }
        else
        {
            leftbox.appendChild(toolbar);
        }

        // Init every tab
        tabs.addEventListener("TabOpen", this, false);
        for (let i=0; i < tabs.childNodes.length; i++)
        {
            this.initTab(tabs.childNodes[i]);
        }

        // And restore the label here.
        this.debugOutput("label: "+label);
        tabs.firstChild.label = label;

        this.unloaders.push(() =>
        {
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
            for (let i = 0; i < tabs.childNodes.length; i++)
            {
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


            if (this.preferences("style.tab.status") == true)
            {
                this.removeStylesheet(this.preferences("dataPath") + "status.css");
            }

            if (this.preferences("compact") == true)
            {
                this.removeStylesheet(this.preferences("dataPath") + "compact.css");
            }

            this.removeThemeStylesheet();
            this.removeStylesheet(this.preferences("dataPath") + "theme/base.css");
            this.removeStylesheet(this.preferences("dataPath") + "override-bindings.css");
        });
    }

    initTab(aTab)
    {
        aTab.setAttribute("align", "stretch");
        aTab.maxWidth = 65000;
        aTab.minWidth = 0;
    }

    setPinnedSizes()
    {
        //this.debugOutput("set pinned sizes!");
    }

    onTabbarResized()
    {
        let tabs = this.document.getElementById("tabbrowser-tabs");
        this.setPinnedSizes();
        this.window.setTimeout(this.webext_sendChangedSetting("width", tabs.boxObject.width), 10);
    }

    onPreferenceChange(prefName, newValue)
    {
        switch (prefName)
        {
            case "right":
                this.webExtPreferences = newValue;
                let browserbox = this.document.getElementById("browser");
                if (browserbox.dir != "reverse")
                {
                    browserbox.dir = "reverse";
                }
                else
                {
                    browserbox.dir = "normal";
                }
                break;
            case "theme":
                this.removeThemeStylesheet();
                this.webExtPreferences = newValue;
                this.applyThemeStylesheet();
                break;

            case "compact":
                this.webExtPreferences = newValue;
                if (this.preferences("compact") == true)
                {
                    this.installStylesheet(this.preferences("dataPath") + "compact.css");
                }
                else
                {
                    this.removeStylesheet(this.preferences("dataPath") + "compact.css");
                }
                break;

            case "style.tab.status":
                this.webExtPreferences = newValue;
                if (this.preferences("style.tab.status") == true)
                {
                    this.installStylesheet(this.preferences("dataPath") + "status.css");
                }
                else
                {
                    this.removeStylesheet(this.preferences("dataPath") + "status.css");
                }
                break;

            case "tabtoolbarPosition":
                this.webExtPreferences = newValue;
                // Position toggle/move of the tabtoolbar
                let toolbar = this.document.getElementById("TabsToolbar");
                let leftbox = this.document.getElementById("verticaltabs-box");
                if (this.preferences("tabtoolbarPosition") == "top")
                {
                    leftbox.insertBefore(toolbar, leftbox.firstChild);
                }
                else
                {
                    leftbox.appendChild(toolbar);
                }
                break;

            default:
                this.webExtPreferences = newValue;
                break;
        }
    }

    initEventListeners()
    {
        // Note: Not all eventsListener are set up here
        this.window.addEventListener("resize", this, false);

        this.unloaders.push(function()
        {
            this.window.removeEventListener("resize", this, false);
        });
    }

    // Event handlers
    handleEvent(aEvent)
    {
        //debugOutput("aEvent.type: "+aEvent.type);
        switch (aEvent.type)
        {
            case "TabOpen":
                this.initTab(aEvent.target);
                this.setPinnedSizes();
                return;
            case "mouseup":
                if (aEvent.target.getAttribute("id") == "verticaltabs-splitter")
                {
                    this.onTabbarResized();
                }
                return;
            //case "popupshowing":
                //return;
            case "resize":
                this.setPinnedSizes();
                return;
        }
    }

    toggleDisplayState()
    {
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
    }

    changeDisplayState(display)
    {
        const document = this.document;

        let tabs = document.getElementById("verticaltabs-box").style;
        let splitter = document.getElementById("verticaltabs-splitter").style;

        if (tabs.display == display && splitter.display == display)
        {
            return;
        }

        tabs.display = splitter.display = display;
    }

    /* Enter/Left fullscreen mode */
    changeFullscreenMode(state)
    {
        if(this.changedDisplayState == true)
        {
            return;
        }

        this.debugOutput("changeFullscreenMode " + state);
        if(state == "true")
        {
            this.changeDisplayState("none");
        }
        else
        {
            this.changeDisplayState("");
        }
    }

    unload()
    {
        this.unloaders.forEach(function(func)
        {
            func.call(this);
        }, this);

        this.unloaders = [];
    }

    debugOutput(output)
    {
        this.webext_sendMsg({
            type: "debug.log",
            value: output
        });
    }

}

exports.VerticalTabsReloaded = VerticalTabsReloaded;
