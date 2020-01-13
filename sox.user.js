// ==UserScript==
// @name         Stack Overflow Extras (SOX)
// @namespace    https://github.com/soscripted/sox
// @homepage     https://github.com/soscripted/sox
// @homepageURL  https://github.com/soscripted/sox
// @version      2.6.22 DEV
// @description  Extra optional features for Stack Overflow and Stack Exchange sites
// @contributor  ᴉʞuǝ (https://stackoverflow.com/users/1454538/, https://github.com/mezmi)
// @contributor  ᔕᖺᘎᕊ (https://stackexchange.com/users/4337810/, https://github.com/shu8)
// @contributor  Sir-Cumference (https://stackexchange.com/users/4119142/, https://github.com/Sir-Cumference)
// @contributor  GaurangTandon (https://github.com/GaurangTandon)
// @contributor  double-beep (https://stackexchange.com/users/14688437/double-beep, https://github.com/double-beep)
// @updateURL    https://cdn.jsdelivr.net/gh/soscripted/sox@dev/sox.user.js

// @match        https://*.stackoverflow.com/*
// @match        https://*.stackexchange.com/*
// @match        https://*.superuser.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.stackapps.com/*
// @match        https://*.mathoverflow.net/*
// @match        *://github.com/soscripted/*
// @match        *://soscripted.github.io/sox/*

// @exclude      *://data.stackexchange.com/*
// @exclude      *://api.stackexchange.com/*
// @exclude      *://stackoverflow.com/c/*

// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @require      https://api.stackexchange.com/js/2.0/all.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-timeago/1.5.3/jquery.timeago.min.js

// @require      sox.common.js
// @require      sox.github.js
// @require      sox.dialog.js
// @require      sox.features.js

// @resource     css sox.css
// @resource     dialog sox.dialog.html
// @resource     featuresJSON sox.features.info.json
// @resource     common sox.common.info.json
// @resource     sprites sox.sprites.svg

// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_setClipboard
// ==/UserScript==
/*jshint loopfunc: true*/
(function(sox, $) {
  'use strict';

  function init() {
    if (sox.location.on('github.com/soscripted')) {
      try {
        sox.github.init(sox.info.version, sox.info.handler);
      } catch (e) {
        throw ('SOX: There was an error while attempting to initialize the sox.github.js file, please report this on GitHub.\n' + e);
      }
      return;
    }

    if (sox.location.on('soscripted.github.io/sox/#access_token')) { //save access token
      try {
        const access_token = window.location.href.split('=')[1].split('&')[0];
        sox.loginfo('ACCESS TOKEN: ', access_token);
        GM_setValue('SOX-accessToken', access_token);
        alert('Access token successfully saved! You can close this window :)');
      } catch (e) {
        throw ('SOX: There was an error saving your access token');
      }
      return;
    }
    if (sox.info.debugging) {
      sox.debug('DEBUGGING SOX VERSION ' + sox.info.version);
      sox.debug('----------------saved variables---------------------');
      sox.settings.writeToConsole(true); //true => hide access token
      sox.debug('----------------end saved variables---------------------');
    }

    const spritesDiv = $('<div/>', { html: GM_getResourceText('sprites') });
    $('head').append(spritesDiv);

    GM_addStyle(GM_getResourceText('css'));

    const settings = sox.settings.load();
    //returns undefined if not set

    const featureInfo = JSON.parse(GM_getResourceText('featuresJSON'));

    try {
      sox.debug('SOX object', sox);
      sox.dialog.init({
        version: sox.info.version,
        features: featureInfo,
        settings: settings,
        lastVersionInstalled: sox.info.lastVersionInstalled,
      });
    } catch (e) {
      throw ('SOX: There was an error while attempting to initialize the SOX Settings Dialog, please report this on GitHub.\n' + e);
    }

    if (sox.settings.available) {
      // Execute features
      performance.mark('allFeatures-start');
      for (let i = 0; i < settings.length; ++i) {
        const category = settings[i].split('-')[0];
        const featureId = settings[i].split('-')[1];

        if (!(category in featureInfo.categories)) { //if we ever rename a category
          sox.loginfo('Deleting feature "' + settings[i] + '" (category rename?)');
          settings.splice(i, 1);
          sox.settings.save(settings);
          continue;
        }

        const feature = featureInfo.categories[category].filter(obj => {
          return obj.name == featureId;
        })[0];

        let runFeature = true;
        try {
          //NOTE: there is no else if() because it is possible to have both match and exclude patterns..
          //which could have minor exceptions making it neccessary to check both
          if (feature.match !== '') {
            const sites = feature.match.split(',');

            for (let pattern = 0; pattern < sites.length; pattern++) {
              if (!sox.location.matchWithPattern(sites[pattern])) {
                runFeature = false; //none of the patterns match the current site.. yet.
              } else {
                runFeature = true;
                break; //if it does match, then stop looping; we want the feature to run
              }
            }
          }
          if (feature.exclude !== '') {
            const sites = feature.exclude.split(',');

            for (let pattern = 0; pattern < sites.length; pattern++) {
              if (sox.location.matchWithPattern(sites[pattern])) { //if current site is in list, DON'T run feature
                runFeature = false; //don't run feature
                break; //no need to keep on looping
              }
            }
          }
          if (runFeature) {
            sox.debug('running ' + featureId);
            performance.mark(`${featureId}-start`);
            if (feature.settings) {
              const settingsToPass = GM_getValue('SOX-' + featureId + '-settings') ? JSON.parse(GM_getValue('SOX-' + featureId + '-settings')) : {};
              sox.features[featureId](settingsToPass); //run the feature if match and exclude conditions are met, pass on settings object
            } else {
              sox.features[featureId](); //run the feature if match and exclude conditions are met
            }
            performance.mark(`${featureId}-end`);
            performance.measure(featureId, `${featureId}-start`, `${featureId}-end`);
          }
        } catch (err) {
          if (!sox.features[featureId] || !feature) { //remove deprecated/'corrupt' feature IDs from saved settings
            sox.loginfo('Deleting feature "' + settings[i] + '" (feature not found)');
            settings.splice(i, 1);
            sox.settings.save(settings);
            $('#sox-settings-dialog-features').find('#' + settings[i].split('-')[1]).parent().parent().remove();
          } else {
            $('#sox-settings-dialog-features').find('#' + settings[i].split('-')[1]).parent().css('color', 'red').attr('title', 'There was an error loading this feature. Please raise an issue on GitHub.');
            sox.error('There was an error loading the feature "' + settings[i] + '". Please raise an issue on GitHub, and copy the following error log:\n' + err);
          }
        }
      }
      performance.mark('allFeatures-end');
      performance.measure('allFeatures', 'allFeatures-start', 'allFeatures-end');
      sox.debug('Performance Data', performance.getEntriesByType('measure'));
    }

    //custom events....
    sox.helpers.observe([...document.getElementsByClassName('post-layout')], '.new_comment, .comment, .comments, .comment-text', node => {
      sox.debug('sox-new-comment event triggered');
      $(document).trigger('sox-new-comment', [node]);
    });

    sox.helpers.observe(document.body, 'textarea[id^="wmd-input"]', node => {
      sox.debug('sox-edit-window event triggered');
      $(document).trigger('sox-edit-window', [node]);
    });

    sox.helpers.observe(document.body, '.reviewable-post, .review-content', node => {
      sox.debug('sox-new-review-post-appeared event triggered');
      $(document).trigger('sox-new-review-post-appeared', [node]);
    });

    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
      sox.helpers.observe(chatBody, '.user-popup', node => {
        sox.debug('sox-chat-user-popup event triggered');
        $(document).trigger('sox-chat-user-popup', [node]);
      });
    }

    if (GM_getValue('SOX-accessToken', -1) == -1) { //set access token
      //This was originally a series of IIFEs appended to the head which used the SE API JS SDK but
      //it was very uncertain and often caused issues, especially in FF
      //it now uses a Github page to show the access token
      //and detects that page and saves it automatically.
      //this seems to be a much cleaner and easier-to-debug method!
      GM_setValue('SOX-accessToken', -2); //once we ask the user once, don't ask them again: set the value to -2 so this IF never evaluates to true
      const askUserToAuthorise = window.confirm('To get the most out of SOX, you should get an access token! Please press "OK" to continue and follow the instructions in the window that opens. NOTE: this message will not appear again; if you choose not to, you can click the key at the bottom of the settings dialog at anytime to get one.');
      if (askUserToAuthorise) window.open('https://stackexchange.com/oauth/dialog?client_id=7138&scope=no_expiry&redirect_uri=http://soscripted.github.io/sox/');
      sox.warn('Please go to the following URL to get your access token for certain SOX features', 'https://stackexchange.com/oauth/dialog?client_id=7138&scope=no_expiry&redirect_uri=http://soscripted.github.io/sox/');
    }
  }
  sox.ready(init);
})(window.sox = window.sox || {}, jQuery);
