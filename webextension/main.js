"use strict"

var port = browser.runtime.connect({name: "connection-to-legacy"});


//
// Handle addon settings
//
var settings;
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function()
{
    settings = JSON.parse(xhr.responseText);
}
xhr.open("GET", "options/options.json", true);
xhr.send();


function get_options_object()
{
    return settings;
}

function restore_default_settings()
{
    Object.keys(settings).forEach(function(optionsElement)
    {
        save_setting(settings[optionsElement]["name"], settings[optionsElement]["value"]);
        sdk_send_changed_setting(settings[optionsElement]["name"]);
    });
}

function save_setting(name, value)
{
    let settingsObject = {};
    settingsObject[name] = value;

    browser.storage.local.set(settingsObject).then(error =>
    {
        if(error)
        {
            return false;
        }

        return true;
    });
}

function get_setting(name)
{
    return new Promise(function (fulfill, reject)
    {
        browser.storage.local.get(name).then(results =>
        {
            if (!results.hasOwnProperty(name))
            {
                debug_log("VTR WebExt setting '"+ name +"': not saved use default value.");
                if(settings.hasOwnProperty(name))
                {
                    results[name] = settings[name]["value"];
                }
                else
                {
                    debug_log("VTR WebExt setting '"+ name +"': no default value found.");
                }
            }

            fulfill(results[name]);
        }).catch(
            function(reason) {
                debug_log(reason);
            }
        );
    });
}

//
// CSS Mangament
//

function css_load_file(filename)
{
    return new Promise(function (fulfill, reject)
    {
        var read = new XMLHttpRequest();
        debug_log(browser.runtime.getURL("data/"+filename));
        read.open("GET", browser.runtime.getURL("data/"+filename), false);
        read.onreadystatechange = function()
        {
            //console.log(read.responseText);
            fulfill(read.responseText);
        }
        read.send();
    });
}

//
// Communication with the legacy part + content script
//

function sdk_send_all_settings()
{
    browser.storage.local.get().then(value => {
        value["dataPath"] = browser.runtime.getURL("data/");
        sdk_sendMsg({
            type: "settings.post-all",
            value: value
        });
    });
}

sdk_send_all_settings();

// Changed addon preferences, send to SDK
function sdk_send_changed_setting(settingName)
{
    sdk_send_all_settings();

    get_setting(settingName).then(value => {
        sdk_sendMsg({
            type: "settings.post",
            name: settingName,
            value: value
        });
    });
}

function sdk_replyHandler(message)
{
    if(message.type == "settings.post")
    {
        // the legacy part sent settings, save them
        debug_log(message.name + " (from legacy) : " + message.value);
        save_setting(message.name, message.value);
    }

    if(message.type == "settings.reset")
    {
        restore_default_settings();
    }

    /*if(message.type == "css.get")
    {
        if(message.file == "none")
        {
            // Reset some saved CSS values
            sdk_sendMsg({type: "css.post", name: message.name, value: ""});
        }
        else
        {
            css_load_file(message.file).then(css =>
            {
                sdk_sendMsg({type: "css.post", name: message.name, value: css});
            });
        }
    }*/

    if(message.type == "debug.log")
    {
        debug_log(message.value);
    }
}

port.onMessage.addListener(sdk_replyHandler); // legacy listener
browser.runtime.onMessage.addListener(sdk_replyHandler); // content script listener

function sdk_sendMsg(message)
{
    browser.runtime.sendMessage(message).then(reply =>
    {
        if (reply) {
            sdk_replyHandler(reply);
        }
    });
}



setInterval(function()
{
    browser.windows.getCurrent().then(currentWindow =>
    {
        if(typeof this["vtr.windows.state."+currentWindow.id] == undefined)
        {
            this["vtr.windows.state."+currentWindow.id] = "init";
        }

        if(currentWindow.state == "fullscreen")
        {
            if(this["vtr.windows.state."+currentWindow.id] != "fullscreen")
            {
                this["vtr.windows.state."+currentWindow.id] = "fullscreen";
                get_setting("hideInFullscreen").then(value =>
                {
                    if(value == true)
                    {
                        sdk_sendMsg({type: "event.fullscreen", value: "true"});
                    }
                });
            }
        }
        else
        {
            if(this["vtr.windows.state."+currentWindow.id] == "fullscreen")
            {
                this["vtr.windows.state."+currentWindow.id] = currentWindow.state;
                get_setting("hideInFullscreen").then(value =>
                {
                    if(value == true)
                    {
                        sdk_sendMsg({type: "event.fullscreen", value: "false"});
                    }
                });
            }
        }
    });
}, 100);


setTimeout(function() {
    // Get all settings from the legacy part once
    sdk_sendMsg({type: "settings.migrate"});

    // Set up listener
    browser.storage.onChanged.addListener(sdk_send_all_settings);
}, 100);


// Utils
function debug_log(output)
{
	get_setting("debug").then(value => {
        if(value == true)
        {
            console.log(output);
        }
	});
}
