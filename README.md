# ![](https://github.com/Croydon/vertical-tabs-reloaded/raw/main/data/icon/icon-48-white.png) Vertical Tabs Reloaded for Firefox


[![](https://img.shields.io/amo/v/vertical-tabs-reloaded.svg?style=flat-square)](https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/) [![](https://img.shields.io/amo/dw/vertical-tabs-reloaded.svg)](https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/statistics/?last=365) [![](https://img.shields.io/amo/users/vertical-tabs-reloaded.svg)](https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/statistics/usage/?last=365) [![](https://img.shields.io/amo/rating/vertical-tabs-reloaded.svg)](https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/)


This Firefox add-on arranges tabs in a vertical rather than horizontal
fashion. Vertical Tabs Reloaded is a fork of [Vertical Tabs](https://addons.mozilla.org/firefox/addon/vertical-tabs/), which was discontinued. The original project is heavily inspired by the Tree Style Tab add-on.

  * source code & issue tracker: https://github.com/Croydon/vertical-tabs-reloaded
  * source code repository mirror: https://gitlab.com/Cr0ydon/vertical-tabs-reloaded

Installation: https://addons.mozilla.org/firefox/addon/vertical-tabs-reloaded/

If you like my work you could [buy me a drink. ☕](https://www.paypal.me/cr0ydon/4,99)


## Features

  * arranges tabs vertical
  * ships 4 different styles for the tab sidebar
  * hide/display manually the tab sidebar with a hotkey (default: Ctrl+Shift+V) or by clicking on the VTR icon
  * display the tab toolbar at top, bottom (default) or hide it completely
  * show the tab status (unloaded, unready, busy) visually on the tabs
  * sync settings across all devices


## Goals

 * Minimalist implementation.
 * Native look and feel and ability to customize if wanted.
 * Readable, maintainable and robust code.


## Platform Support

Only the latest Firefox version is fully supported. Compatibility with the latest [ESR version](https://www.mozilla.org/en-US/firefox/organizations/faq/) will not get broken on purpose, but it might be necessary to do so sometimes. Pull requests fixing compatibility with the latest ESR version have a good chance to get accepted. Pull requests concerning other versions as the latest Firefox version or the latest Firefox ESR version will not be accepted.

### Firefox ESR 60 support

Vertical Tabs Reloaded will actively support (i.e. feature updates) ESR 60 for at least 12 weeks (around Firefox 62) up to 18 weeks (around Firefox 63) and bug fixing only support for additional ~ 6 weeks.

While full support for a year would be nice, it would mean freezing features for too long as the WebExtension API is still rather immature and actively developing.

### Firefox ESR 52 users

Install the version v0.8.2 from here: https://addons.mozilla.org/de/firefox/addon/vertical-tabs-reloaded/versions/?page=1#version-0.8.2


## Building

You need Node.js and npm installed on your system. Then install web-ext:
> npm install -g web-ext

After that you can build the add-on by executing in the project's root directory:
> web-ext build


## Developer Version

You can also install the pre-built [developer version here](https://croydon.github.io/vtr-releases/). By using it you can help me testing new versions before they are getting shipped to everyone.


## Contact

If you want to have a chat with me you can join #vtr:matrix.org with every Matrix client, e.g. Element: https://app.element.io/#/room/#vtr:matrix.org


## License and Credits

This project is licensed under the terms of the [Mozilla Public License Version 2.0](LICENSE.md).

Credits can be found in the [credits.md](credits.md) file.
