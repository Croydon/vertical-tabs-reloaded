"use strict";

var main = browser.extension.getBackgroundPage();

function debug_log(output)
{
    debug_log(output);
}

class tabutils
{
    static getTargetID(e)
    {
        // This returns the tabID of a tab, which is always the last element in a HTML ID tag
        let target = e.target.id;
        let targetArray = target.split("-");
        return targetArray[targetArray.length - 1];
    }

    static close(tabID)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        browser.tabs.remove(tabID);
    }

    static reload(tabID)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        browser.tabs.reload(tabID);
    }

    // Toggles pinning status
    static pin(tabID)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        browser.tabs.get(tabID).then((tabInfo) =>
        {
            browser.tabs.update(tabID, {"pinned": !tabInfo.pinned});
        });
    }

    // Toggles muting status
    static mute(tabID)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        browser.tabs.get(tabID).then((tabInfo) =>
        {
            console.log("muted: " + !tabInfo.mutedInfo.muted);
            browser.tabs.update(tabID, {"muted": !tabInfo.mutedInfo.muted});
        });
    }

    static async isPinned(tabID)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        let pinnedInfo;
        await browser.tabs.get(tabID).then((tabInfo) => {
            pinnedInfo = tabInfo.pinned;
        });

        return pinnedInfo;
    }
}

