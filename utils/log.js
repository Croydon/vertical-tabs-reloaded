"use strict";

/* global utils */
/* exported log */

utils["log"] = {};
var log = utils["log"];

utils["log"]["debugEnabled"] = false;

// Set inital value for debug logging enabled
browser.storage.local.get("debug").then(results =>
{
    if (results.hasOwnProperty("debug"))
    {
        utils.log.debugEnabled = results.debug;
    }
});

utils["log"]["debug"] = function debug_log(output)
{
    if(utils["log"]["debugEnabled"] == true)
    {
        console.log(output);
    }
};
