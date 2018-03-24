"use strict";

/* global utils */

// Time & Date Helpers
utils["time"] = class timesutils
{
    /* Returns the current UNIX timestamp */
    static getTimestamp()
    {
        return Math.floor(Date.now() / 1000);
    }
};
