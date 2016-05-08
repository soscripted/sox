// ==UserScript==
// @name         Stack Overflow Extras (SOX)
// @namespace    https://github.com/soscripted/sox
// @version      2.0.0 REFACTOR
// @description  Extra features for Stack Overflow and Stack Exchange sites
// @contributor  ᴉʞuǝ (stackoverflow.com/users/1454538/)
// @contributor  ᔕᖺᘎᕊ (stackexchange.com/users/4337810/)
// @updateURL    https://rawgit.com/soscripted/sox/master/sox.user.js
// @match        *://*.stackoverflow.com/*
// @match        *://*.stackexchange.com/*
// @match        *://*.superuser.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.askubuntu.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.mathoverflow.net/*
// @match        *://github.com/soscripted/*
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js
// @require      https://cdn.rawgit.com/timdown/rangyinputs/master/rangyinputs-jquery-src.js
// @require      https://cdn.rawgit.com/jeresig/jquery.hotkeys/master/jquery.hotkeys.js
// @require      https://cdn.rawgit.com/camagu/jquery-feeds/master/jquery.feeds.js
// @require      https://rawgit.com/soscripted/sox/dev/sox.helpers.js?v=1.0.4e
// @require      https://rawgit.com/soscripted/sox/dev/sox.enhanced_editor.js?v=1.0.4b
// @require      https://rawgit.com/soscripted/sox/dev/sox.features.js?v=1.0.4o
// @require      https://api.stackexchange.com/js/2.0/all.js
// @resource     css https://rawgit.com/soscripted/sox/dev/sox.css
// @resource     dialog https://rawgit.com/soscripted/sox/dev/sox.dialog.html?v=1.0.4b
// @resource     features https://rawgit.com/soscripted/sox/dev/sox.features.info.json?v=1.0.4d
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceText
// @grant        GM_info
// ==/UserScript==
(function(sox, $, undefined) {
    'use strict';

    var SOX_SETTINGS = 'SOXSETTINGS';
    var SOX_VERSION = (typeof GM_info !== 'undefined' ? GM_info.script.version : '??');
    var SOX_MANAGER = (typeof GM_info !== 'undefined' ? GM_info.scriptHandler : '??');

    sox.settings = {
        available: GM_getValue(SOX_SETTINGS, -1) != -1,
        load: function() {
            return JSON.parse(GM_getValue(SOX_SETTINGS));
        },
        save: function(options) {
            GM_setValue(SOX_SETTINGS, JSON.stringify(options));
        },
        reset: function() {
            GM_deleteValue(SOX_SETTINGS);
        }
    }


    function init() {
        sox.notify('initializing');

        sox.github.init(SOX_VERSION, SOX_MANAGER);

        if (sox.settings.available) {
            sox.settings.load();
        } else {
            // no settings available => first return
            sox.notify('first run');

            // request oath access if it hasn't been granted previously <- this will take some checking via the api, doable though

        }

        sox.dialog.init()

        // sox.features.init()
        // |->  execute enabled features

    }

    $(function() { //TODO: Move doc.ready to sox.ready function
        // document is ready

        sox.ready(init);
    });


})(window.sox = window.sox || {}, jQuery);
