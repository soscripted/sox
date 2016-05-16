(function(sox, $, undefined) {
    'use strict';

    sox.dialog = {
        init: function(options) {
            sox.helpers.notify('dialog init');

            var version = options.version,
                features = options.features,
                settings = options.settings;

            var html = GM_getResourceText('dialog');

            var $soxSettingsDialog = $(html),
                $soxSettingsDialogFeatures = $soxSettingsDialog.find('#sox-settings-dialog-features'),
                $soxSettingsDialogVersion = $soxSettingsDialog.find('#sox-settings-dialog-version'),
                $soxSettingsSave = $soxSettingsDialog.find('#sox-settings-dialog-save'),
                $soxSettingsReset = $soxSettingsDialog.find('#sox-settings-dialog-reset'),
                $soxSettingsToggleAccessTokensDiv = $soxSettingsDialog.find('#sox-settings-dialog-access-tokens'),
                $soxSettingsAccessTokensToggle = $soxSettingsToggleAccessTokensDiv.find('#toggle-access-token-links'),
                $soxSettingsToggle = $soxSettingsDialog.find('#sox-settings-dialog-check-toggle'),
                $soxSettingsClose = $soxSettingsDialog.find('#sox-settings-dialog-close'),
                $searchBox = $soxSettingsDialog.find('#search'),
                $searchReset = $soxSettingsDialog.find('#search-reset');


            function addFeature(options) {
                var $div = $('<div/>', {
                        'class': 'feature'
                    }),
                    $label = $('<label/>'),
                    $input = $('<input/>', {
                        id: options.name,
                        type: 'checkbox'
                    });
                $div.append($label);
                $label.append($input);
                $input.after(options.desc);
                $soxSettingsDialogFeatures.find('#' + options.category).append($div);
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

            // display sox version number in the dialog
            $soxSettingsDialogVersion.text(options.version != 'unknown' ? ' v' + version.toLowerCase() : '');

            // wire up event handlers
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

            $searchReset.on('click', function() {
                $('.category, .features, #sox-settings-dialog label').fadeIn();
                $searchBox.val('').focus();
            });

            $soxSettingsSave.on('click', function() {
                var settings = [];

                $soxSettingsDialogFeatures.find('input[type=checkbox]:checked').each(function() {
                    var x = $(this).closest('.modal-content').attr('id') + '-' + $(this).attr('id');

                    settings.push(x); //Add the function's ID (also the checkbox's ID) to the array
                });

                sox.settings.save(settings);

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


            // create sox settings button
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

            //open dialog on hover if another dialog is already open
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

            //close dialog if clicked outside it
            $(document).click(function(e) {
                $target = $(e.target);
                if (!$target.is('#soxSettingsButton, #sox-settings-dialog') && !$target.parents("#soxSettingsButton, #sox-settings-dialog").is("#soxSettingsButton, #sox-settings-dialog")) {
                    $soxSettingsDialog.hide();
                    $('#soxSettingsButton').removeClass('topbar-icon-on');
                }
            });

            //close dialog if one of the links on the topbar is clicked
            $('.topbar-icon').not('.sox-settings-button').click(function() {
                $soxSettingsDialog.hide();
                $('#soxSettingsButton').removeClass('topbar-icon-on');
            });


            // load features into dialog
            for (var category in features.categories) {
                addCategory(category);

                for (var feature in features.categories[category]) {
                    addFeature({
                        category: category,
                        name: features.categories[category][feature].name,
                        description: features.categories[category][feature].desc
                    });
                }
            }
            if (settings) {
                for (var i = 0; i < settings.length; ++i) {
                    $soxSettingsDialogFeatures.find('#' + settings[i].split('-')[1]).prop('checked', true);
                }
            } else {
                // no settings found, mark all inputs as checked and display settings dialog
                $soxSettingsDialogFeatures.find('input').prop('checked', true);
                $soxSettingsDialog.show();
            }

            // add dialog to corral and sox button to topbar
            $soxSettingsButton.append($icon).appendTo('div.network-items');
            $('.js-topbar-dialog-corral').append($settingsDialog);
        }
    };

})(window.sox = window.sox || {}, jQuery);
