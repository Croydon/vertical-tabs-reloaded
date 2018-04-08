"use strict";

/* global utils log */

let managedWindows = {};

// Windows Management
// FIREFIX: FIXME: Not yet able to read the status of the sidebar. Try to workaround #134
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

    static setSidebarOpenedStatus(windowID, newSidebarOpenedStatus)
    {
        log.debug("set window status " + windowID + " status: " + newSidebarOpenedStatus);

        if(typeof managedWindows[windowID] == "undefined")
        {
            this.add(windowID);
        }
        managedWindows[windowID]["sidebarOpened"] = newSidebarOpenedStatus;
    }

    static getSidebarOpenedStatus(windowID)
    {
        return managedWindows[windowID]["sidebarOpened"];
    }

    static getCurrentWindow()
    {
        return managedWindows["currentWindow"];
    }

    static setCurrentWindow(windowID)
    {
        managedWindows["currentWindow"] = windowID;
    }
};
