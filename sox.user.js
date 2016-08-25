// ==UserScript==
// @name         Stack Overflow Extras (SOX)
// @namespace    https://github.com/soscripted/sox
// @version      2.0.1c
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
// @require      https://code.jquery.com/ui/1.11.4/jquery-ui.min.js
// @require      https://api.stackexchange.com/js/2.0/all.js
// @require      https://cdn.rawgit.com/timdown/rangyinputs/master/rangyinputs-jquery-src.js
// @require      https://cdn.rawgit.com/jeresig/jquery.hotkeys/master/jquery.hotkeys.js

// @require      sox.common.js
// @require      sox.github.js
// @require      sox.dialog.js
// @require      sox.features.js
// @require      sox.enhanced_editor.js

// @resource     css sox.css
// @resource     dialog sox.dialog.html
// @resource     featuresJSON sox.features.info.json?v=1
// @resource     common sox.common.info.json
// @resource     SEAPI https://api.stackexchange.com/js/2.0/all.js

// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==
//jQuery.noConflict();
(function(sox, $, undefined) {
    'use strict';

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
        $('<link/>', {
            rel: 'stylesheet',
            href: 'https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css'
        }).appendTo('head');

        var settings = sox.settings.load(), //returns undefined if not set
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
                        if (feature.settings) {
                            var settingsToPass = GM_getValue("SOX-" + featureId + "-settings") ? JSON.parse(GM_getValue("SOX-" + featureId + "-settings")) : {};
                            sox.features[featureId](settingsToPass); //run the feature if match and exclude conditions are met, pass on settings object
                        } else {
                            sox.features[featureId](); //run the feature if match and exclude conditions are met
                        }
                    }
                } catch (err) {
                    if (!sox.features[featureId]) { //remove deprecated/'corrupt' feature IDs from saved settings
                        settings.splice(i, 1);
                        sox.settings.save(settings);
                        $('#sox-settings-dialog-features').find('#' + settings[i].split('-')[1]).parent().parent().remove();
                    } else {
                        $('#sox-settings-dialog-features').find('#' + settings[i].split('-')[1]).parent().css('color', 'red').attr('title', 'There was an error loading this feature. Please raise an issue on GitHub.');
                        console.log('SOX error: There was an error loading the feature "' + settings[i] + '". Please raise an issue on GitHub, and copy the following error log:\n' + err);
                    }
                    i++;
                }
            }
        }

        if (GM_getValue('SOX-accessToken', -1) == -1) {
            if (!sox.location.on('stackoverflow.com') && !sox.location.on('oauth/login_success')) {
                // TODO: find a more user friendly way of handling this
                window.open('http://stackoverflow.com');
                alert('Stack Overflow has been opened for you. To complete the SOX installation please click on the cogs icon that has been added to the topbar to recieve your access token (on the Stack Overflow site!).');
                sox.helpers.notify("Please go to stackoverflow.com to get your access token for certain SOX features");
            } else {
                //everything in this `else` is only weird to make it work on Firefox
                //the solution has come from http://stackoverflow.com/a/38924760/3541881
                //in effect, it makes and appends an IIFE to the head that `init`s SE
                //and then when done appends another IIFE to `authenticate` SE
                //the access token is sent with postMessage to the webpage
                //and the script receives the message and saves the access token.
                //a hacky fix, but it works for now.
                window.addEventListener("message", function(event) {
                    var accesstoken;
                    try {
                        accesstoken = JSON.parse(event.data);
                    } catch (error) {}
                    if (!('SOX-accessToken' in accesstoken)) return;
                    console.log(accesstoken['SOX-accessToken']);
                    GM_setValue('SOX-accessToken', accesstoken['SOX-accessToken']);
                }, false);
                document.head.appendChild(document.createElement('script')).text =
                    GM_getResourceText('SEAPI') + ';(' + function() {
                        SE.init({
                            clientId: 7138, //SOX client ID
                            key: 'lL1S1jr2m*DRwOvXMPp26g((', //SOX key
                            channelUrl: location.protocol + '//stackoverflow.com/blank',
                            complete: function(d) {
                                $(document).on('click', '#soxSettingsButton', function() {
                                    //make the cogs button red?
                                    document.head.appendChild(document.createElement('script')).text =
                                        '(' + function() {
                                            SE.authenticate({
                                                success: function(data) {
                                                    window.postMessage(JSON.stringify({
                                                        'SOX-accessToken': data.accessToken
                                                    }), '*');
                                                },
                                                error: function(data) {
                                                    console.log(data);
                                                },
                                                scope: ['read_inbox', 'write_access', 'no_expiry']
                                            });
                                        } + ')();';
                                });
                            }
                        });
                    } + ')();';
            }
        }
    }
    sox.ready(init);
})(window.sox = window.sox || {}, jQuery);
