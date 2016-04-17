// ==UserScript==
// @name         Stack Overflow Extras (SOX)
// @namespace    https://github.com/soscripted/sox
// @version      1.0.4 DEV
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
// @match        *://github.com/soscripted/*
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js
// @require      https://cdn.rawgit.com/timdown/rangyinputs/master/rangyinputs-jquery-src.js
// @require      https://cdn.rawgit.com/jeresig/jquery.hotkeys/master/jquery.hotkeys.js
// @require      https://cdn.rawgit.com/camagu/jquery-feeds/master/jquery.feeds.js
// @require      https://rawgit.com/soscripted/sox/dev/sox.helpers.js?v=1.0.4e
// @require      https://rawgit.com/soscripted/sox/dev/sox.enhanced_editor.js?v=1.0.4a
// @require      https://rawgit.com/soscripted/sox/dev/sox.features.js?v=1.0.4n
// @require      https://api.stackexchange.com/js/2.0/all.js
// @resource     settingsDialog https://rawgit.com/soscripted/sox/dev/sox.dialog.html?v=1.0.4b
// @resource     featuresJSON https://rawgit.com/soscripted/sox/dev/sox.features.info.json?v=1.0.4d
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceText
// @grant        GM_info
// ==/UserScript==
/*jshint multistr: true */
(function(sox, $, undefined) {
    var SOX_SETTINGS = 'SOXSETTINGS';
    var SOX_VERSION = (typeof GM_info !== "undefined" ? GM_info.script.version : "??");
    var SOX_MANAGER = (typeof GM_info == "undefined" ? "??" : GM_info.scriptHandler + "/Chrome" || "Greasemonkey" + "/Firefox");

    // auto-inject version number and environment information into GitHub issues
    function inject() {
        var $issue = $('#issue_body');
        if ($issue.length) {
            $issue.prop('disabled', 'true');
            var issueText = $issue.text();

            issueText = issueText.replace('1.X.X', SOX_VERSION); //inject the SOX version by replacing the issue template's placeholder '1.X.X'
            issueText = issueText.replace('Chrome/Tampermonkey', SOX_MANAGER); //inject the SOX userscript manager+platfirm by replacing the issue template's placeholder 'Chrome/Tampermonkey'
            $('#issue_body').delay(500).text(issueText).removeAttr('disabled');
        }
    }

    if (location.href.indexOf('/issues/new') > -1) {
        inject();
    }

    $(document).on('pjax:complete', function() {
        if (location.href.indexOf('/issues/new') > -1) {
            inject();
        }
    });

    if (location.host != 'github.com') {
        var $settingsDialog = $(GM_getResourceText('settingsDialog')),
            featuresJSON = JSON.parse(GM_getResourceText('featuresJSON')),
            $soxSettingsDialog,
            $soxSettingsDialogFeatures,
            $soxSettingsDialogVersion,
            $soxSettingsSave,
            $soxSettingsReset,
            $soxSettingsToggleAccessTokensDiv,
            $soxSettingsAccessTokensToggle,
            $soxSettingsToggle,
            $soxSettingsClose,
            $searchBox,
            $searchReset;

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
                    'flaggingPercentages',
                    'linkQuestionAuthorName'
                ];
            return (new RegExp('(' + deprecatedFeatures.join('|') + ')')).test(settings);
        }

        function addFeature(category, feature, desc) {
            var $div = $('<div/>', {
                    'class': 'feature',
                    'data-desc': desc
                }),
                $label = $('<label/>'),
                $input = $('<input/>', {
                    id: feature,
                    type: 'checkbox'
                });
            $div.append($label);
            $label.append($input);
            $input.after(desc);
            $soxSettingsDialogFeatures.find('#' + category).append($div);
        }

        function addCategory(name) {
            var $div = $('<div/>', {
                    'class': 'header category'
                }),
                $h3 = $('<h3/>', {
                    text: name.toLowerCase()
                }),
                $content = $('<div/>', {
                    id: name,
                    class: 'modal-content features'
                });
            $div.append($h3);

            $soxSettingsDialogFeatures.find('#sox-settings-dialog-access-tokens').before($div);
            $div.after($content);
        }

        //initialize sox
        (function() {

            // add sox CSS file and font-awesome CSS file
            $('head').append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">')
                .append('<link rel="stylesheet" type="text/css" href="https://rawgit.com/soscripted/sox/dev/sox.css?v=1.0.4b" />');
            $('.js-topbar-dialog-corral').append($settingsDialog);

            $soxSettingsDialog = $('#sox-settings-dialog');
            $soxSettingsDialogFeatures = $soxSettingsDialog.find('#sox-settings-dialog-features');
            $soxSettingsDialogVersion = $soxSettingsDialog.find('#sox-settings-dialog-version');
            $soxSettingsSave = $soxSettingsDialog.find('#sox-settings-dialog-save');
            $soxSettingsReset = $soxSettingsDialog.find('#sox-settings-dialog-reset');
            $soxSettingsToggleAccessTokensDiv = $soxSettingsDialog.find('#sox-settings-dialog-access-tokens');
            $soxSettingsAccessTokensToggle = $soxSettingsToggleAccessTokensDiv.find('#toggle-access-token-links');
            $soxSettingsToggle = $soxSettingsDialog.find('#sox-settings-dialog-check-toggle');
            $soxSettingsClose = $soxSettingsDialog.find('#sox-settings-dialog-close');
            $searchBox = $soxSettingsDialog.find('#search');
            $searchReset = $soxSettingsDialog.find('#search-reset');

            $soxSettingsDialogVersion.text(SOX_VERSION != '??' ? ' v' + SOX_VERSION.toLowerCase() : '');

            for (var category in featuresJSON) { //load all the features in the settings dialog
                addCategory(category);
                for (var feature in featuresJSON[category]) {
                    addFeature(category, feature, featuresJSON[category][feature].desc);
                }
                //sorting features alphabetically. Thanks to http://stackoverflow.com/a/27836605/
                var alphabeticallyOrderedDivs = $('#sox-settings-dialog-features #' + category + ' div.feature').sort(function(a, b) {
                    return String.prototype.localeCompare.call($(a).data('desc').toLowerCase(), $(b).data('desc').toLowerCase());
                });

                var container = $("#" + category);
                container.children().remove();
                container.append(alphabeticallyOrderedDivs);
            }

            // add settings icon to navbar
            var $soxSettingsButton = $('<a/>', {
                    id: 'soxSettingsButton',
                    class: 'topbar-icon yes-hover sox-settings-button',
                    title: 'Change SOX Settings',
                    style: 'color: #A1A1A1',
                    click: function(e) {
                        e.preventDefault();
                        $('#sox-settings-dialog').toggle();
                        if ($soxSettingsDialog.is(':visible')) {
                            $(this).addClass('topbar-icon-on');
                        } else {
                            $(this).removeClass('topbar-icon-on');
                        }
                    }
                }),
                $icon = $('<i/>', {
                    class: 'fa fa-cogs'
                });
            $soxSettingsButton.append($icon).appendTo('div.network-items');

            $('#soxSettingsButton').hover(function() { //https://github.com/soscripted/sox/issues/44, open on hover, just like the normal dropdowns
                if ($('.topbar-icon').not('#soxSettingsButton').hasClass('topbar-icon-on')) {
                    $('.topbar-dialog').hide();
                    $('.topbar-icon').removeClass('topbar-icon-on').removeClass('icon-site-switcher-on');
                    $(this).addClass('topbar-icon-on');
                    $soxSettingsDialog.show();
                }
            }, function() {
                $('.topbar-icon').not('#soxSettingsButton').hover(function() {
                    if ($('#soxSettingsButton').hasClass('topbar-icon-on')) {
                        $soxSettingsDialog.hide();
                        $('#soxSettingsButton').removeClass('topbar-icon-on');
                        var which = $(this).attr('class').match(/js[\w-]*\b/)[0].split('-')[1];
                        if (which != 'site') { //site-switcher dropdown is slightly different
                            $('.' + which + '-dialog').not('#sox-settings-dialog, #metaNewQuestionAlertDialog').show();
                            $(this).addClass('topbar-icon-on');
                        } else {
                            $('.siteSwitcher-dialog').show();
                            $(this).addClass('topbar-icon-on').addClass('icon-site-switcher-on'); //icon-site-switcher-on is special to the site-switcher dropdown (StackExchange button)
                        }
                    }
                });
            });

            // add click handlers for the buttons in the settings dialog
            $soxSettingsClose.on('click', function() {
                $soxSettingsDialog.hide();
            });
            $soxSettingsReset.on('click', function() {
                reset();
                location.reload(); // reload page to reflect changed settings
            });
            $soxSettingsAccessTokensToggle.on('click', function() {
                $links = $(this).parent().find('#sox-settings-dialog-access-tokens-links');
                if ($links.is(':visible')) {
                    $links.hide();
                    $soxSettingsToggleAccessTokensDiv.find('#toggle-access-token-links').removeClass('expander-arrow-small-show').addClass('expander-arrow-small-hide')
                } else {
                    $links.show();
                    $soxSettingsToggleAccessTokensDiv.find('#toggle-access-token-links').removeClass('expander-arrow-small-hide').addClass('expander-arrow-small-show')
                }
            });
            $soxSettingsToggle.on('click', function() {
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
            $soxSettingsSave.on('click', function() {
                var extras = [];
                $soxSettingsDialogFeatures.find('input[type=checkbox]:checked').each(function() {
                    var x = $(this).closest('.modal-content').attr('id') + '-' + $(this).attr('id');

                    extras.push(x); //Add the function's ID (also the checkbox's ID) to the array
                });
                save(extras);
                location.reload(); // reload page to reflect changed settings
            });
            $searchBox.on('keyup keydown', function() { //search box
                if ($(this).val() != '') {
                    var t = $(this).val();
                    $('#sox-settings-dialog label').each(function() {
                        var $features = $(this).closest('.features');
                        if ($(this).text().toLowerCase().indexOf(t) == -1) {
                            $(this).hide();
                        } else {
                            $(this).show();
                        }

                        if ($features.find('label:visible').length == 0 && $features.find('label[style*="display: inline"]').length == 0) {
                            $features.hide().prev().hide();
                        } else {
                            $features.show().prev().show();
                        }
                    });
                } else {
                    $('.category, .features, #sox-settings-dialog label').fadeIn();
                }
            });

            $searchReset.on('click', function() {
                $('.category, .features, #sox-settings-dialog label').fadeIn();
                $searchBox.val('').focus();

            });

            $(document).click(function(e) { //close dialog if clicked outside it
                $target = $(e.target);
                if (!$target.is('#soxSettingsButton, #sox-settings-dialog') && !$target.parents("#soxSettingsButton, #sox-settings-dialog").is("#soxSettingsButton, #sox-settings-dialog")) {
                    $soxSettingsDialog.hide();
                    $('#soxSettingsButton').removeClass('topbar-icon-on');
                }
            });
            $('.topbar-icon').not('.sox-settings-button').click(function() { //close dialog if one of the links on the topbar is clicked
                $soxSettingsDialog.hide();
                $('#soxSettingsButton').removeClass('topbar-icon-on');
            });

            $(document).on('click', 'a.getAccessToken', function() {
                $that = $(this);
                var client_id = $(this).attr('data-client-id');
                var key = $(this).attr('data-key');
                var featureId = $(this).attr('data-feature-id');
                var oauthDomain = $(this).attr('data-oauth-domain');
                if(location.hostname == oauthDomain) { //it only works on the Oauth Domain given when registering the app at Stack Apps
                    SE.init({
                        clientId: client_id,
                        key: key,
                        channelUrl: location.protocol + '//' + oauthDomain + '/blank',
                        complete: function(d) {
                            console.log('SE init');
                        }
                    });
                    SE.authenticate({
                        success: function(data) {
                            accessToken = data.accessToken;
                            console.log(accessToken);
                            var accessTokens = JSON.parse(GM_getValue('SOX-accessTokens', "{}"));
                            accessTokens[featureId] = accessToken;
                            GM_setValue('SOX-accessTokens', JSON.stringify(accessTokens));
                            $that.before(accessToken);
                            $that.text(" New access token?");
                        }
                    });
                } else {
                    alert('You must be on ' + oauthDomain + ' to get this access token');
                }
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
                            if (feature['accessToken']) {
                                var accessTokens = JSON.parse(GM_getValue('SOX-accessTokens', "{}"));
                                if (!accessTokens[featureId]) {
                                    $soxSettingsToggleAccessTokensDiv.find('#sox-settings-dialog-access-tokens-links').append(feature['desc'] + ': <a class="getAccessToken" data-feature-id="' + featureId + '" data-oauth-domain="' + feature['accessToken']['oauth_domain'] + '" data-client-id="' + feature['accessToken']['clientId'] + '" data-key="' + feature['accessToken']['key'] + '">Get access token?</a>');
                                } else if (accessTokens[featureId]) {
                                    $soxSettingsToggleAccessTokensDiv.find('#sox-settings-dialog-access-tokens-links').append(feature['desc'] + ': ' + accessTokens[featureId] + ' <a class="getAccessToken" data-feature-id="' + featureId + '" data-oauth-domain="' + feature['accessToken']['oauth_domain'] + '" data-client-id="' + feature['accessToken']['clientId'] + '" data-key="' + feature['accessToken']['key'] + '">New access token?</a>');
                                }
                            }
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
                            $soxSettingsDialogFeatures.find('#' + extras[i].split('-')[1]).parent().css('color', 'red').attr('title', 'There was an error loading this feature. Please raise an issue on GitHub.');
                            console.log('SOX error: There was an error loading the feature "' + extras[i] + '". Please raise an issue on GitHub, and copy the following error log.');
                            console.log(err);
                            i++;
                        }
                    }
                }
            } else {
                // no settings found, mark all inputs as checked and display settings dialog
                $soxSettingsDialogFeatures.find('input').prop('checked', true);

                setTimeout(function() {
                    $soxSettingsDialog.show();
                }, 500);
            }

        })();
    } //end for else not being on GitHub
}(window.sox = window.sox || {}, jQuery));
