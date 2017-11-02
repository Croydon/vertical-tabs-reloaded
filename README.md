# ![](https://github.com/Croydon/vertical-tabs-reloaded/raw/0.8.0/data/icon.png) Vertical Tabs Reloaded for Firefox


[![](https://img.shields.io/amo/v/vertical-tabs-reloaded.svg?style=flat-square)](https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/) [![](https://img.shields.io/amo/d/vertical-tabs-reloaded.svg)](https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/statistics/?last=365) [![](https://img.shields.io/amo/users/vertical-tabs-reloaded.svg)](https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/statistics/usage/?last=365) [![](https://img.shields.io/amo/rating/vertical-tabs-reloaded.svg)](https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/)


This Firefox add-on arranges tabs in a vertical rather than horizontal
fashion. Vertical Tabs Reloaded is a fork of [Vertical Tabs](https://addons.mozilla.org/firefox/addon/vertical-tabs/), which was discontinued. The original project is heavily inspired by the Tree Style Tab add-on.

Source Code & Issue Tracker: https://github.com/Croydon/vertical-tabs-reloaded

Installation: [![https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_2.png)](https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/)

If you like my work you could [buy me a drink. ☕](https://www.paypal.me/cr0ydon/4,99)

## WebExtension version is in work!
See https://github.com/Croydon/vertical-tabs-reloaded/issues/13 for more information. [Opera support](https://github.com/Croydon/vertical-tabs-reloaded/issues/117) is also upcoming.


## Firefox ESR v52 users
Install the version v0.8.2 from here: https://addons.mozilla.org/de/firefox/addon/vertical-tabs-reloaded/versions/?page=1#version-0.8.2


## Features

 * arranges tabs vertical
 * ships 5 different styles for the tab sidebar
 * hide/display manually the tab sidebar at any time with a hotkey (Ctrl+Shift+V)
 * display the tab toolbar at top, bottom (default) or hide it completely
 * compact mode: hide text labels on tabs for a minimalistic tab sidebar (opt-in)
 * show the tab status (unloaded, unready, busy) visually on the tabs


## Goals

 * Minimalist implementation.

 * Native look and feel and ability to customize if wanted.

 * Readable, maintainable and robust code.


## Platform Support

Only the latest Firefox version is fully supported. Compatibility with the latest [ESR version](https://www.mozilla.org/en-US/firefox/organizations/faq/) will not get broken on purpose, but it might be necessary to do so sometimes. Pull requests fixing compatibility with the latest ESR version have a good chance to get accepted. Pull requests concerning other versions as the latest Firefox version or the latest Firefox ESR version will not be accepted.


## Building
You need Node.js and npm installed on your system. Then install web-ext:
> npm install -g web-ext

After that you can build the add-on by executing in the project's root directory:
> web-ext build


## Contact

If you want to have a chat with me you can join #vtr:matrix.org with every Matrix client, e.g. Riot:
https://riot.im/app/#/room/#vtr:matrix.org
or connect with an IRC client to #verticaltabsreloaded on chat.freenode.net


## License and Credits

This project is licensed under the terms of the [Mozilla Public License Version 2.0](LICENSE.md).

Credits can be found in the [credits.md](credits.md) file.
