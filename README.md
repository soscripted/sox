# Stack Overflow Extras (SOX)

A userscript for sites in the Stack Overflow Network that adds a bunch of optional, user-selectable features via an easy-to-use control panel.

#How to use, requirements, how it works
1. Install [Tampermonkey](http://tampermonkey.net/) (for Chrome), or [Greasemonkey](http://www.greasespot.net/) (for Firefox) or similar. These are userscript managers that are required for this script to work, because they also provide support for `GM_*` functions, which this script relies on to save the options you set!
2. Install [the script](https://github.com/soscripted/sox/raw/master/sox.user.js)
3. Go to any SO site (eg. www.superuser.com or www.stackoverflow.com)
4. A dialog box should popup asking you to select the features you want

If you ever want to change your options, a toggle button (gears icon) has been added to the navigation bar so it is easily accessible from any page.

**You need to have a browser compatible with Greasemonkey, or Tampermokey (or similar), because this script relies on `GM_*` features**, as mentioned above.

In case you're wondering, it works by using `GM_setValue` to save your options and then calling the appropiate functions according to your options.

#What features are included?

A list of all features (current and depreciated) is available on the SOX documentation page. [here]
