(function(sox, $) {
  'use strict';

  sox.features = { //SOX functions must go in here
    moveBounty: function() {
      // Description: For moving bounty to the top

      $('.bounty-notification').insertAfter('.question .fw-wrap');
      $('.bounty-link.bounty').closest('ul').insertAfter('.question .fw-wrap');
    },

    dragBounty: function() {
      // Description: Makes the bounty window draggable

      const target = document.getElementById('question');
      sox.helpers.observe(target, '#start-bounty-popup', () => {
        $('#start-bounty-popup').draggable({
          drag: function() {
            $(this).css({
              'width': 'auto',
              'height': 'auto',
            });
          },
        }).css('cursor', 'move');
      });
    },

    renameChat: function() {
      // Description: Renames Chat tabs to prepend 'Chat' before the room name

      if (sox.site.type === 'chat') {
        const match = document.title.match(/^(\(\d*\*?\) )?(.* \| [^|]*)$/);
        document.title = (match[1] || '') + 'Chat - ' + match[2];
      }
    },

    markEmployees: function () {
      // Description: Adds an Stack Overflow logo next to users that *ARE* a Stack Overflow Employee

      const anchors = [...document.querySelectorAll('.comment a, .deleted-answer-info a, .employee-name a, .user-details a, .question-summary .started a')].filter(el => {
        return el.href.contains('/users/');
      });
      const ids = [];

      for (let i = 0; i < anchors.length; i++) {
        const href = anchors[i].href;
        const idMatch = href.match(/(\d+)/);
        if (idMatch && ids.indexOf(idMatch[1]) === -1) ids.push(idMatch[1]);
      }
      sox.debug('markEmployees user IDs', ids);

      // TODO is pagination needed?
      sox.helpers.getFromAPI({
        endpoint: 'users',
        ids,
        sitename: sox.site.url,
        filter: '!*MxJcsv91Tcz6yRH',
        limit: 100,
        featureId: 'markEmployees',
        cacheDuration: 60 * 24, // Cache for 24 hours (in minutes)
      }, items => {
        sox.debug('markEmployees returned data', items);
        for (let i = 0; i < items.length; i++) {
          const userId = items[i].user_id;
          const isEmployee = items[i].is_employee;
          if (!isEmployee) continue;

          const $icon = $('<svg aria-hidden="true" class="sox-markEmployees-logo sox-sprite svg-icon iconStackExchange" width="18" height="18" viewBox="0 0 18 18"><path d="M15 1H3a2 2 0 0 0-2 2v2h16V3a2 2 0 0 0-2-2zM1 13c0 1.1.9 2 2 2h8v3l3-3h1a2 2 0 0 0 2-2v-2H1v2zm16-7H1v4h16V6z"></path></svg>');
          $icon.css('color', $('.mod-flair').css('color'));
          anchors.filter(el => el.href.contains(`/users/${userId}/`)).forEach(el => {
            $(el).append($('<span/>', {
              title: 'employee (added by SOX)',
            }).append($icon.clone()));
          });
        }
      });
    },

    copyCommentsLink: function() {
      // Description: Adds the 'show x more comments' link before the commnents
      // Test on e.g. https://meta.stackexchange.com/questions/125439/

      function copyLinks() {
        $('.js-show-link').each(function() {
          if (!$(this).parent().prev().find('.comment-text').length) return; // https://github.com/soscripted/sox/issues/196

          const $existingClonedBtn = $(this).parent().parent().find('.sox-copyCommentsLinkClone');
          if ($existingClonedBtn.length) {
            if ($(this).parent().parent().find('.js-show-link.comments-link:visible').length !== 2) {
              // If we've already cloned the button, we would expect 2 of the buttons to now exist
              // If now, delete the clone as the comments have already been expanded (direct link to deep comment)
              // See https://github.com/soscripted/sox/issues/379#issuecomment-460069876
              $existingClonedBtn.remove();
            }
            // Don't add again if we've already cloned the button
            return;
          }

          const $btnToAdd = $(this).clone();
          $btnToAdd.addClass('sox-copyCommentsLinkClone');
          $btnToAdd.on('click', function(e) {
            e.preventDefault();
            $(this).hide();
          });

          $(this).parent().parent().prepend($btnToAdd);

          $(this).click(() => {
            $btnToAdd.hide();
          });
        });

        $(document).on('click', '.js-add-link', function() { //https://github.com/soscripted/sox/issues/239
          const commentParent = ($(this).parents('.answer').length ? '.answer' : '.question');
          $(this).closest(commentParent).find('.js-show-link.comments-link').hide();
        });
      }

      copyLinks();
      $(document).on('sox-new-comment', copyLinks);
    },

    highlightQuestions: function() {
      // Description: For highlighting only the tags of favorite questions

      function highlight() {
        const interestingQuestions = [...document.getElementsByClassName('tagged-interesting')];
        const questionsLength = interestingQuestions.length;
        for (let i = 0; i < questionsLength; i++) {
          const question = interestingQuestions[i];
          question.classList.remove('tagged-interesting');
          question.classList.add('sox-tagged-interesting');
        }
      }

      let color;
      if (sox.location.on('superuser.com')) {
        color = '#00a1c9';
      } else if (sox.location.on('stackoverflow.com')) {
        color = '#f69c55';
      } else if (sox.location.on('serverfault.com')) {
        color = '#EA292C';
      } else {
        const existingPostTags = document.getElementsByClassName('post-tag');
        if (existingPostTags.length) {
          color = existingPostTags[0].style.color;
        } else {
          // Default colour if we can't find one on the page already
          color = '#39739d';
        }
      }

      const style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(`.sox-tagged-interesting:before{ background: ${color} }`));
      document.head.appendChild(style);

      highlight();

      if (document.getElementsByClassName('question-summary').length) {
        const targetMainPage = document.getElementById('question-mini-list');
        const targetQuestionsPage = document.getElementById('questions');
        sox.helpers.observe([targetMainPage, targetQuestionsPage], '.question-summary', highlight);
      }
    },

    displayName: function() {
      // Description: For displaying username next to avatar on topbar

      const name = sox.user.name;
      const $span = $('<span/>', {
        class: 'reputation links-container',
        style: $('.top-bar').css('background-color') == 'rgb(250, 250, 251)' ? 'color: #535a60; padding-right: 12px; font-size: 13px;' : 'color: white; padding-right: 12px; font-size: 13px;',
        title: name,
        text: name,
      });
      $span.insertBefore('.top-bar .gravatar-wrapper-24');
    },

    colorAnswerer: function() {
      // Description: For highlighting the names of answerers on comments

      function color() {
        const answerCells = [...document.getElementsByClassName('answercell')];
        for (let i = 0; i < answerCells.length; i++) {
          const cell = answerCells[i];
          const answerer = cell.querySelector('.post-signature:nth-last-of-type(1) a');
          if (!answerer) continue;
          const answererID = answerer.href.match(/\d+/)[0];
          const commentUsers = $(cell).next().next().find('.comments .comment-user');

          commentUsers.each(function() {
            if (!this.href) return true;
            if (this.href.contains(`users/${answererID}`)) this.classList.add('sox-answerer');
          });
        }
      }

      color();
      $(document).on('sox-new-comment', color);
    },

    kbdAndBullets: function() {
      // Description: For adding buttons to the markdown toolbar to surround selected test with KBD or convert selection into a markdown list

      function replaceSelectedText(node, newText) {
        const sS = node.selectionStart;
        const sE = node.selectionEnd;
        const val = node.value;
        const valBefore = val.substring(0, sS);
        const valAfter = val.substring(sE);

        // situation contrary to our expectation
        if (sS === sE) return;

        node.value = valBefore + newText + valAfter;
        node.selectionStart = node.selectionEnd = sS + newText.length;

        sox.Stack.MarkdownEditor.refreshAllPreviews();
        node.focus();
      }

      function getSelection(node) {
        return node.value.substring(node.selectionStart, node.selectionEnd);
      }

      function addBullets(node) {
        const list = '- ' + getSelection(node).split('\n').join('\n- ');
        replaceSelectedText(node, list);
      }

      function addKbd(node) {
        sox.helpers.surroundSelectedText(node, '<kbd>', '</kbd>');
        node.focus();
      }

      function getTextarea(button) {
        // li -> ul -> #wmd-button-bar -> .wmd-container
        return button.parentNode.parentNode.parentNode.querySelector('textarea');
      }

      const kbdBtn = '<li class="wmd-button wmd-kbd-button-sox" title="surround selected text with <kbd> tags"><span style="background-image:none;">kbd</span></li>';
      const listBtn = '<li class="wmd-button wmd-bullet-button-sox" title="add dashes (\'-\') before every line to make a bullet list"><span style="background-image:none;">&#x25cf;</span></li>';

      function loopAndAddHandlers() {
        const redoButtons = [...document.querySelectorAll('[id^="wmd-redo-button"]')];
        for (let i = 0; i < redoButtons.length; i++) {
          const button = redoButtons[i];
          if (!button.dataset.kbdAdded) {
            // Compatability with https://stackapps.com/q/3341 as requested in https://github.com/soscripted/sox/issues/361
            // The SOX kbd button isn't added if that script is installed
            if (button.parentNode.querySelector('.tmAdded.wmd-kbd-button')) {
              button.insertAdjacentHTML('afterend', listBtn);
            } else {
              button.insertAdjacentHTML('afterend', kbdBtn + listBtn);
            }
            button.dataset.kbdAdded = true;
          }
        }
      }

      $(document).on('sox-edit-window', loopAndAddHandlers);

      loopAndAddHandlers();

      document.addEventListener('keydown', event => {
        const kC = event.keyCode;
        const target = event.target;

        if (target && target.tagName === 'TEXTAREA' && event.altKey) {
          if (kC === 76) addBullets(target); // l
          else if (kC === 75) addKbd(target); // k
        }
      });

      $(document).on('click', '.wmd-kbd-button-sox, .wmd-bullet-button-sox', function() {
        const textarea = getTextarea(this);

        if (this.classList.contains('wmd-kbd-button-sox')) addKbd(textarea);
        else addBullets(textarea);
      });
    },

    editComment: function() {
      // Description: For adding checkboxes when editing to add pre-defined edit reasons

      const DEFAULT_OPTIONS = [
        { 'formatting': 'Improved Formatting' },
        { 'spelling': 'Corrected Spelling' },
        { 'grammar': 'Fixed grammar' },
        { 'greetings': 'Removed thanks/greetings' },
        { 'retag': 'Improved usage of tags' },
        { 'title': 'Improved title' },
      ];

      function toLocaleSentenceCase(str) {
        return str.substr(0, 1).toLocaleUpperCase() + str.substr(1);
      }

      function convertOptionsToNewFormat(options) {
        // Storage format was changed 03-02-19
        // Old storage format was an array of arrays: [[name, text], [name, text], ...]
        // This converts it to an object (like DEFAULT_OPTIONS above)
        const newOptions = [];
        options.forEach(opt => {
          newOptions.push({
            [opt[0]]: opt[1],
          });
        });
        return newOptions;
      }

      function saveOptions(options) {
        GM_setValue('editReasons', JSON.stringify(options));
      }

      function getOptions() {
        let options = GM_getValue('editReasons', -1);
        if (options === -1) {
          options = DEFAULT_OPTIONS;
          saveOptions(options);
        } else {
          options = JSON.parse(options);
        }
        // If options are being stored in the old format, convert them to the new
        if (Array.isArray(options[0])) {
          options = convertOptionsToNewFormat(options);
          saveOptions(options);
        }

        return options;
      }

      function addOptionsToDialog() {
        $('#currentValues').html(' ');
        const options = getOptions();
        options.forEach(opt => {
          const [[name, text]] = Object.entries(opt);
          $('#currentValues').append(`
          <div>
            ${name} - <i>${text}</i>
            <button class="grid--cell s-btn s-btn__muted discard-question sox-editComment-editDialogButton" data-name="${name}">Edit</button>
            <button class="grid--cell s-btn s-btn__danger discard-question sox-editComment-deleteDialogButton" data-name="${name}">Delete</button>
          </div>`);
        });
        addCheckboxes();
      }

      function createDialogEditReasons() {
        const $settingsDialog = sox.helpers.createModal({
          'header': 'SOX: View/Remove Edit Reasons',
          'id': 'dialogEditReasons',
          'css': {
            'min- width': '50%',
          },
          'html': `<div id="currentValues" class="sox-editComment-currentValues"></div>
                  <br />
                  <h3>Add a custom reason</h3>
                  Display Reason:	<input type="text" id="displayReason">
                  <br />
                  Actual Reason: <input type="text" id="actualReason">
                  <br />
                  <input type="button" id="submitUpdate" value="Submit">
                  <input type="button" id="resetEditReasons" style="float:right;" value="Reset">`,
        });

        $(document).on('click', '#resetEditReasons', () => { //manual reset
          if (confirm('Are you sure you want to reset the settings to the default ones? The page will be refreshed afterwards')) {
            saveOptions(DEFAULT_OPTIONS);
            location.reload();
          }
        });

        $('body').append($settingsDialog);
        $('#dialogEditReasons').show(500);
      }

      function addCheckboxes() {
        const $editCommentField = $('input[id^="edit-comment"]'); //NOTE: input specifcally needed, due to https://github.com/soscripted/sox/issues/363
        if (!$editCommentField.length) return; //https://github.com/soscripted/sox/issues/246

        $('#reasons').remove(); //remove the div containing everything, we're going to add/remove stuff now:
        if (/\/edit/.test(sox.site.href) || $('[class^="inline-editor"]').length || $('.edit-comment').length) {
          $editCommentField.after('<div id="reasons" style="float:left;clear:both"></div>');
          const $reasons = $('#reasons');

          const options = getOptions();
          options.forEach(opt => {
            const [[name, text]] = Object.entries(opt);
            $reasons.append(`
              <label class="sox-editComment-reason"><input type="checkbox" value="${text}"</input>${name}</label>&nbsp;
            `);
          });

          $reasons.find('input[type="checkbox"]').change(function() {
            if (this.checked) { //Add it to the summary
              if ($editCommentField.val()) {
                $editCommentField.val($editCommentField.val() + '; ' + $(this).val());
              } else {
                $editCommentField.val(toLocaleSentenceCase($(this).val()));
              }
              const newEditComment = $editCommentField.val(); //Remove the last space and last semicolon
              $editCommentField.val(newEditComment).focus();
            } else { //Remove it from the summary
              $editCommentField.val(toLocaleSentenceCase($editCommentField.val().replace(new RegExp(toLocaleSentenceCase($(this).val()) + ';? ?'), ''))); //for beginning values
              $editCommentField.val($editCommentField.val().replace($(this).val() + '; ', '')); //for middle values
              $editCommentField.val($editCommentField.val().replace(new RegExp(';? ?' + $(this).val()), '')); //for last value
            }
          });
        }
      }

      $(document).on('click', '#dialogEditReasons .sox-editComment-deleteDialogButton', function () { //Click handler to delete an option
        const optionToDelete = $(this).attr('data-name');
        const options = getOptions();
        const index = options.findIndex(opt => opt[optionToDelete]);
        options.splice(index, 1); //actually delete it
        saveOptions(options);
        addOptionsToDialog(); //display the items again (update them)
      });

      $(document).on('click', '#dialogEditReasons .sox-editComment-editDialogButton', function () { //Click handler to edit an option
        const optionToEdit = $(this).attr('data-name');
        const options = getOptions();
        const index = options.findIndex(opt => opt[optionToEdit]);

        const [[name, text]] = Object.entries(options[index]);
        const newName = window.prompt('Enter new name', name);
        const newText = window.prompt('Enter new text', text);

        if (!newName || !newText) return;

        options[index] = { [newName]: newText };
        saveOptions(options);
        addOptionsToDialog(); //display the items again (update them)
      });

      $(document).on('click', '#dialogEditReasons #submitUpdate', () => { //Click handler to update the array with custom value
        const name = $('#displayReason').val();
        const text = $('#actualReason').val();

        if (!name || !text) {
          alert('Please enter something in both the textboxes!');
        } else {
          const optionToAdd = { [name]: text };
          const options = getOptions();
          options.push(optionToAdd);
          saveOptions(options);

          addOptionsToDialog(); //display the items again (update them)
          $('#displayReason, #actualReason').val('');
        }
      });

      //Add the button to update and view the values in the help menu:
      sox.helpers.addButtonToHelpMenu({
        'id': 'editReasonsLink',
        'linkText': 'Edit Reasons',
        'summary': 'Edit your personal edit reasons (edit summary checkboxes)',
        'click': function () {
          createDialogEditReasons(); //Show the dialog to view and update values
          addOptionsToDialog();
        },
      });

      addCheckboxes();
      $(document).on('sox-edit-window', addCheckboxes);
    },

    shareLinksPrivacy: function() {
      // Description: Remove your user ID from the 'share' link

      $('.js-share-link').each((i, el) => {
        el.href = el.href.match(/\/(q|a)\/[0-9]+/)[0];
      }).click(function () {
        // Remove the 'includes your user id' string, do it on click because
        // SE's code seems to re-add the element when the share tip is shown
        $(this).parent().find('.js-subtitle').remove();
      });
    },

    shareLinksMarkdown: function() {
      // Description: For changing the 'share' button link to the format [name](link)

      const title = $('.fs-headline1.fl1').text().replace(/\[(on\shold|duplicate)\]/g, '($1)'); // https://github.com/soscripted/sox/issues/226, https://github.com/soscripted/sox/issues/292
      $('.js-share-link').click(function () {
        const $inputEl = $(this).parent().find('.js-input');

        // TODO: is there a way to do this without a hacky setTimeout?
        // Seems like SE has some JS that populates the input field which overwrites
        // anything we do unless there's a setTimeout
        setTimeout(() => {
          // $(this).attr('href') is relative, so make it absolute
          const href = new URL($(this).attr('href'), window.location.href).href;
          $inputEl.val(`[${title}](${href})`);
          $inputEl.select();
          document.execCommand('copy'); // https://github.com/soscripted/sox/issues/177
        }, 0);
      });
    },

    commentShortcuts: function() {
      // Description: For adding support in comments for Ctrl+K,I,B to add code backticks, italicise, bolden selection

      $('.comments').on('keydown', 'textarea', function (e) {
        const el = $(this).get(0);

        if (e.which == 75 && e.ctrlKey) { // Ctrl+k (code backticks)
          sox.helpers.surroundSelectedText(el, '`', '`');
          e.stopPropagation();
          e.preventDefault();
          return false;
        }

        if (e.which == 73 && e.ctrlKey) { // Ctrl+i (italicize)
          sox.helpers.surroundSelectedText(el, '*', '*');
          e.stopPropagation();
          e.preventDefault();
          return false;
        }

        if (e.which == 66 && e.ctrlKey) { // Ctrl+b (bolden)
          sox.helpers.surroundSelectedText(el, '**', '**');
          e.stopPropagation();
          e.preventDefault();
          return false;
        }
      });
    },

    unspoil: function() {
      // Description: For adding a button to reveal all spoilers in a post

      $('#answers div[id*="answer"], div[id*="question"]').each(function() {
        if ($(this).find('.spoiler').length) {
          $(this).find('.post-menu').append('<span class="lsep">|</span><a id="showSpoiler-' + $(this).attr('id') + '" href="javascript:void(0)">unspoil</span>');
        }
      });
      $('a[id*="showSpoiler"]').click(function() {
        const x = $(this).attr('id').split(/-(.+)?/)[1];
        $('#' + x + ' .spoiler').removeClass('spoiler');
      });
    },

    spoilerTip: function() {
      // Description: For adding some text to spoilers to tell people to hover over it

      function addSpoilerTip() {
        const $spoiler = $('.spoiler');

        $spoiler.prepend('<div id="isSpoiler" style="color:red; font-size:smaller; float:right;">hover to show spoiler<div>');
        $spoiler.hover(function() {
          $(this).find('#isSpoiler').hide(500);
        }, function() {
          $(this).find('#isSpoiler').show(500);
        });
      }
      addSpoilerTip();
      $(document).on('sox-new-review-post-appeared', addSpoilerTip);
    },

    commentReplies: function() {
      // Description: For adding reply links to comments

      if (!sox.user.loggedIn) return;

      function addReplyLinks() {
        $('.comment').each(function () {
          if (!$(this).find('.soxReplyLink').length) { //if the link doesn't already exist
            if (sox.user.name !== $(this).find('.comment-text a.comment-user').text()) { //make sure the link is not added to your own comments
              $(this).find('.comment-text').css('overflow-x', 'hidden');
              $(this).find('.comment-text .comment-body').append('<span class="soxReplyLink" title="reply to this user" style="margin-left: -7px">&crarr;</span>');
            }
          }
        });
      }

      $(document).on('click', 'span.soxReplyLink', function() {
        const parentDiv = $(this).closest('.post-layout');
        const textToAdd = '@' + $(this).parent().find('a.comment-user').text().replace(/\s/g, '').replace(/♦/, ''); //eg. @USERNAME
        if (!parentDiv.find('textarea').length) parentDiv.find('a.js-add-link')[0].click(); //show the textarea, http://stackoverflow.com/a/10559680/

        const $textarea = parentDiv.find('textarea');
        if ($textarea.val().match(/@[^\s]+/)) { //if a ping has already been added
          $textarea.val($textarea.val().replace(/@[^\s]+/, textToAdd)); //replace the @name with the new @name
        } else {
          $textarea.val($textarea.val() + textToAdd + ' '); //add the @name
        }
      });

      addReplyLinks();

      $(document).on('sox-new-comment', addReplyLinks);
      $(document).on('sox-new-review-post-appeared', addReplyLinks);
    },

    parseCrossSiteLinks: function() {
      // Description: For converting cross-site links to their titles

      function expandLinks() {
        const isQuestionLink = /\/(q|questions)\//;
        const FILTER_QUESTION_TITLE = '!)5IW-5QufDkXACxq_MT8aYkZRhm9';

        $('.post-text a:not(.expand-post-sox), .comment-copy a:not(.expand-post-sox)').each(function() {
          const href = this.href.replace(/https?:\/\//, '').replace(/www\./, '');
          if (!href) return;

          const sitename = sox.helpers.getSiteNameFromLink(href);
          const questionID = sox.helpers.getIDFromLink(href);

          // if it is a bare link is to a question on a SE site
          if (questionID && sitename && isQuestionLink.test(href) && this.innerText.replace(/https?:\/\//, '').replace(/www\./, '') === href) {
            sox.helpers.getFromAPI({
              endpoint: 'questions',
              ids: questionID,
              sitename,
              filter: FILTER_QUESTION_TITLE,
              featureId: 'parseCrossSiteLinks',
              cacheDuration: 10, // Cache for 10 minutes
            }, items => {
              this.innerHTML = items[0].title;
            });
          }
        });
      }

      expandLinks();
      $(document).on('sox-new-review-post-appeared', expandLinks);
    },

    confirmNavigateAway: function() {
      // Description: For adding a 'are you ure you want to go away' confirmation on pages where you have started writing something

      if (window.location.href.indexOf('questions/') >= 0) {
        $(window).bind('beforeunload', () => {
          const textarea = document.querySelector('.comment-form textarea');
          if (textarea && textarea.value) {
            return 'Do you really want to navigate away? Anything you have written will be lost!';
          }
          return;
        });
      }
    },

    sortByBountyAmount: function() {
      // Description: For adding some buttons to sort bounty's by size

      // Do nothing unless there is at least one bounty on the page
      if (!document.getElementsByClassName('bounty-indicator').length) return;

      [...document.getElementsByClassName('question-summary')].forEach(summary => {
        const indicator = summary.querySelector('.bounty-indicator');
        const bountyAmount = indicator ? indicator.innerText.replace('+', '') : undefined;
        if (bountyAmount) {
          summary.setAttribute('data-bountyamount', bountyAmount);
          summary.classList.add('hasBounty'); // Add a 'bountyamount' attribute to all the questions
        }
      });

      // Homepage/questions tab
      const wrapper = document.getElementById('question-mini-list') || document.getElementById('questions');

      // Filter buttons:
      $('.subheader').after('<span>sort by bounty amount:&nbsp;&nbsp;&nbsp;</span><span id="largestFirst">largest first&nbsp;&nbsp;</span><span id="smallestFirst">smallest first</span>');

      // Thanks: http://stackoverflow.com/a/14160529/3541881
      $('#largestFirst').css('cursor', 'pointer').on('click', () => { // Largest first
        [...wrapper.querySelectorAll('.question-summary.hasBounty')].sort((a, b) => {
          return +b.getAttribute('data-bountyamount') - +a.getAttribute('data-bountyamount');
        }).prependTo($(wrapper));
      });

      $('#smallestFirst').css('cursor', 'pointer').on('click', () => { // Smallest first
        [...wrapper.querySelectorAll('.question-summary.hasBounty')].sort((a, b) => {
          return +a.getAttribute('data-bountyamount') - +b.getAttribute('data-bountyamount');
        }).prependTo($(wrapper));
      });
    },

    isQuestionHot: function() {
      // Description: For adding some text to questions that are in the hot network questions list

      function getHotDiv(className) {
        return $('<div/>', {
          title: 'SOX: this is a hot network question!',
          'class': `sox-hot ${className || ''}`,
        }).append(sox.sprites.getSvg('hot'));
      }

      function addHotText() {
        if (document.getElementsByClassName('sox-hot').length) return;
        $(document.getElementById('question-header')).prepend(getHotDiv());
      }

      const sitename = sox.site.currentApiParameter;

      if (sox.location.on('/questions')) {
        const postId = window.location.pathname.split('/')[2];
        apiCall(postId, sitename);
      } else if ($('.question-summary').length) {
        $('.question-summary').each(function() {
          // Check if .question-summary has an id attribute - SO Teams posts (at the top of the page, if any) don't!
          if ($(this).attr('id')) {
            var postID = $(this).attr('id').split('-')[2];
            apiCall(postID, sitename, this);
          }
        });
      }

      function apiCall(postID, sitename, el) {
        sox.helpers.getFromAPI({
          endpoint: 'posts',
          childEndpoint: 'revisions',
          sitename: sitename,
          filter: '!5RC-)9_aw3mg*i)3*vUhU3Wfl',
          ids: postID,
          featureId: 'isQuestionHot',
          cacheDuration: 60 * 8, // Cache for 8 hours
        }, results => {
          results.forEach(data => {
            // Questions stay hot for 3 days. Check if they are hot now (Note SE works with secs, not millisecs!)
            if (data.comment === '<b>Became Hot Network Question</b> ' && new Date().getTime() / 1000 - data.creation_date <= 259200) {
              sox.location.on('/questions') ? addHotText() : $(el).find('.summary h3').prepend(getHotDiv('question-list'));
            }
          });
        });
      }
    },

    localTimestamps: function(settings) {
      // Description: Gets local timestamp

      $('span.relativetime:contains(at), span.relativetime-clean:contains(at)').each(updateTS);

      function updateTS() {
        const utcTimestamp = $(this).attr('title');
        const matches = utcTimestamp.match(/^([\d]{4})-([\d]{2})-([\d]{2}) ([\d]{2}):([\d]{2}):([\d]{2}) ?(?:Z|UTC|GMT(?:[+-]00:?00))$/);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (!matches) return;

        const date = new Date(
          Date.UTC(
            parseInt(matches[1], 10),
            parseInt(matches[2], 10) - 1,
            parseInt(matches[3], 10),
            parseInt(matches[4], 10),
            parseInt(matches[5], 10),
            parseInt(matches[6], 10)
          )
        );

        const month = monthNames[date.getMonth()];
        const minute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
        const year = ((date.getFullYear() - 2000) < 10 ? '0' : '') + (date.getFullYear() - 2000);

        let hour = date.getHours();
        let dayTime = '';

        if (settings.twelveHours) {
          dayTime = 'am';

          if (date.getHours() >= 12) {
            dayTime = 'pm';
            hour -= 12;
          }

          if (hour === 0)
            hour += 12;
        }

        const newTimestamp = (new Date()).getFullYear() == date.getFullYear() ? month + ' ' + date.getDate() + ' at ' + hour + ':' + minute + dayTime : month + ' ' + date.getDate() + ' \'' + year + ' at ' + hour + ':' + minute + dayTime;

        $(this).text(newTimestamp);
      }
    },

    autoShowCommentImages: function() {
      // Description: For auto-inlining any links to imgur images in comments

      function showImages() {
        $('.comment .comment-text .comment-copy a').each(function() {
          const href = this.href;
          const parent = this.parentNode;

          if (parent && href && (/i(\.stack)?\.imgur\.com/.test(href))) {
            if (!parent.querySelectorAll('img[src="' + href + '"]').length) {
              //DO NOT USE innerHTML -- it *removes* the old DOM and inserts a new one (https://stackoverflow.com/a/23539150), meaning it won't work for multiple imgur links in the same comment
              //https://github.com/soscripted/sox/issues/360
              $(parent).append('<br><a href="' + href + '"><img class="sox-autoShowCommentImages-image" src="' + href + '" style="max-width:100%"></a>');
            }
          }
        });
      }

      setTimeout(showImages, 2000); //setTimeout needed because FF refuses to load the feature on page load and does it before so the comment isn't detected.

      $(document).on('sox-new-comment', showImages);
      $(document).on('sox-new-review-post-appeared', showImages);
    },

    showCommentScores: function() {
      // Description: For adding a button on your profile comment history pages to show your comment's scores

      const sitename = sox.site.currentApiParameter;
      const WHITESPACES = '&nbsp;&nbsp;&nbsp;';
      const COMMENT_SCORE_FILTER = '!)5IW-5QufDkXACxq_MT8bhYD9b.m';

      function addLabelsAndHandlers() {
        $('.history-table td b a[href*="#comment"]').each(function() {
          if (!$(this).parent().find('.showCommentScore').length) {
            const id = +this.href.match(/comment(\d+)_/)[1];

            $(this).after('<span class="showCommentScore" id="' + id + '">' + WHITESPACES + 'show comment score</span>');
          }
        });

        $('.showCommentScore').css('cursor', 'pointer').on('click', function() {
          sox.helpers.getFromAPI({
            endpoint: 'comments',
            ids: this.id,
            sitename,
            filter: COMMENT_SCORE_FILTER,
            useCache: false, // Single ID, so no point
          }, items => {
            this.innerHTML = WHITESPACES + items[0].score;
          });
        });
      }

      addLabelsAndHandlers();
      const target = document.getElementById('mainbar-full');
      if (target) sox.helpers.observe(target, '.history-table', addLabelsAndHandlers);
    },

    answerTagsSearch: function() {
      // Description: For adding tags to answers in search

      function getQuestionIDFromAnswerDIV(answerDIV) {
        return sox.helpers.getIDFromAnchor(answerDIV.querySelector('.result-link a'));
      }

      function addClassToInsertedTag(tagLink) {
        if (/status-/.test(tagLink.innerText)) {
          tagLink.classList.add('moderator-tag');
        } else if (/\b(discussion|feature-request|support|bug)\b/.test(tagLink.innerText)) {
          tagLink.classList.add('required-tag');
        }
      }

      const tagsForQuestionIDs = {};
      const QUESTION_TAGS_FILTER = '!)8aDT8Opwq-vdo8';
      const questionIDs = [];

      const answers = [...document.getElementsByClassName('question-summary')].filter(q => /answer-id/.test(q.id));

      // Get corresponding question's ID for each answer
      answers.forEach(answer => {
        const questionID = getQuestionIDFromAnswerDIV(answer);
        // Cache value for later reference
        answer.dataset.questionid = questionID;
        questionIDs.push(questionID);
      });

      sox.helpers.getFromAPI({
        endpoint: 'questions',
        ids: questionIDs,
        sitename: sox.site.currentApiParameter,
        filter: QUESTION_TAGS_FILTER,
        limit: 60,
        sort: 'creation',
        featureId: 'answerTagsSearch',
        cacheDuration: 10, // Cache for 10 minutes
      }, items => {
        const itemsLength = items.length;

        for (let i = 0; i < itemsLength; i++) {
          const item = items[i];
          tagsForQuestionIDs[item.question_id] = item.tags;
        }

        answers.forEach(answer => {
          const id = +answer.dataset.questionid;
          const tagsForThisQuestion = tagsForQuestionIDs[id];

          for (let x = 0; x < tagsForThisQuestion.length; x++) {
            const currTag = tagsForThisQuestion[x];
            const $insertedTag = $(answer.querySelector('.summary .tags')).append('<a href="/questions/tagged/' + currTag + '" class="post-tag">' + currTag + '</a>');
            addClassToInsertedTag($insertedTag);
          }
        });
      });
    },

    stickyVoteButtons: function() {
      // Description: For making the vote buttons stick to the screen as you scroll through a post
      // https://github.com/shu8/SE_OptionalFeatures/pull/14:
      // https://github.com/shu8/Stack-Overflow-Optional-Features/issues/28: Thanks @SnoringFrog for fixing this!

      $('.votecell > .js-voting-container').css({ //.votecell is necessary; e.g., the number of votes of questions on the Questions list for a site uses the .vote class too
        'position': '-webkit-sticky',
        // eslint-disable-next-line no-dupe-keys
        'position': 'sticky',
        'top': parseInt($('.container').css('margin-top'), 10) + parseInt($('body').css('padding-top'), 10), //Seems like most sites use margin-top on the container, but Meta and SO use padding on the body
      });
    },

    titleEditDiff: function() {
      // Description: For showing the new version of a title in a diff separately rather than loads of crossing outs in red and additions in green
      // Example URL to test on: https://meta.stackexchange.com/review/suggested-edits/65403

      function getSprite(state) {
        return sox.sprites.getSvg(`toggle_${state}`, 'toggle SOX better title diff').addClass('sox-better-title-toggle');
      }

      function betterTitle() {
        sox.debug('titleEditDiff: running betterTitle');
        const $questionHyperlinkOriginal = $('.summary h2 .question-hyperlink');
        const $questionHyperlink = $questionHyperlinkOriginal.clone();
        const $questionHyperlinkTwo = $questionHyperlinkOriginal.clone();

        const link = $questionHyperlinkOriginal.attr('href');
        const added = ($questionHyperlinkTwo.find('.diff-delete').remove().end().text());
        const removed = ($questionHyperlink.find('.diff-add').remove().end().text());

        if ($questionHyperlinkOriginal.find('.diff-delete, .diff-add').length && !($('.sox-better-title').length)) {
          if (!$('.sox-better-title-toggle').length) {
            $('.summary h2 .question-hyperlink').before(getSprite('off'));
          }
          $questionHyperlinkOriginal.addClass('sox-original-title-diff').hide();
          $questionHyperlinkOriginal.after('<a href="' + link + '" class="question-hyperlink sox-better-title"><span class="diff-delete">' + removed + '</span><span class="diff-add">' + added + '</span></a>');
        }
      }

      // https://github.com/soscripted/sox/issues/166#issuecomment-269925059
      $(document).on('click', '.sox-better-title-toggle', function() {
        const $soxOriginalTitleDiff = $('.sox-original-title-diff');
        if ($soxOriginalTitleDiff.is(':visible')) {
          $(this).replaceWith(getSprite('on'));
          $soxOriginalTitleDiff.hide();
          $('.sox-better-title').show();
        } else {
          $(this).replaceWith(getSprite('off'));
          $soxOriginalTitleDiff.show();
          $('.sox-better-title').hide();
        }
      });

      betterTitle();
      const target = document.querySelector('.review-content');
      sox.helpers.observe(target, '.review-status, .review-content, .suggested-edit, .post-id', betterTitle);
    },

    metaChatBlogStackExchangeButton: function() {
      // Description: For adding buttons next to sites under the StackExchange button that lead to that site's meta and chat

      $(document).on('mouseenter', '#your-communities-section > ul > li > a', function() {
        const href = this.href.replace(/https?:\/\//, '');
        let link;
        let chatLink = 'https://chat.stackexchange.com?tab=site&host=' + href.replace(/\/.*/, '');

        if (href === 'meta.stackexchange.com/') { //Meta SE's chat link is a bit different
          chatLink = 'https://chat.meta.stackexchange.com';
        } else if (href.indexOf('meta') > -1) { //For the usual meta sites
          link = 'https://' + href.split('meta.').shift() + href.split('meta.').pop();
          chatLink = 'https://chat.stackexchange.com?tab=site&host=' + href.split('meta.').shift() + href.split('meta.').pop().split('/').shift(); //We don't need "meta." in the chat links
        } else if (href.indexOf('.stackexchange.com') > -1 || href.indexOf('.stackoverflow.com') > -1) { //For the majority of SE sites, and other languages of SO
          link = 'https://' + href.split('.').shift() + '.meta' + href.split(href.split('.').shift()).pop();
        } else if (href.indexOf('stackapps') == -1) { //For sites that have unique URLs, e.g. serverfault.com (except StackApps, which has no meta)
          link = 'https://meta.' + href;
        }

        if (href.indexOf('stackoverflow.com') > -1 && !href.match(/(pt|ru|es|ja|.meta)/i)) { //English Stack Overflow has a unique chat link
          chatLink = 'https://chat.stackoverflow.com';
        }

        //All sites have either a chat link or meta link
        $(this).find('.rep-score').stop(true).delay(135).fadeOut(20);
        $(this).append('<div class="related-links" style="float: right; display: none;">' +
                    (link ?
                      (href.indexOf('meta') > -1 ? '<a href="' + link + '">main</a>' : '<a href="' + link + '">meta</a>') :
                      '') +
                    (chatLink ? '<a href="' + chatLink + '">chat</a>' : '') +
                    '</div>');
        $(this).find('.related-links').delay(135).css('opacity', 0).animate({
          opacity: 1,
          width: 'toggle',
        }, 200);

      }).on('mouseleave', '#your-communities-section > ul > li > a', function() {
        $(this).find('.rep-score').stop(true).fadeIn(110);
        $(this).find('.related-links').remove();
      });
    },

    metaNewQuestionAlert: function() {
      // Description: For adding a fake mod diamond that notifies you if there has been a new post posted on the current site's meta

      //Do not run on meta, chat, or sites without a meta
      if ((sox.site.type != 'main' && sox.site.type != 'beta') || !$('.related-site').length) return;

      const NEWQUESTIONS = 'metaNewQuestionAlert-lastQuestions';
      const favicon = sox.site.icon;
      const sitename = sox.site.currentApiParameter;

      // If it is a special site, add 'meta' before it, if not, replace the 'stackexchange' from the URL with 'meta'.
      if (sitename.match(/stackoverflow|superuser|serverfault|askubuntu|stackapps|mathoverflow/)) {
        var metaName = 'meta.' + sitename;
      } else {
        metaName = sitename.replace('stackexchange','meta');
      }

      const FILTER_QUESTION_TITLE_LINK = '!BHMIbze0EQ*ved8LyoO6rNk25qGESy';
      const $dialog = $('<div/>', {
        id: 'metaNewQuestionAlertDialog',
        'class': 'topbar-dialog dno new-topbar',
      });
      const $header = $('<div/>', {
        'class': 'header',
      }).append($('<h3/>').append($('<a/>', {
        text: 'new meta posts',
        href: `//meta.${sox.site.url}`,
        style: 'color: #0077cc',
      })));
      const $content = $('<div/>', {
        'class': 'modal-content',
      });
      const $questions = $('<ul/>', {
        id: 'metaNewQuestionAlertDialogList',
        'class': 'js-items items',
      });
      const $diamond = $('<a/>', {
        id: 'metaNewQuestionAlertButton',
        href: '#',
        'class': '-link',
        title: 'Moderator inbox (recent meta questions)',
        click: function(e) {
          e.preventDefault();
          $diamond.toggleClass('topbar-icon-on');
          $dialog.toggle();
        },
      }).append($('<svg/>', { //Updated with the new mod diamond icon
        'aria-hidden': true,
        class: 'svg-icon',
        viewBox: '0 0 18 18',
        width: 18,
        height: 18,
      }).append($('<path/>', {
        d: 'M8.4.78c.33-.43.87-.43 1.3 0l5.8 7.44c.33.43.33 1.13 0 1.56l-5.8 7.44c-.33.43-.87.43-1.2 0L2.6 9.78a1.34 1.34 0 0 1 0-0.156L8.4.78z',
      })));
      let lastQuestions = {};

      $diamond.html($diamond.html()); //Reloads the diamond icon, which is necessary when adding an SVG using jQuery.

      $dialog.append($header).append($content.append($questions));
      $('.-secondary > .-item:not(:has(.my-profile)):eq(1)').before($('<li/>').addClass('-item').append($diamond));

      $dialog.css({
        'top': $('.top-bar').height(),
        'right': $('.-container').outerWidth() - $diamond.parent().position().left - $diamond.outerWidth(),
      });

      if ($('#metaNewQuestionAlertButton').length) $('.js-topbar-dialog-corral').append($dialog);

      $(document).mouseup(e => {
        if (!$dialog.is(e.target) &&
                    $dialog.has(e.target).length === 0 &&
                    !$(e.target).is('#metaNewQuestionAlertButton, svg, path')) {
          $dialog.hide();
          $diamond.removeClass('topbar-icon-on');
        }
      });

      if (GM_getValue(NEWQUESTIONS, -1) == -1) {
        GM_setValue(NEWQUESTIONS, JSON.stringify(lastQuestions));
      } else {
        lastQuestions = JSON.parse(GM_getValue(NEWQUESTIONS));
      }

      sox.helpers.getFromAPI({
        endpoint: 'questions',
        sitename: metaName,
        filter: FILTER_QUESTION_TITLE_LINK,
        sort: 'activity',
        limit: 5,
        featureId: 'metaNewQuestionAlert',
      }, items => {
        const latestQuestion = items[0].title;

        // Make diamond blue if there's a new question
        if (latestQuestion != lastQuestions[metaName]) {
          $diamond.css('color', '#0077cc');
        }

        let seen = false;
        // Regardless of if there's a new question, show the latest 5
        for (let i = 0, len = items.length; i < len; i++) {
          const title = items[i].title;
          const link = items[i].link;
          // If one's been seen, the older questions must also have been seen
          if (title === lastQuestions[metaName]) seen = true;
          addQuestion(title, link, seen);
        }

        lastQuestions[metaName] = latestQuestion;

        $diamond.click(() => {
          GM_setValue(NEWQUESTIONS, JSON.stringify(lastQuestions));
        });
      });

      function addQuestion(title, link, seen) {
        const $li = $('<li/>');
        const $link = $('<a/>', {
          href: link,
          style: 'display: flex',
        });
        const $icon = $('<div/>', {
          'class': 'site-icon favicon ' + favicon,
          style: 'margin-right: 3px',
        });
        const $message = $('<div/>', {
          'class': 'message-text',
        }).append($('<h4/>', {
          html: title,
          style: `font-weight: ${seen ? 'normal' : 'bold'}`,
        }));

        $link.append($icon).append($message).appendTo($li);
        $questions.append($li);
      }
    },

    betterCSS: function() {
      // Description: For adding the better CSS for the voting buttons and favourite button

      function addCSS() {
        $('.js-vote-up-btn, .js-vote-down-btn, .js-favorite-btn').addClass('sox-better-css');
        $('head').append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/shu8/SE-Answers_scripts@master/coolMaterialDesignCss.css" type="text/css" />');
        $('#hmenus').css('-webkit-transform', 'translateZ(0)');
      }
      addCSS();
      $(document).on('sox-new-review-post-appeared', addCSS);
    },

    standOutDupeCloseMigrated: function() {
      // Description: For adding cooler signs that a questions has been closed/migrated/put on hod/is a dupe

      // For use in dataset, used for hideCertainQuestions feature compatability
      const QUESTION_STATE_KEY = 'soxQuestionState';
      const FILTER_QUESTION_CLOSURE_NOTICE = '!)Ei)3K*irDvFA)l92Lld3zD9Mu9KMQ59-bgpVw7D9ngv5zEt3';
      const NOTICE_REGEX = /\[(duplicate|closed|migrated|on hold)\]$/;

      function addLabels() {
        const questions = [];
        const questionSummaries = [...document.getElementsByClassName('question-summary')];
        questionSummaries.forEach(question => {
          // Don't run if tag has already been added to question
          if (question.dataset[QUESTION_STATE_KEY]) return;

          const anchor = question.querySelector('.summary h3 a');
          const id = sox.helpers.getIDFromAnchor(anchor);
          const text = anchor.innerText.trim();

          const noticeMatch = text.match(NOTICE_REGEX);
          const noticeName = noticeMatch && noticeMatch[1];

          // Don't run if the question is still open
          if (!noticeName) return;
          questions.push({ element: question, noticeName, text, anchor, id });
        });
        sox.debug('standOutDupeCloseMigrated questions to request API for', questions);

        // https://github.com/soscripted/sox/issues/181
        $('.question-summary .answer-hyperlink, .question-summary .question-hyperlink, .question-summary .result-link a').css('display', 'inline');
        $('.summary h3').css('line-height', '1.2em'); // Fixes line height on "Questions" page

        sox.helpers.getFromAPI({
          endpoint: 'questions',
          ids: questions.map(q => q.id),
          sitename: sox.site.currentApiParameter,
          filter: FILTER_QUESTION_CLOSURE_NOTICE,
          featureId: 'standOutDupeCloseMigrated',
          cacheDuration: 10, // Cache for 10 minutes
        }, items => {
          questions.forEach(question => {
            sox.debug('standOutDupeCloseMigrated adding details for question', question);
            question.anchor.innerText = question.text.replace(NOTICE_REGEX, '');
            question.element.dataset[QUESTION_STATE_KEY] = question.noticeName;

            const questionDetails = items.find(d => d.question_id === question.id);
            if (!questionDetails) return;

            switch (question.noticeName) {
            case 'duplicate': {
              const questionId = questionDetails.closed_details.original_questions[0].question_id;

              // Styling for https://github.com/soscripted/sox/issues/181
              // NOTE: the `data-searchsession` attribute is to workaround a weird line of code in SE *search* pages,
              // which changes the `href` of anchors in in `.result-link` containers to `data-searchsession`
              // See https://github.com/soscripted/sox/pull/348#issuecomment-404245056
              $(question.anchor).after('&nbsp;<a data-searchsession=\'/questions/' + questionId + '\' style=\'display: inline\' href=\'https://' + sox.site.url + '/q/' + questionId + '\'><span class=\'standOutDupeCloseMigrated-duplicate\' title=\'click to visit duplicate\'>&nbsp;duplicate&nbsp;</span></a>');
              break;
            }
            case 'closed':
            case 'on hold': {
              const details = questionDetails.closed_details;
              const users = details.by_users.reduce((str, user) => str + ', ' + user.display_name, '').substr(2);
              const closureDate = new Date(questionDetails.closed_date * 1000);
              const timestamp = closureDate.toLocaleString();
              const closeNotice = (details.on_hold ? 'put on hold' : 'closed') + ' as ';
              const closeText = details.on_hold ? 'on hold' : 'closed';
              const cssClass = details.on_hold ? 'onhold' : 'closed';

              $(question.anchor).after('&nbsp;<span class="standOutDupeCloseMigrated-' + cssClass + '" title="' + closeNotice + details.reason + ' by ' + users + ' on ' + timestamp + '">&nbsp;' + closeText + '&nbsp;</span>');
              break;
            }
            case 'migrated': {
              let textToAdd;
              if (questionDetails.migrated_to) {
                const migratedToSite = questionDetails.migrated_to.other_site.name;
                textToAdd = 'migrated to ' + migratedToSite;
              } else if (questionDetails.migrated_from) {
                const migratedFromSite = questionDetails.migrated_from.other_site.name;
                textToAdd = 'migrated from ' + migratedFromSite;
              } else {
                sox.warn('standOutDupeCloseMigrated: unknown migration state');
              }

              $(question.anchor).after('&nbsp;<span class=\'standOutDupeCloseMigrated-migrated\' title=\'' + textToAdd + '\'>&nbsp;migrated&nbsp;</span>');
              break;
            }
            }
          });
        });
      }

      addLabels();

      const targetMainPage = document.getElementById('question-mini-list');
      const targetQuestionsPage = document.getElementById('questions');
      sox.helpers.observe([targetMainPage, targetQuestionsPage], '#questions, #question-mini-list', addLabels);
    },

    editReasonTooltip: function() {
      // Description: For showing the latest revision's comment as a tooltip on 'edit [date] at [time]'

      function addTooltips() {
        const ids = [];
        const $posts = [];
        $('.question, .answer').each(function() {
          if ($(this).find('.post-signature').length > 1) {
            $posts.push($(this));
            const id = $(this).attr('data-questionid') || $(this).attr('data-answerid');
            ids.push(id);
          }
        });
        if (!ids.length) return;

        sox.helpers.getFromAPI({
          endpoint: 'posts',
          childEndpoint: 'revisions',
          sitename: sox.site.url,
          filter: '!SWJaL02RNFkXc_we4i',
          ids,
          featureId: 'editReasonTooltip',
          cacheDuration: 5, // Cache for 5 minutes
        }, revisions => {
          $posts.forEach($post => {
            const id = $post.attr('data-questionid') || $post.attr('data-answerid');
            const revision = revisions.find(r => r.revision_type === 'single_user' && r.post_id === +id);
            if (revision) {
              const span = sox.helpers.newElement('span', {
                'class': 'sox-revision-comment',
                'title': revision.comment,
              });
              sox.debug(`editReasonTooltip, adding text to tooltip for post ${id}: '${revision.comment}'`);
              $post.find('.post-signature:eq(0)').find('.user-action-time a').wrapInner(span);
            }
          });
        });
      }

      addTooltips();
      $(document).on('sox-new-review-post-appeared', addTooltips);
    },

    addSBSBtn: function(settings) {
      // Description: For adding a button to the editor toolbar to toggle side-by-side editing
      // Thanks szego (@https://github.com/szego) for completely rewriting this! https://github.com/shu8/SE-Answers_scripts/pull/2
      // This is a heavily modified version by szego <https://github.com/szego/SE-Answers_scripts/blob/master/side-by-side-editing.user.js>:

      function startSBS(toAppend) {
        //variables to reduce DOM searches
        const wmdinput = $('#wmd-input' + toAppend);
        const wmdpreview = $('#wmd-preview' + toAppend);
        const posteditor = $('#post-editor' + toAppend);
        const draftsaved = $('#draft-saved' + toAppend);
        const draftdiscarded = $('#draft-discarded' + toAppend);
        const editcommentdiv = $('#edit-comment' + toAppend).parent().parent(); //edit comment main parent div has no class or ID

        $('#wmd-button-bar' + toAppend).toggleClass('sbs-on');

        draftsaved.toggleClass('sbs-on');
        draftdiscarded.toggleClass('sbs-on');
        posteditor.toggleClass('sbs-on');
        posteditor.find('.wmd-container').toggleClass('sbs-on');
        posteditor.find('.wmd-container').parent().toggleClass('sbs-on-left-side');
        wmdinput.parent().toggleClass('sbs-on'); //wmdinput.parent() has class wmd-container
        wmdpreview.toggleClass('sbs-on');

        if (sox.location.on('/edit-tag-wiki/')) $('#post-form').toggleClass('sbs-on'); //https://github.com/soscripted/sox/issues/247
        if (sox.location.on('/edit')) $('.post-editor').next().css('clear', 'both');

        if (toAppend.length > 0) { //options specific to making edits on existing questions/answers
          posteditor.find('.hide-preview').toggleClass('sbs-on'); //needed to stop the tag box from being 'on top of' the textarea blocking text from being entering
          editcommentdiv.toggleClass('sbs-on edit-comment');
        } else if (window.location.pathname.indexOf('questions/ask') > -1) { //extra CSS for 'ask' page
          wmdpreview.toggleClass('sbs-newq');
          draftsaved.toggleClass('sbs-newq');
          draftdiscarded.toggleClass('sbs-newq');

          $('#tag-editor').toggleClass('sbs-on edit-comment'); //needed to stop the tag box from being 'on top of' the textarea blocking text from being entering
          $('#question-only-section').children('.form-item').toggleClass('sbs-on sbs-newq');

          //swap the order of things to prevent draft saved/discarded messages from
          // moving the preview pane around
          if (wmdpreview.hasClass('sbs-on')) {
            draftsaved.before(wmdpreview);
          } else {
            draftdiscarded.after(wmdpreview);
          }
        }
        if (wmdpreview.hasClass('sbs-on')) { //sbs was toggled on
          $('#sidebar').addClass('sbs-on');
          $('#content').addClass('sbs-on');
          $('.tag-editor').parent().parent().removeAttr('style'); //remove style from both div style='position:relative'
          $('.tag-editor').parent().parent().parent().removeAttr('style'); //remove style from both div style='position:relative'

          if (toAppend.length > 0) { //current sbs toggle is for an edit
            $('.votecell').addClass('sbs-on');
          }

          //stretch the text input window to match the preview length
          // - "215" came from trial and error
          // - Can this be done using toggleClass?
          const previewHeight = wmdpreview.height();
          if (previewHeight > 215) { //default input box is 200px tall, only scale if necessary
            wmdinput.height(previewHeight - 15);
          }
        } else { //sbs was toggled off
          //check if sbs is off for all existing questions and answers
          if (!$('.question').find('.wmd-preview.sbs-on').length && !$('.answer').find('.wmd-preview.sbs-on').length) {
            $('.votecell').removeClass('sbs-on');

            if (!($('#wmd-preview').hasClass('sbs-on'))) { //sbs is off for everything
              $('#sidebar').removeClass('sbs-on');
              $('#content').removeClass('sbs-on');
            }
          }

          //return input text window to original size
          // - Can this be done using toggleClass?
          wmdinput.height(200);
        }
      }

      function SBS(jNode) {
        jNode = $(jNode);
        if (jNode.is('textarea')) jNode = jNode.closest('.wmd-container').find('[id^="wmd-redo-button"]');
        if (jNode.is('.inline-editor, .wmd-button-bar, .review-content')) jNode = jNode.find('[id^="wmd-redo-button"]');
        if (!jNode.length) return;

        const itemid = jNode[0].id.replace(/^\D+/g, '');
        const toAppend = (itemid.length > 0 ? '-' + itemid : ''); //helps select tags specific to the question/answer being
        // edited (or new question/answer being written)
        setTimeout(() => {
          if (jNode.closest('.post-editor').find('.sox-sbs-toggle').length) return; //don't add again if already exists

          const sbsBtn = '<li class="wmd-button sox-sbs-toggle" title="side-by-side-editing" style="left: 500px;width: 170px;"> \
<div id="wmd-sbs-button' + toAppend + '" style="background-image: none;">SBS</div></li>';
          jNode.after(sbsBtn);

          //add click listener to sbsBtn
          jNode.next().on('click', () => {
            startSBS(toAppend);
          });

          if (settings.sbsByDefault) {
            startSBS(toAppend);
          }

          //add click listeners for "Save Edits" and "cancel" buttons
          // - also gets added to the "Post New Question" and "Post New Answer" button as an innocuous (I think) side effect
          $('#post-editor' + toAppend).siblings('.form-submit').children().on('click', function() {
            if ($(this).parent().siblings('.sbs-on').length) { //sbs was on, so turn it off
              startSBS(toAppend);
            }
          });
        }, 1000);
      }

      if (window.location.pathname.indexOf('questions/ask') < 0) { //not posting a new question
        //get question and answer IDs for keeping track of the event listeners
        //answers have anchor tags before them of the form <a name="#">, where # is the answer ID
        const anchorList = $('#answers > a');
        const numAnchors = anchorList.length;
        const itemIDs = [];

        for (let i = 1; i <= numAnchors - 2; i++) { //the first and last anchors aren't answers
          itemIDs.push(anchorList[i].name);
        }
        itemIDs.push($('.question').data('questionid'));

        //event listeners for adding the sbs toggle buttons for editing existing questions or answers
        const targetQuestionCells = document.getElementsByClassName('postcell');
        const targetAnswerCells = document.getElementsByClassName('answercell');
        for (let i = 0; i <= numAnchors - 2; i++) {
          sox.helpers.observe([...targetAnswerCells, ...targetQuestionCells], '#wmd-redo-button-' + itemIDs[i], SBS);
        }
      }

      //event listener for adding the sbs toggle button for posting new questions or answers
      $(document).on('sox-edit-window', (e, target) => {
        if ($(target).is('.wmd-button-bar')) return; //don't want to catch extra mutation event for button bar
        SBS(target);
      });

    },

    addAuthorNameToInboxNotifications: function(settings) {
      // Description: To add the author's name to inbox notifications
      function setAuthorName(node) {
        //for https://github.com/soscripted/sox/issues/347
        const prependToMessage = Object.keys(settings).length !== 0 ? settings.addNameBeforeMessageOrAtTop : false;
        const link = node.firstElementChild.href;
        let id;
        const matches = {
          comments: ['posts/comments', '!SWJnaN4ZecdHc*iADu'],
          answers: ['com/a/', '!1zSn*g7xPUIQr.yCmkAiu'],
          'suggested-edits': ['/suggested-edits/', '!Sh2oL2BQQ2W(roUyy9'],
        };

        let filter;

        if (!link) return;

        const sitename = sox.helpers.getSiteNameFromLink(link);

        let apiCallType = null;

        for (const key in matches) {
          if (matches.hasOwnProperty(key) && link.indexOf(matches[key][0]) > -1) {
            apiCallType = key;
            id = sox.helpers.getIDFromLink(link);
            filter = matches[key][1];
          }
        }

        if (!apiCallType) {
          sox.loginfo('SOX does not currently support get author information for type: ' + apiCallType);
          return;
        }

        sox.debug('addAuthorNameToInboxNotifications: ', node, id);

        sox.helpers.getFromAPI({
          endpoint: apiCallType,
          ids: id,
          sitename,
          filter,
          useCache: false, // Single ID so no point
        }, items => {
          sox.debug('addAuthorNameToInboxNotifications JSON returned from API', items);

          // https://github.com/soscripted/sox/issues/233
          const temporaryDIV = $('<div>');
          if (!items.length) return;

          const author = (link.indexOf('/suggested-edits/') > -1 ? items[0].proposing_user.display_name : items[0].owner.display_name);
          const $author = $('<span/>', {
            class: 'sox-notification-author',
            text: (prependToMessage ? '' : ' by ') + temporaryDIV.html(author).text() + (prependToMessage ? ': ' : ''), //https://github.com/soscripted/sox/issues/347
          });

          const $header = $(node.querySelector('.item-header'));
          const $type = $header.find('.item-type').clone();
          const $creation = $header.find('.item-creation').clone();

          if (prependToMessage) {
            $(node).find('.item-summary').prepend($author);
          } else {
            //fix conflict with soup fix mse207526 - https://github.com/vyznev/soup/blob/master/SOUP.user.js#L489
            $header.empty().append($type).append($author).append($creation);
          }
        });
      }

      const inboxClass = 'inbox-dialog';
      const PROCESSED_CLASS = 'sox-authorNameAdded';
      const MAX_PROCESSED_AT_ONCE = 20;

      const target = document.querySelector('.js-secondary-topbar-links');
      if (target) {
        sox.helpers.observe(target, '.inbox-item', () => {
          const inboxDialog = document.getElementsByClassName(inboxClass)[0];
          let eligibleElements = [...inboxDialog.querySelectorAll('.inbox-item')];
          eligibleElements = eligibleElements.slice(0, MAX_PROCESSED_AT_ONCE);

          const unprocessedElements = eligibleElements.filter(e => !e.classList.contains(PROCESSED_CLASS));
          for (let x = 0; x < unprocessedElements.length; x++) {
            const element = unprocessedElements[x];
            setAuthorName(element);
            element.classList.add(PROCESSED_CLASS);
          }
        });
      }
    },

    flagOutcomeTime: function() {
      // Description: For adding the flag outcome time to the flag page
      //https://github.com/shu8/Stack-Overflow-Optional-Features/pull/32

      $('.flag-outcome').each(function() {
        $(this).append(' – ' + $(this).attr('title'));
      });
    },

    scrollToTop: function() {
      // Description: For adding a button at the bottom right part of the screen to scroll back to the top
      //https://github.com/shu8/Stack-Overflow-Optional-Features/pull/34

      $('<div/>', {
        id: 'sox-scrollToTop',
        click: function(e) {
          e.preventDefault();
          $('html, body').animate({
            scrollTop: 0,
          }, 50);
          return false;
        },
      }).append(sox.sprites.getSvg('top', 'Scroll to top (SOX)')).appendTo('body');

      if ($(window).scrollTop() < 200) $('#sox-scrollToTop').hide();

      $(window).scroll(function() {
        if ($(this).scrollTop() > 200) {
          $('#sox-scrollToTop').fadeIn();
        } else {
          $('#sox-scrollToTop').fadeOut();
        }
      });
    },

    flagPercentages: function() {
      // Description: For adding percentages to the flag summary on the flag page
      //By @enki; https://github.com/shu8/Stack-Overflow-Optional-Features/pull/38, http://meta.stackoverflow.com/q/310881/3541881, http://stackapps.com/q/6773/26088

      const group = {
        POST: 1,
        SPAM: 2,
        OFFENSIVE: 3,
        COMMENT: 4,
      };
      const type = {
        WAITING: 'waiting',
        HELPFUL: 'helpful',
        DECLINED: 'declined',
        DISPUTED: 'disputed',
        AGEDAWAY: 'aged away',
        RETRACTED: 'retracted',
      };

      let count;
      let percentage;

      function addPercentage(group, type, percentage) {
        const $span = $('<span/>', {
          text: `(${percentage}%)`,
          style: 'margin-left:5px; color: #999; font-size: 12px;',
        });
        $(`li > a[href*="group=${group}"]:contains("${type}")`).find('div:first').after($span);
      }

      function calculatePercentage(count, total) {
        const percent = (count / total) * 100;
        return +percent.toFixed(2);
      }

      function getFlagCount(group, type) {
        let flagCount = 0;
        const $groupHeader = $(`li > a[href="?group=${group}"]`);
        flagCount += Number($groupHeader.next().find(`li:contains("${type}")`)
          .find('div:last')
          .text()
          .replace(/[\D]/g, '')); // Strip any non-digit characters (e.g. commas)
        return flagCount;
      }

      // Add percentages
      for (const groupKey in group) {
        const item = group[groupKey];

        // Strip any non-digit characters (e.g. commas)
        const total = +$(`li > a[href="?group=${item}"]`).find('div:last').text().replace(/[\D]/g, '');

        for (const typeKey in type) {
          const typeItem = type[typeKey];
          count = getFlagCount(item, typeItem);
          percentage = calculatePercentage(count, total);
          addPercentage(item, typeItem, percentage);
        }
      }
    },

    linkedPostsInline: function() {
      // Description: Displays linked posts inline with an arrow

      function getIdFromUrl(url) {
        let idMatch;
        if (url.match('/a|q/')) {
          // eg. http://meta.stackexchange.com/a/26764/260841 or http://meta.stackexchange.com/q/26756/260841
          idMatch = url.match(/\/(?:a|q)\/(\d+)/);
        } else if (url.includes('/questions/')) {
          // If URL includes '#', probably an answer, eg. http://meta.stackexchange.com/questions/26756/how-do-i-use-a-small-font-size-in-questions-and-answers/26764#26764
          // Oherwise, it's a question
          idMatch = url.match(/#?(\d+)/);
        }
        if (idMatch) return idMatch[1];
      }

      function addButton() {
        $('.post-text a, .comments .comment-copy a').each(function() {
          const url = $(this).attr('href');

          // https://github.com/soscripted/sox/issues/205 -- check link's location is to same site, eg if on SU, don't allow on M.SU
          // http://stackoverflow.com/a/4815665/3541881
          if (url &&
              $('<a>').prop('href', url).prop('hostname') == location.hostname &&
              !url.includes('#comment') &&
              !url.includes('/edit/') && // https://github.com/soscripted/sox/issues/281
              !url.includes('/tagged/') &&
              getIdFromUrl(url) && // getIdFromUrl(url) makes sure it won't fail later on
              !$(this).prev().is('.expand-post-sox')) {
            $(this).before('<a class="expander-arrow-small-hide expand-post-sox" style="border-bottom:0"></a>');
          }
        });
      }

      addButton();
      $(document).on('sox-new-review-post-appeared', addButton);

      $(document).on('click', 'a.expand-post-sox', function() {
        if ($(this).hasClass('expander-arrow-small-show')) {
          $(this).removeClass('expander-arrow-small-show');
          $(this).addClass('expander-arrow-small-hide');
          $('.linkedPostsInline-loaded-body-sox').remove();
        } else if ($(this).hasClass('expander-arrow-small-hide')) {
          $(this).removeClass('expander-arrow-small-hide');
          $(this).addClass('expander-arrow-small-show');
          const $that = $(this);
          const id = getIdFromUrl($(this).next().attr('href'));
          $.get(location.protocol + '//' + sox.site.url + '/posts/' + id + '/body', d => {
            const div = '<div class="linkedPostsInline-loaded-body-sox">' + d + '</div>';
            $that.next().after(div);
          });
        }
      });
    },

    hideHireMe: function() {
      // Description: Hides the Looking for a Job module from the sidebar

      $('#hireme').remove();
    },

    hideCommunityBulletin: function() {
      // Description: Hides the Community Bulletin module from the sidebar

      $('#sidebar .community-bulletin').remove();
    },

    hideJustHotMetaPosts: function() {
      // Description: Hide just the 'Hot Meta Posts' sections in the Community Bulletin

      const $hotMetaPostsHeader = $('#sidebar .community-bulletin .related').find('div:contains("Hot Meta Posts")');
      if ($hotMetaPostsHeader.length) {
        $hotMetaPostsHeader.nextAll().remove();
        $hotMetaPostsHeader.remove();
      }
    },

    hideChatSidebar: function() {
      // Description: Hides the Chat module from the sidebar

      $('#sidebar #chat-feature').remove();
    },

    hideLoveThisSite: function() {
      // Description: Hides the "Love This Site?" (weekly newsletter) module from the sidebar

      $('#sidebar #newsletter-ad').remove();
    },

    chatEasyAccess: function() {
      // Description: Adds options to give a user read/write/no access in chat from their user popup dialog

      const target = document.getElementById('chat-body');
      sox.helpers.observe(target, '.user-popup', node => {
        const $node = $(node).parent();
        const id = $node.find('a')[0].href.split('/')[4];

        //NOTE: $(node) !== $node
        if ($(node).find('.chatEasyAccess').length) return;
        if ($('.chatEasyAccess').length) $('.chatEasyAccess').remove();

        //NOTE: $(node) !== $node
        $(node).append('<div class="chatEasyAccess">give <b id="read-only">read</b> / <b id="read-write">write</b> / <b id="remove">no</b> access</div>');
        $(document).on('click', '.chatEasyAccess b', function() {
          const $that = $(this);
          $.ajax({
            url: 'https://chat.stackexchange.com/rooms/setuseraccess/' + location.href.split('/')[4],
            type: 'post',
            data: {
              'fkey': window.fkey().fkey,
              'userAccess': $that.attr('id'),
              'aclUserId': id,
            },
            success: function(d) {
              if (d === '') {
                alert('Successfully changed user access');
              } else {
                alert(d);
              }
            },
          });
        });
      });
    },

    topAnswers: function() {
      // Description: Adds a box above answers to show the most highly-scoring answers

      let count = 0;
      const $topAnswers = $('<div/>', {
        id: 'sox-top-answers',
        style: 'padding-bottom: 10px; border-bottom: 1px solid #eaebec;',
      });

      const $table = $('<table/>', {
        style: 'margin:0 auto;',
      });

      const $row = $('<tr/>');

      $table.append($row).appendTo($topAnswers);

      function score(e) {
        return +$(e).parent().find('.js-vote-count').text();
      }

      function compareByScore(a, b) {
        return score(b) - score(a);
      }

      $(':not(.deleted-answer) .answercell').slice(1).sort(compareByScore).slice(0, 5).each(function() {
        count++;
        const id = $(this).closest('.answer').attr('data-answerid');
        const score = $(this).prev().find('.js-vote-count').text();
        let icon = 'vote-up-off';

        if (score > 0) {
          icon = 'vote-up-on';
        }
        if (score < 0) {
          icon = 'vote-down-on';
        }

        const $column = $('<td/>', {
          style: 'width: 100px; text-align: center;',
        });

        const $link = $('<a/>', {
          href: '#' + id,
        });

        const $icon = $('<i/>', {
          class: icon,
          style: 'margin-bottom: 0;',
        });

        $link.append($icon).append('Score: ' + score);
        $column.append($link).appendTo($row);
      });

      if (count > 0 && !$('#sox-top-answers').length) {
        $('#answers div.answer:first').before($topAnswers);
        $table.css('width', count * 100 + 'px');
      }
    },

    tabularReviewerStats: function() {
      // Description: Display reviewer stats on /review/suggested-edits in table form
      // Idea by lolreppeatlol @ http://meta.stackexchange.com/a/277446/260841 :)

      const target = document.querySelector('.mainbar-full');
      sox.helpers.observe(target, '.review-more-instructions', () => {
        const info = {};
        $('.review-more-instructions ul:eq(0) li').each(function() {
          const text = $(this).text();
          const username = $(this).find('a').text();
          const link = $(this).find('a').attr('href');
          const approved = text.match(/approved (.*?)[a-zA-Z]/)[1];
          const rejected = text.match(/rejected (.*?)[a-zA-Z]/)[1];
          const improved = text.match(/improved (.*?)[a-zA-Z]/)[1];
          info[username] = {
            'link': link,
            'approved': approved,
            'rejected': rejected,
            'improved': improved,
          };
        });
        const $editor = $('.review-more-instructions ul:eq(1) li');
        if (!$editor.length) return;
        const editorName = $editor.find('a').text();
        const editorLink = $editor.find('a').attr('href');
        const editorApproved = $editor.clone().find('a').remove().end().text().match(/([0-9]+)/g)[0];
        //`+` matches 'one or more' to make sure it works on multi-digit numbers!
        const editorRejected = $editor.clone().find('a').remove().end().text().match(/([0-9]+)/g)[1]; //https://stackoverflow.com/q/11347779/3541881 for fixing https://github.com/soscripted/sox/issues/279
        info[editorName] = {
          'link': editorLink,
          'approved': editorApproved,
          'rejected': editorRejected,
        };
        let table = '<table><tbody><tr><th style=\'padding: 4px;\'>User</th><th style=\'padding: 4px;\'>Approved</th><th style=\'padding: 4px;\'>Rejected</th><th style=\'padding: 4px;\'>Improved</th style=\'padding: 4px;\'></tr>';
        $.each(info, (user, details) => {
          table += '<tr><td style=\'padding: 4px;\'><a href=\'' + details.link + '\'>' + user + '</a></td><td style=\'padding: 4px;\'>' + details.approved + '</td><td style=\'padding: 4px;\'>' + details.rejected + '</td><td style=\'padding: 4px;\'>' + (details.improved ? details.improved : 'N/A') + '</td></tr>';
        });
        table += '</tbody></table>';
        $('.review-more-instructions p, .review-more-instructions ul').remove();
        $('.review-more-instructions').append(table);
      });
    },

    linkedToFrom: function() {
      // Description: Add an arrow to linked posts in the sidebar to show whether they are linked to or linked from

      function getSprite(state, tooltip) {
        return sox.sprites.getSvg(`chevron_${state}`, tooltip).addClass('sox-linkedToFrom-chevron');
      }

      const currentPageId = +location.href.match(/\/(\d+)\//)[1];
      sox.helpers.getFromAPI({
        endpoint: 'questions',
        childEndpoint: 'linked',
        ids: currentPageId,
        sitename: sox.site.url,
        filter: '!-MOiNm40Dv9qWI4dBqjO5FBS8p*ODCWqP',
        featureId: 'linkedToFrom',
        cacheDuration: 30, // Cache for 30 minutes
      }, pagesThatLinkToThisPage => {
        $('.linked .spacer a.question-hyperlink').each(function () {
          const id = +$(this).attr('href').match(/\/(\d+)\//)[1];

          if ($('a[href*="' + id + '"]').not('#sidebar a').length) {
            // If a link from 'linked questions' does exist elsewhere on this page
            // Then we know that this page definitely references the linked post
            $(this).append(getSprite('right', 'Current page links to this question'));

            // However, the linked post _might_ also reference the current page, so let's check:
            if (pagesThatLinkToThisPage.find(question => question.question_id === currentPageId && question.qustion_id === id)) {
              // The current page is linked to from question_id (which is also the current anchor in the loop)
              sox.debug(`linkedToFrom: link to current page (${currentPageId}) exists on question ${id}`);
              $(this).append(getSprite('left', 'This question links to the current page'));
            } else {
              sox.debug(`linkedToFrom: link to current page not found on question ${id}`);
            }
          } else {
            // If a link from 'linked questions' doesn't exist on the rest of the page
            // Then it must be there _only_ due to the fact that the linked post references the current page
            $(this).append(getSprite('left', 'This question links to the current page'));
          }
        });
      });
    },

    alignBadgesByClass: function() {
      // Description: Aligns badges by their class (bronze/silver/gold) on user profiles

      const acs = {};
      const $badges = $('.user-accounts tr .badges');

      $badges.each(function(i) {
        let b; let s; let g;
        if ($(this).find('>span[title*="bronze badge"]').length) {
          b = $(this).find('>span[title*="bronze badge"] .badgecount').text();
        }
        if ($(this).find('>span[title*="silver badge"]').length) {
          s = $(this).find('>span[title*="silver badge"] .badgecount').text();
        }
        if ($(this).find('>span[title*="gold badge"]').length) {
          g = $(this).find('>span[title*="gold badge"] .badgecount').text();
        }
        acs[i] = {
          'bronze': b,
          'silver': s,
          'gold': g,
        };
      });
      $.each(acs, k => {
        const $badgesTd = $badges.eq(k);
        $badgesTd.html('');
        if (acs[k].gold) {
          $badgesTd.append('<span title="' + acs[k].gold + ' gold badges"><span class="badge1"></span><span class="badgecount">' + acs[k].gold + '</span></span>');
        } else {
          $badgesTd.append('<span><span class="badge1" style="background-image:none"></span><span class="badgecount"></span></span>');
        }
        if (acs[k].silver) {
          $badgesTd.append('<span title="' + acs[k].silver + ' silver badges"><span class="badge2"></span><span class="badgecount">' + acs[k].silver + '</span></span>');
        } else {
          $badgesTd.append('<span><span class="badge1" style="background-image:none"></span><span class="badgecount"></span></span>');
        }
        if (acs[k].bronze) {
          $badgesTd.append('<span title="' + acs[k].bronze + ' bronze badges"><span class="badge3"></span><span class="badgecount">' + acs[k].bronze + '</span></span>');
        } else {
          $badgesTd.append('<span><span class="badge1" style="background-image:none"></span><span class="badgecount"></span></span>');
        }
      });

      $('.user-accounts .badges span').css({
        'min-width': '20px',
        'display': 'inline-block',
      });

    },

    quickAuthorInfo: function() {
      // Description: Shows when the post's author was last active and their registration state

      function addLastSeen(userDetailsFromAPI) {
        $('.question, .answer, .reviewable-post').each(function() {
          const anchor = this.querySelector('.post-signature:last-child .user-details a[href^="/users"]');
          if (!anchor) return;

          const id = sox.helpers.getIDFromAnchor(anchor);
          if (!id || !(userDetailsFromAPI[id] && !this.getElementsByClassName('sox-last-seen').length)) return;

          const lastSeenDate = new Date(userDetailsFromAPI[id].last_seen);

          const $div = $('<div/>', {
            'class': 'sox-quickAuthorInfo-details',
            title: 'SOX: last seen',
          }).append(sox.sprites.getSvg('access_time'))
            .append($('<time/>', {
              'class': 'timeago sox-last-seen',
              datetime: lastSeenDate.toISOString(),
              title: lastSeenDate.toJSON().replace('T', ' ').replace('.000', ''), // https://github.com/soscripted/sox/issues/204: hacky but short way '.000' always works because SE doesn't do such precise times
              value: lastSeenDate.toLocaleString(),
            }));

          const $userInfo = $(this).find('.user-info');
          $userInfo.last().append($div);
          if (userDetailsFromAPI[id].type === 'unregistered') {
            $userInfo.find('.user-details a').after('<span title="SOX: this user is unregistered" class="sox-quickAuthorInfo-unregistered">(unregistered)</span>');
          }
        });

        $('time.timeago').timeago();
      }

      function getIdsAndAddDetails(postAuthors) {
        const FILTER_USER_LASTSEEN_TYPE = '!*MxL2H2Vp3iPIKLu';

        $('.question, .answer, .reviewable-post').each(function() {
          const userDetailsAnchor = this.querySelector('.post-signature:last-child .user-details a[href^="/users"]');

          let userid; let username;

          if (userDetailsAnchor) {
            userid = sox.helpers.getIDFromAnchor(userDetailsAnchor);
            username = userDetailsAnchor.innerText;

            if (userid !== 0) postAuthors[userid] = username;
          } else {
            sox.loginfo('Could not find user user link for: ', this);
          }
        });

        sox.helpers.getFromAPI({
          endpoint: 'users',
          ids: Object.keys(postAuthors),
          sitename: sox.site.currentApiParameter,
          filter: FILTER_USER_LASTSEEN_TYPE,
          sort: 'creation',
          featureId: 'quickAuthorInfo',
        }, items => {
          const userDetailsFromAPI = {};
          items.forEach(user => {
            userDetailsFromAPI[user.user_id] = {
              'last_seen': user.last_access_date * 1000,
              'type': user.user_type,
            };
          });

          sox.debug('quickAuthorInfo userDetailsFromAPI', userDetailsFromAPI);
          addLastSeen(userDetailsFromAPI);

          $(document).on('sox-new-comment', () => { //make sure it doesn't disappear when adding a new comment!
            addLastSeen(userDetailsFromAPI);
          });
        });
      }

      // key:id, value:username
      const postAuthors = {};

      $(document).on('sox-new-review-post-appeared', () => {
        getIdsAndAddDetails(postAuthors);
      });

      getIdsAndAddDetails(postAuthors);
    },

    hiddenCommentsIndicator: function() {
      // Description: Darkens the border underneath comments if there are hidden comments underneath it

      $('.question, .answer').each(function() {
        if ($(this).find('.js-show-link.comments-link:visible').length) {
          const postId = $(this).attr('data-questionid') || $(this).attr('data-answerid');
          const x = [];
          const y = [];
          const protocol = location.protocol;
          const hostname = location.hostname;
          const baseUrl = protocol + '//' + hostname;

          $.get(baseUrl + '/posts/' + postId + '/comments', d => {
            const $commentCopy = $('#comments-' + postId + ' .comment-text .comment-copy');

            $(d).find('.comment-text').each(function() {
              x.push($(this).find('.comment-copy').text());
            });

            $commentCopy.filter(d => {
              y.push(x.indexOf($commentCopy.eq(d).text()));
            });

            for (let i = 0; i < y.length; i++) {
              if (y[i] != y[i + 1] - 1) {
                $commentCopy.filter(function() {
                  return $(this).text() == x[y[i]];
                }).parent().parent().parent().find('.comment-actions, .comment-text').css('border-bottom-color', 'gray');
              }
            }
          });
        }
      });
    },

    hotNetworkQuestionsFiltering: function(settings) {
      // Description: Filter hot network questions in the sidebar based on their attributes such as title, site, etc.

      function createRegex(list) {
        return new RegExp('\\b' + list.replace(',', '|').replace(' ', '') + '\\b', 'i');
      }

      const WORDS_TO_BLOCK = settings.wordsToBlock;
      let SITES_TO_BLOCK = settings.sitesToBlock;
      const TITLES_TO_HIDE = settings.titlesToHideRegex && settings.titlesToHideRegex.split(',');

      if (SITES_TO_BLOCK) SITES_TO_BLOCK = SITES_TO_BLOCK.split(',');

      $('#hot-network-questions li a').each(function() {
        let i;

        // NOTE: to hide questions, we use a class that has 'display: none !important'.
        // This is to make sure questions that were previously hidden don't appear after
        // the user clicks 'more hot questions', because the questions are *already* on
        // the page before the button is clicked, but just hidden!

        if (WORDS_TO_BLOCK) {
          if (createRegex(WORDS_TO_BLOCK).test(this.innerText)) $(this).parent().addClass('sox-hot-network-question-filter-hide');
        }

        if (SITES_TO_BLOCK) {
          const href = this.href;
          for (let i = 0; i < SITES_TO_BLOCK.length; i++) {
            if (sox.location.matchWithPattern(SITES_TO_BLOCK[i], href)) {
              $(this).parent().addClass('sox-hot-network-question-filter-hide');
            }
          }
        }

        if (TITLES_TO_HIDE) {
          const title = this.innerText;
          for (i = 0; i < TITLES_TO_HIDE.length; i++) {
            if (title.match(new RegExp(TITLES_TO_HIDE[i]))) {
              $(this).parent().hide();
            }
          }
        }
      });
    },

    warnNotLoggedIn: function() {
      // Description: Add a small notice at the bottom left of the screen if you are not logged in when browsing an SE site

      const div = $('<div/>', {
        id: 'loggedInReminder',
        style: 'position: fixed; right: 0; bottom: 50px; background-color: rgba(200, 200, 200, 1); width: 200px; text-align: center; padding: 5px; color: black; font-weight:bold',
        html: 'SOX: You are not logged in. You should <a href="/users/login">log in</a> to continue enjoying SE.',
      });

      function checkAndAddReminder() {
        if (!sox.user.loggedIn && !sox.location.on('winterbash')) {
          if (!$('#loggedInReminder').length) $('.container').append(div);
        } else {
          $('#loggedInReminder').remove();
        }
      }
      checkAndAddReminder();
      setInterval(checkAndAddReminder, 300000); //5 mins
    },

    disableVoteButtons: function() {
      // Description: disables vote buttons on your own or deleted posts, which you cannot vote on
      // https://github.com/soscripted/sox/issues/309, https://github.com/soscripted/sox/issues/335

      //Grays out votes, vote count for deleted posts
      if ($('.deleted-answer').length) {
        $('.deleted-answer .vote-down-off, .deleted-answer .vote-up-off, .deleted-answer .vote-count-post').css({
          'cursor': 'default',
          'opacity': '0.5',
          'pointer-events': 'none', //disables the anchor tag (jQuery off() doesn't work)
        });
      }

      //Grays out votes on own posts
      $('.answer, .question')
        .find('.user-details:last a')
        .filter('a[href*=' + sox.user.id + ']')
        .closest('.answer, .question')
        .find('.votecell .vote a[class*="vote"]')
        .not('[id*="vote-accept"]') //https://github.com/soscripted/sox/issues/165
        .removeClass('sox-better-css')
        .css({
          'cursor': 'default',
          'opacity': '0.5',
          'pointer-events': 'none', //disables the anchor tag (jQuery off() doesn't work)
        })
        .parent().attr('title', 'You cannot vote on your own posts.'); //.parent() is to add the title to the .vote div
    },

    replyToOwnChatMessages: function() {
      // Description: Adds a reply button to your own chat messages so you can reply to your own messages easier and quicker
      // I use $(document).on instead of .each, since using .each wouldn't apply to messages loaded via "Load more messages" and "Load to my last message"

      $(document).on('mouseenter', '.mine .message', function() {
        //Remove excess spacing to the left of the button (by emptying .meta, which has "&nbsp" in it), and set the button color to the background color
        $(this).find('.meta').empty().css({
          'background-color': $(this).parent().css('background-color'),
          'padding-right': '1px',
        }).show().append(replySpan);
        //The "padding-right: 1px" is to avoid some weird bug I can't figure out how to fix
      }).on('mouseleave', '.mine .message', function() {
        $(this).find('.meta').hide().find('.newreply').remove();
      })

      //Do the same thing if you hover over the timestamp
        .on('mouseenter', '.mine .timestamp', function() {
          $(this).next().find('.meta').empty().css({
            'background-color': $(this).parent().css('background-color'),
            'padding-right': '1px',
          }).show().append(replySpan);
        }).on('mouseleave', '.mine .timestamp', function() {
          $(this).next().find('.meta').hide().find('.newreply').remove();
        })

        .on('click', '.newreply.added-by-sox', e => {
          const $message = $(e.target).closest('.message');
          const id = $message.attr('id').split('-')[1];
          const rest = $('#input').focus().val().replace(/^:([0-9]+)\s+/, '');
          $('#input').val(':' + id + ' ' + rest).focus();
        });

      const replySpan = $('<span/>', {
        class: 'newreply added-by-sox',
        'title': 'link my next chat message as a reply to this',
      });
    },

    hideCertainQuestions: function(settings) {
      // Description: Hide certain questions depending on your choices

      if (settings.duplicate || settings.closed || settings.migrated || settings.onHold) {
        $('.question-summary').each(function() { //Find the questions and add their id's and statuses to an object
          const $question = $(this);
          const $anchor = $(this).find('.summary a:eq(0)');
          const text = $anchor.text().trim();

          if (text.substr(text.length - 11) == '[duplicate]' || $question.attr('data-sox-question-state') == 'duplicate') {
            if (settings.duplicate) $question.hide();

          } else if (text.substr(text.length - 8) == '[closed]' || $question.attr('data-sox-question-state') == 'closed') {
            if (settings.closed) $question.hide();

          } else if (text.substr(text.length - 10) == '[migrated]' || $question.attr('data-sox-question-state') == 'migrated') {
            if (settings.migrated) $question.hide();

          } else if (text.substr(text.length - 9) == '[on hold]' || $question.attr('data-sox-question-state') == 'on hold') {
            if (settings.onHold) $question.hide();
          }
        });
      }
      if (settings.deletedAnswers) {
        const length = $('.answer.deleted-answer').hide().length;
        $('.answers-subheader h2').append(' (' + length + ' deleted & hidden)');
      }
    },

    inlineEditorEverywhere: function() {
      // Description: Enabled inline editor on all sites
      // Written by @nicael: http://stackapps.com/questions/6216/inline-editor-regardless-of-reputation, and copied with nicael's permission

      if (sox.Stack) {
        $('.suggest-edit-post').removeClass('suggest-edit-post').addClass('edit-post');
        sox.Stack.using('inlineEditing', () => {
          sox.Stack.inlineEditing.init();
        });
      } else {
        sox.warn('inlineEditorEverywhere error: sox.Stack.using not found');
        sox.debug('inlineEditorEverywhere: Stack object:', sox.Stack);
      }
    },

    flagPercentageBar: function() {
      // Description: Adds a coloured percentage bar above the pane on the right of the flag summary page to show percentage of helpful flags

      let helpfulFlags = 0;
      $('li > a:contains(\'helpful\')').each(function() {
        helpfulFlags += parseInt($(this).find('div:last').text().replace(',', ''));
      });

      let declinedFlags = 0;
      $('li > a:contains(\'declined\')').each(function() {
        declinedFlags += parseInt($(this).find('div:last').text().replace(',', ''));
      });

      if (helpfulFlags > 0) {
        let percentHelpful = Number(Math.round((helpfulFlags / (helpfulFlags + declinedFlags)) * 100 + 'e2') + 'e-2');
        if (percentHelpful > 100) percentHelpful = 100;

        let percentColor;
        if (percentHelpful >= 90) {
          percentColor = 'limegreen';
        } else if (percentHelpful >= 80) {
          percentColor = 'darkorange';
        } else if (percentHelpful < 80) {
          percentColor = 'red';
        }

        //this is for the dynamic part; the rest of the CSS is in the main CSS file
        GM_addStyle(`#sox-flagPercentProgressBar:after {
                      background: ${percentColor};
                      width: ${percentHelpful}%;
                    }`);

        $('#flag-summary-filter').after('<h3 id=\'sox-flagPercentHelpful\' title=\'only helpful and declined flags are counted\' class=\'wrap-div\'><span id=\'percent\'>' + percentHelpful + '%</span> helpful</h3>');
        $('#sox-flagPercentHelpful span#percent').css('color', percentColor);

        $('#sox-flagPercentHelpful').after('<div id=\'sox-flagPercentProgressBar\' class=\'wrap-div\'></div>');
        $('.wrap-div').wrapAll('<div class=\'sox-flagPercentProgressBar-container\'></div>');
      }
    },

    showMetaReviewCount: function() {
      // Description: Adds the total count of meta reviews on the main site on the /review page

      // CORS proxy
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const metaUrl = sox.Stack.options.site.childUrl;
      const requestUrl = proxyUrl + metaUrl + '/review';

      $.get(requestUrl, d => {
        const $doc = $(d);
        let total = 0;

        $doc.find('#content .grid.bt .fs-subheading').each(() => total += +$(this).text());

        const $lastReviewRow = $('#content .grid.bt').last();

        // Clone the existing bottom-most review div
        const $metaDashboardEl = $lastReviewRow.clone();

        // Cache the left and right sections, get immediate divs only with `>`
        const $sections = $metaDashboardEl.find('>div');

        const $leftSection = $sections.first();
        // Set number of reviews
        $leftSection.find('.fs-subheading').text(total).attr('title', total);
        // Set 'reviews' text (instead of e.g. 'edits')
        $leftSection.find('.mt2').text('reviews');

        const $rightSection = $sections.last();
        $rightSection.find('a').first().text('Meta Reviews').attr('href', `${metaUrl}/review`);
        $rightSection.find('.fs-body2').text('SOX: Total reviews available on this site\'s meta at the moment');
        // Remove the user avatars from the new row
        $rightSection.find('>div').last().remove();

        $lastReviewRow.after($metaDashboardEl);
      });
    },

    copyCode: function() {
      // Description: Add a button to code in posts to let you copy it

      //button uses CSS mainly from http://stackoverflow.com/a/30810322/3541881
      function addButton() {
        //https://github.com/soscripted/sox/issues/218#issuecomment-281148327 reason for selector:
        //http://stackoverflow.com/a/11061657/3541881

        $('pre:not(:has(.sox-copyCodeButton))').before(sox.sprites.getSvg('copy', 'Copy code to clipboard (SOX)').addClass('sox-copyCodeButton'));

        $('pre').hover(function() {
          $(this).prev('.sox-copyCodeButton').show();
        }, function() {
          $(this).prev('.sox-copyCodeButton').hide();
        });

        $('.sox-copyCodeButton').hover(function() {
          $(this).show();
        }, function() {
          $(this).hide();
        });
      }

      addButton();
      $(document).on('sox-new-review-post-appeared', addButton);

      $(document).on('click', '.sox-copyCodeButton', function() {
        try {
          const copyCodeTextareas = document.getElementsByClassName('sox-copyCodeTextarea');
          if (!copyCodeTextareas.length) $('body').append('<textarea class="sox-copyCodeTextarea">');

          copyCodeTextareas[0].value = $(this).next('pre').text();
          copyCodeTextareas[0].select();
          document.execCommand('copy');
          $(this).effect('highlight', {
            color: 'white',
          }, 3000);
        } catch (e) {
          sox.info('Browser doesn\'t support execComand for copyCode feature');
        }
      });
    },

    dailyReviewBar: function() {
      // Description: Adds a progress bar showing how many reviews you have left in the day

      function addBar() {
        const currentUrl = location.href.split('/');
        const sliced = currentUrl.slice(0, currentUrl.length - 1).join('/');
        let urlToGet;

        if ($('.reviewable-post').length) {
          urlToGet = sliced + '/stats';
        } else {
          urlToGet = currentUrl.join('/') + '/stats';
        }

        $.get(urlToGet, d => {
          const count = +$(d).find('.review-stats-count-current-user').first().text().trim();
          const width = (count / 20) * 100;
          const $soxDailyReviewCount = $('#sox-daily-review-count');
          if ($soxDailyReviewCount.length) {
            $soxDailyReviewCount.find('#badge-progress-bar').css('width', width);
            $soxDailyReviewCount.find('#badge-progress-count').text(count);
          } else {
            $('.subheader.tools-rev').append(`<div id="sox-daily-review-count" title="your daily review cap in this queue" class="review-badge-progress">
                            <div class="meter" style="width: 100px;margin-top: 14px;margin-right: 15px;height: 9px;float: right;">
                                <div id="badge-progress-bar" style="width: ` + width + `%;">
                                    <div id="badge-progress-bar-vis" style="border:none"></div>
                                </div>
                            </div>
                            <div id="badge-progress-count">` + count + `</div>
                        </div>`);
          }
        });
      }

      addBar();
      $(document).on('sox-new-review-post-appeared', addBar);
    },

    openLinksInNewTab: function(settings) {
      // Description: Open any links to the specified sites in a new tab by default

      settings = settings.linksToOpenInNewTab;
      if (!settings) return;

      settings = settings.replace(' ', '').split(',');
      if (settings.length) { //https://github.com/soscripted/sox/issues/300
        $('.post-text a').each(function() {
          const href = $(this).attr('href');
          for (let i = 0; i < settings.length; i++) {
            if (sox.location.matchWithPattern(settings[i], href)) {
              $(this).append(sox.sprites.getSvg('launch', 'SOX: this link will open in a new tab').addClass('sox-openLinksInNewTab-externalLink'));
              $(this).prop('target', '_blank');
            }
          }
        });
      }
    },

    showQuestionStateInSuggestedEditReviewQueue: function() {
      // Description: Show question's current state in the suggested edit review queue (duplicate, off-topic, etc.)

      const PROCESSED_ID = 'sox-showQuestionStateInSuggestedEditReviewQueue-checked';
      $(document).on('sox-new-review-post-appeared', () => {
        if (document.getElementById(PROCESSED_ID)) return;

        const $anchor = $('.summary h2 a');
        if (!$anchor.length) return;
        const postId = sox.helpers.getIDFromAnchor($anchor[0]);
        const QUESTION_STATE_FILTER = '!-MOiNm40B3fle5H6oLVI3nx6UQo(vNstn';

        sox.helpers.getFromAPI({
          endpoint: 'questions',
          ids: postId,
          sitename: sox.site.currentApiParameter,
          filter: QUESTION_STATE_FILTER,
          sort: 'creation',
          useCache: false, // Single ID, so no point
        }, items => {
          $('body').append($('<div/>', {
            'id': PROCESSED_ID,
            'style': 'display: none',
          }));

          if (!items[0].closed_reason) return;
          if (items[0].closed_reason === 'duplicate') {
            $anchor.after('&nbsp;<span class=\'standOutDupeCloseMigrated-duplicate\'>&nbsp;duplicate&nbsp;</span></a>');
          } else if (items[0].closed_details.on_hold === true) { //on-hold
            $anchor.after('&nbsp;<span class="standOutDupeCloseMigrated-onhold">&nbsp;on hold&nbsp;</span>');
          } else if (items[0].closed_details.on_hold === false && items[0].closed_reason == 'off-topic') { //closed
            $anchor.after('&nbsp;<span class="standOutDupeCloseMigrated-closed">&nbsp;closed&nbsp;</span>');
          }
        });
      });
    },

    findAndReplace: function() { //Salvaged from old 'enhanced editor' feature
      // Description: adds a 'find and replace' option to the markdown editor

      function startLoop() {
        $('textarea[id^="wmd-input"].processed').each(function() {
          main($(this).attr('id'));
        });

        $('.edit-post').click(function() {
          const $that = $(this);
          const targetQuestionCells = document.getElementsByClassName('postcell');
          const targetAnswerCells = document.getElementsByClassName('answercell');
          sox.helpers.observe([...targetQuestionCells, ...targetAnswerCells], '#wmd-redo-button-' + $that.attr('href').split('/')[2], () => {
            main($that.parents('table').find('.inline-editor textarea.processed').attr('id'));
          });
        });
      }

      function main(wmd) {
        const s = '#' + wmd; //s is the selector we pass onto each function so the action is applied to the correct textarea (and not, for example the 'add answer' textarea *and* the 'edit' textarea!)
        if ($(s).parents('.wmd-container').find('#findReplace').length) return;

        $('.wmd-button-bar').css('margin-top', '0'); //https://github.com/soscripted/sox/issues/203

        $(s).before('<div class=\'findReplaceToolbar\'><span id=\'findReplace\'>Find & Replace</span></div>');

        $(document).on('click', '#findReplace', function(e) {
          if ($('.findReplaceInputs').length) {
            $('.findReplaceInputs').remove();
          } else {
            $(this).parent().append('<div class=\'findReplaceInputs\'><input id=\'find\' type=\'text\' placeholder=\'Find\'><input id=\'modifier\' type=\'text\' placeholder=\'Modifier\'><input id=\'replace\' type=\'text\' placeholder=\'Replace with\'><input id=\'replaceGo\' type=\'button\' value=\'Go\'></div>');
          }
          $(document).on('click', '.findReplaceToolbar #replaceGo', function() {
            const regex = new RegExp($('.findReplaceToolbar #find').val(), $('.findReplaceToolbar #modifier').val());
            const oldval = $(this).parent().parent().parent().find('textarea').val();
            const newval = oldval.replace(regex, $('.findReplaceToolbar #replace').val());
            $(this).parent().parent().parent().find('textarea').val(newval);

            if (sox.Stack.MarkdownEditor) sox.Stack.MarkdownEditor.refreshAllPreviews();
          });
          e.preventDefault();
          e.stopPropagation();
        });

        $(s).keydown(e => {
          if (e.which == 70 && e.ctrlKey) { //ctrl+f (find+replace)
            $('#findReplace').trigger('click');
            e.stopPropagation();
            e.preventDefault();
            return false;
          }
        });
      }
      $(document).on('sox-edit-window', startLoop);
      startLoop();
    },

    onlyShowCommentActionsOnHover: function() {
      // Description: Only show the comment actions (flag/upvote) when hovering over a comment

      function addCSS() {
        // Delay needed because of https://github.com/soscripted/sox/issues/379#issuecomment-460001854
        setTimeout(() => $('.comment').addClass('sox-onlyShowCommentActionsOnHover'), 100);
      }

      $(document).on('sox-new-comment', addCSS);
      addCSS();
    },

    showTagWikiLinkOnTagPopup: function() {
      // Description: Add a 'wiki' link to the new tag popups that appear on hover

      const target = document.querySelector('.question-page');
      sox.helpers.observe(target, '.tag-popup', () => {
        //extract from feed URL button
        const tagName = $('.tag-popup .float-right a').attr('href').match('/feeds/tag/(.*)')[1];
        const wikiUrl = '//' + sox.site.url + '/tags/' + tagName + '/info';

        $('.tag-popup .mr8:last').after($('<span/>', {
          'class': 'sox-tag-popup-wiki-link',
          'html': '<a href="' + wikiUrl + '">wiki</a>',
          'title': 'view tag wiki (added by SOX)',
        }));
      });
    },

    addTimelineAndRevisionLinks: function() {
      // Description: Add timeline and revision links to the bottom of each post for quick access to them

      $('.question, .answer').each(function () {
        const id = $(this).attr('data-questionid') || $(this).attr('data-answerid');
        $(this).find('.post-menu').append($('<a/>', {
          'href': '//' + sox.site.url + '/posts/' + id + '/revisions',
          'text': 'revisions',
        })).append($('<a/>', {
          'href': '//' + sox.site.url + '/posts/' + id + '/timeline',
          'text': 'timeline',
        }));
      });
    },

    hideWelcomeBackMessage: function() {
      // Description: Hide the 'welcome back...don't forget to vote' message when visiting a site after a while

      sox.helpers.observe(document.body, '#overlay-header', el => {
        if ($(el).text().match(/welcome back/gi)) {
          $(el).remove();
        }
      });
    },

    hideHowToAskWhenZoomed: function() {
      // Description: Hides the 'How to ask/format/tag' yellow boxes that appear when asking a question whilst zoomed in

      const target = document.getElementById('question-form');
      sox.helpers.observe(target, '.js-help-pointer', el => {
        if ($(el).text().match(/(How to Ask)|(How to Format)|(How to Tag)/gi)) {
          $(el).remove();
        }
      });
    },

    addOnTopicLinkToSiteSwitcher: function() {
      // Description: Replaces 'help' with an 'on-topic' link in the site switcher dropdown

      $('.top-bar .related-links').find('a').eq(0).replaceWith('<a href="/help/on-topic">on-topic</a>');
    },

    customMagicLinks: function () {
      // Description: Adds custom magic links to the post and comment editors

      const magicLinks = JSON.parse(GM_getValue('SOX-customMagicLinks', '[]'));
      // magicLinks = [ { text: 'edit/q', replacement: 'Edit Question', link: '$BASEURL$/posts/$QUESTIONID$/edit' }];

      function updateGMValue(magicLinks) {
        GM_setValue('SOX-customMagicLinks', JSON.stringify(magicLinks));
      }

      function generateSettingsTableHtml(magicLinks) {
        const $magicLinksTable = $(`
        <table class='sox-customMagicLinks-settings-table'>
          <tr>
            <th>Text</th>
            <th>Replacement</th>
            <th>Link</th>
          </tr>
        </table>`);
        for (let i = 0; i < magicLinks.length; i++) {
          const currentLink = magicLinks[i];
          const $saveButton = $('<button/>', {
            'text': 'save',
            'click': function () {
              const $parentTr = $(this).parent().parent();
              const index = $parentTr.attr('data-magic-link-index');
              magicLinks[index].text = $parentTr.find('.magic-link-text').text();
              magicLinks[index].replacement = $parentTr.find('.magic-link-replacement').text();
              magicLinks[index].link = $parentTr.find('.magic-link-link').text();
              window.alert('Your changes were saved!');
              updateGMValue(magicLinks);
            },
          });
          const $deleteButton = $('<button/>', {
            'text': 'delete',
            'click': function () {
              magicLinks.splice($(this).parent().attr('data-magic-link-index'), 1);
              $(this).parent().parent().remove();
              updateGMValue(magicLinks);
            },
          });
          const $linkDetails = $(
            `<tr class='sox-magic-link-details' data-magic-link-index=${i}>
              <td contenteditable class='magic-link-text'>${currentLink.text}</td>
              <td contenteditable class='magic-link-replacement'>${currentLink.replacement}</td>
              <td contenteditable class='magic-link-link'>${currentLink.link}</td>
            </tr>`);
          $linkDetails.append($('<td/>').append($saveButton)).append($('<td/>').append($deleteButton));
          $magicLinksTable.append($linkDetails);
        }
        return $magicLinksTable;
      }

      function replacePlaceholders(text, $textarea) {
        const baseUrl = $(location).attr('protocol') + '//' + $(location).attr('hostname');
        const localMetaBase = $(location).attr('protocol') + '//meta.' + $(location).attr('hostname');
        const questionId = $('.question').data('questionid');
        const answerId = $textarea.closest('.answer').data('answerid');

        return text
          .replace(/\$BASEURL\$/ig, baseUrl)
          .replace(/\$METABASEURL\$/ig, localMetaBase)
          .replace(/\$QUESTIONID\$/ig, questionId)
          .replace(/\$ANSWERID\$/ig, answerId);
      }

      function magicLink($el) {
        const $textarea = $el.is('textarea') ? $el : $el.parents('form').find('textarea').eq(0);
        let newVal = $textarea.val();
        for (let i = 0; i < magicLinks.length; i++) {
          const currentMagicLink = magicLinks[i];
          const replacementText = currentMagicLink.replacement;
          const url = replacePlaceholders(currentMagicLink.link, $textarea);
          const regex = new RegExp('\\[' + currentMagicLink.text + '\\]', 'g');
          newVal = newVal.replace(regex, '[' + replacementText + '](' + url + ')');
        }
        $textarea.val(newVal);
      }

      if (sox.site.href.indexOf('/questions') !== -1) {
        $(document).on('keydown', '.comment-form textarea', function (e) {
          if (e.keyCode == 13) magicLink($(this));
        });
        $(document).on('click', '.comment-form input[type="submit"], .form-submit #submit-button, form.inline-post button[id*="submit-button-"]', function () {
          magicLink($(this));
        });
      }

      function createSettingsDialog(magicLinks) {
        const $settingsDialog = sox.helpers.createModal({
          'header': 'SOX: Magic Link Settings',
          'css': {
            'min-width': '50%',
          },
          'html': '<i>the table cells below are editable; be sure to save any changes!</i><br><br><div class="table-container"></div>',
        });
        const $settingsDialogContent = $settingsDialog.find('.sox-custom-dialog-content');

        const $newMagicLinkButton = $('<button/>', {
          'text': 'new link',
          'click': function () {
            const text = window.prompt('Enter the magic link text (e.g. edit/q)');
            const replacement = window.prompt('Enter the text you would like the link to show as (e.g. Edit Question)');
            const link = window.prompt('Enter the replacement link, using the placeholders as required');

            if (text && replacement && link) {
              magicLinks.push({
                text,
                replacement,
                link,
              });
              updateGMValue(magicLinks);
              $settingsDialogContent.find('.table-container table').remove();
              $settingsDialogContent.find('.table-container').append(generateSettingsTableHtml(magicLinks));
            } else {
              window.alert('Please enter details for all three fields');
            }
          },
        });
        $settingsDialogContent.find('.table-container').append(generateSettingsTableHtml(magicLinks));
        $settingsDialogContent.append($newMagicLinkButton);

        $('body').append($settingsDialog);
      }

      sox.helpers.addButtonToHelpMenu({
        'id': 'magicLinksSettingsLink',
        'linkText': 'Magic Links',
        'summary': 'Edit your custom magic links',
        'click': function () {
          createSettingsDialog(magicLinks);
        },
      });
    },

    openImagesAsModals: function () {
      // Description: When clicking on imgur images, show a larger version in a modal

      const modalAttributes = {
        header: 'SOX: Linked Image',
        css: {
          'min-width': '90%',
          'min-height': '90%',
        },
        id: 'sox-linked-image-modal',
      };

      const posts = [...document.querySelectorAll('.question, .answer')];
      posts.forEach(post => {
        [...post.querySelectorAll('img')].forEach(img => {
          if (!img.src || !img.src.includes('i.stack.imgur.com')) return;

          img.addEventListener('click', e => {
            e.preventDefault();
            // Create modal on click instead of outside; modal is removed when closed
            // so reference would become invalid
            modalAttributes.header = `SOX: Linked Image <a class='sox-openImagesAsModals-sourceLink' target='_blank' rel='noopener noreferrer' href='${img.src}'>source</a>`;
            const $modal = sox.helpers.createModal(modalAttributes);
            $modal.find('.sox-custom-dialog-content').html(`<img width='100%' height='100%' src='${img.src}' />`);
            if (!document.getElementById('#sox-linked-image-modal')) $('body').append($modal);
          });
        });
      });
    },

    addTagsToHNQs: function () {
      // Description: Show HNQ tags on hover in the sidebar

      const FILTER_QUESTION_TAGS = '!)5IW-5Quf*cV5LToe(J0BjSBXW19';
      const PLACEHOLDER = 'fetching tags...';

      function insertTagsList(anchor) {
        if ($(anchor).parent().find('.sox-hnq-question-tags-tooltip').length) return;
        $(anchor).after('<span class="sox-hnq-question-tags-tooltip">' + anchor.dataset.tags + '</span>');
      }

      $('#hot-network-questions h4').css('display', 'inline').after($('<span/>', {
        'style': 'color:  grey; display: block; margin-bottom: 10px;',
        'text': 'SOX: hover over titles to show tags',
      }));

      [...document.querySelectorAll('#hot-network-questions li a')].forEach(el => {
        const id = sox.helpers.getIDFromAnchor(el);
        const sitename = sox.helpers.getSiteNameFromAnchor(el);

        el.addEventListener('mouseenter', () => {
          if (!el.dataset.tags) {
            sox.helpers.getFromAPI({
              endpoint: 'questions',
              ids: id,
              sitename,
              filter: FILTER_QUESTION_TAGS,
              useCache: false, // Single ID, so no point
            }, items => {
              el.dataset.tags = items[0].tags.join(', ');
              insertTagsList(el);
            });
            el.dataset.tags = PLACEHOLDER;
          } else if (typeof el.dataset.tags !== 'undefined' && el.dataset.tags !== PLACEHOLDER) {
            insertTagsList(el);
          } else {
            insertTagsList(el, PLACEHOLDER);
          }
        });

        el.addEventListener('mouseleave', () => {
          const tooltip = el.parentNode.querySelector('.sox-hnq-question-tags-tooltip');
          if (tooltip) tooltip.remove();
        });
      });
    },
  };
})(window.sox = window.sox || {}, jQuery);
