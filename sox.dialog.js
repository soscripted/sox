(function(sox, $) {
  'use strict';

  sox.dialog = {
    init: function(options) {
      if (!$('.s-topbar').length) return;
      sox.debug('initializing SOX dialog');

      const version = options.version;
      const features = options.features;
      const settings = options.settings;
      const lastVersionInstalled = options.lastVersionInstalled;
      const html = GM_getResourceText('dialog');
      const $soxSettingsDialog = $(html);
      const $soxSettingsDialogFeatures = $soxSettingsDialog.find('#sox-settings-dialog-features');
      const $soxSettingsDialogVersion = $soxSettingsDialog.find('#sox-settings-dialog-version');
      const $soxSettingsSave = $soxSettingsDialog.find('#sox-settings-dialog-save');
      const $soxSettingsReset = $soxSettingsDialog.find('#sox-settings-dialog-reset');
      const $soxSettingsDebugging = $soxSettingsDialog.find('#sox-settings-dialog-debugging');
      const $soxSettingsNewAccessTokenButton = $soxSettingsDialog.find('#sox-settings-dialog-access-token');
      const $soxSettingsToggle = $soxSettingsDialog.find('#sox-settings-dialog-check-toggle');
      const $soxSettingsClose = $soxSettingsDialog.find('#sox-settings-dialog-close');
      const $searchBox = $soxSettingsDialog.find('#search');
      const $importSettingsButton = $soxSettingsDialog.find('#sox-settings-import');
      const $exportSettingsButton = $soxSettingsDialog.find('#sox-settings-export');
      const $featurePackButtons = $soxSettingsDialog.find('.sox-settings-dialog-feature-pack');

      // Array of HTML strings that will be displayed as `li` items if the user has installed a new version.
      const changes = [
        "Fix bugs in various features due to SE layout changes",
        "Add feature to add answer count to question header",
        "Behind-the-scenes performance improvements (e.g., reduce usage of jQuery for efficiency - thanks @double-beep!)",
        'Deprecate "align badges by their class on user profile pages" feature (now natively implemented!)',
        'Deprecate "differentiate spoilers from empty blockquotes" (now native!)',
      ];

      function addCategory(name) {
        const $div = $('<div/>', {
          'class': 'header category',
          'id': 'header-for-' + name,
        });

        const $h3 = $('<h3/>', {
          text: name.toLowerCase(),
        });

        const $content = $('<div/>', {
          id: name,
          'class': 'modal-content features',
        });
        $div.append($h3);

        if (!$soxSettingsDialogFeatures.find('div#header-for-' + name).length) {
          $soxSettingsDialogFeatures.append($div);
          $div.after($content);
        }
      }

      function addFeature(category, name, description, featureSettings, extendedDescription, metaLink, featurePacks, usesApi) {
        const blockFeatureSelection = usesApi && !sox.settings.accessToken;

        const $div = $('<div/>', {
          'class': 'sox-feature ' + (featurePacks.length ? featurePacks.join(' ') : '') + (blockFeatureSelection ? ' disabled-feature' : ''),
          'title': blockFeatureSelection ? 'You must get an access token to enable this feature (click the key button at the bottom of the SOX dialog)' : '',
        });

        const $info = $(sox.sprites.getSvg('info')).hover(function() {
          if (extendedDescription && !$(this).parent().find('.sox-feature-info').length) {
            $(this).parent().append($('<div/>', {
              'class': 'sox-feature-info',
              'html': extendedDescription + (metaLink ? ' <a href="' + metaLink + '">[meta]</a>' : ''),
            }));
          }
        });

        const $label = $('<label/>');
        const $input = $('<input/>', {
          id: name,
          'class': 's-checkbox',
          type: 'checkbox',
        }).prop('disabled', blockFeatureSelection);

        $div.on('mouseleave', function() {
          $(this).find('.sox-feature-info').remove();
        }).append($label).append(extendedDescription ? $info : '');
        $label.append($input);
        $input.after(description);
        $soxSettingsDialogFeatures.find('#' + category).append($div);

        if (featureSettings) {
          const $settingsDiv = $('<div/>', {
            id: 'feature-settings-' + name,
            'class': 'sox-feature-settings',
            style: 'display: none; margin-top: 5px;',
          });

          const $settingsToggle = $(sox.sprites.getSvg('wrench', 'Edit this feature\'s settings')).click(e => {
            e.preventDefault(); //don't uncheck the checkbox

            const $settingsPanel = $('#feature-settings-' + name);

            if ($settingsPanel.is(':visible')) {
              $settingsPanel.fadeOut();
            } else {
              $settingsPanel.fadeIn();
            }
          });

          const optionalSettings = GM_getValue('SOX-' + name + '-settings', -1);

          for (let i = 0; i < featureSettings.length; i++) {
            const currentSetting = featureSettings[i];
            $settingsDiv
              .append(sox.helpers.newElement(currentSetting.type, { //use newElement helper so the type can be things like 'checkbox' or 'radio'
                id: currentSetting.id,
                'class': currentSetting.type === 'textarea' ? 'featureSetting s-input' : 'featureSetting s-checkbox',
                'style': 'margin-right: 5px',
                'checked': (currentSetting.type === 'checkbox' ? JSON.parse(optionalSettings)[currentSetting.id] : false),
                value: (optionalSettings === -1 ? '' : JSON.parse(optionalSettings)[currentSetting.id]),
              }))
              .append(currentSetting.desc)
              .append('<br>');
          }

          const $saveFeatureSettings = $('<a/>', {
            id: 'saveSettings-' + name,
            'class': 'action s-btn s-btn__secondary s-btn__sm',
            text: 'Save Settings',
            click: function(e) {
              e.preventDefault(); //don't uncheck the checkbox
              const settingsToSave = {};
              $('.sox-feature.disabled-feature input[type="checkbox"]').prop('checked', false); //uncheck any features that somehow were checked (they shouldn't be able to through the UI) but should be disabled (user doesn't have access token)
              $(this).parent().find('.featureSetting').each(function() {
                settingsToSave[$(this).attr('id')] = ($(this).is(':checkbox') ? $(this).is(':checked') : $(this).val());
              });
              GM_setValue('SOX-' + name + '-settings', JSON.stringify(settingsToSave));
              sox.settings.writeToConsole(true);
              alert('Saved!');
            },
          });

          $settingsDiv.append($saveFeatureSettings);

          const $feature = $soxSettingsDialogFeatures.find('input#' + name).parent();
          $feature.append($settingsToggle);

          if ($div.has('.sox-sprite-info').length) {
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
        const $newVersionDetailsContainer = $('<div/>', {
          'class': 'sox-new-version-details',
        });

        const $newVersionHeader = $('<div/>', {
          'class': 'header category',
          'html': '<h3>new in this version</h3>',
        });

        const $changes = $('<ul/>');

        for (let i = 0; i < changes.length; i++) {
          $changes.append($('<li/>', {
            'html': changes[i], //this array is defined near the top of the file
            'class': 'sox-new-version-item',
          }));
        }

        const $newVersionInfoContainer = $('<div/>', {
          'class': 'modal-content',
          'html': $changes,
        });

        $soxSettingsDialogFeatures.append($newVersionDetailsContainer.append($newVersionHeader).append($newVersionInfoContainer));
      }

      if (sox.info.debugging) $soxSettingsDebugging.text('Disable debugging');

      // wire up event handlers
      $soxSettingsClose.on('click', () => {
        $soxSettingsDialog.hide();
      });

      $soxSettingsReset.on('click', () => {
        if (confirm('Are you sure you want to reset SOX?')) {
          sox.settings.reset();
          location.reload(); // reload page to reflect changed settings
        }
      });

      $soxSettingsDebugging.on('click', () => {
        const currentState = sox.info.debugging;
        if (typeof currentState === 'undefined') {
          GM_setValue('SOX-debug', true);
          $soxSettingsDebugging.text('Disable debugging');
        } else {
          GM_setValue('SOX-debug', !currentState);
          $soxSettingsDebugging.text(currentState ? 'Enable debugging' : 'Disable debugging');
        }
        location.reload();
      });

      $soxSettingsNewAccessTokenButton.on('click', () => {
        window.open('https://stackexchange.com/oauth/dialog?client_id=7138&scope=no_expiry&redirect_uri=http://soscripted.github.io/sox/');
        sox.loginfo('To get a new access token, please go to the following URL', 'https://stackexchange.com/oauth/dialog?client_id=7138&scope=no_expiry&redirect_uri=http://soscripted.github.io/sox/');
      });

      $soxSettingsToggle.on('click', function() {
        const $icon = $(this).find('svg');
        const checked = $icon.hasClass('sox-sprite-checked_box');

        if (checked) {
          $(this).find('.sox-sprite-checked-box').hide();
          $(this).find('.sox-sprite-unchecked-box').show();
          $icon.removeClass('sox-sprite-checked_box').addClass('sox-sprite-unchecked_box');
        } else {
          $(this).find('.sox-sprite-unchecked-box').hide();
          $(this).find('.sox-sprite-checked-box').show();
          $icon.removeClass('sox-sprite-unchecked_box').addClass('sox-sprite-checked_box');
        }

        $soxSettingsDialogFeatures.find('input').prop('checked', !checked);
      });

      $soxSettingsSave.on('click', () => {
        const settings = [];
        $soxSettingsDialogFeatures.find('input[type=checkbox]:checked').not('.featureSetting').each(function() { //NOT the per-feature featureSetting checkboxes, because they are saved in THEIR OWN setting object!
          const x = $(this).closest('.modal-content').attr('id') + '-' + $(this).attr('id');
          settings.push(x); //Add the function's ID (also the checkbox's ID) to the array
        });

        sox.settings.save(settings);
        location.reload(); // reload page to reflect changed settings
      });

      $importSettingsButton.on('click', () => {
        const settingsToImport = window.prompt('Please paste the settings exactly as they were given to you');
        if (!settingsToImport) return;
        sox.settings.save(settingsToImport);
        location.reload();
      });

      $exportSettingsButton.on('click', () => {
        window.prompt('Your settings are below. Press Ctrl/Cmd + C to copy.', JSON.stringify(sox.settings.load()));
      });

      $searchBox.on('keyup keydown', function() { //search box
        if ($(this).val() !== '') {
          const searchQuery = $(this).val();
          $('.sox-new-version-details').hide();
          $('#sox-settings-dialog .sox-feature').each(function() {
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
      const $soxSettingsButton = $('<a/>', {
        id: 'soxSettingsButton',
        'class': 'sox-settings-button s-topbar--item',
        title: 'Change SOX settings',
        href: '#',
        click: function(e) {
          e.preventDefault();
          $('#sox-settings-dialog').toggle();
          if ($soxSettingsDialog.is(':visible')) {
            $(this).addClass('is-selected');
            $soxSettingsDialog.find('#search').focus();
            $soxSettingsDialog.css('right', 'calc(95vw - ' + $(e.target).offset().left + 'px)');
          } else {
            $(this).removeClass('is-selected');
          }
        },
      });

      // Very basic 'dark theme' support. See https://github.com/soscripted/sox/issues/406
      // Not sure what the best way to detect dark mode is; the following just checks to
      // see if <body>'s text color is #ccc (grey/rgb(204,204,204)). Might need changing
      // in future
      if ($('body').css('color') === 'rgb(204, 204, 204)') {
        sox.debug('Dark mode detected, tweaking SOX CSS');
        $soxSettingsDialog.addClass('dark-mode');
      }

      const $icon = $(sox.sprites.getSvg('settings', 'Change your SOX settings')).css({
        fill: $('.top-bar .-secondary .-link').css('color'),
        width: '25px',
        height: '25px',
      }).addClass('svg-icon iconInbox');

      //close dialog if clicked outside it
      $(document).click(e => { //close dialog if clicked outside it
        const $target = $(e.target);
        const isToggle = $target.is('#soxSettingsButton, #sox-settings-dialog');
        const isChild = $target.parents('#soxSettingsButton, #sox-settings-dialog').is('#soxSettingsButton, #sox-settings-dialog');

        if (!isToggle && !isChild) {
          $soxSettingsDialog.hide();
          $soxSettingsButton.removeClass('is-selected');
        }
      });

      //close dialog if one of the links on the topbar is clicked
      $('.s-topbar--content .s-topbar--item').not('.sox-settings-button').click(() => {
        $soxSettingsDialog.hide();
        $soxSettingsButton.removeClass('is-selected');
      });

      // load features into dialog
      sox.debug('injecting features into dialog');
      for (const category in features.categories) {
        addCategory(category);
        for (const feature in features.categories[category]) {
          const currentFeature = features.categories[category][feature];
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
      $('.s-topbar--item.s-user-card').parent().after($('<li/>').append($soxSettingsButton));

      $soxSettingsDialog.css({
        'top': $('.top-bar').height(),
        'right': $('.-container').outerWidth() - $('#soxSettingsButton').parent().position().left - $('#soxSettingsButton').outerWidth(),
      });

      //only add dialog if button was added successfully
      if ($('#soxSettingsButton').length) $('.js-topbar-dialog-corral').append($soxSettingsDialog);
    },
  };
})(window.sox = window.sox || {}, jQuery);
