var main = browser.extension.getBackgroundPage();
var blockSaveEvent = false;

var settings = main.get_options_object();

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
            var description = '<br> <span class="preferences-description">' + setting.description + '</span>';
        }
        else
        {
            var description = '';
        }

        if(setting.hidden == true)
        {
            var classHidden = "hidden-setting";
        }
        else
        {
            var classHidden = "";
        }

        if(setting.readonly == true)
        {
            var addition = " disabled";
        }
        else
        {
            var addition = "";
        }

        if(setting.type == "bool")
        {
            settingsHTML += '<tr class="detail-row-complex ' + classHidden + '"><td> <div class="checkboxItem"><label for="' + setting.name + '">' + setting.title + '</label>' + description +'</td> <td> <input type="checkbox" id="' + setting.name + '"' + addition + '></div></td></tr>';
        }

        if(setting.type == "string")
        {
            if(setting.placeholder == undefined) { setting.placeholder = ""; }

            settingsHTML += '<tr class="detail-row-complex ' + classHidden + '"><td>' + setting.title + description +'</td> <td> <input type="text" id="' + setting.name + '" placeholder="' + setting.placeholder + '"' + addition + '></td></tr>';
        }

        if(setting.type == "integer")
        {
            if(setting.placeholder == undefined) { setting.placeholder = ""; }

            settingsHTML += '<tr class="detail-row-complex ' + classHidden + '"><td>' + setting.title + description +'</td> <td> <input type="number" id="' + setting.name + '" placeholder="' + setting.placeholder + '"' + addition + '></td></tr>';
        }

        if(setting.type == "menulist")
        {
            settingsHTML += '<tr class="detail-row-complex ' + classHidden + '"><td>' + setting.title + description +'</td> <td><select id="' + setting.name + '"' + addition + '>';
            Object.keys(setting.options).forEach(function(key)
            {
                let option = setting.options[key];
                settingsHTML += '<option value="' + option.value + '">' + option.label + '</option>';
            });

            settingsHTML += '</select></td></tr>';
        }

        if(setting.type == "control")
        {
            settingsHTML += '<tr class="detail-row-complex ' + classHidden + '"><td>' + setting.title + description +'</td> <td> <button type="button" id="'+ setting.name +'"' + addition + '>'+ setting.label +'</button> </td></tr>';
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
           // main.debug_log(elements[i]);
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
