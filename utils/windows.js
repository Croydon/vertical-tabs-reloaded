"use strict";

/* global utils log */

let managedWindows = {};

// Windows Management
utils["windows"] = class windowsutils
{
    static add(windowID)
    {
        log.debug("add window " + windowID);
        managedWindows[windowID] = {"sidebarOpened": false};
    }

    static remove(windowID)
    {
        delete managedWindows[windowID];
    }

    /* This function is required for Opera, Firefox enables us to read the sidebar status directly */
    static setSidebarOpenedStatus(windowID, newSidebarOpenedStatus)
    {
        log.debug("set window status " + windowID);
        managedWindows[windowID]["sidebarOpened"] = newSidebarOpenedStatus;
    }

    static async getSidebarOpenedStatus(windowID)
    {
        /* FIXME:
        If Opera then
            return managedWindows[windowID]["sidebarOpened"];
        else */
        let isOpen;
        await browser.sidebarAction.isOpen({"windowId": windowID}).then((result) =>
        {
            isOpen = result;
        });

        return isOpen;
    }

    /* FIXME: Necessary? Buggy as it's not getting set anywhere, when not manually? */
    static getCurrentWindow()
    {
        return managedWindows["currentWindow"];
    }

    static setCurrentWindow(windowID)
    {
        managedWindows["currentWindow"] = windowID;
    }
};
