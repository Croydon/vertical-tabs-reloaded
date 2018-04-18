"use strict";

/* exported main utils log */

var main;
var utils;
var log;
// var options;

if(browser.extension.getBackgroundPage() != null)
{
    // REGULAR WINDOWS
    main = browser.extension.getBackgroundPage();
    // options = main.utils.options; // see sidebar.js
}
else
{
    // PRIVATE WINDOWS
    // options = utils.options; // see sidebar.js
}

// for all windows
utils = {};
log = utils.log;
