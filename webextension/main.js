"use strict"

var port = browser.runtime.connect({name: "connection-to-legacy"});


//
// Handle addon settings
//
var defaultSettings = {
    right: false,
    hideInFullscreen: true,
    compact: false,
    "style.tab.status": false,
    theme: "dark",
    tabtoolbarPosition: "top",
    toggleDisplayHotkey: "control-alt-v",
    width: 250,
    debug: false,
    showHiddenSettings: false,
    experiment: false
}

function restore_default_settings()
{
    Object.keys(defaultSettings).forEach(function(k)
    {
        save_setting(k, defaultSettings[k]);
        sdk_send_changed_setting(k);
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
                if(defaultSettings.hasOwnProperty(name))
                {
                    results[name] = defaultSettings[name];
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
