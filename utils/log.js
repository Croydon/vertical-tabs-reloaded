"use strict";

/* global utils */
/* exported log */

utils["log"] = {};
var log = utils["log"];
utils["log"]["debug"] = function debug_log(output)
{
    let debugSetting = false;

    browser.storage.local.get("debug").then(results =>
    {
        if (results.hasOwnProperty("debug"))
        {
            debugSetting = results["debug"];
        }

        if(debugSetting == true)
        {
            console.log(output);
        }
    });
};