/* Entry point for every VTR sidebar for every window */
var VerticalTabsReloaded = class VerticalTabsReloaded
{
    constructor(window, preferences)
    {
        // this.main = main;
        this.window = window;
        this.document = window.document;
        this.webExtPreferences = preferences;
        this.changedDisplayState = false;
        this.unloaders = [];
        this.selectedTabID = undefined;
        this.newOpenedTabSelectIt = undefined;
        this.initialized = false;

        this.tabbrowser = this.document.getElementById("tabbrowser-tabs");

        browser.windows.getCurrent({windowTypes: ["normal"]}).then((windowObj) =>
        {
            this.windowID = windowObj.id;
            this.init();
        });
    }

    init()
    {
        debug_log(this.webExtPreferences);

        this.build_ui();
        this.initEventListeners();
        this.scroll_to_tab(this.selectedTabID);
        this.toolbar_activate();
        this.check_scrollbar_status();
        main.windowutils.setSidebarOpenedStatus(this.windowID, true);
        this.initialized = true;
    }

    preferences(settingName)
    {
        debug_log(settingName + " (lib): " + this.webExtPreferences[settingName]);
        return this.webExtPreferences[settingName];
    }

    installStylesheet(uri, type)
    {
        debug_log("VTR install sheet: " + uri + " of type: " + type);
        this.document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" href="${uri}" id="vtr-${type}">`);
    }

    removeStylesheet(type)
    {
        debug_log("VTR remove sheet of type: " + type);
        this.document.getElementById("vtr-" + type).remove();
    }

    applyThemeStylesheet()
    {
        if(this.preferences("theme") != "none")
        {
            this.installStylesheet(this.getThemeStylesheet(this.preferences("theme")), "theme");
        }
    }

    removeThemeStylesheet()
    {
        if(this.preferences("theme") != "none")
        {
            debug_log("remove theme stylesheet!");
            this.removeStylesheet("theme");
        }
    }

    getThemeStylesheet(theme)
    {
        let stylesheet;
        switch (theme)
        {
            default:
                stylesheet = "data/theme/" + theme + "/index.css";
                break;
        }

        return browser.runtime.getURL(stylesheet);
    }

    scroll_to_tab(tabID)
    {
        if(typeof tabID != "number")
        {
            return;
        }

        let tabElement = this.document.getElementById("tab-" + tabID);

        if(tabElement == null)
        {
            setTimeout(() =>
            {
                tabElement = this.document.getElementById("tab-" + tabID);
                if(tabElement == null)
                {
                    return;
                }
            }, 10);
        }

        var rect = tabElement.getBoundingClientRect();

        if(rect.top >= 0
        && rect.left >= 0
        && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        && rect.right <= (window.innerWidth || document.documentElement.clientWidth))
        {
            // visible
        }
        else
        {
            tabElement.scrollIntoView({block: "end", behavior: "smooth"});
        }
    }

    build_ui()
    {
        // FIREFIX: Placeholder. Firefox doesn't support hiding the default tabbrowser currently.

        // Injecting CSS
        this.installStylesheet(browser.runtime.getURL("data/theme/base.css"), "base");
        this.applyThemeStylesheet();
        if (this.preferences("compact") == true)
        {
            debug_log("compact true");
            this.installStylesheet(browser.runtime.getURL("data/compact.css"), "compact");
        }

        if (this.preferences("style.tab.status") == true)
        {
            debug_log("style.tab.status true");
            this.installStylesheet(browser.runtime.getURL("data/status.css"), "status");
        }

        browser.tabs.query({currentWindow: true}).then((tabs) =>
        {
            for(let tab of tabs)
            {
                this.create_tab(tab);
            }
        });

        this.unloaders.push(() =>
        {
            // FIXME: Properly not necessary since sidebars are totally isolated and are just getting "deleted" on closing
        });
    }

    check_scrollbar_status()
    {
        if(this.tabbrowser.scrollHeight > this.tabbrowser.clientHeight)
        {
            this.tabbrowser.classList.remove("no-scrollbar");
            this.tabbrowser.classList.add("scrollbar-visible");
        }
        else
        {
            this.tabbrowser.classList.remove("scrollbar-visible");
            this.tabbrowser.classList.add("no-scrollbar");
        }
    }

    /* FIREFIX: Firefox's security policy prevents us from loading some default icons,
    replace with local, exact-same icon versions
    - yes. that's kinda stupid  */
    normalize_tab_icon(iconURL)
    {
        if(typeof iconURL == "undefined" || iconURL == null || iconURL == "")
        {
            return "data/chrome/icon/default-favicon.svg";
        }

        switch (iconURL)
        {
            case "chrome://mozapps/skin/extensions/extensionGeneric-16.svg":
                return "data/chrome/icon/extension-generic.svg";

            case "chrome://mozapps/skin/places/defaultFavicon.svg":
                return "data/chrome/icon/default-favicon.svg";

            default:
                return iconURL;
        }
    }

    create_tab(tab)
    {
        let id = tab.id;
        // let url = tab.url;
        let title = "Connecting...";
        let pinned = tab.pinned;
        let status = tab.status;
        let iconURL = this.normalize_tab_icon(tab.favIconUrl);

        let pinnedAttribute = "", selectedAttribute = "", statusAttribute = `status="${status}"`, tabIndex = 0;

        if(status == "loading")
        {
            iconURL = "data/chrome/icon/connecting@2px.png";
        }

        if(pinned == true)
        {
            pinnedAttribute = 'pinned="true"';
        }

        if(tab.selected == true)
        {
            selectedAttribute = 'selected="true"';
            this.selectedTabID = id;
        }

        if(this.initialized == false)
        {
            tabIndex = tab.index;
        }
        else
        {
            // Temporary index, we are updating it directly after creating the tab
            // This improves performance at startup and complexity at runtime
            tabIndex = this.get_last_tab_index() + 1;
        }

        let tabHTML = `<div id="tab-${id}" class="tabbrowser-tab" title="${title}" ${pinnedAttribute} ${selectedAttribute} ${statusAttribute} data-index="${tabIndex}" align="stretch">
        <span class="tab-icon"> <img id="tab-icon-${id}" class="tab-icon-image" src="${iconURL}" data-src-after-loaded="${iconURL}"> </span>
        <span id="tab-title-${id}" class="tab-label tab-text"> ${title} </span>
        <span class="tab-buttons">
            <span id="tab-close-button-${id}" class="tab-close-button close-icon" title="Close tab"> </span>
        </span>
        </div>`;

        // Check: fadein="true" linkedpanel="panel-3-77" pending="true" align="stretch"
        if(pinned == true)
        {
            this.document.getElementById("tabbrowser-tabs-pinned").insertAdjacentHTML("beforeend", tabHTML);
        }
        else
        {
            this.tabbrowser.insertAdjacentHTML("beforeend", tabHTML);
        }

        this.document.getElementById("tab-" + id).addEventListener("click", (event) =>
        {
            browser.tabs.update(id, {active: true});
            event.preventDefault();
        });


        if(this.newOpenedTabSelectIt == id)
        {
            this.newOpenedTabSelectIt = undefined;
            this.update_tab(id, "selected", "true");
        }

        this.update_tab(id, "title", tab.title);

        if(this.initialized == true)
        {
            // At startup we would check that for every single tab, which is nonsense
            this.check_scrollbar_status();
        }

        this.document.getElementById(`tab-close-button-${id}`).addEventListener("click", () => { tabutils.close(id); });

        if(this.initialized == true)
        {
            this.move_tab(id, tabIndex, tab.index);
        }

        /* div.addEventListener('dragstart', handleDragStart, false);
        div.addEventListener('dragover', handleDragOver, false);
        div.addEventListener('drop', handleDrop, false);*/
    }

    update_tab(tabID, attribute, value)
    {
        debug_log("update tab: " + tabID + " " + attribute + " " + value);
        switch(attribute)
        {
            case "title":
                this.document.getElementById("tab-" + tabID).setAttribute("title", value);
                this.document.getElementById("tab-title-" + tabID).innerText = value;
                break;

            case "pinned":
                if(value == true)
                {
                    this.document.getElementById("tab-" + tabID).setAttribute("pinned", "true");
                    this.document.getElementById("tabbrowser-tabs-pinned").appendChild(this.document.getElementById("tab-" + tabID));
                }
                else
                {
                    this.document.getElementById("tab-" + tabID).removeAttribute("pinned");
                    // this.document.getElementById("tabbrowser-tabs").appendChild(this.document.getElementById("tab-"+tabID)); // unpinning triggers index update as well
                }
                break;

            case "favIconUrl":
                value = this.normalize_tab_icon(value);

                debug_log("status: " + this.document.getElementById("tab-" + tabID).getAttribute("status"));
                debug_log("favIconUrl loaded: " + value);

                this.document.getElementById("tab-icon-" + tabID).setAttribute("data-src-after-loaded", value);

                if(this.document.getElementById("tab-" + tabID).getAttribute("status") == "complete")
                {
                    this.document.getElementById("tab-icon-" + tabID).setAttribute("src", value);
                }

                break;

            case "selected":
                if(this.selectedTabID != undefined)
                {
                    this.document.getElementById("tab-" + this.selectedTabID).removeAttribute("selected");
                }

                let selectedTab = this.document.getElementById("tab-" + tabID);
                if(selectedTab != null)
                {
                    this.document.getElementById("tab-" + tabID).setAttribute("selected", "true");
                    this.selectedTabID = tabID;

                    this.scroll_to_tab(tabID);
                }
                else
                {
                    this.newOpenedTabSelectIt = tabID;
                }

                break;

            case "status":
                debug_log("new status: " + value);
                this.document.getElementById("tab-" + tabID).setAttribute("status", value);

                if(value == "complete")
                {
                    let newFavicon = this.document.getElementById("tab-icon-" + tabID).getAttribute("data-src-after-loaded");
                    if(newFavicon != "")
                    {
                        debug_log("new favicon: " + newFavicon);
                        this.update_tab(tabID, "favIconUrl", newFavicon);
                    }
                }

                if(value == "loading")
                {
                    // FIXME: Which icon is getting set should be really up to the theme
                    this.document.getElementById("tab-icon-" + tabID).setAttribute("src", "data/chrome/icon/connecting@2x.png");
                }
                break;

            case "index":
                this.document.getElementById("tab-" + tabID).setAttribute("data-index", value);
                this.document.getElementById("tab-title-" + tabID).innerHTML = value;
                break;
        }
    }

    async move_tab(tabID, fromIndex, toIndex)
    {
        if(fromIndex == toIndex) { return; }

        debug_log("move tab " + tabID + " from " + fromIndex + " to " + toIndex);

        let pinnedTab = await tabutils.isPinned(tabID);
        let pinnedTabMoveDown = false;

        debug_log(this.get_last_tab_index());
        if(toIndex == this.get_last_tab_index())
        {
            // Move at the end
            if(pinnedTab)
            {
                this.document.getElementById("tabbrowser-tabs-pinned").append(this.document.getElementById("tab-" + tabID));
            }
            else
            {
                this.tabbrowser.append(this.document.getElementById("tab-" + tabID));
            }
        }
        else
        {
            let insertBeforeIndex;
            if(fromIndex < toIndex)
            {
                // Move down
                insertBeforeIndex = toIndex + 1;

                // Check if this is a pinned tab moving down
                // We need to prevent, that the pinned tab is placing in the regular tab section
                if(pinnedTab)
                {
                    pinnedTabMoveDown = true;
                }
            }
            else
            {
                // Move up
                insertBeforeIndex = toIndex;
            }

            let insertBeforeTab = this.document.querySelector(`div[data-index="${insertBeforeIndex}"]`);

            if(pinnedTabMoveDown == true)
            {
                if(insertBeforeTab.getAttribute("pinned") === null)
                {
                    // We want to move a pinned tab down to the last position of pinned tabs
                    this.document.getElementById("tabbrowser-tabs-pinned").append(this.document.getElementById("tab-" + tabID));
                    return;
                }
            }

            // debug_log(insertBeforeIndex);
            // debug_log(insertBeforeTab.outerHTML);
            insertBeforeTab.parentNode.insertBefore(this.document.getElementById("tab-" + tabID), insertBeforeTab);
        }
    }

    update_tab_indexes()
    {
        let index = 0;
        for(let tab of this.document.getElementsByClassName("tabbrowser-tab"))
        {
            tab.setAttribute("data-index", index);
            // tab.innerHTML = index + " " + tab.innerHTML;
            index++;
        }
    }

    get_last_tab_index()
    {
        /* if(this.tabbrowser.lastElementChild === null && this.document.getElementById("tabbrowser-tabs-pinned") === null)
        {
            return -1;
        } */

        let result;

        if(this.tabbrowser.lastElementChild === null)
        {
            if(this.document.getElementById("tabbrowser-tabs-pinned").lastElementChild === null)
            {
                return -1;
            }
            else
            {
                result = this.document.getElementById("tabbrowser-tabs-pinned").lastElementChild.getAttribute("data-index");
            }


        }
        else
        {
            result = this.tabbrowser.lastElementChild.getAttribute("data-index");
        }

        return parseInt(result, 10);
    }

    remove_tab(tabID)
    {
        if(this.document.getElementById("tab-" + tabID) !== null)
        {
            debug_log("remove tab: " + tabID);

            if(tabID == this.selectedTabID)
            {
                this.selectedTabID = undefined;
            }

            this.document.getElementById(`tab-close-button-${tabID}`).removeEventListener("click", () => { tabutils.close(tabID); });
            this.document.getElementById("tab-" + tabID).remove();

            this.check_scrollbar_status();
        }
    }

    setPinnedSizes()
    {
        // this.window.addEventListener("resize", this, false);

        // this.unloaders.push(function()
        // {
        // this.window.removeEventListener("resize", this, false);
        // });

        // debug_log("set pinned sizes!");
    }

    onPreferenceChange(prefName, newValue)
    {
        switch (prefName)
        {
            // Former options which have no effect anymore: "right" (sidebar position), "hideInFullscreen"

            case "tabtoolbarPosition":
                this.webExtPreferences[prefName] = newValue;
                let TabsToolbar = this.document.getElementById("TabsToolbar");

                switch(newValue)
                {
                    case "hide":
                        TabsToolbar.style.display = "none";
                        break;

                    case "top":
                        TabsToolbar.style.display = "";
                        this.document.body.insertBefore(TabsToolbar, this.document.getElementById("tabbrowser-tabs-pinned"));
                        break;

                    case "bottom":
                        TabsToolbar.style.display = "";
                        this.document.appendChild(TabsToolbar);
                        break;
                }
                break;

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
            debug_log("on_storage: " + item + " " + changes[item].newValue);
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
            if(tab.windowId == this.windowID)
            {
                this.create_tab(tab);
                this.update_tab_indexes();
            }
        });

        browser.tabs.onActivated.addListener((details) =>
        {
            this.update_tab(details.tabId, "selected", "true");
        });

        browser.tabs.onUpdated.addListener((tabID, changeInfo, tab) =>
        {
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

            if(changeInfo.hasOwnProperty("favIconUrl"))
            {
                this.update_tab(tabID, "favIconUrl", changeInfo["favIconUrl"]);
            }

            if(changeInfo.hasOwnProperty("status"))
            {
                this.update_tab(tabID, "status", changeInfo["status"]);
            }

            /* if (changeInfo.hasOwnProperty('mutedInfo')) {
                sidetabs.setMuted(tab, changeInfo.mutedInfo);
            }
            if (changeInfo.hasOwnProperty('audible')) {
                sidetabs.setAudible(tab, changeInfo.audible);
            } */
        });

        browser.tabs.onMoved.addListener((tabID, moveInfo) =>
        {
            this.move_tab(tabID, moveInfo["fromIndex"], moveInfo["toIndex"]);
            // this.update_tab(tabID, "index", moveInfo["toIndex"]);
            this.update_tab_indexes();
        });

        browser.tabs.onDetached.addListener((tabID, details) =>
        {
            this.remove_tab(tabID);
        });

        browser.tabs.onRemoved.addListener((tabID, removeInfo) =>
        {
            this.remove_tab(tabID);
        });

        // Doubleclick on free space within the tabbrowser opens a new tab
        this.document.getElementById("tabbrowser-tabs").addEventListener("dblclick", (e) =>
        {
            if(e.target == this.document.getElementById("tabbrowser-tabs"))
            {
                browser.tabs.create({
                    active: true,
                });
            }
        });

        // Old event handler: case "popupshowing":
        // return;
    }

    toolbar_activate()
    {
        let TabsToolbar = this.document.getElementById("TabsToolbar");

        switch(this.preferences("tabtoolbarPosition"))
        {
            case "hide":
                TabsToolbar.style.display = "none";
                break;

            case "top":
                this.document.insertBefore(TabsToolbar, this.document.getElementById("tabbrowser-tabs-pinned"));
                break;

            case "bottom":
                // Default position
                break;
        }

        this.document.getElementById("toolbar-action-tab-new").addEventListener("click", () =>
        {
            browser.tabs.create({
                active: true,
            });
        });

        this.document.getElementById("toolbar-action-options").addEventListener("click", () =>
        {
            browser.runtime.openOptionsPage();
        });
    }

    unload()
    {
        this.unloaders.forEach(function(func)
        {
            func.call(this);
        }, this);

        this.unloaders = [];
    }
};

