// ==UserScript==
// @name         SOX2R
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
// @require      sox.dialog.js
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
      alert('test');
        sox.helpers.notify('initializing');
        sox.helpers.notify(sox.user.rep, sox.user.name, sox.user.id, sox.site.type, sox.site.name);

        if (sox.location.on('github.com/soscripted')) {
            try {
                sox.github.init(sox.info.version, sox.info.handler);
            } catch (e) {
                throw ('SOX: There was an error while attempting to initialize the sox.github.js file, please report this on GitHub.\n' + e);
            } finally {
                return;
            }
        }

        var settings = sox.settings.load() || undefined;

        try {
            sox.dialog.init({
                version: sox.info.version,
                features: features,
                settings: settings
            });
        } catch (e) {
            throw ('SOX: There was an error while attempting to initialize the SOX Settings Dialog, please report this on GitHub.\n' + e);
        }

        if (sox.settings.available) {

            sox.helpers.notify(settings);

            // execute features
            for (var i = 0; i < settings.length; ++i) {
                try {

                    /*
                      var featureHeader = settings[i].split('-')[0];
                      var featureId = settings[i].split('-')[1];
                      var feature = features[featureHeader][featureId];
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
