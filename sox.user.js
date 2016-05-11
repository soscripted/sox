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
// @require      sox.common.js
// @require      sox.github.js
// @resource     css https://rawgit.com/soscripted/sox/refactor/sox.css
// @resource     dialog https://rawgit.com/soscripted/sox/refactor/sox.dialog.html
// @resource     features https://rawgit.com/soscripted/sox/refactor/sox.features.info.json
// @resource     common https://rawgit.com/soscripted/sox/refactor/so.json
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceText
// @grant        GM_info
// ==/UserScript==

// @require      sox.github.js
// @require      sox.dialog.js
// @require      sox.features.js
jQuery.noConflict();
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
    };


    function init() {
        sox.helpers.notify('initializing');

        sox.github.init(SOX_VERSION, SOX_MANAGER);

        if (sox.settings.available) {
            //sox.settings.load();
        } else {
            // no settings available => first return
            sox.helpers.notify('first run');

            // request oath access if it hasn't been granted previously <- this will take some checking via the api, doable though


        }

        sox.helpers.notify(sox.user.rep, sox.user.name, sox.user.id, sox.site.type, sox.site.name);

        /*sox.dialog.init({
          html: GM_getResourceText('dialog')
        });
        */

        // sox.features.init()
        // |->  execute enabled features

    }


    sox.ready(init);

})(window.sox = window.sox || {}, jQuery);
