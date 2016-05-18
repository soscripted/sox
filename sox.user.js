// ==UserScript==
// @name         SOX2R
// @namespace    https://github.com/soscripted/sox
// @version      2.0.0 REFACTOR
// @description  Extra optional features for Stack Overflow and Stack Exchange sites
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
// @require      https://api.stackexchange.com/js/2.0/all.js
// @require      sox.common.js
// @require      sox.github.js
// @require      sox.dialog.js
// @require      sox.features.js
// @require      sox.enhanced_editor.js

// @resource     css sox.css
// @resource     dialog sox.dialog.html
// @resource     featuresJSON sox.features.info.json?v=1
// @resource     common sox.common.info.json

// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==
jQuery.noConflict();
(function(sox, $, undefined) {
    'use strict';
    // TODO: ** please leave this until we're all <done> refactoring **
    sox.helpers.notify(
        sox.user.name,
        sox.user.rep,
        sox.user.id,
        sox.site.name,
        sox.site.type,
        sox.site.apiParameter(sox.site.name)
    );

    function init() {
        if (sox.location.on('github.com/soscripted')) {
            try {
                sox.github.init(sox.info.version, sox.info.handler);
            } catch (e) {
                throw ('SOX: There was an error while attempting to initialize the sox.github.js file, please report this on GitHub.\n' + e);
            } finally {
                return;
            }
        }

        GM_addStyle(GM_getResourceText('css'));
        $('head').append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">');

        var settings = sox.settings.load(), //returns null if not set
            featureInfo = JSON.parse(GM_getResourceText('featuresJSON'));

        try {
            sox.dialog.init({
                version: sox.info.version,
                features: featureInfo,
                settings: settings
            });
        } catch (e) {
            throw ('SOX: There was an error while attempting to initialize the SOX Settings Dialog, please report this on GitHub.\n' + e);
        }

        if (sox.settings.available) {
            // execute features
            for (var i = 0; i < settings.length; ++i) {
                try {
                    var category = settings[i].split('-')[0],
                        featureId = settings[i].split('-')[1],
                        feature = featureInfo.categories[category].filter(function(obj) {
                            return obj.name == featureId;
                        })[0],
                        runFeature = true,
                        sites,
                        pattern;

                    //NOTE: there is no else if() because it is possible to have both match and exclude patterns..
                    //which could have minor exceptions making it neccessary to check both
                    if (feature.match !== '') {
                        sites = feature.match.split(',');

                        for (pattern = 0; pattern < sites.length; pattern++) {
                            if (!sox.location.match(sites[pattern])) {
                                runFeature = false; //none of the patterns match the current site.. yet.
                            } else {
                                runFeature = true;
                                break; //if it does match, then stop looping; we want the feature to run
                            }
                        }
                    }
                    if (feature.exclude !== '') {
                        sites = feature.exclude.split(',');

                        for (pattern = 0; pattern < sites.length; pattern++) {
                            if (sox.location.match(sites[pattern])) { //if current site is in list, DON'T run feature
                                runFeature = false; //don't run feature
                                break; //no need to keep on looping
                            }
                        }
                    }
                    if (runFeature) {
                        sox.features[featureId](); //run the feature if match and exclude conditions are met
                    }
                } catch (err) {
                    $('#sox-settings-dialog-features').find('#' + settings[i].split('-')[1]).parent().css('color', 'red').attr('title', 'There was an error loading this feature. Please raise an issue on GitHub.');
                    console.log('SOX error: There was an error loading the feature "' + settings[i] + '". Please raise an issue on GitHub, and copy the following error log:\n' + err);
                    i++;
                }
            }
        }
        if (GM_getValue('SOX-accessToken', -1) == -1) {
            if (location.hostname !== 'stackoverflow.com' && location.indexOf('oauth/login_success') == -1) {
                // TODO: find a more user friendly way of handling this
                window.alert("Please go to stackoverflow.com to get your access token for certain SOX features");
                sox.helpers.notify("Please go to stackoverflow.com to get your access token for certain SOX features");
            } else {
                SE.init({
                    clientId: 7138, //SOX client ID
                    key: 'lL1S1jr2m*DRwOvXMPp26g((', //SOX key
                    channelUrl: location.protocol + '//stackoverflow.com/blank',
                    complete: function(d) {
                        console.log('SE init');
                    }
                });
                $('#soxSettingsButton').click(function() {
                    //TODO: this only works when something is clicked -- what should we make the user click?
                    //make the cogs button red?
                    SE.authenticate({
                        success: function(data) {
                            GM_setValue('SOX-accessToken', data.accessToken);
                        },
                        error: function(data) {
                            console.log(data);
                        },
                        scope: ['read_inbox', 'write_access', 'no_expiry']
                    });
                });
            }
        }
    }
    sox.ready(init);

})(window.sox = window.sox || {}, jQuery);
