var main = browser.extension.getBackgroundPage();
var blockSaveEvent = false;

var settings = [
    {
		"name": "right",
		"type": "bool",
		"title": "Display tabs on the right",
		"value": false
	},
	{
		"name": "hideInFullscreen",
		"type": "bool",
		"title": "Hide tabs in fullscreen",
		"value": true
	},
	{
		"name": "compact",
		"type": "bool",
		"title": "Compact Mode (hides text labels)",
		"value": false
	},
    {
        "name": "style.tab.status",
        "type": "bool",
        "title": "Show Tab Status on Text Label",
        "description": "Unloaded: strike-through; Unread/busy: underline",
        "value": false
    },
	{
		"name": "theme",
		"type": "menulist",
		"title": "Theme",
		"value": "dark",
		"options": [
			{
				"value": "none",
				"label": "None / Firefox default"
			},
			{
				"value": "dark",
				"label": "Dark (recommended)"
			},
			{
				"value": "light",
				"label": "Light (recommended)"
			},
			{
				"value": "windows",
				"label": "Windows"
			},
			{
				"value": "darwin",
				"label": "Darwin"
			},
			{
				"value": "linux",
				"label": "Linux"
			}
		]
	},
	{
		"name": "tabtoolbarPosition",
		"type": "menulist",
		"title": "Toolbar Position",
		"value": "top",
		"options": [
			{
				"value": "top",
				"label": "Top"
			},
			{
				"value": "bottom",
				"label": "Bottom"
			}
		]
	},
	{
		"name": "toggleDisplayHotkey",
		"type": "string",
		"title": "Hotkey for hiding/showing tabbar",
		"value": "control-shift-v"
	},
	{
		"name": "toggleDrawInTitlebar",
		"type": "control",
		"title": "Enable/Disable titlebar",
		"label": "Toggle titlebar",
		"description": "Enable the titlebar if the window control buttons are overlapping with Firefox elements"
	},
	{
		"name": "setDefaultPrefs",
		"type": "control",
		"title": "Reset preferences of VTR",
		"label": "Restore default preferences"
	},
    {
        "name": "showHiddenSettings",
        "type": "bool",
        "title": "Display hidden settings",
        "value": false,
        "hidden": true
    },
	{
		"name": "width",
		"type": "integer",
		"title": "Width of the tab sidebar",
		"value": 250,
		"hidden": true
	},
    {
		"name": "debug",
		"type": "bool",
		"title": "Enable console logging for debugging",
		"value": false,
		"hidden": true
	},
    {
		"name": "experiment",
		"type": "bool",
		"title": "Enable VTR experimental features <b>(**unstable!**)</b>",
		"value": false,
		"hidden": true
	},
];

function setDefaultPrefs()
{
    main.restore_default_settings();
}

function toggleDrawInTitlebar()
{
    main.sdk_sendMsg({type: "settings.toggleDrawInTitlebar"});
}

function save_setting(event)
{
    if(blockSaveEvent == true) { return; }

    let input = document.getElementById(event.target.id);
    if(input.type == "checkbox")
    {
        value = input.checked;
    }
    else
    {
        value = input.value;
    }

    //main.debug_log(event.target.id + " new value: " + value);
    main.save_setting(event.target.id, value);
    main.sdk_send_changed_setting(event.target.id);
}

