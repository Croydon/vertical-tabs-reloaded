var main = browser.extension.getBackgroundPage();

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
				"label": "Top (recommended)"
			},
			{
				"value": "bottom",
				"label": "Bottom"
			},
			{
				"value": "hide",
				"label": "Don't show"
			}
		]
	},
	{
		"name": "toggleDisplayHotkey",
		"type": "string",
		"title": "Hotkey for hiding/showing tabbar",
		"value": "control-alt-v"
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
		"title": "Enables console logging for debugging",
		"value": false,
		"hidden": true
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
	}
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
    let input = document.getElementById(event.target.id);
    if(input.type == "checkbox")
    {
        value = input.checked;
    }
    else
    {
        value = input.value;
    }
    
    main.debug_log(event.target.id + " new value: " + value);
    main.save_setting(event.target.id, value);
    main.sdk_send_changed_setting(event.target.id);
}

function build()
{
    // This builds the entire setting list from the JSON object
    Object.keys(settings).forEach(function(k)
    {
        let setting = settings[k];
        
        if(setting.hidden == true)
        {
            return;
        }
        
        document.getElementById("settings").innerHTML += "<hr>";
        
        if(setting.type == "bool")
        {
            document.getElementById("settings").innerHTML += '<div class="checkboxItem"><label for="' + setting.name + '">' + setting.title + '</label><input type="checkbox" id="' + setting.name + '"></div>';
        }
        
        if(setting.type == "string")
        {
            if(setting.placeholder == undefined) { setting.placeholder = ""; }
            
            document.getElementById("settings").innerHTML += setting.title + ' <input type="text" id="' + setting.name + '" placeholder="' + setting.placeholder + '">';
        }
        
        if(setting.type == "menulist")
        {
            newInnerHTML = setting.title + ' <select id="' + setting.name + '">';
            Object.keys(setting.options).forEach(function(key)
            {
                let option = setting.options[key];
                newInnerHTML += '<option value="' + option.value + '">' + option.label + '</option>';
            });
           
            newInnerHTML += '</select>';
            
            document.getElementById("settings").innerHTML += newInnerHTML;
        }
        
        if(setting.type == "control")
        {
            document.getElementById("settings").innerHTML += setting.title + ' <button type="button" id="'+ setting.name +'">'+ setting.label +'</button>';
        }
        
        if(setting.description != undefined)
        {
            document.getElementById("settings").innerHTML += '<br>' + setting.description;
        }

    });
}

function show_setting(input)
{
    if(input.type != "button") 
    {
        // buttons don't have values
        main.get_setting(input.id).then(value => {
            main.debug_log(input);

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
    
    main.debug_log("found element:" + input.id);
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

document.addEventListener('DOMContentLoaded', function() 
{ 
    build();
    
    var inputs = document.querySelectorAll("input, select, button");
    for (var i = 0; i < inputs.length; i++) 
    {
        show_setting(inputs[i]);
    }
});
