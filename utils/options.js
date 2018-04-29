"use strict";

/* global utils log */

//
// Handle addon settings
//
var OptionsUtils = class OptionsUtils
{
    constructor()
    {
        this.settings = {};
        this.initalized = false;

        this.get_options_file();
    }

    get_options_file()
    {
        return new Promise((fulfill) =>
        {
            if(this.initalized == true)
            {
                fulfill(true);
            }

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () =>
            {
                if(xhr.readyState == 4) // 4 == DONE
                {
                    this.settings = xhr.response;
                    this.initalized = true;
                    fulfill(true);
                }
            };

            xhr.overrideMimeType("json");
            xhr.responseType = "json";

            xhr.open("GET", "options/options.json", true);
            xhr.send();
        });
    }

    /* exported get_options_object */
    get_options_object()
    {
        return this.settings;
    }

    /* exported restore_default_settings */
    restore_default_settings()
    {
        Object.keys(this.settings).forEach((optionsElement) =>
        {
            this.restore_default_setting_of(optionsElement);
        });
    }

    reset_experimental_features()
    {
        Object.keys(this.settings).forEach((optionsElement) =>
        {
            if(this.settings[optionsElement]["experimental"] == true)
            {
                this.restore_default_setting_of(optionsElement);
            }
        });
    }

    restore_default_setting_of(optionsElement)
    {
        this.save_setting(this.settings[optionsElement]["name"], this.settings[optionsElement]["value"]);
    }

    on_options_change(changes, area)
    {
        if(area == "sync")
        {
            Object.keys(changes).forEach((name) =>
            {
                if(name == "meta.options.time.lastsaved" || name == "options.sync.enabled") { return; }

                browser.storage.sync.get("meta.options.time.lastsaved").then(results =>
                {
                    if (results.hasOwnProperty("meta.options.time.lastsaved"))
                    {
                        // This entire function is a callback, use the globally acccessible utils.options call instead of this
                        utils.options.get_setting("meta.options.time.lastsaved").then(lastSavedLocal =>
                        {
                            if(results["meta.options.time.lastsaved"] > lastSavedLocal)
                            {
                                let settingsObject = {};
                                settingsObject[name] = changes[name]["newValue"];
                                browser.storage.local.set(settingsObject).then(error =>
                                {
                                    if(error)
                                    {
                                        log.debug("VTR received sync setting: Could not save option:" + name);
                                        return false;
                                    }

                                    log.debug("received sync setting: " + name + " => " + changes[name]["newValue"]);
                                });
                            }
                        });
                    }
                });
            });
        }

        if(area == "local")
        {
            Object.keys(changes).forEach(name =>
            {
                if(name == "debug")
                {
                    utils.log.debugEnabled = changes[name]["newValue"];
                }

                if(name == "toggleDisplayHotkey")
                {
                    utils.options.update_hotkey("sidebar.toggling", changes[name]["newValue"]);
                }
            });
        }
    }

    save_setting(name, value)
    {
        let settingsObject = {};
        settingsObject[name] = value;

        log.debug("save: " + name + " " + value);

        if(name == "experiment" && value == false)
        {
            this.reset_experimental_features();
        }

        if(name != "meta.options.time.lastsaved" && name != "options.sync.enabled")
        {
            this.save_setting("meta.options.time.lastsaved", utils.time.getTimestamp());
        }

        browser.storage.local.set(settingsObject).then(error =>
        {
            if(error)
            {
                return false;
            }
        });

        if(name != "options.sync.enabled")
        {
            this.get_setting("options.sync.enabled").then(syncEnabled =>
            {
                if(syncEnabled != true) { return; }

                browser.storage.sync.set(settingsObject).then(error =>
                {
                    if(error)
                    {
                        log.debug("VTR sync error!");
                        return false;
                    }
                });

                log.debug("sync setting saved: " + name + " => " + value);
            });
        }

        // If sync gets enabled, all values should be copied once
        if(name == "options.sync.enabled" && value == true)
        {
            browser.storage.sync.get("meta.options.time.lastsaved").then(results =>
            {
                if (!results.hasOwnProperty("meta.options.time.lastsaved"))
                {
                    results["meta.options.time.lastsaved"] = -1;
                    // No sync data exists, copy from local to sync
                }

                this.get_setting("meta.options.time.lastsaved").then(lastSavedLocal =>
                {
                    log.debug("VTR sync: sync.lastsaved: " + results["meta.options.time.lastsaved"] + " local.lastsaved: " + lastSavedLocal);

                    let allStorageSettings;
                    // Sync is newer then local, copy from sync to local
                    if(results["meta.options.time.lastsaved"] > lastSavedLocal)
                    {
                        allStorageSettings = browser.storage.sync.get(null);
                    }

                    // Local is newer then sync, copy from local to sync
                    if(results["meta.options.time.lastsaved"] < lastSavedLocal)
                    {
                        allStorageSettings = browser.storage.local.get(null);
                    }

                    allStorageSettings.then(storageResults =>
                    {
                        Object.keys(storageResults).forEach((storageName) =>
                        {
                            if(name == "meta.options.time.lastsaved" || name == "options.sync.enabled") { return; }

                            let settingsObject = {};
                            settingsObject[storageName] = storageResults[storageName];

                            if(results["meta.options.time.lastsaved"] > lastSavedLocal)
                            {
                                browser.storage.local.set(settingsObject);

                                log.debug("VTR sync inital setting from sync to local saved: " + name + " => " + value);
                            }

                            if(results["meta.options.time.lastsaved"] < lastSavedLocal)
                            {
                                browser.storage.sync.set(settingsObject);

                                log.debug("VTR sync inital setting from local to sync saved: " + name + " => " + value);
                            }
                        });
                    });
                });
            });
        }

        return true;
    }

    get_all_settings()
    {
        // This is necessary to not only get all actually saved values, but also the default values for unsaved attributes
        return new Promise((fulfill, reject) =>
        {
            let allSettings = {};

            let forEachSetting = (name) =>
            {
                return new Promise((fulfill) =>
                {
                    this.get_setting(name).then((value) =>
                    {
                        let newValue = {};
                        newValue[name] = value;
                        Object.assign(allSettings, newValue);
                        fulfill(true);
                    });
                });
            };

            let allPromises = Object.keys(this.settings).map(forEachSetting);

            Promise.all(allPromises).then(() =>
            {
                fulfill(allSettings);
            });
        }).catch(
            (reason) =>
            {
                log.debug(reason);
            }
        );
    }

    get_setting(name)
    {
        if(name == undefined)
        {
            return this.get_all_settings();
        }

        return new Promise((fulfill, reject) =>
        {
            browser.storage.local.get(name).then(results =>
            {
                let localDebugOutput = "VTR option '" + name + "': ";
                let localDebug = false;
                let localDebugWorthwhile = false;

                if (!results.hasOwnProperty(name))
                {
                    // Debug output for "debug" is causing potentially an endless loop to the extend that browser doesn't react anymore
                    // if(name != "debug") { localDebug = true; localDebugOutput += "No user value, use default value. "; }
                    if(this.settings.hasOwnProperty(name))
                    {
                        if(name != "debug") { localDebug = true; localDebugOutput += "No user value; default value is '" + this.settings[name]["value"] + "'. "; }
                        results[name] = this.settings[name]["value"];
                    }
                    else
                    {
                        localDebugWorthwhile = true;
                        if(name != "debug") { localDebug = true; localDebugOutput += "No default value found."; }
                    }
                }

                if(localDebug == true && localDebugWorthwhile == true) { log.debug(localDebugOutput); }

                fulfill(results[name]);
            }).catch(
                (reason) =>
                {
                    log.debug(reason);
                }
            );
        });
    }

    set_alpha_settings()
    {
        // Enforce debugging, hidden settings and experiment flag to true for Firefox Nightly / Opera
        this.save_setting("showHiddenSettings", true);
        this.save_setting("debug", true);
        this.save_setting("experiment", true);
    }

    set_beta_settings()
    {
        // Enforce debugging and hidden settings for Firefox Beta
        this.save_setting("showHiddenSettings", true);
        this.save_setting("debug", true);
    }

    async update_hotkey(name, value)
    {
        if(name == "sidebar.toggling")
        {
            try
            {
                await browser.commands.update({"name": "_execute_sidebar_action", "shortcut": value});
            }
            catch (error)
            {
                this.restore_default_setting_of("toggleDisplayHotkey");
                log.debug(error);
            }
        }
    }
};

utils["options"] = new OptionsUtils();
