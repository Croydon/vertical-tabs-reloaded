/* ***** BEGIN LICENSE BLOCK *****
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";


var main = browser.extension.getBackgroundPage();

/* Object injected for every window */
var VerticalTabsReloaded = class VerticalTabsReloaded
{
    constructor(window, preferences)
    {
        //this.main = main;
        this.window = window;
        this.document = window.document;
        this.webExtPreferences = preferences;
        this.changedDisplayState = false;
        this.unloaders = [];

        this.tabbrowser = this.document.getElementById("tabbrowser-tabs");

        this.init();
    }

    init()
    {
        this.debug_log(this.webExtPreferences);
        this.window.VerticalTabsReloaded = this;
        //this.unloaders.push(function() {
            //delete this.window.VerticalTabsReloaded;
        //});

        this.build_ui();
        this.initEventListeners();
    }

    preferences(settingName)
    {
        this.debug_log(settingName + " (webext lib): " + this.webExtPreferences[settingName]);
        return this.webExtPreferences[settingName];
    }

    installStylesheet(uri, type)
    {
        this.debug_log("VTR install sheet: " + uri + " of type: " + type);
        this.tabbrowser.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${uri}" id="vtr-${type}">`);
    }

    removeStylesheet(type)
    {
        this.debug_log("VTR remove sheet of type: " + type);
        this.document.getElementById("vtr-"+type).remove();
    }

    applyThemeStylesheet()
    {
        if(this.preferences("theme") != "none")
        {
            /*main.css_get_full_path().then(fullPath => {
                this.installStylesheet(fullPath);
            });*/

            this.installStylesheet( this.getThemeStylesheet(this.preferences("theme")), "theme" );
        }
    }

    removeThemeStylesheet()
    {
        if(this.preferences("theme") != "none")
        {
            this.debug_log("remove theme stylesheet!");
            this.removeStylesheet("theme");
        }
    }

    getThemeStylesheet(theme)
    {
        var stylesheet;
        switch (theme)
        {
            default:
                stylesheet = "data/theme/"+theme+"/index.css";
                break;
        }

        return browser.runtime.getURL(stylesheet);
    }

    build_ui()
    {
        // FIREFIX: Placeholder. Firefox doesn't support hiding the default tabbrowser currently.

        // Injecting CSS
        this.installStylesheet(browser.runtime.getURL("data/theme/base.css"), "base");
        this.applyThemeStylesheet();
        if (this.preferences("compact") == true)
        {
            this.debug_log("compact true");
            this.installStylesheet(browser.runtime.getURL("data/compact.css"), "compact");
        }

        if (this.preferences("style.tab.status") == true)
        {
            this.debug_log("style.tab.status true");
            this.installStylesheet(browser.runtime.getURL("data/status.css"), "status");
        }

        // FIREFIX: Placeholder. Sidebars on the right are currently not suppoted by Firefox.
        //if (this.preferences("right"))

        // Placeholder. Restore width of tab bar from previous session
        //tabs.setAttribute("width", this.preferences("width"));
        // FIREFIX: Firefox doesn't support resizing the sidebar programmatically currently.

        // FIREFIX: Firefox doesn't supporting the moving of toolbars. https://bugzilla.mozilla.org/show_bug.cgi?id=1344959
        //if (this.preferences("tabtoolbarPosition") == "top")
        //{
            //leftbox.insertBefore(toolbar, leftbox.firstChild);
        //}
        //else
        //{
            //leftbox.appendChild(toolbar);
        //}

        browser.tabs.query({currentWindow: true}).then((tabs) =>
        {
            for(let tab of tabs)
            {
                this.create_tab(tab);
            }
        });

        this.unloaders.push(() =>
        {
            // FIXME: Put the tabs back up, unhide tabstrip

            // FIXME: Properly not necessary since sidebars are totally isolated and are just getting "deleted" on closing
            //this.removeThemeStylesheet();
        });
    }

    create_tab(tab)
    {
        let id = tab.id;
        let url = tab.url;
        let title = tab.title || "Connecting...";
        let pinned = false;

        let div = document.createElement("div");
        div.className = "tabbrowser-tab";
        div.setAttribute('contextmenu', 'tabContextMenu');
        div.id = id;

        /*let a = document.createElement('a');
        a.className = 'tab';
        a.innerText = this.url;
        a.href = this.url;*/

        // Check: fadein="true" context="tabContextMenu" linkedpanel="panel-3-77" pending="true" image="" iconLoadingPrincipal="" align="stretch"
        this.tabbrowser.insertAdjacentHTML("beforeend", `<div id="tab-${id}" label="${title}" class="tabbrowser-tab" fadein="true" context="tabContextMenu" linkedpanel="panel-3-77" pending="true" image="" iconLoadingPrincipal="" align="stretch" maxwidth="65000" minwidth="0"> <span id="tab-title-${id}" class="tab-label tab-text">${title}</span> </div>`);

        //setTimeout(function(){}, 0); // workaround

        this.document.getElementById("tab-"+id).addEventListener('click', (event) =>
        {
            browser.tabs.update(id, {active: true});
            event.preventDefault();
        });



        /*for (let method of ['close', 'reload', 'mute', 'pin', 'newWindow']) {
          let button = document.createElement('a');
          button.className = `button right ${method}`;
          button.href = '#';
          button.innerText = textMap[method];
          button.title = method;
          button.addEventListener('click', buttonEvent);
          div.appendChild(button);
      }*/

        /*let icon = document.createElement('img');
        icon.className = 'icon';
        icon.style.visibility = 'hidden';*/

        //icon.addEventListener('error', handleImageError);

        /*let context = document.createElement('span');
        context.className = 'context';
        context.style.visibility = 'hidden';*/

        /*div.appendChild(icon);
        div.appendChild(context);
        div.appendChild(a);
        tabList.appendChild(div);*/

        /*div.addEventListener('dragstart', handleDragStart, false);
        div.addEventListener('dragover', handleDragOver, false);
        div.addEventListener('drop', handleDrop, false);*/
    }

    update_tab(tabID, attribute, value)
    {
        this.debug_log("update tab: " + tabID + " " + attribute + " " + value);
        if(attribute == "title")
        {
            this.document.getElementById("tab-"+tabID).setAttribute("label", value);
            this.document.getElementById("tab-title-"+tabID).innerHTML = value;
        }

        if(attribute == "pinned")
        {
            if(value == true)
            {
                this.document.getElementById("tab-"+tabID).setAttribute("pinned", "true");
            }
            else
            {
                this.document.getElementById("tab-"+tabID).removeAttribute("pinned");
            }
        }
    }

    remove_tab(tabID)
    {
        this.debug_log("remove tab: " + tabID);
        this.document.getElementById("tab-"+tabID).remove();
    }

    setPinnedSizes()
    {
        //this.window.addEventListener("resize", this, false);

        //this.unloaders.push(function()
        //{
            //this.window.removeEventListener("resize", this, false);
        //});

        //this.debug_log("set pinned sizes!");
    }

    onPreferenceChange(prefName, newValue)
    {
        switch (prefName)
        {
            //case "right":
                //this.webExtPreferences = newValue;
                // Placeholder.
                //break;

            //case "tabtoolbarPosition":
                //this.webExtPreferences = newValue;
                // Placeholder.
                //break;

            case "theme":
                this.removeThemeStylesheet();
                this.webExtPreferences[prefName] = newValue;
                this.applyThemeStylesheet();
                break;

            case "compact":
                this.webExtPreferences[prefName] = newValue;
                if (this.preferences("compact") == true)
                {
                    this.installStylesheet(browser.runtime.getURL("data/compact.css"), "compact");
                }
                else
                {
                    this.removeStylesheet("compact");
                }
                break;

            case "style.tab.status":
                this.webExtPreferences[prefName] = newValue;
                if (this.preferences("style.tab.status") == true)
                {
                    this.installStylesheet(browser.runtime.getURL("data/status.css"), "status");
                }
                else
                {
                    this.removeStylesheet("status");
                }
                break;

            default:
                this.webExtPreferences[prefName] = newValue;
                break;
        }
    }

    on_storage_change_iterator(changes, area)
    {
        /* area = placeholder FIXME */

        Object.keys(changes).forEach(item =>
        {
            this.debug_log("on_storage: " + item + " " + changes[item].newValue);
            this.onPreferenceChange(item, changes[item].newValue);
        });
    }

    initEventListeners()
    {
        // Note: Not all eventsListener are set up here

        browser.storage.onChanged.addListener((changes, area) =>
        {
            this.on_storage_change_iterator(changes, area);
        });

        browser.tabs.onCreated.addListener((tab) =>
        {
            this.create_tab(tab);
        });

        browser.tabs.onUpdated.addListener((tabID, changeInfo, tab) =>
        {
            console.log("Update: " + tabID + " " + changeInfo["title"]);
            if (changeInfo.hasOwnProperty("title"))
            {
                this.update_tab(tabID, "title", changeInfo["title"]);
            }

            if (changeInfo.hasOwnProperty("pinned"))
            {
                if (changeInfo.pinned === true || changeInfo.pinned === false)
                {
                    this.update_tab(tabID, "pinned", changeInfo.pinned);
                }
            }
            /*if (changeInfo.hasOwnProperty('mutedInfo')) {
                sidetabs.setMuted(tab, changeInfo.mutedInfo);
              }
          if (changeInfo.hasOwnProperty('audible')) {
            sidetabs.setAudible(tab, changeInfo.audible);
          }
          if (changeInfo.status === 'loading') {
            sidetabs.setSpinner(tab);
          }
          if (changeInfo.status === 'complete') {
            sidetabs.setIcon(tab);
        }*/
        });

        browser.tabs.onDetached.addListener((tabID, details) =>
        {
            this.remove_tab(tabID);
        });

        browser.tabs.onRemoved.addListener((tabID, removeInfo) =>
        {
            this.remove_tab(tabID);
        });

        browser.commands.onCommand.addListener((command) =>
        {
            if (command == "toggleTabbrowser")
            {
                this.toggleDisplayState();
            }
        });

        browser.browserAction.onClicked.addListener(() =>
        {
            this.toggleDisplayState();
        });

        //Old event handler: case "popupshowing":
            //return;
    }

    toggleDisplayState()
    {
        // FIREFIX: Not yet able to read the status of the sidebar.

        // browser.sidebarAction.toggleSidebar(); /// FIREFIX FIXME: not landed in Nightly yet

        /* if(sidebar visible == true)
        {
            this.changedDisplayState = true;
        }
        else
        {
            this.changedDisplayState = false;
        }*/
    }

    changeDisplayState(display)
    {
        // FIREFIX: Not yet able to read the status of the sidebar.

        /*
        if((display == "none" && sidebar visible == true) || (display == "" && sidebar visible == false))
        {
            // browser.sidebarAction.toggleSidebar(); /// FIREFIX FIXME: not landed in Nightly yet
        } */
    }

    /* Enter/Left fullscreen mode */
    changeFullscreenMode(state)
    {
        if(this.changedDisplayState == true)
        {
            return;
        }

        this.debug_log("changeFullscreenMode " + state);
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

    debug_log(output)
    {
        main.debug_log(output);
    }

}

document.addEventListener("DOMContentLoaded", function()
{
    main.get_setting().then(value =>
    {
        var VTR = new VerticalTabsReloaded(window, value);
    });

});

//exports.VerticalTabsReloaded = VerticalTabsReloaded;
