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
    utils = {};
    log = utils.log;
    // options = main.utils.options; // see sidebar.js
}
else
{
    // PRIVATE WINDOWS
    utils = {};
    log = utils.log;
    // options = utils.options; // see sidebar.js
}
