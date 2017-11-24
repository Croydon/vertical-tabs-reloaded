# Changelog

### v0.9.4, 2017-11-24
 * fixed: tab context menu can go off-screen when to close to sidebar borders (#147)
 * internal: minor other improvements and cleanups


***


### v0.9.3, 2017-11-19
 * fixed: don't switch active tab when mute/unmute tabs via a click on the sound button


***


### v0.9.2, 2017-11-16
 * fixed: when the sidebar gets first opened no tab is selected (#148)


***


### v0.9.1, 2017-11-14
 * fixed: typo in the update landing page


***


### v0.9.0, 2017-11-13
 * this is the first full WebExtension version (#13) 🤖
 * added: landing page after update with changes explained (#13)
   * shows once after update in a new tab automatically
   * can be opened again from the option page
 * added: asking for "unlimited storage" permission, because upcoming custom themes can be heavy
 * removed: compact mode (#13)
 * fixed: new tabs do not open correctly, when the tab browser is hidden (#42)
 * fixed: disabling the add-on leaves a broken tab browser (#8)
 * fixed: some clicks can close the tab unexpectedly (#102, #118)
 * fixed: sometimes pinned tabs don't have a text label (#107)
 * themes improvements:
   * merged Windows and Linux themes into the new Feather theme (#91)
     * Feather is a bright, minimalistic theme
   * Darwin theme got some fine turning
   * all themes got internal cleanups


***


### v0.8.5.2, 2017-10-04
 * fixed: workaround problem that sidebar position (left, right) is not set correctly (#129)


***


### v0.8.5.1, 2017-10-03
 * fixed: workaround problem that sidebar width is not set correctly (#129)


***


### v0.8.5, 2017-10-01
 * themes improvements:
   * Dark & Light theme:
     * higher contrast between selected/pinned tabs and the rest of the tabs
     * use included versions of the close buttons to prevent future breakages
 * removed: don't offer the option anymore to select the "None/Firefox default" theme
   * if selected previous to the update then it can still be used till Firefox v57
 * internal: continue rewriting add-on as a WebExtension (#13)
   * added basic support for Opera (#117)
   * added tab close button
   * added option icon to the tab toolbar (#115)
   * added tab context menu with reload, mute, pin and close features
   * show only the options which can actually be used
     * previously even in the WebExtension-only version the legacy options were displayed
   * fixing many layout issues, refactoring a lot of internals


***


### v0.8.4.1, 2017-08-14
 * fixed: audio playing icons not visible (#97)
 * fixed: tabbrowser didn't hide in fullscreen in Firefox stable (#110)


***


### v0.8.4, 2017-08-06
 * added: add toolbar button to toggle sidebar
 * added: hidden experiment add-on flag
   * enforce debugging, hidden settings and experiment flag to true for Firefox Nightly
   * enforce debugging and hidden settings for Firefox Beta
 * internal: continue rewriting add-on as a WebExtension (#13)
   * manage hotkey by WebExtension
   * manage window events by WebExtension
   * implement correct sorting of tabs - keep it dynamically up to date on tab moves
   * implement tab toolbar with a new tab button
     * make it possible to place it at top, bottom and hide it completely (#57)
   * create new tab by clicking on free space within the tab browser (#17)
   * scroll selected tabs automatically into view


***


### v0.8.3.1, 2017-05-21
 * fixed: fallback to default settings when no values saved by user (#86)
 * fixed: potential endless spamming in the console
 * this version is commit a137da8 + backported commit 87bf4f4


***


### v0.8.3, 2017-04-23
 * added: feature to display tab status (loaded, unloaded, unread, busy) (#67)
 * added: possibility to show hidden settings in settings UI
 * added: minimal changed version of the icons
 * fixed: error when hotkey is invalid or non-existing (#72)
 * fixed: use toolkit.cosmeticAnimations.enabled in FF55+ (#83)
 * internal: continue rewriting add-on as a WebExtension (#13)
   * make WebExtensions main settings manager
   * removed: settings in the legacy storage


***


### v0.8.2, 2017-03-30
 * change default hotkey for hiding the tabbrowser to Control+Shift+V (#13)
   * the former hotkey is not compatible with the WebExtension APIs
 * fixed: show checkboxes on the settings page
 * fixed: hide tabs in fullscreen


***


### v0.8.1, 2017-03-28
 * internal: continue rewriting add-on as a WebExtension (#13)
   * manage settings UI by WebExtension
   * move default settings restore function to WebExtension
   * move more settings logic to WebExtension
   * handle debug output by WebExtension


***


### v0.8.0, 2017-01-09
 * internal: start rewriting add-on as a WebExtension (#13)
   * sync settings between the legacy SDK and the new WebExtension part
     * this is critical to release as soon as possible, so that in the best case nobody will lose their settings by the end of 2017
     * At the end of 2017 non-WebExtensions will stop working. Data migration won't be possible either afterwards


***


### v0.7.1, 2016-10-09
 * themes improvements:
   * Dark theme:
     * fixed: close button displayed wrong on low resolution displays running Windows 7


***


### v0.7.0, 2016-07-01
 * added: compact mode, hide text labels on tabs for a minimal tab sidebar (#55)
 * added: preference to display tab toolbar at top (new default) or at bottom (#46)
 * themes improvements:
   * Dark, Light themes:
     * more subtle (smaller and less contrast) splitter between tab sidebar and website (#21)
   * template Basic, Dark theme:
     * fixed: don't show close button on pinned tabs
   * template Basic:
     * internal: accept all kind of background values
 * internal: don't spam the console anymore for good
 * internal: mark as compatible with e10s


***


### v0.6.2, 2016-05-31
 * added: compatibility to Tab Mix Plus v0.5 or newer (#19)


***


### v0.6.1, 2016-05-08
 * themes improvements:
   * the Dark (default) and Light themes are now official recommended
   * all themes:
     * remove all statuspanel related styles
   * Darwin, Linux, Windows themes:
     * add blue left border to pinned tabs (#32)
 * fixed: don't spam the console with debug output
 * internal: some refactoring for more efficient code


***


### v0.6.0, 2016-05-06
 * added: button to toggle `browser.tabs.drawInTitlebar` for the case that window control elements are overlappig with FF (#9)
   * note: this is set automatically to `true` once at installation
 * added: possibility to reset VTR preferences to default via button (#11)
 * fixed: hotkey to hide tab sidebar only works in the latest opened window (#30)
 * fixed: destroy references to closed windows, set memory free (#39)
 * themes improvements:
   * all themes (except Darwin):
     * fixed: status bar was not readable on some Linux desktops (e.g. KDE) (#37)
   * no theme option:
     * the base style rules are including now a border between tabs and a min and max height of tabs
   * Dark theme:
     * fixed: Close button shown thrice under some circumstances (#35)
 * intern: rename object to VerticalTabsReloaded (before: VerticalTabs)


***


### v0.5.0, 2016-03-31
 * themes improvements:
   * all themes:
     * all themes have now a border between tabs (#24)
	 * show Firefox placeholder favicon if the tab has none instead of no icon at all (#25)
	 * internal: remove unnecessary style rules
   * internal: introduced templates
	 * create and adapt easily a theme without worrying too much about css
	 * if a templates get bug fixes or enhancements all themes building on it are profiting
	 * templates might be also the foundation for full user customization of themes in the future
	 * created a template named Basic, based on the Dark Theme style
   * introduce option to choose no theme
     * this might be a good option to let other add-ons decide tab colors, font attributes etc.
   * Darwin theme:
     * tabs which are getting hovered with the mouse are getting visual highlighted (#24)
	 * use white sound icons instead of black ones (#26)
   * Linux theme:
     * tabs which are getting hovered with the mouse are getting visual highlighted (#24)
	 * fixed: unwanted white bar at bottom of window (#16)
   * Dark theme:
     * make background of the favicons transparent instead of white (#18)
	 * use white close icon and white sound icons instead of black ones (#26)
	 * add blue left border to pinned tabs (#32)
	 * fixed: unwanted white bar at bottom of window (#16)
	 * internal: port to Basic template
   * Light theme:
   	 * add blue left border to pinned tabs (#32)
	 * fixed: unwanted white bar at bottom of window (#16)
	 * internal: port to Basic template
 * fixed: toolbar context menu was damaged (#27)
 * fixed: browser.tabs.animated was just disabled one time instead of always
 * heavily refactoring of the code base


***


### v0.4.0, 2016-03-15
 * added possibility to hide/show the tab sidebar manually at any time with a hotkey (customizable) (#6)
 * migrated the add-on to package.json & JPM (#7)
 * added an icon (#3)
 * removed broken group and multiselect features (#10, #12)
 * heavily refactoring of the code base


***


### v0.3.2, 2016-03-01
 * published on Mozilla's Add-on page for auto updates and user friendly installing (#5)
 * fixed: settings were not persistent (#1)
 * added credits
 * refactoring of the code base


***


### v0.3.0, 2015-05-24
 * license updated to MPL 2.0 (from MPL 1.1)
 * tabs are getting hidden in fullscreen finally (toggleable)
 * fixed: style problem on Windows
