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
        tabID = this._convertIDtoInt(tabID);

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
        tabID = this._convertIDtoInt(tabID);

        browser.tabs.remove(tabID);
    }

    static reload(tabID)
    {
        tabID = this._convertIDtoInt(tabID);

        browser.tabs.reload(tabID);
    }

    // Toggles pinning status
    static pin(tabID)
    {
        tabID = this._convertIDtoInt(tabID);

        browser.tabs.get(tabID).then((tabInfo) =>
        {
            browser.tabs.update(tabID, {"pinned": !tabInfo.pinned});
        });
    }

    // Toggles muting status
    static mute(tabID)
    {
        tabID = this._convertIDtoInt(tabID);

        browser.tabs.get(tabID).then((tabInfo) =>
        {
            log.debug("muted: " + !tabInfo.mutedInfo.muted);
            browser.tabs.update(tabID, {"muted": !tabInfo.mutedInfo.muted});
        });
    }

    // Discard a single tab
    static discard(tabID)
    {
        tabID = this._convertIDtoInt(tabID);

        browser.tabs.discard(tabID);
    }

    static moveToNewWindow(tabID)
    {
        tabID = this._convertIDtoInt(tabID);

        browser.windows.create({"tabId": tabID});
    }

    static setIndex(tabID, newIndex)
    {
        tabID = this._convertIDtoInt(tabID);

        if(typeof newIndex == "string")
        {
            newIndex = parseInt(newIndex, 10);
        }

        browser.tabs.move(tabID, {index: newIndex});
    }

    static async isPinned(tabID)
    {
        return await this._isTabSomething(tabID, "pinned");
    }

    static async isMuted(tabID)
    {
        return await this._isTabSomething(tabID, "mutedInfo.muted");
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

    static async restoreLastClosedTab()
    {
        let lastSession = await browser.sessions.getRecentlyClosed({maxResults: 1});
        if(typeof lastSession[0].tab != "undefined")
        {
            browser.sessions.restore(lastSession[0].tab.sessionId);
        }
    }

    static async isActive(tabID)
    {
        return await this._isTabSomething(tabID, "active");
    }

    static async isDiscarded(tabID)
    {
        return await this._isTabSomething(tabID, "discarded");
    }

    static isTabElement(HTMLElement)
    {
        if(HTMLElement.classList.contains("tabbrowser-tab"))
        {
            return true;
        }

        return false;
    }

    static async _isTabSomething(tabID, key)
    {
        tabID = this._convertIDtoInt(tabID);

        let somethingInfo;

        await browser.tabs.get(tabID).then((tabInfo) =>
        {
            if(!key.includes("."))
            {
                somethingInfo = tabInfo[key];
            }
            else
            {
                for(let singleKey of key.split("."))
                {
                    if(somethingInfo == null)
                    {
                        somethingInfo = tabInfo[singleKey];
                    }
                    else
                    {
                        somethingInfo = somethingInfo[singleKey];
                    }
                }
            }
        });

        return somethingInfo;
    }

    static _convertIDtoInt(tabID)
    {
        if(typeof tabID == "string")
        {
            tabID = parseInt(tabID, 10);
        }

        return tabID;
    }
};
