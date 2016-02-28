// ==UserScript==
// @name         Stack Overflow Extras (SOX)
// @namespace    https://github.com/soscripted/sox
// @version      EXPERIMENTAL 1.0.1
// @description  Adds a bunch of optional features to sites in the Stack Overflow Network.
// @contributor  ᴉʞuǝ (stackoverflow.com/users/1454538/)
// @contributor  ᔕᖺᘎᕊ (stackexchange.com/users/4337810/)
// @updateURL    https://rawgit.com/soscripted/sox/experimental/sox.user.js
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
// @require      https://rawgit.com/soscripted/sox/experimental/sox.helpers.js
// @require      https://rawgit.com/soscripted/sox/experimental/sox.features.js
// @require      https://rawgit.com/soscripted/sox/experimental/themes/sox.themeeditor.js
// @require      https://rawgit.com/soscripted/sox/experimental/themes/sox.theming.js
// @require      https://rawgit.com/soscripted/sox/experimental/chat/sox.chat.js
// @resource     settingsDialog https://rawgit.com/soscripted/sox/experimental/sox.dialog.html
// @resource     themeEditor https://rawgit.com/soscripted/sox/experimental/themes/sox.themeeditor.html
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceText
// ==/UserScript==
/*jshint multistr: true */
(function(sox, $, undefined) {
    var SOX_SETTINGS = 'SOXSETTINGS';

    var $settingsDialog = $(GM_getResourceText('settingsDialog')),
        $soxSettingsDialog,
        $soxSettingsDialogFeatures,
        $soxSettingsSave,
        $soxSettingsReset,
        $soxSettingsToggle,
        $soxSettingsClose


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
        //TODO: add function names to an array and loop instead of || .. || .. ||
        var settings = getSettings();
        if (settings.indexOf('answerCountSidebar') != -1 ||
            settings.indexOf('highlightClosedQuestions') != -1 ||
            settings.indexOf('unHideAnswer') != -1 ||
            settings.indexOf('flaggingPercentages') != -1) {
            return true;
        }
    }

    function addFeatures(features) {
        $.each(features, function(i, o) {
            var $div = $('<div/>'),
                $label = $('<label/>'),
                $input = $('<input/>', {
                    id: o[0],
                    type: 'checkbox',
                    style: 'margin-right: 5px;'
                });
            $div.append($label);
            $label.append($input);
            $input.after(o[1]);
            $soxSettingsDialogFeatures.append($div);
        });
    }

    function addCategory(name) {
        var $div = $('<div/>'),
            $h3 = $('<h3/>', {
                text: name
            });
        $div.append($h3);
        $soxSettingsDialogFeatures.append($div);
    }

    function loadFeatures() {
        addCategory('Appearance');
        addFeatures([
            ['grayOutVotes', 'Gray out deleted votes'],
            ['moveBounty', 'Move \'start bounty\' to top'],
            ['dragBounty', 'Make bounty box draggable'],
            ['renameChat', 'Prepend \'Chat - \' to chat tabs\' titles'],
            ['exclaim', 'Remove exclamation mark on message'],
            ['employeeStar', 'Add star after employee names'],
            ['bulletReplace', 'Replace triangular bullets with normal ones'],
            ['addEllipsis', 'Add ellipsis to long names'],
            ['fixedTopbar', 'Fix topbar position'],
            ['displayName', 'Display name before gravatar'],
            ['unspoil', 'Add a link to show all spoilers in a post'],
            ['spoilerTip', 'Differentiate spoilers from empty blockquotes'],
            ['stickyVoteButtons', 'Make vote buttons next to posts sticky whilst scrolling on that post'],
            ['betterCSS', 'Add extra CSS for voting signs and favourite button (currently only on Android SE)'],
            ['standOutDupeCloseMigrated', 'Add colourful, more apparent signs to questions that are on hold, duplicates, closed or migrated on question lists'],
            ['colorAnswerer', 'Color answerer\'s comments'],
            ['highlightQuestions', 'Alternate favourite questions highlighing'],
            ['metaNewQuestionAlert', 'Add an extra mod diamond to the topbar that alerts you if there is a new question posted on the child-meta of the current site'],
            ['hideHotNetworkQuestions', 'Hide the Hot Network Questions module'],
            ['hideHireMe', 'Hide the Looking for a Job module'],
            ['hideCommunityBulletin', 'Hide the Community Bulletin module'],
            ['hideSearchBar', 'Replaces the searchbar with an link to the search page'],
            ['themes', 'Enable themes'],
            ['themeEditor', 'Enable theme editor']
        ]);

        addCategory('Flags');
        addFeatures([
            ['flagOutcomeTime', 'Show the flag outcome time when viewing your Flag History'],
            ['flagPercentages', 'Show flagging percentages for each type in the Flag Summary']
            // lots more to come
        ]);

        addCategory('Editing');
        addFeatures([
            ['kbdAndBullets', 'Add KBD and list buttons to editor toolbar'],
            ['editComment', 'Pre-defined edit comment options'],
            ['editReasonTooltip', 'Add a tooltip to posts showing the latest revision\'s comment on \'edited [date] at [time]\''],
            ['addSBSBtn', 'Add a button to the editor toolbar to start side-by-side editing'],
            ['linkQuestionAuthorName', 'Add a button in the editor toolbar to insert a hyperlink to a post and add the author automatically'],
            ['titleEditDiff', 'Make title edits show seperately rather than merged']
        ]);

        addCategory('Comments');
        addFeatures([
            ['copyCommentsLink', 'Copy \'show x more comments\' to the top'],
            ['commentShortcuts', 'Use Ctrl+I,B,K (to italicise, bolden and add code backticks) in comments'],
            ['quickCommentShortcutsMain', 'Add shortcuts to add pre-defined comments to comment fields'],
            ['commentReplies', 'Add reply links to comments for quick replying (without having to type someone\'s username)'],
            ['autoShowCommentImages', 'View linked images (to imgur) in comments inline'],
            ['showCommentScores', 'Show your comment and comment replies scores in your profile tabs']
        ]);

        addCategory('Unsorted');
        addFeatures([
            //other
            ['shareLinksMarkdown', 'Change \'share\' link to format of [post-name](url)'],
            ['parseCrossSiteLinks', 'Parse titles to links cross-SE-sites'],
            ['confirmNavigateAway', 'Add a confirmation dialog before navigating away on pages whilst you are still typing a comment'],
            ['sortByBountyAmount', 'Add an option to filter bounties by their amount'],
            ['isQuestionHot', 'Add a label on questions which are hot-network questions'],
            ['answerTagsSearch', 'Show tags for the question an answer belongs to on search pages (for better context)'],
            ['metaChatBlogStackExchangeButton', 'Show meta, chat and blog buttons on hover of a site under the StackExchange button'],
            ['alwaysShowImageUploadLinkBox', 'Always show the \'Link from the web\' box when uploading an image'],
            ['addAuthorNameToInboxNotifications', 'Add the author\'s name to notifications in the inbox'],
            ['scrollToTop', 'Add Scroll To Top button'],
            ['linkedPostsInline', 'Display linked posts inline (with an arrow)']
        ]);
    }

    //initialize sox
    (function() {

        // add sox CSS file and font-awesome CSS file
        $('head').append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">')
            .append('<link rel="stylesheet" type="text/css" href="https://rawgit.com/soscripted/sox/dev/sox.css" />');
        $('body').append($settingsDialog);

        $soxSettingsDialog = $('#sox-settings-dialog');
        $soxSettingsDialogFeatures = $soxSettingsDialog.find('#sox-settings-dialog-features');
        $soxSettingsSave = $soxSettingsDialog.find('#sox-settings-dialog-save');
        $soxSettingsReset = $soxSettingsDialog.find('#sox-settings-dialog-reset');
        $soxSettingsToggle = $soxSettingsDialog.find('#sox-settings-dialog-check-toggle');
        $soxSettingsClose = $soxSettingsDialog.find('#sox-settings-dialog-close');

        loadFeatures(); //load all the features in the settings dialog

        // add settings icon to navbar
        var $soxSettingsButton = $('<a/>', {
                id: 'soxSettingsButton',
                class: 'topbar-icon yes-hover sox-settings-button',
                title: 'Change SOX Settings',
                style: 'color: #A1A1A1',
                click: function(e) {
                    e.preventDefault();
                    $('#sox-settings-dialog').toggle();
                }
            }),
            $icon = $('<i/>', {
                class: 'fa fa-cogs'
            });
        $soxSettingsButton.append($icon).appendTo('div.network-items');

        // add click handlers for the buttons in the settings dialog
        $soxSettingsClose.on('click', function() {
            $soxSettingsDialog.hide();
        });
        $soxSettingsReset.on('click', function() {
            reset();
            location.reload(); // reload page to reflect changed settings
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
                var x = $(this).attr('id');
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
                    //TODO: weird ++i and i++ in catch
                    $soxSettingsDialogFeatures.find('#' + extras[i]).prop('checked', true);
                    try {
                        features[extras[i]](); //Call the functions that were chosen
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

            setTimeout(function() {
                $soxSettingsDialog.show();
            }, 500);

            //$soxSettingsDialog.delay(800).show(); //not working -- why!?
        }

    })();
}(window.sox = window.sox || {}, jQuery));
