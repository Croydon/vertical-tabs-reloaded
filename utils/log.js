"use strict";

/* global utils */
/* exported log */

utils["log"] = {};
var log = utils["log"];

utils["log"]["debugEnabled"] = false;

utils["log"]["debug"] = function debug_log(output)
{
    if(utils["log"]["debugEnabled"] == true)
    {
        console.log(output);
    }
};
