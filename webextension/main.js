"use strict"

var port = browser.runtime.connect({name: "connection-to-legacy"});


//
// Handle addon settings
//

function saveSettings(name, value)
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

function getSettingsError(name)
{
    console.log("VTR WebExt setting '"+ name +"' not saved.");
}

function getSettings(name)
{
    return new Promise(function (fulfill, reject) 
    {
        browser.storage.local.get(name).then(results =>
        {
            if (!results[name]) 
            {
                getSettingsError(name);
            }
            
            fulfill(results[name]);
        });
    });
}


//
// Communication with the legacy part + content script
//

function sdk_replyHandler(message)
{
    if(message.type == "settings.post") 
    {
        // the legacy part sent settings, save them
        saveSettings(message.name, message.value);
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


// Get all settings from the legacy part 10secs after startup
setTimeout(function(){ 
    sdk_sendMsg({type: "settings.get", name: "right"});
    sdk_sendMsg({type: "settings.get", name: "hideInFullscreen"});
    sdk_sendMsg({type: "settings.get", name: "theme"});
    sdk_sendMsg({type: "settings.get", name: "tabtoolbarPosition"});
    sdk_sendMsg({type: "settings.get", name: "toggleDisplayHotkey"});
    sdk_sendMsg({type: "settings.get", name: "width"});
    sdk_sendMsg({type: "settings.get", name: "debug"});
}, 10000);

/*setInterval(function(){ 

    getSettings("theme").then(value => {
        console.log("received theme setting: " + value);
    });
    
    getSettings("toggleDisplayHotkey").then(value => {
        console.log("received toggleDisplayHotkey setting: " + value);
    });
    
    getSettings().then(value => {
        console.log(value);
    });

}, 4000);*/