var contextmenuTarget = "NOTARGET";

function contextmenuHide()
{
    if(contextmenuTarget != "NOTARGET")
    {
        document.getElementById("contextmenu").style.display = "";
        document.getElementById("contextmenu").removeEventListener("click", contextmenuHide);
        // document.removeEventListener("DOMMouseScroll", (e) => { e.preventDefault(); } , false);
        document.removeEventListener("scroll", (e) => { contextmenuHide(); });
    }
}

function contextmenuShow(e)
{
    e.preventDefault();

    contextmenuTarget = tabutils.getTargetID(e);

    debug_log(contextmenuTarget);
    debug_log(e.pageX + " y " + e.pageY);

    document.getElementById("contextmenu").style.setProperty("left", e.pageX + "px");
    document.getElementById("contextmenu").style.setProperty("top", e.pageY + "px");
    document.getElementById("contextmenu").style.display = "block";

    // FIXME: Prevent scrolling while the context menu is open // removing this event handler doesn't work for some reason
    // Simply close the context menu for now on scrolling
    // document.addEventListener("DOMMouseScroll", (e) => { e.preventDefault(); } , false);
    document.addEventListener("scroll", (e) => { contextmenuHide(); });

    document.addEventListener("click", contextmenuHide);
}

document.addEventListener("DOMContentLoaded", () =>
{
    main.get_setting().then(value =>
    {
        new VerticalTabsReloaded(window, value);
    });

    document.getElementById("tabbrowser-tabs-pinned").addEventListener("contextmenu", (e) => contextmenuShow(e));
    document.getElementById("tabbrowser-tabs").addEventListener("contextmenu", (e) => contextmenuShow(e));

    document.getElementById("contextmenu-action-tab-close").addEventListener("click", (e) => { tabutils.close(contextmenuTarget); });
    document.getElementById("contextmenu-action-tab-reload").addEventListener("click", (e) => { tabutils.reload(contextmenuTarget); });
    document.getElementById("contextmenu-action-tab-pin").addEventListener("click", (e) => { tabutils.pin(contextmenuTarget); });
    document.getElementById("contextmenu-action-tab-mute").addEventListener("click", (e) => { tabutils.mute(contextmenuTarget); });
});

// exports.VerticalTabsReloaded = VerticalTabsReloaded;
