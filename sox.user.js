// ==UserScript==
// @name         Stack Overflow Extras (SOX)
// @namespace    https://github.com/soscripted/sox
// @version      1.0.2
// @description  Adds a bunch of optional features to sites in the Stack Overflow Network.
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
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js
// @require      https://cdn.rawgit.com/timdown/rangyinputs/master/rangyinputs-jquery-src.js
// @require      https://cdn.rawgit.com/jeresig/jquery.hotkeys/master/jquery.hotkeys.js
// @require      https://cdn.rawgit.com/camagu/jquery-feeds/master/jquery.feeds.js
// @require      https://cdn.rawgit.com/soscripted/sox/commit/0785f0c59e4e166cec532c29afed78e9ba4333ee
// @require      https://cdn.rawgit.com/soscripted/sox/commit/4e2cc42ae85e79d97eedf036eb02e5c51e4a714b
// @require      https://cdn.rawgit.com/soscripted/sox/commit/51058e722ec852d82e760ab0d7e10f3950c87f0f
// @resource     settingsDialog https://cdn.rawgit.com/soscripted/sox/commit/1924ee2470a9b5862b65463680ddba093f0244d5
// @resource     featuresJSON https://cdn.rawgit.com/soscripted/sox/commit/740a32b718b7ef9685b65d26b72e2b7242eb8822
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceText
// ==/UserScript==
/*jshint multistr: true */
(function (sox, $, undefined) {
    var SOX_SETTINGS = 'SOXSETTINGS';

    var $settingsDialog = $(GM_getResourceText('settingsDialog')),
        featuresJSON = JSON.parse(GM_getResourceText('featuresJSON')),
        $soxSettingsDialog,
        $soxSettingsDialogFeatures,
        $soxSettingsSave,
        $soxSettingsReset,
        $soxSettingsToggle,
        $soxSettingsClose;

    function isAvailable() {
        return GM_getValue(SOX_SETTINGS, -1) != -1;
    }

    function getSettings() {
        return JSON.parse(GM_getValue(SOX_SETTINGS));
    }

    function reset() {
        GM_deleteValue(SOX_SETTINGS);
    }

    function save(options) {
        GM_setValue(SOX_SETTINGS, JSON.stringify(options));
        console.log('SOX settings saved: ' + JSON.stringify(options));
    }

    function isDeprecated() { //checks whether the saved settings contain a deprecated feature
        var settings = getSettings(),
            deprecatedFeatures = [
                'answerCountSidebar',
                'highlightClosedQuestions',
                'unHideAnswer',
                'flaggingPercentages'
            ];
        return (new RegExp('(' + deprecatedFeatures.join('|') + ')')).test(settings);
    }

    function addFeature(category, feature, desc) {
        var $div = $('<div/>'),
            $label = $('<label/>'),
            $input = $('<input/>', {
                id: feature,
                type: 'checkbox',
                style: 'margin-right: 5px;'
            });
        $div.append($label);
        $label.append($input);
        $input.after(desc);
        $soxSettingsDialogFeatures.find('#' + category).append($div);
    }

    function addCategory(name) {
        var $div = $('<div/>', {
                id: name,
                'class': 'feature-header'
            }),
            $h3 = $('<h3/>', {
                text: name
            });
        $div.append($h3);
        $soxSettingsDialogFeatures.append($div);
    }

    //initialize sox
    (function () {

        // add sox CSS file and font-awesome CSS file
        $('head').append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">')
            .append('<link rel="stylesheet" type="text/css" href="https://github.com/soscripted/sox/commit/51058e722ec852d82e760ab0d7e10f3950c87f0f" />');
        $('body').append($settingsDialog);

        $soxSettingsDialog = $('#sox-settings-dialog');
        $soxSettingsDialogFeatures = $soxSettingsDialog.find('#sox-settings-dialog-features');
        $soxSettingsSave = $soxSettingsDialog.find('#sox-settings-dialog-save');
        $soxSettingsReset = $soxSettingsDialog.find('#sox-settings-dialog-reset');
        $soxSettingsToggle = $soxSettingsDialog.find('#sox-settings-dialog-check-toggle');
        $soxSettingsClose = $soxSettingsDialog.find('#sox-settings-dialog-close');

        for (var category in featuresJSON) { //load all the features in the settings dialog
            addCategory(category);
            for (var feature in featuresJSON[category]) {
                addFeature(category, feature, featuresJSON[category][feature].desc);
            }
        }

        // add settings icon to navbar
        var $soxSettingsButton = $('<a/>', {
                id: 'soxSettingsButton',
                class: 'topbar-icon yes-hover sox-settings-button',
                title: 'Change SOX Settings',
                style: 'color: #A1A1A1',
                click: function (e) {
                    e.preventDefault();
                    $('#sox-settings-dialog').toggle();
                }
            }),
            $icon = $('<i/>', {
                class: 'fa fa-cogs'
            });
        $soxSettingsButton.append($icon).appendTo('div.network-items');

        // add click handlers for the buttons in the settings dialog
        $soxSettingsClose.on('click', function () {
            $soxSettingsDialog.hide();
        });
        $soxSettingsReset.on('click', function () {
            reset();
            location.reload(); // reload page to reflect changed settings
        });
        $soxSettingsToggle.on('click', function () {
            var $icon = $(this).find('i'),
                checked = $icon.hasClass('fa-check-square-o') ? true : false;

            if (checked) {
                $icon.removeClass('fa-check-square-o').addClass('fa-square-o');
                $soxSettingsDialogFeatures.find('input').prop('checked', false);
            } else {
                $icon.removeClass('fa-square-o').addClass('fa-check-square-o');
                $soxSettingsDialogFeatures.find('input').prop('checked', true);
            }
        });
        $soxSettingsSave.on('click', function () {
            var extras = [];
            $soxSettingsDialogFeatures.find('input[type=checkbox]:checked').each(function () {
                var x = $(this).parents('.feature-header').attr('id') + '-' + $(this).attr('id');
                console.log(x);
                extras.push(x); //Add the function's ID (also the checkbox's ID) to the array
            });
            save(extras);
            location.reload(); // reload page to reflect changed settings
        });

        // check if settings exist and execute desired functions
        if (isAvailable()) {
            var extras = getSettings();
            if (isDeprecated()) { //if the setting is set but a deprecated, non-existent feature exists, then delete the setting and act as if it is new
                reset();
            } else {
                for (var i = 0; i < extras.length; ++i) {
                    $soxSettingsDialogFeatures.find('#' + extras[i].split('-')[1]).prop('checked', true);
                    try {
                        var featureHeader = extras[i].split('-')[0];
                        var featureId = extras[i].split('-')[1];
                        var feature = featuresJSON[featureHeader][featureId];
                        if (feature['enableOnSites']) {
                            var sites = feature['enableOnSites'].split(',');
                            if (sites.indexOf(SOHelper.getAPISiteName()) > -1) { //if current site is in list, run feature
                                features[featureId]();
                            }
                        } else if (feature['disableOnSites']) {
                            var sites = feature['disableOnSites'].split(',');
                            if (sites.indexOf(SOHelper.getAPISiteName()) == -1) { //if current site is in list, don't run feature
                                features[featureId]();
                            }
                        } else { //if neither enableOnSites nor disableOnSites is given, run the feature (features that run on all sites)
                            features[featureId]();
                        }
                    } catch (err) {
                        $soxSettingsDialogFeatures.find('#' + extras[i]).parent().css('color', 'red').attr('title', 'There was an error loading this feature. Please raise an issue on GitHub.');
                        console.log('SOX error: There was an error loading the feature "' + extras[i] + '". Please raise an issue on GitHub, and copy the following error log.');
                        console.log('Error details:');
                        console.log(err);
                        i++;
                    }
                }
            }
        } else {
            // no settings found, mark all inputs as checked and display settings dialog
            $soxSettingsDialogFeatures.find('input').prop('checked', true);

            setTimeout(function () {
                $soxSettingsDialog.show();
            }, 500);
        }

    })();
}(window.sox = window.sox || {}, jQuery));
