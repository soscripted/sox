(function(sox, $, undefined) {
    'use strict';

    sox.dialog = {
        init: function(options) {
            if (!$('.top-bar').length) return;
            sox.debug('initializing SOX dialog');

            let version = options.version,
                features = options.features,
                settings = options.settings,
                lastVersionInstalled = options.lastVersionInstalled,

                html = GM_getResourceText('dialog'),

                $soxSettingsDialog = $(html),
                $soxSettingsDialogFeatures = $soxSettingsDialog.find('#sox-settings-dialog-features'),
                $soxSettingsDialogVersion = $soxSettingsDialog.find('#sox-settings-dialog-version'),
                $soxSettingsSave = $soxSettingsDialog.find('#sox-settings-dialog-save'),
                $soxSettingsReset = $soxSettingsDialog.find('#sox-settings-dialog-reset'),
                $soxSettingsDebugging = $soxSettingsDialog.find('#sox-settings-dialog-debugging'),
                $soxSettingsNewAccessTokenButton = $soxSettingsDialog.find('#sox-settings-dialog-access-token'),
                $soxSettingsToggle = $soxSettingsDialog.find('#sox-settings-dialog-check-toggle'),
                $soxSettingsClose = $soxSettingsDialog.find('#sox-settings-dialog-close'),
                $searchBox = $soxSettingsDialog.find('#search'),
                $importSettingsButton = $soxSettingsDialog.find('#sox-settings-import'),
                $exportSettingsButton = $soxSettingsDialog.find('#sox-settings-export'),
                $featurePackButtons = $soxSettingsDialog.find('.sox-settings-dialog-feature-pack'),

                //array of HTML strings that will be displayed as `li` items if the user has installed a new version.
                changes = ["Introduced 'feature packs' -- easily find and enable features we would categorise as 'major UI tweaks', 'key features', or 'power user fetures'!",
                          "You will no longer be forced to get an access token. If you choose not to, SOX will simply disable features that need one. Thanks @Izzy for the suggestion!"];

            function addCategory(name) {
                let $div = $('<div/>', {
                        'class': 'header category',
                        'id': 'header-for-' + name
                    }),
                    $h3 = $('<h3/>', {
                        text: name.toLowerCase()
                    }),
                    $content = $('<div/>', {
                        id: name,
                        class: 'modal-content features'
                    });
                $div.append($h3);

                if (!$soxSettingsDialogFeatures.find('div#header-for-' + name).length) {
                    $soxSettingsDialogFeatures.append($div);
                    $div.after($content);
                }
            }

            function addFeature(category, name, description, featureSettings, extendedDescription, metaLink, featurePacks, usesApi) {
                let blockFeatureSelection = usesApi && !sox.settings.accessToken,
                    $div = $('<div/>', {
                        'class': 'sox-feature ' + (featurePacks.length ? featurePacks.join(' ') : '') + (blockFeatureSelection ? ' disabled-feature' : ''),
                        'title': blockFeatureSelection ? 'You must get an access token to enable this feature (click the key button at the bottom of the SOX dialog)' : ''
                    }),
                    $info = $('<i/>', {
                        'class': 'fa fa-info',
                        'aria-hidden': true
                    }).hover(function() {
                        if (extendedDescription && !$(this).parent().find('.sox-feature-info').length) {
                            $(this).parent().append($('<div/>', {
                                'class': 'sox-feature-info',
                                'html': extendedDescription + (metaLink ? ' <a href="' + metaLink + '">[meta]</a>' : '')
                            }));
                        }
                    }),
                    $label = $('<label/>'),
                    $input = $('<input/>', {
                        id: name,
                        type: 'checkbox',
                    }).prop('disabled', blockFeatureSelection);

                $div.on('mouseleave', function() {
                    $(this).find('.sox-feature-info').remove();
                }).append($label).append(extendedDescription ? $info : '');
                $label.append($input);
                $input.after(description);
                $soxSettingsDialogFeatures.find('#' + category).append($div);

                if (featureSettings) {
                    let $settingsDiv = $('<div/>', {
                            id: 'feature-settings-' + name,
                            'class': 'sox-feature-settings',
                            style: 'display: none; margin-top: 5px;'
                        }),
                        $settingsToggle = $('<i/>', {
                            'class': 'fa fa-wrench',
                            click: function(e) {
                                e.preventDefault(); //don't uncheck the checkbox

                                let $settingsPanel = $('#feature-settings-' + name);

                                if ($settingsPanel.is(":visible")) {
                                    $settingsPanel.fadeOut();
                                } else {
                                    $settingsPanel.fadeIn();
                                }

                            }
                        }),
                        optionalSettings = GM_getValue("SOX-" + name + "-settings", -1);

                    for (let i = 0; i < featureSettings.length; i++) {
                        let currentSetting = featureSettings[i];
                        $settingsDiv
                            .append(currentSetting.desc)
                            .append('<br>')
                            .append(sox.helpers.newElement(currentSetting.type, { //use newElement helper so the type can be things like 'checkbox' or 'radio'
                                id: currentSetting.id,
                                'class': 'featureSetting',
                                'checked': (currentSetting.type === 'checkbox' ? JSON.parse(optionalSettings)[currentSetting.id] : false),
                                value: (optionalSettings === -1 ? '' : JSON.parse(optionalSettings)[currentSetting.id])
                            }))
                            .append('<br>');
                    }

                    let $saveFeatureSettings = $('<a/>', {
                        id: 'saveSettings-' + name,
                        text: 'Save Settings',
                        click: function(e) {
                            e.preventDefault(); //don't uncheck the checkbox
                            let settingsToSave = {};
                            $('.sox-feature.disabled-feature input[type="checkbox"]').prop('checked', false); //uncheck any features that somehow were checked (they shouldn't be able to through the UI) but should be disabled (user doesn't have access token)
                            $(this).parent().find('.featureSetting').each(function() {
                                settingsToSave[$(this).attr('id')] = ($(this).is(':checkbox') ? $(this).is(':checked') : $(this).val());
                            });
                            GM_setValue('SOX-' + name + '-settings', JSON.stringify(settingsToSave));
                            sox.settings.writeToConsole(true);
                            alert('Saved!');
                        }
                    });

                    $settingsDiv.append($saveFeatureSettings);

                    let $feature = $soxSettingsDialogFeatures.find('input#' + name).parent();
                    $feature.append($settingsToggle);

                    if ($div.has('i.fa-info').length) {
                        $info.after($settingsDiv);
                    } else {
                        $feature.append($settingsDiv);
                    }

                }
            }

            // display sox version number in the dialog
            if (version != 'unknown' && version !== null) {
                $soxSettingsDialogVersion.text(' v' + (version ? version.toLowerCase() : ''));
            } else {
                $soxSettingsDialogVersion.text('');
            }

            if (version !== lastVersionInstalled) {
                GM_setValue('SOX-lastVersionInstalled', version);
                let $newVersionDetailsContainer = $('<div/>', {
                        'class': 'sox-new-version-details'
                    }),
                    $newVersionHeader = $('<div/>', {
                        'class': 'header category',
                        'html': '<h3>new in this version</h3>'
                    }),
                    $changes = $('<ul/>'),
                    $newVersionInfoContainer;

                for (let i = 0; i < changes.length; i++) {
                    $changes.append($('<li/>', {
                        'html': changes[i], //this array is defined near the top of the file
                        'class': 'sox-new-version-item'
                    }));
                }

                $newVersionInfoContainer = $('<div/>', {
                    'class': 'modal-content',
                    'html': $changes
                });

                $soxSettingsDialogFeatures.append($newVersionDetailsContainer.append($newVersionHeader).append($newVersionInfoContainer));
            }

            if (sox.info.debugging) $soxSettingsDebugging.text('Disable debugging');

            // wire up event handlers
            $soxSettingsClose.on('click', function() {
                $soxSettingsDialog.hide();
            });

            $soxSettingsReset.on('click', function() {
                if (confirm('Are you sure you want to reset SOX?')) {
                    sox.settings.reset();
                    location.reload(); // reload page to reflect changed settings
                }
            });

            $soxSettingsDebugging.on('click', function() {
                let currentState = sox.info.debugging;
                if (typeof currentState === 'undefined') {
                    GM_setValue('SOX-debug', true);
                    $soxSettingsDebugging.text('Disable debugging');
                } else {
                    GM_setValue('SOX-debug', !currentState);
                    $soxSettingsDebugging.text(currentState ? 'Enable debugging' : 'Disable debugging');
                }
                location.reload();
            });

            $soxSettingsNewAccessTokenButton.on('click', function() {
                window.open('https://stackexchange.com/oauth/dialog?client_id=7138&scope=no_expiry&redirect_uri=http://soscripted.github.io/sox/');
                sox.loginfo('To get a new access token, please go to the following URL', 'https://stackexchange.com/oauth/dialog?client_id=7138&scope=no_expiry&redirect_uri=http://soscripted.github.io/sox/');
            });

            $soxSettingsToggle.on('click', function() {
                let $icon = $(this).find('i'),
                    checked = $icon.hasClass('fas');

                if (checked) {
                    $icon.removeClass('fas').addClass('far');
                } else {
                    $icon.removeClass('far').addClass('fas');
                }

                $soxSettingsDialogFeatures.find('input').prop('checked', !checked);
            });

            $soxSettingsSave.on('click', function() {
                let settings = [];
                $soxSettingsDialogFeatures.find('input[type=checkbox]:checked').not('.featureSetting').each(function() { //NOT the per-feature featureSetting checkboxes, because they are saved in THEIR OWN setting object!
                    let x = $(this).closest('.modal-content').attr('id') + '-' + $(this).attr('id');
                    settings.push(x); //Add the function's ID (also the checkbox's ID) to the array
                });

                sox.settings.save(settings);
                location.reload(); // reload page to reflect changed settings
            });

            $importSettingsButton.on('click', function() {
                let settingsToImport = window.prompt('Please paste the settings exactly as they were given to you');
                if (!settingsToImport) return;
                sox.settings.save(settingsToImport);
                location.reload();
            });

            $exportSettingsButton.on('click', function() {
                window.prompt('Your settings are below. Press Ctrl/Cmd + C to copy.', JSON.stringify(sox.settings.load()));
            });

            $searchBox.on('keyup keydown', function() { //search box
                if ($(this).val() !== '') {
                    let searchQuery = $(this).val();
                    $('.sox-new-version-details').hide();
                    $('#sox-settings-dialog .sox-feature').each(function() {
                        let $features = $(this).closest('.features');
                        if ($(this).find('label').text().toLowerCase().indexOf(searchQuery) == -1) {
                            $(this).hide();
                        } else {
                            $(this).show();
                        }
                    });
                } else {
                    $('.category, .features, #sox-settings-dialog .sox-feature, .sox-new-version-details').fadeIn();
                }
            });
            
            $featurePackButtons.click(function() {
                $('#sox-settings-dialog .sox-feature').removeClass('feature-fade-out');
                if ($(this).is('.clear-feature-pack-selection')) return;
                $('#sox-settings-dialog .sox-feature').not('.' + $(this).attr('data-feature-pack-id')).addClass('feature-fade-out');
            });

            // create sox settings button
            let $soxSettingsButton = $('<a/>', {
                    id: 'soxSettingsButton',
                    class: 'sox-settings-button -link',
                    title: 'Change SOX settings',
                    href: '#',
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

            //close dialog if clicked outside it
            $(document).click(function(e) { //close dialog if clicked outside it
                let $target = $(e.target),
                    isToggle = $target.is('#soxSettingsButton, #sox-settings-dialog'),
                    isChild = $target.parents('#soxSettingsButton, #sox-settings-dialog').is('#soxSettingsButton, #sox-settings-dialog');

                if (!isToggle && !isChild) {
                    $soxSettingsDialog.hide();
                    $soxSettingsButton.removeClass('topbar-icon-on');
                }
            });

            //close dialog if one of the links on the topbar is clicked
            $('.topbar-icon, .-link').not('.sox-settings-button').click(function() {
                $soxSettingsDialog.hide();
                $soxSettingsButton.removeClass('topbar-icon-on');
            });

            // load features into dialog
            sox.debug('injecting features into dialog');
            for (let category in features.categories) {
                addCategory(category);
                for (let feature in features.categories[category]) {
                    let currentFeature = features.categories[category][feature];
                    addFeature(
                        category,
                        currentFeature.name,
                        currentFeature.desc,
                        (currentFeature.settings ? currentFeature.settings : false), //add the settings panel for this feautre if indicated in the JSON
                        (currentFeature.extended_description ? currentFeature.extended_description : false), //add the extra description on hover if the feature has the extended description
                        (currentFeature.meta ? currentFeature.meta : false), //add the meta link to the extra description on hover
                        (currentFeature.feature_packs ? currentFeature.feature_packs : []),
                        (currentFeature.usesApi ? currentFeature.usesApi : false)
                    );
                }
            }

            if (settings) {
                for (let i = 0; i < settings.length; ++i) {
                    $soxSettingsDialogFeatures.find('#' + settings[i].split('-')[1]).prop('checked', true);
                }
            } else { // no settings found, mark all inputs as checked and display settings dialog
                //note: the .not() is to make sure any disabled features (user doesn't have access token) aren't selected by default
                $soxSettingsDialogFeatures.find('input').not('.sox-feature.disabled-feature input').prop('checked', true);
                $soxSettingsButton.addClass('topbar-icon-on');
                $soxSettingsDialog.show();
            }

            // add dialog to corral and sox button to topbar
            $soxSettingsButton.append($icon);
            $('.-secondary > .-item:not(:has(.my-profile)):eq(1)').before($('<li/>').addClass('-item').append($soxSettingsButton));

            $soxSettingsDialog.css({
                'top': $('.top-bar').height(),
                'right': $('.-container').outerWidth() - $('#soxSettingsButton').parent().position().left - $('#soxSettingsButton').outerWidth()
            });

            //only add dialog if button was added successfully
            if ($('#soxSettingsButton').length) $('.js-topbar-dialog-corral').append($soxSettingsDialog);
        }
    };

})(window.sox = window.sox || {}, jQuery);