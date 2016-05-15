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
// @resource     common https://rawgit.com/soscripted/sox/refactor/sox.common.info.json
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

    var features = GM_getResourceText('features');


    function init() {
        sox.helpers.notify('initializing');

        if (sox.location.on('github.com/soscripted')) {
            sox.github.init(sox.info.version, sox.info.handler);
            return;
        }

        var settings = sox.settings.load();

        sox.dialog.init({
            version: sox.info.version
            features: features,
            settings = settings
        });

        if (sox.settings.available) {
            // execute features
            for (var i = 0; i < settings.length; ++i) {
                try {
                    /*
                      var featureHeader = settings[i].split('-')[0];
                      var featureId = settings[i].split('-')[1];
                      var feature = featuresJSON[featureHeader][featureId];
                    */

                } catch (err) {
                    /*
                      $('').find('#' + extras[i].split('-')[1]).parent().css('color', 'red').attr('title', 'There was an error loading this feature. Please raise an issue on GitHub.');
                      console.log('SOX error: There was an error loading the feature "' + extras[i] + '". Please raise an issue on GitHub, and copy the following error log.');
                      console.log(err);
                      i++;
                    */
                }
            }

        } else {
            // no settings available => first return
            sox.helpers.notify('first run');

            // request oath access if it hasn't been granted previously <- this will take some checking via the api, doable though


        }
    }

    sox.ready(init);

})(window.sox = window.sox || {}, jQuery);
