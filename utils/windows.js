let managedWindows = {};
// Windows Management
// FIREFIX: FIXME: Not yet able to read the status of the sidebar. Try to workaround #134
utils["windows"] = class windowsutils
{
    static add(windowID)
    {
        debug_log("add window " + windowID);
        managedWindows[windowID] = {"sidebarOpened": false};
    }

    static remove(windowID)
    {
        delete managedWindows[windowID];
    }

    static setSidebarOpenedStatus(windowID, newSidebarOpenedStatus)
    {
        debug_log("set window status " + windowID);
        managedWindows[windowID]["sidebarOpened"] = newSidebarOpenedStatus;
    }

    static getSidebarOpenedStatus(windowID)
    {
        return managedWindows[windowID]["sidebarOpened"];
    }
};
