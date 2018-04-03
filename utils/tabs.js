"use strict";

/* global utils log */

utils["tabs"] = class tabutils
{
    static getTargetID(e)
    {
        // This returns the tabID of a tab, which is always the last element in a HTML ID tag
        return parseInt(this.getIDFromHTMLID(e.target.id), 10);
    }

    static getIDFromHTMLID(target)
    {
        let targetArray = target.split("-");
        return parseInt(targetArray[targetArray.length - 1], 10);
    }

    static getIndexFrom(tabID)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        return parseInt(document.getElementById("tab-" + tabID).getAttribute("data-index"), 10);
    }

    static updateTabIndexes()
    {
        let index = 0;
        for(let tab of window.document.querySelectorAll(".tabbrowser-tab"))
        {
            tab.setAttribute("data-index", index);
            // window.document.getElementById("tab-title-" + utils.tabs.getIDFromHTMLID(tab.id)).innerHTML = index;
            index++;
        }
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
            log.debug("muted: " + !tabInfo.mutedInfo.muted);
            browser.tabs.update(tabID, {"muted": !tabInfo.mutedInfo.muted});
        });
    }

    static moveToNewWindow(tabID)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        browser.windows.create({"tabId": tabID});
    }

    static setIndex(tabID, newIndex)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        if(typeof newIndex == "string")
        {
            newIndex = parseInt(newIndex, 10);
        }

        browser.tabs.move(tabID, {index: newIndex});
    }

    static async isPinned(tabID)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        let pinnedInfo;
        await browser.tabs.get(tabID).then((tabInfo) =>
        {
            pinnedInfo = tabInfo.pinned;
        });

        return pinnedInfo;
    }

    static reloadAllVisibleTabs()
    {
        browser.windows.getCurrent({"windowTypes": ["normal"], "populate": true}).then((windowInfo) =>
        {
            for(let tab of windowInfo.tabs)
            {
                browser.tabs.reload(tab.id);
            }
        });
    }

    static closeTabsRelativeTo(tabID, relativeTyp)
    {
        let tabIndex = this.getIndexFrom(tabID);
        log.debug("Close tabs " + relativeTyp + " from  tab index " + tabIndex);

        let closeTheseTabs = [];
        for(let tab of window.document.querySelectorAll(".tabbrowser-tab"))
        {
            let currentTabID = this.getIDFromHTMLID(tab.id);
            let currentTabIndex = this.getIndexFrom(currentTabID);

            if((relativeTyp == "below" && currentTabIndex > tabIndex)
            || (relativeTyp == "above" && currentTabIndex < tabIndex)
            || (relativeTyp == "others" && currentTabID != tabID))
            {
                closeTheseTabs.push(currentTabID);
            }
        }

        this.updateTabIndexes();
        log.debug(closeTheseTabs);
        this.close(closeTheseTabs);
    }

    static async isActive(tabID)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        let activeInfo;
        await browser.tabs.get(tabID).then((tabInfo) =>
        {
            activeInfo = tabInfo.active;
        });

        return activeInfo;
    }

    static isTabElement(HTMLElement)
    {
        if(HTMLElement.classList.contains("tabbrowser-tab"))
        {
            return true;
        }

        return false;
    }
};
