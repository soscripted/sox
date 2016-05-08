(function(sox, $, undefined) {
    'use strict';

    sox.dialog = {
        init: function(options) {
            // options { dialog html, features data, sox version}

            var $soxSettingsDialog = $(options.html),
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

            // display sox version number in the dialog
            $soxSettingsDialogVersion.text(SOX_VERSION != '??' ? ' v' + SOX_VERSION.toLowerCase() : '');

            // wire up event handlers


            // append the dialog to the dialog corral
            $('.js-topbar-dialog-corral').append($settingsDialog);


        }
    };

})(window.sox = window.sox || {}, jQuery);