function build()
{
    // This builds the entire setting list from the JSON object
    let settingsHTML = "";

    Object.keys(settings).forEach(function(k)
    {
        let setting = settings[k];

        if(setting.description != undefined)
        {
            var settingsDescription = '<div class="preferences-description">' + setting.description + '</div>';
        }
        else
        {
            var settingsDescription = "";
        }

        if(setting.hidden == true)
        {
            var classHidden = "hidden-setting";
        }
        else
        {
            var classHidden = "";
        }

        if(setting.type == "bool")
        {
            settingsHTML += '<tr class="detail-row-complex ' + classHidden + '"><td> <div class="checkboxItem"><label for="' + setting.name + '">' + setting.title + '</label> ' + settingsDescription + ' </td> <td> <input type="checkbox" id="' + setting.name + '"></div></td></tr>';
        }

        if(setting.type == "string")
        {
            if(setting.placeholder == undefined) { setting.placeholder = ""; }

            settingsHTML += '<tr class="detail-row-complex ' + classHidden + '"><td>' + setting.title + settingsDescription + '</td> <td> <input type="text" id="' + setting.name + '" placeholder="' + setting.placeholder + '"></td></tr>';
        }

        if(setting.type == "integer")
        {
            if(setting.placeholder == undefined) { setting.placeholder = ""; }

            settingsHTML += '<tr class="detail-row-complex ' + classHidden + '"><td>' + setting.title + settingsDescription + '</td> <td> <input type="number" id="' + setting.name + '" placeholder="' + setting.placeholder + '"></td></tr>';
        }

        if(setting.type == "menulist")
        {
            newInnerHTML = '<tr class="detail-row-complex ' + classHidden + '"><td>' + setting.title + settingsDescription + ' </td> <td><select id="' + setting.name + '">';
            Object.keys(setting.options).forEach(function(key)
            {
                let option = setting.options[key];
                newInnerHTML += '<option value="' + option.value + '">' + option.label + '</option>';
            });

            newInnerHTML += '</select></td></tr>';

            settingsHTML += newInnerHTML;
        }

        if(setting.type == "control")
        {
            settingsHTML += '<tr class="detail-row-complex ' + classHidden + '"><td>' + setting.title + settingsDescription + '</td> <td> <button type="button" id="'+ setting.name +'">'+ setting.label +'</button> </td></tr>';
        }
    });

    document.getElementById("settings").insertAdjacentHTML("beforeend", settingsHTML);
}

function load_value(input)
{
    // buttons don't have values
    if(input.type != "button")
    {
        main.get_setting(input.id).then(value => {
            if(input.type == "checkbox")
            {
                document.getElementById(input.id).checked = value;
            }
            else
            {
                document.getElementById(input.id).value = value;
            }
        });
    }

    //main.debug_log("found element:" + input.id);
}


function add_events(input)
{
    if(input.type == "button")
    {
        // id of element equals the function which is getting executed on click
        input.addEventListener("click", window[input.id]);
    }
    else
    {
        input.addEventListener("change", save_setting);
    }
}

/*function all_forms_helper(functionName)
{
    var inputs = document.querySelectorAll("input, select, button");
    for (var i = 0; i < inputs.length; i++)
    {
        let params = [inputs[i]];
        let funcObject = this[functionName];
        funcObject.apply(this, params);
    }
}*/

function update_all_inputs()
{
    blockSaveEvent = true;
    //all_forms_helper(load_value);

    var inputs = document.querySelectorAll("input, select, button");
    for (var i = 0; i < inputs.length; i++)
    {
        load_value(inputs[i]);
    }

    blockSaveEvent = false;

    main.get_setting("showHiddenSettings").then(value => {
        if(value == false)
        {
            var newDisplay = ""; // see default CSS
        }
        else
        {
            var newDisplay = "table-row";
        }

        var elements = document.getElementsByClassName("hidden-setting");
        for(var i=0; i<elements.length; i++)
        {
           main.debug_log(elements[i]);
           elements[i].style.display = newDisplay;
        }

    });
}

function oncontentmenu_show_hidden_options()
{
    main.save_setting("showHiddenSettings", true);
}

document.addEventListener('DOMContentLoaded', function()
{
    build();

    update_all_inputs();

    var inputs = document.querySelectorAll("input, select, button");
    for (var i = 0; i < inputs.length; i++)
    {
        add_events(inputs[i]);
    }

    document.getElementById("contextmenu-show-hidden-options").onclick = oncontentmenu_show_hidden_options;

    browser.storage.onChanged.addListener(update_all_inputs);

});
