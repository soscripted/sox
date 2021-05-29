/* globals Notifier, fkey */
(function(sox, $) {
  'use strict';

  sox.features = { //SOX functions must go in here
    moveBounty: function() {
      // Description: For moving bounty to the top

      const bountyLink = document.querySelector('.bounty-link.bounty');
      if (!bountyLink) return; // question not eliglible for bounty
      const bountyLinkDiv = bountyLink.parentElement.parentElement;
      const cloneBounty = bountyLinkDiv.cloneNode(true);
      bountyLinkDiv.previousElementSibling.insertAdjacentElement('beforebegin', cloneBounty);
      bountyLinkDiv.remove();
    },

    dragBounty: function() {
      // Description: Makes the bounty window draggable

      sox.helpers.addAjaxListener('\\/posts\\/bounty\\/\\d+', () => {
        const bountyPopup = document.querySelector('#start-bounty-popup');
        $(bountyPopup).draggable({
          drag: function() {
            $(this).css({
              'width': 'auto',
              'height': 'auto',
            });
          },
        });
        bountyPopup.style.cursor = 'move';
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
      // Description: Adds the Stack Exchange logo next to users that *ARE* Stack Exchange employees

      const icon = sox.sprites.getSvg('se_logo');
      icon.classList.add('iconStackExchange', 'svg-icon', 'sox-markEmployees-logo');
      const logoSpan = document.createElement('span');
      logoSpan.className = 'sox-markEmployees';
      logoSpan.title = 'employee (added by SOX)';
      logoSpan.appendChild(icon);

      function getIds() {
        const anchors = [...document.querySelectorAll('a.comment-user, .user-details a, .question-summary .started a')].filter(el => {
          return ![...el.children].filter(el => el.classList.contains('sox-markEmployees')).length && el.href && el.href.match(/\/users\/\d+/);
        });
        const ids = [...new Set(anchors.map(el => el.href.match(/(\d+)/)[0]))];
        sox.debug('markEmployees user IDs', ids);

        for (let i = 0; i < Math.ceil(ids.length / 100); i++) {
          apiCall(i + 1, ids.slice(i * 100, (i * 100) + 100), anchors);
        }
      }

      function apiCall(page, ids, anchors) {
        sox.helpers.getFromAPI({
          endpoint: 'users',
          ids,
          sitename: sox.site.url,
          filter: '!*MxJcsv91Tcz6yRH',
          limit: 100,
          page,
          featureId: 'markEmployees',
          cacheDuration: 60 * 24, // Cache for 24 hours (in minutes)
        }, items => {
          sox.debug('markEmployees returned data', items);
          for (let i = 0; i < items.length; i++) {
            if (!items[i].is_employee) continue;
            const userId = items[i].user_id;
            anchors.filter(el => el.href.contains(`/users/${userId}/`)).forEach(el => el.appendChild(logoSpan.cloneNode(true)));
          }
        });
      }

      getIds();
      window.addEventListener('sox-new-comment', getIds);
      window.addEventListener('sox-new-review-post-appeared', getIds);
    },

    copyCommentsLink: function() {
      // Description: Adds the 'show x more comments' link before the commnents
      // Test on e.g. https://meta.stackexchange.com/questions/125439/

      function copyLinks() {
        [...document.querySelectorAll('.js-show-link')].forEach(element => {
          const btnToAdd = element.cloneNode(true);
          btnToAdd.classList.add('sox-copyCommentsLinkClone');
          btnToAdd.addEventListener('click', event => {
            event.preventDefault();
            btnToAdd.style.display = 'none';
          });

          element.parentElement.parentElement.prepend(btnToAdd);
          element.addEventListener('click', () => { btnToAdd.style.display = 'none'; }); // also hide the clone when the other button is clicked!

          const addCommentLink = element.parentElement.querySelector('.js-add-link');
          addCommentLink.addEventListener('click', () => { element.style.display = 'none'; }); // https://github.com/soscripted/sox/issues/239
        });
      }

      copyLinks();
      window.addEventListener('sox-new-comment', copyLinks);
    },

    highlightQuestions: function() {
      // Description: For highlighting only the tags of favorite questions

      function highlight() {
        [...document.querySelectorAll('.tagged-interesting')].forEach(interestingQuestion => {
          interestingQuestion.classList.remove('tagged-interesting');
          interestingQuestion.classList.add('sox-tagged-interesting');
        });
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
        sox.helpers.addAjaxListener('\\/posts\\/ajax-load-realtime-list', highlight);
      }
    },

    displayName: function() {
      // Description: For displaying username next to avatar on topbar

      if (sox.user.loggedIn) {
        const name = sox.user.name;
        const spanUsernameHtml = `<span class="reputation links-container sox-displayName" title="${name}">${name}</span>`;
        document.querySelector('.my-profile').insertAdjacentHTML('afterbegin', spanUsernameHtml);
      }
    },

    colorAnswerer: function() {
      // Description: For highlighting the names of answerers on comments

      function color() {
        [...document.getElementsByClassName('answercell')].forEach(cell => {
          const answerer = cell.querySelector('.post-signature:nth-last-of-type(1) a');
          if (!answerer) return; // e.g. in case of a deleted user
          const answererId = answerer.href.match(/\d+/)[0];
          const commentUsers = [...cell.parentElement.querySelectorAll('.comments .comment-user')];

          commentUsers.forEach(user => {
            if (!user.href || !user.href.contains(`users/${answererId}`)) return;
            user.classList.add('sox-answerer');
          });
        });
      }

      color();
      window.addEventListener('sox-new-comment', color);
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
      const listBtn = `<li class="wmd-button wmd-bullet-button-sox" title="add "-" before every line to make a bullet list">
                         <span style="background-image:none;">&#x25cf;</span>
                       </li>`;

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

      window.addEventListener('sox-edit-window', loopAndAddHandlers);

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
        { 'formatting': 'improved formatting' },
        { 'spelling': 'corrected spelling' },
        { 'grammar': 'fixed grammar' },
        { 'greetings': 'removed thanks/greetings' },
        { 'retag': 'improved usage of tags' },
        { 'title': 'improved title' },
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
            <section>${name}</section>&nbsp;<i><section>${text}</section></i>
            <button class="grid--cell s-btn sox-editComment-editDialogButton" data-name="${name}">Edit</button>
            <button class="grid--cell s-btn s-btn__danger sox-editComment-deleteDialogButton" data-name="${name}">Delete</button>
          </div>`);
        });
        addCheckboxes();
      }

      function createDialogEditReasons() {
        const settingsDialog = sox.helpers.createModal({
          'header': 'SOX: View/Remove Edit Reasons',
          'id': 'dialogEditReasons',
          'html': `<div id="currentValues" class="sox-editComment-currentValues"></div>
                  <br />
                  <h3 style="color: var(--fc-dark)">Add a custom reason</h3>
                  <div class="grid gs4 gsy fd-column" style="display: inline">
                      <div class="grid--cell" style="float: left">
                          <label class="d-block s-label" style="padding-top: 5px">Display reason: </label>
                      </div>
                      <div class="grid ps-relative" style="padding-left: 5px">
                          <input class="s-input" type="text" style="width: 40% !important" id="displayReason">
                      </div>
                  </div>
                  <div class="grid gs4 gsy fd-column" style="display: inline">
                      <div class="grid--cell" style="float: left">
                          <label class="d-block s-label" style="padding-top: 5px">Actual reason: </label>
                      </div>
                      <div class="grid ps-relative" style="padding-left: 5px">
                          <input class="s-input" type="text" style="width: 40% !important" id="actualReason">
                      </div>
                  </div>
                  <input class="s-btn s-btn__primary" type="button" id="submitUpdate" value="Submit">
                  <input class="s-btn s-btn__primary" type="button" id="resetEditReasons" style="float:right;" value="Reset">`,
        });

        $(document).on('click', '#resetEditReasons', () => { //manual reset
          if (confirm('Are you sure you want to reset the settings to the default ones? The page will be refreshed afterwards')) {
            saveOptions(DEFAULT_OPTIONS);
            location.reload();
          }
        });

        document.body.appendChild(settingsDialog);
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
              <label class="sox-editComment-reason"><input class="s-checkbox" type="checkbox" value="${text}"</input>${name}</label>&nbsp;
            `);
          });

          $reasons.find('input[type="checkbox"]').change(function() {
            const reason_value = $(this).val();
            if (this.checked) { //Add it to the summary
              if ($editCommentField.val()) {
                $editCommentField.val($editCommentField.val() + '; ' + reason_value);
              } else {
                $editCommentField.val(toLocaleSentenceCase(reason_value));
              }
              const newEditComment = $editCommentField.val(); //Remove the last space and last semicolon
              $editCommentField.val(newEditComment).focus();
            } else { //Remove it from the summary
              $editCommentField.val($editCommentField.val().replace('; ' + reason_value, '')); //for middle and end values
              $editCommentField.val($editCommentField.val().replace(new RegExp(reason_value + ';? ?', 'i'), '')); //for start values
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

        $(this).html('Save').addClass('sox-editComment-saveDialogButton').parent()
               .find('section').attr('contenteditable', true).css('border', '1px solid var(--black-200)');
        $(document).on('click', '.sox-editComment-saveDialogButton', function() {
          $(this).html('Edit').removeClass('sox-editComment-saveDialogButton').parent().find('section').attr('contenteditable', false).css('border', 'none');
          const newName = $(this).parent().find('section').first().html();
          const newText = $(this).parent().find('section').eq(1).html();

          options[index] = { [newName]: newText };
          saveOptions(options);
          addOptionsToDialog(); //display the items again (update them)
        });
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
      window.addEventListener('sox-edit-window', addCheckboxes);
    },

    shareLinksPrivacy: function() {
      // Description: Remove your user ID from the 'share' link

      [...document.querySelectorAll('.js-share-link')].forEach(element => {
        element.href = element.href.match(/\/(q|a)\/[0-9]+/)[0];
        element.addEventListener('click', () => {
          // Remove the 'includes your user id' string, do it on click because
          // SE's code seems to re-add the element when the share tip is shown
          element.parentElement.querySelector('.js-subtitle').remove();
        });
      });
    },

    shareLinksMarkdown: function() {
      // Description: For changing the 'share' button link to the format [name](link)

      // Remove [] with () in title: https://github.com/soscripted/sox/issues/226, https://github.com/soscripted/sox/issues/292
      const title = document.querySelector('.fs-headline1.fl1').innerText.replace(/\[(closed|duplicate)\]/g, '($1)');
      [...document.querySelectorAll('.js-share-link')].forEach(element => {
        element.addEventListener('click', () => {
          const $inputEl = element.parentElement.querySelector('.js-input');

          // TODO: is there a way to do this without a hacky setTimeout?
          // Seems like SE has some JS that populates the input field which overwrites
          // anything we do unless there's a setTimeout
          setTimeout(() => {
            // The href is relative, so make it absolute
            const href = new URL(element.href, window.location.href).href;
            const textToCopy = `[${title}](${href})`;
            $inputEl.value = textToCopy;
            $inputEl.select();
            GM_setClipboard(textToCopy); // https://github.com/soscripted/sox/issues/177
          }, 0);
        });
      });
    },

    commentShortcuts: function() {
      // Description: For adding support in comments for Ctrl + K, I, B to add code backticks, italicise, and bolden selection

      $('.comments').on('keydown', 'textarea', function (e) {
        const el = $(this).get(0);

        if (e.which == 75 && e.ctrlKey) { // Ctrl + k: add code backticks (`code`)
          sox.helpers.surroundSelectedText(el, '`', '`');
          e.stopPropagation();
          e.preventDefault();
          return false;
        }

        if (e.which == 73 && e.ctrlKey) { // Ctrl + i: italicize (*text*)
          sox.helpers.surroundSelectedText(el, '*', '*');
          e.stopPropagation();
          e.preventDefault();
          return false;
        }

        if (e.which == 66 && e.ctrlKey) { // Ctrl + b bolden (**bold text**)
          sox.helpers.surroundSelectedText(el, '**', '**');
          e.stopPropagation();
          e.preventDefault();
          return false;
        }
      });
    },

    unspoil: function() {
      // Description: For adding a button to reveal all spoilers in a post

      [...document.querySelectorAll('#answers div[id*="answer"], div[id*="question"]')].forEach(element => {
        const buttonHtml = `<span class="lsep">|</span><a id="showSpoiler-${element.id}" href="javascript:void(0)">unspoil</span>`;
        if (element.querySelector('.spoiler')) {
          element.querySelector('.post-menu').insertAdjacentHTML('beforeend', buttonHtml);
        }
      });

      [...document.querySelectorAll('a[id*="showSpoiler"]')].forEach(element => {
        element.addEventListener('click', () => {
          const spoiler = element.id.split(/-(.+)?/)[1];
          [...document.querySelectorAll(`#${spoiler} .spoiler`)].forEach(spoiler => spoiler.classList.remove('spoiler'));
        });
      });
    },

    commentReplies: function() {
      // Description: For adding reply links to comments

      if (!sox.user.loggedIn) return;
      const replyButton = '<span class="soxReplyLink" title="reply to this user" style="margin-left: -7px">&crarr;</span>';

      function addReplyLinks() {
        [...document.querySelectorAll('.comment')].forEach(comment => {
          if (!comment.querySelector('.soxReplyLink')) { // if the link doesn't already exist
            if (sox.user.name !== comment.querySelector('.comment-text a.comment-user').innerText) { // make sure the link is not added to your own comments
              comment.querySelector('.comment-text').overflowX = 'hidden';
              comment.querySelector('.comment-text .comment-body').insertAdjacentHTML('beforeend', replyButton);
            }
          }
        });
      }

      $(document).on('click', 'span.soxReplyLink', function() {
        const parentDiv = $(this).closest('.post-layout');
        const textToAdd = '@' + this.parentElement.querySelector('a.comment-user').innerText.replace(/\s/g, '').replace(/♦/, ''); // e.g. @USERNAME
        if (!parentDiv.find('textarea').length) parentDiv.find('a.js-add-link')[0].click(); //show the textarea, http://stackoverflow.com/a/10559680/

        const $textarea = parentDiv.find('textarea');
        if ($textarea.val().match(/@[^\s]+/)) { //if a ping has already been added
          $textarea.val($textarea.val().replace(/@[^\s]+/, textToAdd)); //replace the @name with the new @name
        } else {
          $textarea.val($textarea.val() + textToAdd + ' '); //add the @name
        }
      });

      addReplyLinks();

      window.addEventListener('sox-new-comment', addReplyLinks);
      window.addEventListener('sox-new-review-post-appeared', addReplyLinks);
    },

    parseCrossSiteLinks: function() {
      // Description: For converting cross-site links to their titles

      const isQuestionLink = /\/(q|questions)\//;
      const FILTER_QUESTION_TITLE = '!)5IW-5QufDkXACxq_MT8aYkZRhm9';

      function expandLinks() {
        [...document.querySelectorAll('.js-post-body a:not(.expand-post-sox), .comment-copy a:not(.expand-post-sox)')].forEach(anchor => {
          const href = anchor.href.replace(/https?:\/\//, '').replace(/www\./, '');
          if (!href) return;

          const sitename = sox.helpers.getSiteNameFromLink(href);
          const questionID = sox.helpers.getIDFromLink(href);

          // if it is a bare link is to a question on a SE site
          if (questionID && sitename && isQuestionLink.test(href) && anchor.innerText.replace(/https?:\/\//, '').replace(/www\./, '') === href) {
            sox.helpers.getFromAPI({
              endpoint: 'questions',
              ids: questionID,
              sitename,
              filter: FILTER_QUESTION_TITLE,
              featureId: 'parseCrossSiteLinks',
              cacheDuration: 10, // Cache for 10 minutes
            }, items => {
              anchor.innerHTML = items[0].title;
            });
          }
        });
      }

      expandLinks();
      window.addEventListener('sox-new-review-post-appeared', expandLinks);
    },

    confirmNavigateAway: function() {
      // Description: For adding a 'are you ure you want to go away' confirmation on pages where you have started writing something

      $(window).bind('beforeunload', () => {
        const textarea = document.querySelector('.comment-form textarea');
        if (textarea && textarea.value) {
          return 'Do you really want to navigate away? Anything you have written will be lost!';
        }
        return;
      });
    },

    sortByBountyAmount: function() {
      // Description: For adding some buttons to sort bounty's by size

      const sortButton = `<button class="s-btn s-btn__muted s-btn__outlined s-btn__sm s-btn__dropdown" role="button" data-controller="s-popover"
                                  data-action="s-popover#toggle" data-target="se-uql.bountyAmount" aria-haspopup="true"
                                  aria-expanded="false" aria-controls="sox-bounty-popover">SOX: sort by bounty</button>`;
      const sortPopover = `<div class="s-popover z-dropdown ws2" id="sox-bounty-popover" data-target="se-uql.bountyAmount"
                                style="margin: 0px;" data-popper-placement="bottom">
                               <div class="s-popover--arrow" style="position: absolute; left: 0px; transform: translate(99px, 0px);"></div>
                               <ul class="list-reset mtn8 mbn8 js-uql-navigation">
                                   <li class="uql-item my0"><a id="largestFirst" class="mln12 mrn12 px12 py6 fl1 s-block-link">Largest first</a></li>
                                   <li class="uql-item my0"><a id="smallestFirst" class="mln12 mrn12 px12 py6 fl1 s-block-link">Smallest first</a></li>
                               </ul>
                           </div>`;

      // Do nothing unless there is at least one bounty on the page
      if (!document.getElementsByClassName('bounty-indicator').length) return;

      [...document.querySelectorAll('.question-summary')].forEach(summary => {
        const indicator = summary.querySelector('.bounty-indicator');
        const bountyAmount = indicator ? indicator.innerText.replace('+', '') : undefined;
        if (bountyAmount) {
          summary.setAttribute('data-bountyamount', bountyAmount); // Add a 'bountyamount' attribute to all the questions
          summary.classList.add('sox-hasBounty');
        }
      });

      // Homepage/questions tab
      const wrapper = document.getElementById('question-mini-list') || document.getElementById('questions');

      // Filter buttons:
      document.querySelector('.uql-nav .js-uql-navigation').insertAdjacentHTML('beforeend', sortButton);
      document.querySelector('#uql-more-popover').insertAdjacentHTML('afterend', sortPopover);

      // Thanks: http://stackoverflow.com/a/14160529/3541881
      document.querySelector('#smallestFirst').addEventListener('click', () => { // Smallest first
        [...wrapper.querySelectorAll('.question-summary.sox-hasBounty')].sort((a, b) => {
          return +b.getAttribute('data-bountyamount') - +a.getAttribute('data-bountyamount');
        }).forEach(element => wrapper.insertAdjacentElement('afterbegin', element));
      });

      document.querySelector('#largestFirst').addEventListener('click', () => { // Largest first
        [...wrapper.querySelectorAll('.question-summary.sox-hasBounty')].sort((a, b) => {
          return +a.getAttribute('data-bountyamount') - +b.getAttribute('data-bountyamount');
        }).forEach(element => wrapper.insertAdjacentElement('afterbegin', element));
      });
    },

    isQuestionHot: function() {
      // Description: For adding some text to questions that are in the hot network questions list

      function getHotDiv(className) {
        const divToReturn = document.createElement('div');
        divToReturn.title = 'SOX: this is a hot network question!';
        divToReturn.className = `sox-hot ${className || ''}`;
        divToReturn.appendChild(sox.sprites.getSvg('hot'));
        return divToReturn;
      }

      function addHotText() {
        if (document.getElementsByClassName('sox-hot').length) return;
        document.getElementById('question-header').prepend(getHotDiv());
      }

      function addHotTextInSummary(summaryElement) {
        summaryElement.querySelector('.summary h3').prepend(getHotDiv('question-list'));
      }

      function questionMatchesCriteria(revisionObject) {
        return revisionObject.comment // there's comment, post was not created at that revision
        && !revisionObject.comment.includes('<b>Post Closed</b> as &quot;') // post is not closed
        && !revisionObject.comment.includes('<b>Removed from Hot Network Questions</b> by') // post has not been removed from HNQ
        && revisionObject.comment === '<b></b> ' && new Date().getTime() / 1000 - revisionObject.creation_date <= 259200; // question is HNQ AND not 3 days old
      }

      if (sox.location.on('/questions')) {
        const postId = window.location.pathname.split('/')[2];
        getIsQuestionHot(postId);
      } else if (document.querySelector('.question-summary')) {
        const questionIds = [];
        [...document.querySelectorAll('.question-summary')].forEach(summary => {
          // Check if .question-summary has an id attribute - SO Teams posts (at the top of the page, if any) don't!
          if (!summary.id) return;
          questionIds.push(summary.id.split('-')[2]);
        });
        getIsQuestionHot(questionIds);
      }


      function getIsQuestionHot(postIds) {
        sox.helpers.getFromAPI({
          endpoint: 'posts',
          childEndpoint: 'revisions',
          sitename: sox.site.currentApiParameter,
          filter: '!SWJaL5tfbL4Ta*2*G*',
          ids: postIds,
          featureId: 'isQuestionHot',
          cacheDuration: 60 * 8, // Cache for 8 hours
        }, results => {
          if (!results) return;
          // There are two cases:
          // 1. We are in a question page (/questions/\d+) and we want to check only 1 question => 1 API call
          // 2. We are in a page with many questions (e.g. /questions). We collect or ids to reduce the API calls and avoid throttling
          // In both cases, we return an array with the ids of the HNQs. Then, the icons are added where necessary

          results.filter(result => questionMatchesCriteria(result))
                 .forEach(item => sox.location.on('/questions') ? addHotText() : addHotTextInSummary(document.querySelector(`#question-summary-${item.post_id}`)));
        });
      }
    },

    localTimestamps: function(settings) {
      // Description: Gets local timestamp

      function updateTimestamps(element) {
        const utcTimestamp = element.title;
        const matches = utcTimestamp.match(/^([\d]{4})-([\d]{2})-([\d]{2}) ([\d]{2}):([\d]{2}):([\d]{2}) ?(?:Z|UTC|GMT(?:[+-]00:?00))/);
        if (!matches) return;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

          if (hour === 0) hour += 12;
        }

        const newTimestamp = month + ' ' + date.getDate() + (new Date().getFullYear() == date.getFullYear() ? '' : ' \'' + year) +' at ' + hour + ':' + minute + dayTime;
        element.innerText = newTimestamp;
      }

      [...document.querySelectorAll('span.relativetime, span.relativetime-clean')].filter(el => el.innerText.contains('at'))
                                                                                  .forEach(element => updateTimestamps(element));
    },

    autoShowCommentImages: function() {
      // Description: For auto-inlining any links to imgur images in comments

      function showImages() {
        [...document.querySelectorAll('.comment .comment-text .comment-copy a')].forEach(anchor => {
          const href = anchor.href;
          const parent = anchor.parentNode;

          if (parent && href && (/i(\.stack)?\.imgur\.com/.test(href))) {
            if (!parent.querySelectorAll('img[src="' + href + '"]').length) {
              // DO NOT USE innerHTML -- it *removes* the old DOM and inserts a new one (https://stackoverflow.com/a/23539150),
              // meaning it won't work for multiple imgur links in the same comment. See https://github.com/soscripted/sox/issues/360
              parent.insertAdjacentHTML('beforeend', `<a href="${href}"><img class="sox-autoShowCommentImages-image" src="${href}" style="max-width:100%"></a>`);
            }
          }
        });
      }

      setTimeout(showImages, 2000); // setTimeout needed because FF refuses to load the feature on page load and does it before so the comment isn't detected.

      window.addEventListener('sox-new-comment', showImages);
      window.addEventListener('sox-new-review-post-appeared', showImages);
    },

    showCommentScores: function() {
      // Description: For adding a button on your profile comment history pages to show your comment's scores

      const sitename = sox.site.currentApiParameter;
      const WHITESPACES = '&nbsp;&nbsp;&nbsp;';
      const COMMENT_SCORE_FILTER = '!)5IW-5QufDkXACxq_MT8bhYD9b.m';

      function addLabelsAndHandlers() {
        [...document.querySelectorAll('.history-table td b a[href*="#comment"]')].forEach(anchor => {
          if (!anchor.parentElement.querySelector('.showCommentScore')) {
            const id = +anchor.href.match(/comment(\d+)_/)[1];

            anchor.insertAdjacentHTML('afterend', `<span class="showCommentScore" id="${id}">${WHITESPACES}show comment score</span>`);
          }
        });

        [...document.querySelectorAll('.showCommentScore')].forEach(button => {
          button.style.cursor = 'pointer';
          button.addEventListener('click', function() {
            sox.helpers.getFromAPI({
              endpoint: 'comments',
              ids: button.id,
              sitename,
              filter: COMMENT_SCORE_FILTER,
              useCache: false, // Single ID, so no point
            }, items => {
              button.innerHTML = WHITESPACES + items[0].score;
            });
          });
        });
      }

      addLabelsAndHandlers();
      sox.helpers.addAjaxListener('\\/ajax\\/users\\/tab\\/\\d+\\?tab=activity&sort=comments', addLabelsAndHandlers);
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
        items.forEach(item => {
          tagsForQuestionIDs[item.question_id] = item.tags;
        });

        answers.forEach(answer => {
          const id = +answer.dataset.questionid;
          const tagsForThisQuestion = tagsForQuestionIDs[id];

          tagsForThisQuestion.forEach(currTag => {
            const $insertedTag = $(answer.querySelector('.summary .tags')).append(`<a href="/questions/tagged/${currTag}" class="post-tag">${currTag}</a>`);
            addClassToInsertedTag($insertedTag);
          });
        });
      });
    },

    stickyVoteButtons: function() {
      // Description: For making the vote buttons stick to the screen as you scroll through a post
      // https://github.com/shu8/SE_OptionalFeatures/pull/14:
      // https://github.com/shu8/Stack-Overflow-Optional-Features/issues/28: Thanks @SnoringFrog for fixing this!

      const containerTopMargin = sox.helpers.getCssProperty(document.querySelector('.container'), 'margin-top');
      const bodyTopPadding = sox.helpers.getCssProperty(document.body, 'padding-top');
      // .votecell is necessary; e.g., the number of votes of questions on the Questions list for a site uses the .vote class too
      [...document.querySelectorAll('.votecell')].forEach(votecell => votecell.classList.add('sox-stickyVoteButtons'));
      // Seems like most sites use margin-top on the container, but Meta and SO use padding on the body
      [...document.querySelectorAll('.votecell .js-voting-container')].forEach(container => {
        container.style.top = parseInt(containerTopMargin.replace('px', '')) + parseInt(bodyTopPadding.replace('px', '')) + 'px';
      });
    },

    metaChatBlogStackExchangeButton: function() {
      // Description: For adding buttons next to sites under the StackExchange button that lead to that site's meta and chat

      [...document.querySelectorAll('#your-communities-section ul li a')].forEach(siteAnchor => {
        siteAnchor.addEventListener('mouseenter', function() {
          const href = this.href.replace(/https?:\/\//, '');
          let link;
          let chatLink = 'https://chat.stackexchange.com?tab=site&host=' + href.replace(/\/.*/, '');

          if (href === 'meta.stackexchange.com') { // Meta SE's chat link is a bit different
            chatLink = 'https://chat.meta.stackexchange.com';
          } else if (href.indexOf('meta') > -1) { // For the usual meta sites
            link = 'https://' + href.split('meta.').shift() + href.split('meta.').pop();
            // We don't need "meta." in the chat links
            chatLink = 'https://chat.stackexchange.com?tab=site&host=' + href.split('meta.').shift() + href.split('meta.').pop().split('/').shift();
          } else if (href.indexOf('.stackexchange.com') > -1 || href.indexOf('.stackoverflow.com') > -1) { // For the majority of SE sites, and other languages of SO
            link = 'https://' + href.split('.').shift() + '.meta' + href.split(href.split('.').shift()).pop();
          } else if (href.indexOf('stackapps') == -1) { // For sites that have unique URLs, e.g. serverfault.com (except StackApps, which has no meta)
            link = 'https://meta.' + href;
          } else if (href.indexOf('stackoverflow.com') > -1 && !href.match(/(pt|ru|es|ja|.meta)/i)) { // English Stack Overflow has a unique chat link
            chatLink = 'https://chat.stackoverflow.com';
          }

          let buttonsHtml = '<div class="related-links" style="float: right; display: none;">';
          if (link) {
            buttonsHtml += href.indexOf('meta') > -1 ? `<a href="${link}">main</a>` : `<a href="${link}">meta</a>`; // if it's meta, link to main and the opposite!
          }
          if (chatLink) buttonsHtml += `<a href="${chatLink}">chat</a>`;
          buttonsHtml += '</div>';

          // All sites have either a chat link or meta link
          $(this.querySelector('.rep-score')).stop(true).delay(135).fadeOut(20);
          this.insertAdjacentHTML('beforeend', buttonsHtml);
          $(this.querySelector('.related-links')).delay(135).css('opacity', 0).animate({
            opacity: 1,
            width: 'toggle',
          }, 200);
        });

        siteAnchor.addEventListener('mouseleave', function() {
          $(this.querySelector('.rep-score')).stop(true).fadeIn(110);
          this.querySelector('.related-links').remove();
        });
      });
    },

    metaNewQuestionAlert: function() {
      // Description: For adding a fake mod diamond that notifies you if there has been a new post posted on the current site's meta

      //Do not run on meta, chat, or sites without a meta
      if ((sox.site.type != 'main' && sox.site.type != 'beta') || !document.querySelector('.related-site')) return;

      // Don't run if the user is a moderator
      if (sox.Stack && sox.Stack.options.user.isModerator) return;

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
      const dialog = document.createElement('div');
      dialog.id = 'metaNewQuestionAlertDialog';
      dialog.className = 'topbar-dialog dno new-topbar';

      const header = document.createElement('div');
      header.className = 'header';

      const anchorToAppend = document.createElement('a');
      anchorToAppend.innerText = 'new meta posts';
      anchorToAppend.href = `//meta.${sox.site.url}`;
      anchorToAppend.style.color = '#0077cc';
      header.appendChild(anchorToAppend);

      const content = document.createElement('div');
      content.className = 'modal-content';

      const questions = document.createElement('ul');
      questions.id = 'metaNewQuestionAlertDialogList';
      questions.className = 'js-items items';

      const diamond = document.createElement('a');
      diamond.id = 'metaNewQuestionAlertButton';
      diamond.className = '-link';
      diamond.title = 'Moderator inbox (recent meta questions)';

      const diamondSvg = sox.sprites.getSvg('diamond');
      diamondSvg.classList.add('svg-icon');
      diamond.insertAdjacentElement('beforeend', diamondSvg);

      //diamond.innerHTML = diamond.innerHTML; //Reloads the diamond icon, which is necessary when adding an SVG using jQuery.
      dialog.appendChild(header);
      content.appendChild(questions);
      dialog.appendChild(content);

      const dialogLi = document.createElement('li');
      dialogLi.classList.add('-item');
      dialogLi.appendChild(diamond);
      document.querySelector('.my-profile').parentElement.insertAdjacentElement('afterend', dialogLi);

      dialog.style.top = sox.helpers.getCssProperty(document.querySelector('.top-bar'), 'height');
      if (document.querySelector('#metaNewQuestionAlertButton')) document.querySelector('.js-topbar-dialog-corral').appendChild(dialog);

      window.addEventListener('mouseup', event => {
        const dialogDisplay = sox.helpers.getCssProperty(dialog, 'display');
        if (event.target.closest('#metaNewQuestionAlertButton') == diamond) { // diamond has been clicked!
          event.preventDefault();
          diamond.classList.toggle('topbar-icon-on');
          dialog.style.display = dialogDisplay == 'none' ? 'block' : 'none';
        } else if (dialogDisplay == 'block' && event.target.closest('#metaNewQuestionAlertDialog') != document.querySelector('#metaNewQuestionAlertDialog')) {
          // if the user has clicked outside the dialog, then hide it
          dialog.style.display = 'none';
          diamond.classList.toggle('topbar-icon-on');
        }
      });

      let lastQuestions = {};
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
          diamond.style.color = '#0077cc';
        }

        let seen = false;
        // Regardless of if there's a new question, show the latest 5
        items.forEach(item => {
          const title = item.title;
          const link = item.link;
          // If one's been seen, the older questions must also have been seen
          if (title === lastQuestions[metaName]) seen = true;
          addQuestion(title, link, seen);
        });

        lastQuestions[metaName] = latestQuestion;

        diamond.addEventListener('click', () => GM_setValue(NEWQUESTIONS, JSON.stringify(lastQuestions)));
      });

      function addQuestion(title, link, seen) {
        const li = document.createElement('li');
        const anchor = document.createElement('a');
        anchor.href = link;
        anchor.style.display = 'flex';

        const icon = document.createElement('div');
        icon.className = 'site-icon favicon ' + favicon;
        icon.style.marginRight = '3px';

        const message = document.createElement('div');
        message.className = 'message-text';
        const h4ToAppend = document.createElement('h4');
        h4ToAppend.innerHTML = title;
        h4ToAppend.style.fontWeight = seen ? 'normal' : 'bold';
        message.appendChild(h4ToAppend);

        anchor.appendChild(icon);
        anchor.appendChild(message);
        li.appendChild(anchor);
        questions.appendChild(li);
      }
    },

    betterCSS: function() {
      // Description: For adding the better CSS for the voting buttons and favourite button

      const betterCssSource = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/shu8/SE-Answers_scripts@master/coolMaterialDesignCss.css" type="text/css">';
      function addCSS() {
        [...document.querySelectorAll('.js-vote-up-btn, .js-vote-down-btn, .js-favorite-btn')].forEach(element => element.classList.add('sox-better-css'));
        document.head.insertAdjacentHTML('beforeend', betterCssSource);
      }
      addCSS();
      window.addEventListener('sox-new-review-post-appeared', addCSS);
    },

    standOutDupeCloseMigrated: function() {
      // Description: For adding cooler signs that a questions has been closed/migrated/put on hod/is a dupe

      // For use in dataset, used for hideCertainQuestions feature compatability
      const QUESTION_STATE_KEY = 'soxQuestionState';
      const FILTER_QUESTION_CLOSURE_NOTICE = '!)Ei)3K*irDvFA)l92Lld3zD9Mu9KMQ59-bgpVw7D9ngv5zEt3';
      const NOTICE_REGEX = /\[(duplicate|closed|migrated)\]$/;

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
        [...document.querySelectorAll('.question-summary .answer-hyperlink, .question-summary .question-hyperlink, .question-summary .result-link a')].forEach(el => {
          el.style.display = 'inline';
        });
        [...document.querySelectorAll('.summary h3')].forEach(header => { header.lineHeight = '1.2em'; }); // Fixes line height on "Questions" page

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
              const duplicateHtml = `&nbsp;<a data-searchsession="/questions/${questionId}" style="display: inline" href="https://${sox.site.url}/q/${questionId}">
                                           <span class="standOutDupeCloseMigrated-duplicate" title="click to visit duplicate">&nbsp;duplicate&nbsp;</span></a>`;
              question.anchor.insertAdjacentHTML('afterend', duplicateHtml);
              break;
            }
            case 'closed': {
              const details = questionDetails.closed_details;
              const users = details.by_users.reduce((str, user) => str + ', ' + user.display_name, '').substr(2);
              const closureDate = new Date(questionDetails.closed_date * 1000);
              const timestamp = closureDate.toLocaleString();
              const buttonHtml = `&nbsp;<span class="standOutDupeCloseMigrated-closed" title="closed as ${details.reason}
                                                                                                     by ${users} on ${timestamp}">&nbsp;closed&nbsp;</span>`;

              question.anchor.insertAdjacentHTML('afterend', buttonHtml);
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

              question.anchor.insertAdjacentHTML('afterend', `&nbsp;<span class="standOutDupeCloseMigrated-migrated" title="${textToAdd}">&nbsp;migrated&nbsp;</span>`);
              break;
            }
            }
          });
        });
      }

      function addQuestionStateInReview() {
        const anchor = document.querySelector('.summary h2 a');
        if (document.querySelector('[class^="standOutDupeCloseMigrated"]') || !anchor || !anchor.innerHTML.match(/closed|duplicate/)) return;
        const aText = anchor.innerHTML;
        const closedDupeMatch = aText.match(/closed|duplicate/)[0];

        anchor.innerHTML = aText.replace(/ \[(closed|duplicate)\]/, '');
        anchor.insertAdjacentHTML('afterend', `&nbsp;<span class="standOutDupeCloseMigrated-${closedDupeMatch}">${closedDupeMatch}</span></a>`);
      }

      addLabels();
      sox.helpers.addAjaxListener('\\/posts\\/ajax-load-realtime-list', addLabels);
      window.addEventListener('sox-new-review-post-appeared', addQuestionStateInReview);
    },

    editReasonTooltip: function() {
      // Description: For showing the latest revision's comment as a tooltip on 'edit [date] at [time]'

      function addTooltips() {
        const ids = [];
        const posts = [];
        [...document.querySelectorAll('.question, .answer')].forEach(post => {
          if (post.querySelectorAll('.post-signature').length > 1) {
            posts.push(post);
            const id = post.getAttribute('data-questionid') || post.getAttribute('data-answerid');
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
          posts.forEach(post => {
            const id = post.getAttribute('data-questionid') || post.getAttribute('data-answerid');
            const revision = revisions.find(r => r.revision_type === 'single_user' && r.post_id === +id);
            if (revision) {
              const unescapedComment = new DOMParser().parseFromString(revision.comment, 'text/html').body.innerText; // hacky way to unescape HTML encoding
              sox.debug(`editReasonTooltip, adding text to tooltip for post ${id}: '${unescapedComment}'`);
              post.querySelectorAll('.post-signature')[0].querySelector('.user-action-time a').title = unescapedComment;
            }
          });
        });
      }

      addTooltips();
      window.addEventListener('sox-new-review-post-appeared', addTooltips);
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
        const toAppend = itemid.length > 0 ? '-' + itemid : ''; // helps select tags specific to the question/answer being
        // edited (or new question/answer being written)
        setTimeout(() => {
          if (jNode.closest('.post-editor').find('.sox-sbs-toggle').length) return; //don't add again if already exists

          const sbsBtn = `<li class="wmd-button sox-sbs-toggle" title="side-by-side-editing" style="left: 500px;width: 170px;">
                          <div id="wmd-sbs-button${toAppend}" style="background-image: none;">SBS</div></li>`;
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
      window.addEventListener('sox-edit-window', () => {
        const target = [...document.querySelectorAll('.question, .answer')].filter(post => !post.querySelector('.sox-sbs-toggle'))[0];
        if (!target) return;
        SBS(target.querySelector('textarea'));
      });

    },

    addAuthorNameToInboxNotifications: function(settings) {
      // Description: To add the author's name to inbox notifications

      function setAuthorName(node) {
        //for https://github.com/soscripted/sox/issues/347
        const prependToMessage = Object.keys(settings).length !== 0 ? settings.addNameBeforeMessageOrAtTop : false;
        const link = node.firstElementChild.href;
        if (!link) return;
        let id;
        const matches = {
          comments: ['posts/comments', '!SWJnaN4ZecdHc*iADu'],
          answers: ['com/a/', '!1zSn*g7xPUIQr.yCmkAiu'],
          'suggested-edits': ['/suggested-edits/', '!Sh2oL2BQQ2W(roUyy9'],
        };

        let filter;
        const sitename = sox.helpers.getSiteNameFromLink(link);

        let apiCallType = null;
        for (const key in matches) {
          if (Object.prototype.hasOwnProperty.call(matches, key) && link.indexOf(matches[key][0]) > -1) {
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
          if (!items.length) return;
          // https://github.com/soscripted/sox/issues/233

          const author = (link.indexOf('/suggested-edits/') > -1 ? items[0].proposing_user.display_name : items[0].owner.display_name);
          const unescapedAuthor = new DOMParser(author, 'text/html').body.innerText;

          const authorElement = document.createElement('span');
          authorElement.className = 'sox-notification-author';
          authorElement.innerText = (prependToMessage ? '' : ' by ') + unescapedAuthor + (prependToMessage ? ': ' : ''); // https://github.com/soscripted/sox/issues/347


          const header = node.querySelector('.item-header');
          const type = header.querySelector('.item-type').cloneNode(true);
          const creation = header.querySelector('.item-creation').cloneNode(true);

          if (prependToMessage) {
            node.querySelector('.item-summary').insertAdjacentHTML('afterbegin', author);
          } else {
            //fix conflict with soup fix mse207526 - https://github.com/vyznev/soup/blob/master/SOUP.user.js#L489
            header.innerHTML = '';
            header.appendChild(type);
            header.appendChild(author);
            header.appendChild(creation);
          }
        });
      }

      const inboxClass = 'inbox-dialog';
      const PROCESSED_CLASS = 'sox-authorNameAdded';
      const MAX_PROCESSED_AT_ONCE = 20;

      sox.helpers.addAjaxListener('\\/topbar\\/inbox', () => {
        const inboxDialog = document.getElementsByClassName(inboxClass)[0];
        let eligibleElements = [...inboxDialog.querySelectorAll('.inbox-item')];
        eligibleElements = eligibleElements.slice(0, MAX_PROCESSED_AT_ONCE);

        const unprocessedElements = eligibleElements.filter(e => !e.classList.contains(PROCESSED_CLASS));
        unprocessedElements.forEach(element => {
          setAuthorName(element);
          element.classList.add(PROCESSED_CLASS);
        });
      });
    },

    flagOutcomeTime: function() {
      // Description: For adding the flag outcome time to the flag page
      //https://github.com/shu8/Stack-Overflow-Optional-Features/pull/32

      [...document.querySelectorAll('.flag-outcome')].forEach(element => {
        element.insertAdjacentHTML('beforeend', ' – ' + element.title);
      });
    },

    scrollToTop: function() {
      // Description: For adding a button at the bottom right part of the screen to scroll back to the top
      //https://github.com/shu8/Stack-Overflow-Optional-Features/pull/34

      const scrollSprite = sox.sprites.getSvg('top', 'Scroll to top (SOX)');
      const scrollDiv = document.createElement('div');
      scrollDiv.id = 'sox-scrollToTop';
      scrollDiv.addEventListener('click', event => {
        event.preventDefault();
        $('html, body').animate({
          scrollTop: 0,
        }, 50);
      });
      scrollDiv.appendChild(scrollSprite);
      document.body.appendChild(scrollDiv);

      if (window.pageYOffset < 150) document.querySelector('#sox-scrollToTop').style.display = 'none';

      window.addEventListener('scroll', () => {
        window.pageYOffset > 150 ? $('#sox-scrollToTop').fadeIn() : $('#sox-scrollToTop').fadeOut();
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
        PENDING: 'pending',
        HELPFUL: 'helpful',
        DECLINED: 'declined',
        DISPUTED: 'disputed',
        AGEDAWAY: 'aged away',
        RETRACTED: 'retracted',
      };

      let count;
      let percentage;

      function addPercentage(group, type, percentage) {
        const span = document.createElement('span');
        span.innerText = `(${percentage}%)`;
        span.className = 'sox-percentage-span';
        const flagTypeEl = [...document.querySelectorAll(`li a[href*="group=${group}"]`)].filter(el => el.innerText.match(type))[0];
        if (!flagTypeEl) return;
        [...flagTypeEl.querySelectorAll('div')].shift().insertAdjacentElement('afterend', span);
      }

      function calculatePercentage(count, total) {
        const percent = (count / total) * 100;
        return +percent.toFixed(2);
      }

      function getFlagCount(group, type) {
        let flagCount = 0;
        const groupHeader = document.querySelector(`li a[href="?group=${group}"]`);
        const liOfType = [...groupHeader.nextElementSibling.querySelectorAll('li')].filter(el => el.innerText.match(type))[0];
        if (!liOfType) return;
        flagCount += Number([...liOfType.querySelectorAll('div')].pop().innerText.replace(/[\D]/g, '')); // Strip any non-digit characters (e.g. commas)
        return flagCount;
      }

      // Add percentages
      for (const groupKey in group) {
        const item = group[groupKey];

        // Strip any non-digit characters (e.g. commas)
        const total = +[...document.querySelector(`li a[href="?group=${item}"]`).querySelectorAll('div')].pop().innerText.replace(/[\D]/g, '');

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

      function addButton() {
        [...document.querySelectorAll('.js-post-body a, .comments .comment-copy a')].forEach(element => {
          const url = element.href;

          // http://stackoverflow.com/a/4815665/3541881
          if (url && url.match(/q(?:uestions)?|a/) &&
              !url.includes('#comment') &&
              !url.includes('/edit') && // https://github.com/soscripted/sox/issues/281
              !url.includes('/tagged/') &&
              !url.includes('web.archive.org') && // shouldn't be a Web Archive URL
              !url.includes('/c/') && // shouldn't be a SO Teams post
              sox.helpers.getIDFromLink(url) && // make sure it won't fail later on
              sox.helpers.getSiteNameFromLink(url) && // should be a Stack Exchange link!
              url.match(/\/(q(?:uestions)?|a)\//) && // should be a question or an answer link!
              (!element.previousElementSibling || !element.previousElementSibling.classList.contains('expand-post-sox'))) {
            element.insertAdjacentHTML('beforebegin', '<a class="expander-arrow-small-hide expand-post-sox" style="border-bottom: 0"></a>');
          }
        });
      }

      addButton();
      window.addEventListener('sox-new-review-post-appeared', addButton);

      [...document.querySelectorAll('a.expand-post-sox')].forEach(arrow => {
        arrow.addEventListener('click', function() {
          if (arrow.classList.contains('expander-arrow-small-show')) {
            arrow.classList.remove('expander-arrow-small-show');
            arrow.classList.add('expander-arrow-small-hide');
            arrow.nextElementSibling.nextElementSibling.remove();
          } else if (arrow.classList.contains('expander-arrow-small-hide')) {
            arrow.classList.remove('expander-arrow-small-hide');
            arrow.classList.add('expander-arrow-small-show');
            let url = arrow.nextElementSibling.href;
            const id = sox.helpers.getIDFromLink(url);
            if (!url.match(/https?:\/\//)) url = 'https://' + url;
            sox.helpers.getFromAPI({
              endpoint: 'posts',
              ids: id,
              sitename: sox.helpers.getSiteNameFromLink(url),
              filter: '!)qFc_3CbvFS40DqE0ROu',
              featureId: 'linkedPostsInline',
              cacheDuration: 60, // Cache for 60 minutes
            }, results => {
              const postHtml = `<div class="linkedPostsInline-loaded-body-sox"><div style="text-align:center">${results[0].title}</div><br>${results[0].body}</div>`;
              const deletedHtml = '<div class="linkedPostsInline-loaded-body-sox"><strong>Post was not found through the API. It may have been deleted</strong></div>';
              arrow.nextElementSibling.insertAdjacentHTML('afterend', results.length ? postHtml : deletedHtml);
            });
          }
        });
      });
    },

    hideHireMe: function() {
      // Description: Hides the Looking for a Job module from the sidebar

      const hireMe = document.querySelector('#hireme');
      if (hireMe) hireMe.remove();
    },

    hideCommunityBulletin: function() {
      // Description: Hides the Community Bulletin module from the sidebar

      document.querySelector('#sidebar .s-sidebarwidget').remove();
    },

    hideJustHotMetaPosts: function() {
      // Description: Hide just the 'Hot Meta Posts' sections in the Community Bulletin

      const sidebar = document.querySelector('#sidebar .s-sidebarwidget');
      if (!sidebar) return; // probably the user has another feature that removes the whole bulletin
      const bulletinArray = [...sidebar.children[0].children];
      const hotMetaPostsIndex = bulletinArray.findIndex(item => item.innerText.contains("Hot Meta Posts"));
      bulletinArray.splice(hotMetaPostsIndex).forEach(element => element.remove());
    },

    hideChatSidebar: function() {
      // Description: Hides the Chat module from the sidebar

      const chatModule = document.querySelector('#sidebar #chat-feature');
      if (chatModule) chatModule.remove();
    },

    hideLoveThisSite: function() {
      // Description: Hides the "Love This Site?" (weekly newsletter) module from the sidebar

      const loveThisSite = document.querySelector('#sidebar #newsletter-ad');
      if (loveThisSite) loveThisSite.remove();
    },

    chatEasyAccess: function() {
      // Description: Adds options to give a user read/write/no access in chat from their user popup dialog

      const currentUserObject = sox.Chat.RoomUsers.current();
      if (!(currentUserObject.is_owner || currentUserObject.is_moderator)) return; // only ROs and mods can grant access to other users
      const accessButtons = '<div class="chatEasyAccess">give <b id="read-only">read</b> / <b id="read-write">write</b> / <b id="remove">no</b> access</div>';

      window.addEventListener('sox-chat-user-popup', () => {
        const node = document.querySelector('.popup.user-popup');
        const nodeParent = node.parentElement;
        const id = nodeParent.querySelector('a').href.split('/')[4];

        if (nodeParent.querySelector('.chatEasyAccess')) return;
        if (document.querySelector('.chatEasyAccess')) document.querySelector('.chatEasyAccess').remove();

        node.insertAdjacentHTML('beforeend', accessButtons);
        $(document).on('click', '.chatEasyAccess b', async function() {
          const data = new FormData();
          data.append('fkey', fkey().fkey);
          data.append('userAccess', this.id);
          data.append('aclUserId', id);
          const response = await fetch('https://' + window.location.host + '/rooms/setuseraccess/' + location.href.split('/')[4], {
            method: 'POST',
            body: data
          });
          const text = await response.text();
          Notifier().notify(text === '' ? 'Successfully changed user access' : text);
        });
      });
    },

    topAnswers: function() {
      // Description: Adds a box above answers to show the most highly-scoring answers

      let count = 0;
      const topAnswers = document.createElement('div');
      topAnswers.id = 'sox-top-answers';

      const table = document.createElement('table');
      table.style.margin = '0 auto';

      const row = document.createElement('tr');

      table.appendChild(row);
      topAnswers.appendChild(table);

      function score(e) {
        return +e.parentElement.querySelector('.js-vote-count').innerText;
      }

      function compareByScore(a, b) {
        return score(b) - score(a);
      }

      [...document.querySelectorAll('.answercell')].slice(1).sort(compareByScore).slice(0, 5).forEach(element => {
        count++;
        const id = element.closest('.answer').getAttribute('data-answerid');
        const score = element.previousElementSibling.querySelector('.js-vote-count').innerText;
        let icon = 'vote-up-off';

        if (score > 0) {
          icon = 'vote-up-on';
        } else if (score < 0) {
          icon = 'vote-down-on';
        }

        const column = document.createElement('td');
        column.style.width = '100px';
        column.style.textAlign = 'center';

        const link = document.createElement('a');
        link.href = `#${id}`;

        const iconEl = document.createElement('i');
        iconEl.className = icon;
        iconEl.style.marginBotton = '0';

        link.appendChild(iconEl);
        link.insertAdjacentHTML('beforeend', 'Score: ' + score);
        column.appendChild(link);
        row.appendChild(column);
      });

      if (count > 0 && !document.querySelector('#sox-top-answers')) {
        document.querySelector('#answers div.answer').insertAdjacentElement('beforebegin', topAnswers);
        table.style.width = count * 100 + 'px';
      }
    },

    tabularReviewerStats: function() {
      // Description: Display reviewer stats on /review/suggested-edits in table form
      // Idea by lolreppeatlol @ http://meta.stackexchange.com/a/277446 :)

      function displayStats() {
        if (document.querySelector('.sox-tabularReviewerStats-table') || document.querySelector('.js-review-actions').children.length == 5) return;
        let table = '<table class="sox-tabularReviewerStats-table"><tbody><tr><th align="center">User</th><th>Approved</th><th>Rejected</th><th>Improved</th></tr>';

        [...document.querySelectorAll('.js-review-more-instructions ul li')].forEach(element => {
          const username = element.querySelector('a').innerText ? element.querySelector('a').innerText : 'Anonymous</span>';
          const link = element.querySelector('a').href ? `a href="${element.querySelector('a').href}"` : 'span';
          const state = element.innerText.match(/\d+(?=\sedit\ssuggestions?)/g);
          table += `<tr><td><${link}>${username}</td><td>${state[0]}</td><td>${state[1]}</td><td>${state[2] ? state[2] : 'N/A'}</td></tr>`;
        });
        table += '</tbody></table>';

        [...document.querySelectorAll('.js-review-more-instructions *')].forEach(element => element.remove());
        document.querySelector('.js-review-more-instructions').insertAdjacentHTML('beforeend', table);
      }

      displayStats();
      window.addEventListener('sox-new-review-post-appeared', displayStats);
    },

    linkedToFrom: function() {
      // Description: Add an arrow to linked posts in the sidebar to show whether they are linked to or linked from

      function getSprite(state, tooltip) {
        const linkedToSprite = sox.sprites.getSvg(`chevron_${state}`, tooltip);
        linkedToSprite.classList.add('sox-linkedToFrom-chevron');
        return linkedToSprite;
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
        [...document.querySelectorAll('.linked .spacer a.question-hyperlink')].forEach(anchor => {
          const id = +anchor.href.match(/\/(\d+)\//)[1];

          if ([...document.querySelectorAll('a[href*="' + id + '"]')].filter(el => document.querySelector('#sidebar a') !== el).length > 2) {
            // If a link from 'linked questions' does exist elsewhere on this page (except from the linked section!)
            // then we know that this page definitely references the linked post
            anchor.appendChild(getSprite('right', 'Current page links to this question'));

            // However, the linked post might also reference the current page, so let's check:
            if (pagesThatLinkToThisPage.find(question => question.question_id === currentPageId && question.qustion_id === id)) {
              // The current page is linked to from question_id (which is also the current anchor in the loop)
              sox.debug(`linkedToFrom: link to current page (${currentPageId}) exists on question ${id}`);
              anchor.appendChild(getSprite('left', 'This question links to the current page'));
            } else {
              sox.debug(`linkedToFrom: link to current page not found on question ${id}`);
            }
          } else {
            // If a link from 'linked questions' doesn't exist on the rest of the page
            // Then it must be there _only_ due to the fact that the linked post references the current page
            anchor.appendChild(getSprite('left', 'This question links to the current page'));
          }
        });
      });
    },

    quickAuthorInfo: function() {
      // Description: Shows when the post's author was last active and their registration state

      const unregisteredHtml = '<span title="SOX: this user is unregistered" class="sox-quickAuthorInfo-unregistered">(unregistered)</span>';

      function addLastSeen(userDetailsFromAPI) {
        [...document.querySelectorAll('.user-details a[href^="/users"]')].forEach(element => {

          const parentDiv = element.parentElement.parentElement;
          const id = sox.helpers.getIDFromAnchor(element);
          if (!id || !(userDetailsFromAPI[id] && !parentDiv.querySelector('.sox-last-seen'))) return;

          const lastSeenDate = new Date(userDetailsFromAPI[id].last_seen);

          const infoDiv = document.createElement('div');
          infoDiv.className = 'sox-quickAuthorInfo-details';
          infoDiv.title = 'SOX: last seen';

          // https://github.com/soscripted/sox/issues/204: hacky but short way: replace T with '.000' because SE doesn't do such precise times
          const timeHtml = `<time class="timeago sox-last-seen" datetime="${lastSeenDate.toISOString()}"
                                  title="${lastSeenDate.toJSON().replace('T', ' ').replace('.000', '')}"
                                  value="${lastSeenDate.toLocaleString()}"></time>`;

          infoDiv.appendChild(sox.sprites.getSvg('access_time'));
          infoDiv.insertAdjacentHTML('beforeend', timeHtml);

          parentDiv.appendChild(infoDiv);
          if (userDetailsFromAPI[id].type === 'unregistered') {
            element.insertAdjacentHTML('afterend', unregisteredHtml);
          }
        });

        $('time.timeago').timeago();
      }

      function getIdsAndAddDetails(postAuthors) {
        [...document.querySelectorAll('.user-details a[href^="/users"]')].forEach(anchor => {
          let userid, username;

          if (anchor) {
            userid = sox.helpers.getIDFromAnchor(anchor);
            username = anchor.innerText;

            if (userid > 0) postAuthors[userid] = username;
          } else {
            sox.loginfo('Could not find user user link for: ', this);
          }
        });

        sox.helpers.getFromAPI({
          endpoint: 'users',
          ids: Object.keys(postAuthors),
          sitename: sox.site.currentApiParameter,
          filter: '!*MxL2H2Vp3iPIKLu',
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

          window.addEventListener('sox-new-comment', () => { // make sure it doesn't disappear when adding a new comment!
            addLastSeen(userDetailsFromAPI);
          });
        });
      }

      // key: id, value :username
      const postAuthors = {};

      window.addEventListener('sox-new-review-post-appeared', () => {
        getIdsAndAddDetails(postAuthors);
      });

      getIdsAndAddDetails(postAuthors);
    },

    hiddenCommentsIndicator: function() {
      // Description: Darkens the border underneath comments if there are hidden comments underneath it

      const baseUrl = location.protocol + '//' + location.hostname;
      [...document.querySelectorAll('.question, .answer')].forEach(post => {
        if (!post.querySelector('.js-show-link.comments-link').offsetParent) return; // check if element is visible; thanks https://stackoverflow.com/a/21696585!
        const postId = post.getAttribute('data-questionid') || post.getAttribute('data-answerid');

        fetch(`${baseUrl}/posts/${postId}/comments`).then(response => response.text()).then(html => {
          const parsedHtml = new DOMParser().parseFromString(html, 'text/html');
          const currentCommentsElements = [...document.querySelectorAll('#comments-' + postId + ' .comment-text')];
          const missingCommentsElements = [...parsedHtml.querySelectorAll('.comment-text')]
                                                        .filter(el => !currentCommentsElements
                                                        .map(currEl => currEl.parentElement.id)
                                                        .includes(el.parentElement.id));
          if (!missingCommentsElements.length) return; // there are no additional comments

          for (let el of missingCommentsElements) {
            const previousElement = el.parentElement.previousElementSibling;
            const nearestElement = previousElement || el.parentElement.nextElementSibling;
            if (!nearestElement || !document.getElementById(nearestElement.id)) continue; // in case there are two consecutive hidden comments
            const borderDirection = previousElement ? 'bottom' : 'top';
            [...document.getElementById(nearestElement.id).children].forEach(el => { el.style[`border-${borderDirection}-color`] = 'gray'; });
          }
        });
      });
    },

    hotNetworkQuestionsFiltering: function(settings) {
      // Description: Filter hot network questions in the sidebar based on their attributes such as title, site, etc.

      function createRegex(list) {
        return new RegExp('\\b' + list.replace(',', '|').replace(' ', '') + '\\b', 'i');
      }

      const WORDS_TO_BLOCK = settings.wordsToBlock;
      let SITES_TO_BLOCK = settings.sitesToBlock && settings.sitesToBlock.split(',');
      const TITLES_TO_HIDE = settings.titlesToHideRegex && settings.titlesToHideRegex.split(',');

      [...document.querySelectorAll('#hot-network-questions li a')].forEach(element => {
        const href = element.href;
        const questionTitle = element.innerText;

        // NOTE: to hide questions, we use a class that has 'display: none !important'.
        // This is to make sure questions that were previously hidden don't appear after
        // the user clicks 'more hot questions', because the questions are *already* on
        // the page before the button is clicked, but just hidden!

        if (WORDS_TO_BLOCK) {
          if (createRegex(WORDS_TO_BLOCK).test(element.innerText)) element.parentElement.classList.add('sox-hot-network-question-filter-hide');
        }

        if (SITES_TO_BLOCK) {
          SITES_TO_BLOCK.forEach(site => {
            if (sox.location.matchWithPattern(site, href)) {
              element.parentElement.classList.add('sox-hot-network-question-filter-hide');
            }
          });
        }

        if (TITLES_TO_HIDE) {
          TITLES_TO_HIDE.forEach(title => {
            if (new RegExp(questionTitle).test(title)) {
              element.parentElement.classList.add('sox-hot-network-question-filter-hide');
            }
          });
        }
      });
    },

    warnNotLoggedIn: function() {
      // Description: Add a small notice at the bottom left of the screen if you are not logged in when browsing an SE site

      const divToShow = document.createElement('div');
      divToShow.id = 'loggedInReminder';
      divToShow.innerHTML = 'SOX: You are not logged in. You should <a href="/users/login">log in</a> to continue enjoying SE.';

      function checkAndAddReminder() {
        if (sox.user.loggedIn) return; // throws error otherwise
        if (!sox.location.on('winterbash') && !document.querySelector('#loggedInReminder')) {
          document.querySelector('.container').appendChild(divToShow);
        } else {
          document.querySelector('#loggedInReminder').remove();
        }
      }

      checkAndAddReminder();
      setInterval(checkAndAddReminder, 300000); // 5 mins
    },

    disableVoteButtons: function() {
      // Description: disables vote buttons on your own or deleted posts, which you cannot vote on
      // https://github.com/soscripted/sox/issues/309, https://github.com/soscripted/sox/issues/335

      // Grays out vote buttons for deleted posts
      [...document.querySelectorAll('.deleted-answer .vote-down-off, .deleted-answer .vote-up-off, .deleted-answer .vote-count-post')].forEach(element => {
        element.style.cursor = 'default';
        element.style.opacity = '0.5';
        element.style.pointerEvents = 'none'; // disables the anchor tag (jQuery off() doesn't work)
      });

      // Grays out votes on own posts
      const opDetails = [...document.querySelectorAll('.user-details')].filter(user => user.getAttribute('itemprop') && user.querySelector('a')
                                                                                    && user.querySelector('a').href.match(sox.user.id));
      if (!opDetails.length) return;
      [...opDetails.closest('.answer, .question').querySelectorAll('.js-vote-up-btn, .js-vote-down-btn')].forEach(el => {
        el.classList.remove('sox-better-css');
        el.classList.add('sox-disabled-button');
        el.title = 'You cannot vote on your own posts.';
      });
    },

    replyToOwnChatMessages: function() {
      // Description: Adds a reply button to your own chat messages so you can reply to your own messages easier and quicker
      // I use $(document).on instead of .each, since using .each wouldn't apply to messages loaded via "Load more messages" and "Load to my last message"

      const replySpan = document.querySelector('.newreply').cloneNode(true);
      replySpan.classList.add('added-by-sox');

      $(document).on('mouseenter', '.mine .message, .mine .timestamp', function() {
        //Remove excess spacing to the left of the button (by emptying .meta, which has "&nbsp" in it), and set the button color to the background color
        const metaElement = this.parentElement.querySelector('.meta');
        metaElement.innerHTML = '';
        metaElement.style.backgroundColor = sox.helpers.getCssProperty(this.parentElement, 'background-color');
        metaElement.style.paddingRight = '1px'; // The "padding-right: 1px" is to avoid some weird bug I can't figure out how to fix
        metaElement.appendChild(replySpan);
        metaElement.style.display = 'block';
      }).on('mouseleave', '.mine .message, .mine .timestamp', function() {
        const metaElement = this.parentElement.querySelector('.meta');
        metaElement.style.display = 'none';
        metaElement.querySelector('.newreply').remove();
      }).on('click', '.newreply.added-by-sox', function() {
        const message = this.closest('.message');
        const input = document.querySelector('#input');
        const rest = input.value.replace(/^:([0-9]+)\s+/, '');
        input.value = `:${message.id.split('-')[1]} ${rest}`;
        input.focus();
      });
    },

    hideCertainQuestions: function(settings) {
      // Description: Hide certain questions depending on your choices

      if (settings.duplicate || settings.closed || settings.migrated || settings.onHold) {
        [...document.querySelectorAll('.question-summary')].forEach(summary => { // Find the questions and add their id's and statuses to an object
          const text = summary.querySelectorAll('.summary a')[0].innerText.trim();
          if ((text.endsWith("[duplicate]") && settings.duplicate)
              || (text.endsWith("[closed]") && settings.closed)
              || (text.endsWith("[migrated]") && settings.migrated)) {
            summary.style.display = 'none';
          }
        });
      }
      if (settings.deletedAnswers) {
        const deletedAnswers = document.querySelectorAll('.answer.deleted-answer');
        deletedAnswers.forEach(answer => { answer.style.display = 'none'; });
        $('.answers-subheader h2').append(' (' + deletedAnswers.length + ' deleted & hidden)');
      }
    },

    inlineEditorEverywhere: function() {
      // Description: Enabled inline editor on all sites
      // Written by @nicael: http://stackapps.com/questions/6216/inline-editor-regardless-of-reputation, and copied with nicael's permission

      if (!sox.Stack) { // check if the StackExchange object is initialised
        sox.warn('inlineEditorEverywhere error: sox.Stack.using not found');
        sox.debug('inlineEditorEverywhere: Stack object:', sox.Stack);
        return;
      }

      const suggestedEditPost = document.querySelector('.suggest-edit-post');
      if (suggestedEditPost) {
        suggestedEditPost.classList.remove('suggest-edit-post');
        suggestedEditPost.classList.add('edit-post');
      }
      sox.Stack.using('inlineEditing', () => {
        sox.Stack.inlineEditing.init();
      });
    },

    flagPercentageBar: function() {
      // Description: Adds a coloured percentage bar above the pane on the right of the flag summary page to show percentage of helpful flags

      let helpfulFlags = 0;
      [...document.querySelectorAll('li a div')].filter(div => div.innerText == 'helpful').forEach(element => {
        helpfulFlags += parseInt(element.parentElement.lastElementChild.innerText.replace(',', ''));
      });

      let declinedFlags = 0;
      [...document.querySelectorAll('li a div')].filter(div => div.innerText == 'declined').forEach(element => {
        declinedFlags += parseInt(element.parentElement.lastElementChild.innerText.replace(',', ''));
      });

      if (helpfulFlags < 0) return;

      let percentHelpful = Number(Math.round((helpfulFlags / (helpfulFlags + declinedFlags)) * 100 + 'e2') + 'e-2');
      if (percentHelpful > 100) percentHelpful = 100;

      let percentColor;
      if (percentHelpful >= 90) {
        percentColor = 'var(--green-500)';
      } else if (percentHelpful >= 80) {
        percentColor = 'var(--orange-500)';
      } else if (percentHelpful < 80) {
        percentColor = 'var(--red)';
      }

      const percentageBar = `<h3 id="sox-flagPercentHelpful" title="only helpful and declined flags are counted">
                               <span id="sox-flagPercentage-percent">${percentHelpful}%</span> helpful</h3>`;
      const wrapperDiv = document.createElement('div');
      wrapperDiv.className = 'sox-flagPercentProgressBar-container';

      // This is for the dynamic part; the rest of the CSS is in the main CSS file
      GM_addStyle(`#sox-flagPercentProgressBar:after {
                       background: ${percentColor};
                       width: ${percentHelpful}%;
                   }
                   #sox-flagPercentHelpful span#sox-flagPercentage-percent { color: ${percentColor} };`);

      wrapperDiv.innerHTML = percentageBar + '<div id="sox-flagPercentProgressBar"></div>';
      document.querySelector('#flag-summary-filter').insertAdjacentElement('afterend', wrapperDiv);
    },

    showMetaReviewCount: function() {
      // Description: Adds the total count of meta reviews on the main site on the /review page

      const metaUrl = sox.Stack.options.site.childUrl;
      // CORS proxy
      const requestUrl = `https://cors-anywhere.herokuapp.com/${metaUrl}/review`;

      fetch(requestUrl).then(response => response.text()).then(htmlResponse => {
        const doc = new DOMParser().parseFromString(htmlResponse, 'text/html');

        let total = 0;
        [...doc.querySelectorAll('#content .grid.bt .fs-subheading')].forEach(element => { total += +element.innerText || null; });

        const lastReviewRow = document.querySelector('#content .jc-space-between div').lastElementChild.previousElementSibling;

        // Clone the existing bottom-most review div
        const metaDashboardEl = lastReviewRow.cloneNode(true);

        // Cache the left and right sections
        const leftSection = metaDashboardEl.children[0];
        const rightSection = metaDashboardEl.children[1];

        // Set number of reviews
        const subheading = leftSection.querySelector('.fs-subheading');
        subheading.innerText = total;
        subheading.title = total;

        // Set 'reviews' text (instead of e.g. 'edits')
        leftSection.querySelector('.mt2').innerText = 'reviews';

        const rightSectionAnchor = rightSection.querySelector('a');
        rightSectionAnchor.innerText = 'Meta Reviews';
        rightSectionAnchor.href = `${metaUrl}/review`;
        rightSection.querySelector('.fs-body2').innerText = 'SOX: Total reviews available on this site\'s meta at the moment';
        rightSection.querySelector('.fs-body2').nextElementSibling.remove();
        rightSection.children[1].remove(); // Remove the user avatars from the new row

        lastReviewRow.insertAdjacentElement('afterend', metaDashboardEl);
      });
    },

    copyCode: function() {
      // Description: Add a button to code in posts to let you copy it

      // button uses CSS mainly from http://stackoverflow.com/a/30810322/3541881
      function addButton() {
        // https://github.com/soscripted/sox/issues/218#issuecomment-281148327 reason for selector:
        // http://stackoverflow.com/a/11061657/3541881

        const copySprite = sox.sprites.getSvg('copy', 'Copy code to clipboard (SOX)');
        copySprite.classList.add('sox-copyCodeButton');

        [...document.querySelectorAll('pre')].filter(el => !el.previousElementSibling || !el.previousElementSibling.classList.contains('sox-copyCodeButton'))
                                             .forEach(pre => {
          pre.insertAdjacentElement('beforebegin', copySprite.cloneNode(true));
          pre.addEventListener('mouseover', () => { pre.previousElementSibling.style.display = 'block'; });
          pre.addEventListener('mouseleave', () => { pre.previousElementSibling.style.display = 'none'; });
        });

        [...document.querySelectorAll('.sox-copyCodeButton')].forEach(button => {
          button.addEventListener('mouseover', () => { button.style.display = 'block'; });
          button.addEventListener('mouseleave', () => { button.style.display = 'none'; });
        });
      }

      addButton();
      window.addEventListener('sox-new-review-post-appeared', addButton);

      $(document).on('click', '.sox-copyCodeButton', function() {
        const copyCodeTextareas = document.getElementsByClassName('sox-copyCodeTextarea');
        if (!copyCodeTextareas.length) document.body.insertAdjacentHTML('afterend', '<textarea class="sox-copyCodeTextarea">');

        const textToCopy = this.nextElementSibling.innerText;
        copyCodeTextareas[0].value = textToCopy;
        copyCodeTextareas[0].select();
        GM_setClipboard(textToCopy);
        $(this).effect('highlight', {
          color: 'white',
        }, 3000);
      });
    },

    openLinksInNewTab: function(settings) {
      // Description: Open any links to the specified sites in a new tab by default

      const openSprite = sox.sprites.getSvg('launch', 'SOX: this link will open in a new tab');
      openSprite.classList.add('sox-openLinksInNewTab-externalLink');
      settings = settings.linksToOpenInNewTab;
      if (!settings) return;
      settings = settings.replace(' ', '').split(',');

      if (settings.length) { // https://github.com/soscripted/sox/issues/300
        [...document.querySelectorAll('.js-post-body a')].forEach(anchor => {
          settings.forEach(setting => {
            if (sox.location.matchWithPattern(setting, anchor.href)) {
              anchor.insertAdjacentHTML('beforeend', openSprite[0].outerHTML);
              anchor.target = 'blank';
            }
          });
        });
      }
    },

    findAndReplace: function() { // Salvaged from old 'enhanced editor' feature
      // Description: adds a 'find and replace' option to the markdown editor

      const findAndReplaceBoxHtml = `<div class="sox-findReplaceInputs pl8">
                                       <input class="sox-findAndReplace-find s-input w30" type="text" placeholder="Find">
                                       <input class="sox-findAndReplace-modifier s-input w30" type="text" placeholder="Modifier">
                                       <input class="sox-findAndReplace-replace s-input w30" type="text" placeholder="Replace with">
                                       <input class="sox-findAndReplace-replaceGo s-btn s-btn__primary" type="button" value="Go">
                                     </div>`;
      const findAndReplaceToolbar = '<div class="sox-findReplaceToolbar p8"><span class="sox-findReplace c-pointer">SOX: Find & Replace</span></div>';

      function startLoop() {
        [...document.querySelectorAll('textarea[id^="wmd-input"].processed')].forEach(textarea => main(textarea.id));
        [...document.querySelectorAll('.edit-post')].forEach(button => {
          button.addEventListener('click', () => {
            const targetQuestionCells = document.getElementsByClassName('postcell');
            const targetAnswerCells = document.getElementsByClassName('answercell');
            sox.helpers.observe([...targetQuestionCells, ...targetAnswerCells], '#wmd-redo-button-' + button.href.split('/')[2], () => {
              main(button.closest('.question, .answer').querySelector('.inline-editor textarea.processed').id);
            });
          });
        });
      }

      function main(wmd) {
        // "selector" is the selector we pass onto each function, so that the action is applied to the correct textarea,
        // and not, for example the 'add answer' textarea *and* the 'edit' textarea!
        const selector = '#' + wmd;
        const wmdElement = document.querySelector(selector);
        const wmdContainer = wmdElement.closest('.wmd-container');
        const containerSelector = '#' + wmdContainer.closest('#post-form, .answer, .question').id; // post-form is the id of the new answer box!
        const wmdButtonBar = wmdContainer.querySelector('.wmd-button-bar');
        if (wmdContainer.querySelector('.sox-findReplace')) return;

        wmdButtonBar.style.marginTop = 0; // https://github.com/soscripted/sox/issues/203
        wmdButtonBar.insertAdjacentHTML('beforeend', findAndReplaceToolbar);

        $(document).on('click', containerSelector + ' .sox-findReplace', event => {
          const input = wmdContainer.querySelector('.sox-findReplaceInputs');
          const textarea = event.target.closest('.wmd-container').querySelector('textarea');
          input ? input.remove() : event.target.parentElement.insertAdjacentHTML('beforeend', findAndReplaceBoxHtml);

          $(document).on('click', containerSelector + ' .sox-findReplaceInputs .sox-findAndReplace-replaceGo', function() {
            const regex = new RegExp(wmdContainer.querySelector('.sox-findReplaceToolbar .sox-findAndReplace-find').value,
                                     wmdContainer.querySelector('.sox-findReplaceToolbar .sox-findAndReplace-modifier').value);
            const oldval = textarea.value;
            const newval = oldval.replace(regex, wmdContainer.querySelector('.sox-findReplaceToolbar .sox-findAndReplace-replace').value);
            textarea.value = newval;

            if (sox.Stack.MarkdownEditor) sox.Stack.MarkdownEditor.refreshAllPreviews(); // refresh the Markdown preview
          });
          event.preventDefault();
          event.stopPropagation();
        });

        wmdElement.addEventListener('keydown', event => {
          if (!(event.which == 70 && event.ctrlKey)) return; // not CTRL + F (find + replace)
          wmdContainer.querySelector('.sox-findReplace').click();
          event.stopPropagation();
          event.preventDefault();
        });
      }

      window.addEventListener('sox-edit-window', startLoop);
      startLoop();
    },

    onlyShowCommentActionsOnHover: function() {
      // Description: Only show the comment actions (flag/upvote) when hovering over a comment

      function addCSS() {
        // Delay needed because of https://github.com/soscripted/sox/issues/379#issuecomment-460001854
        setTimeout(() => [...document.querySelectorAll('.comment')].forEach(comment => comment.classList.add('sox-onlyShowCommentActionsOnHover')), 100);
      }

      window.addEventListener('sox-new-comment', addCSS);
      addCSS();
    },

    showTagWikiLinkOnTagPopup: function() {
      // Description: Add a 'wiki' link to the new tag popups that appear on hover

      function addWikiLink() {
        // extract from feed URL button
        const tagName = document.querySelector('.tag-popup .float-right a').href.match('/feeds/tag/(.*)')[1];
        const wikiUrl = `//${sox.site.url}/tags/${tagName}/info`;
        const spanToAppend = document.createElement('span');
        spanToAppend.className = 'sox-tag-popup-wiki-link';
        spanToAppend.innerHTML = `<a href="${wikiUrl}">wiki</a>`;
        spanToAppend.title = 'view tag wiki (added by SOX)';

        document.querySelectorAll('.tag-popup .mr8')[1].insertAdjacentElement('afterend', spanToAppend);
      }

      sox.helpers.addAjaxListener('\\/tags\\/[^/]+\\/popup', addWikiLink);
    },

    addTimelineAndRevisionLinks: function() {
      // Description: Add revision link to the bottom of each post for quick access

      // Note: This feature used to add a timeline button too, but this was natively
      // implemented as of 2020-16-01, see https://meta.stackexchange.com/a/342316.
      // The function name is unchanged to newer versions don't auto-remove the feature
      // for users with it enabled

      [...document.querySelectorAll('.question, .answer')].forEach(post => {
        const id = post.getAttribute('data-questionid') || post.getAttribute('data-answerid');
        const revisionsAnchor = document.createElement('a');
        revisionsAnchor.innerText = 'revisions';
        revisionsAnchor.href = `//${sox.site.url}/posts/${id}/revisions`;
        revisionsAnchor.insertAdjacentElement('beforebegin', document.querySelector('.lsep').cloneNode(true));
        post.querySelector('.post-menu').appendChild(revisionsAnchor);
      });
    },

    hideWelcomeBackMessage: function() {
      // Description: Hide the 'welcome back...don't forget to vote' message when visiting a site after a while

      function removeMessage(el) {
        if (!el || !el.innerText.match(/welcome back/gi)) return;
        el.remove();
      }

      sox.helpers.observe(document.body, '#overlay-header', el => removeMessage(el));
      removeMessage(document.getElementById('overlay-header'));
    },

    addOnTopicLinkToSiteSwitcher: function() {
      // Description: Replaces 'help' with an 'on-topic' link in the site switcher dropdown

      document.querySelectorAll('.top-bar .related-links a')[0].outerHTML = '<a href="/help/on-topic">on-topic</a>';
    },

    customMagicLinks: function () {
      // Description: Adds custom magic links to the post and comment editors

      const magicLinks = JSON.parse(GM_getValue('SOX-customMagicLinks', '[]'));
      // magicLinks = [ { text: 'edit/q', replacement: 'Edit Question', link: '$BASEURL$/posts/$QUESTIONID$/edit' }];

      function updateGMValue(magicLinks) {
        GM_setValue('SOX-customMagicLinks', JSON.stringify(magicLinks));
      }

      function generateSettingsTableHtml(magicLinks) {
        const magicLinksTable = document.createElement('table');
        magicLinksTable.className = 'sox-customMagicLinks-settings-table s-table';
        magicLinksTable.innerHTML = `<tr>
                                       <th>Text</th>
                                       <th>Replacement</th>
                                       <th>Link</th>
                                     </tr>`;

        magicLinks.forEach((currentLink, i) => {
          const saveButton = document.createElement('button');
          saveButton.innerText = 'save';
          saveButton.addEventListener('click', function() {
            const parentTr = this.parentElement.parentElement;
            const index = parentTr.getAttribute('data-magic-link-index');
            magicLinks[index].text = parentTr.querySelector('.magic-link-text').innerText;
            magicLinks[index].replacement = parentTr.querySelector('.magic-link-replacement').innerText;
            magicLinks[index].link = parentTr.querySelector('.magic-link-link').innerText;
            window.alert('Your changes were saved!');
            updateGMValue(magicLinks);
          });

          const deleteButton = document.createElement('button');
          deleteButton.innerText = 'delete';
          deleteButton.addEventListener('click', function() {
            magicLinks.splice(this.parentElement.getAttribute('data-magic-link-index'), 1);
            this.parentElement.parentElement.remove();
            updateGMValue(magicLinks);
          });

          const linkDetails = document.createElement('tr');
          linkDetails.className = 'sox-magic-link-details';
          linkDetails.setAttribute('data-magic-link-index', i);
          linkDetails.innerHTML = `<td contenteditable class='magic-link-text'>${currentLink.text}</td>
                                   <td contenteditable class='magic-link-replacement'>${currentLink.replacement}</td>
                                   <td contenteditable class='magic-link-link'>${currentLink.link}</td>`;

          const saveButtonTd = document.createElement('td');
          saveButtonTd.appendChild(saveButton);
          const deleteButtonTd = document.createElement('td');
          deleteButtonTd.appendChild(deleteButton);

          linkDetails.appendChild(saveButtonTd);
          linkDetails.appendChild(deleteButtonTd);
          magicLinksTable.appendChild(linkDetails);
        });

        return magicLinksTable;
      }

      function replacePlaceholders(text, textarea) {
        const baseUrl = location.protocol + '//' + location.hostname;
        const localMetaBase = location.protocol + '//meta.' + location.hostname;
        const questionId = document.querySelector('.question').getAttribute('data-questionid');
        const answerId = textarea.closest('.answer').getAttribute('data-answerid');

        return text
          .replace(/\$BASEURL\$/ig, baseUrl)
          .replace(/\$METABASEURL\$/ig, localMetaBase)
          .replace(/\$QUESTIONID\$/ig, questionId)
          .replace(/\$ANSWERID\$/ig, answerId);
      }

      function magicLink(el) {
        const textarea = el.nodeName == 'TEXTAREA' ? el : el.closest('form').querySelectorAll('textarea')[0];
        let newVal = textarea.value;

        magicLinks.forEach(currentMagicLink => {
          const replacementText = currentMagicLink.replacement;
          const url = replacePlaceholders(currentMagicLink.link, textarea);
          const regex = new RegExp('\\[' + currentMagicLink.text + '\\]', 'g');
          newVal = newVal.replace(regex, `[${replacementText}](${url})`);
        });

        textarea.value = newVal;
      }

      if (sox.site.href.indexOf('/questions') !== -1) {
        $(document).on('keydown', '.comment-form textarea', function(e) {
          if (e.keyCode == 13) magicLink(e.target);
        });
        $(document).on('click', '.comment-form input[type="submit"], .form-submit #submit-button, form.inline-post button[id*="submit-button-"]', function() {
          magicLink(this);
        });
      }

      function createSettingsDialog(magicLinks) {
        const settingsDialog = sox.helpers.createModal({
          'header': 'SOX: Magic Link Settings',
          'html': '<i>the table cells below are editable; be sure to save any changes!</i><br><br><div class="table-container"></div>',
        });
        const settingsDialogContent = settingsDialog.querySelector('.sox-custom-dialog-content');

        const newMagicLinkButton = document.createElement('button');
        newMagicLinkButton.innerText = 'new link';
        newMagicLinkButton.onclick = function() {
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
            settingsDialogContent.querySelector('.table-container table').remove();
            settingsDialogContent.querySelector('.table-container').appendChild(generateSettingsTableHtml(magicLinks));
          } else {
            window.alert('Please enter details for all three fields');
          }
        };
        settingsDialogContent.querySelector('.table-container').appendChild(generateSettingsTableHtml(magicLinks));
        settingsDialogContent.appendChild(newMagicLinkButton);

        document.body.appendChild(settingsDialog);
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
        id: 'sox-linked-image-modal',
      };

      function showModalOnclick() {
        const posts = [...document.querySelectorAll('.post-text img, .comment-copy img')];
        posts.forEach(img => {
          if (!img.src || !img.src.match(/i(?:\.stack)?\.imgur\.com\/[a-zA-Z0-9]*\.png$/)) return;

          img.addEventListener('click', e => {
            e.preventDefault();
            // Create modal on click instead of outside; modal is removed when closed
            // so reference would become invalid
            modalAttributes.header = `SOX: Linked Image <a class="sox-openImagesAsModals-sourceLink" target="_blank"
                                                             rel="noopener noreferrer" href="${img.src}">source</a>`;
            const modal = sox.helpers.createModal(modalAttributes);
            modal.querySelector('.sox-custom-dialog-content').innerHTML = `<img width="100%" height="100%" src="${img.src}"/>`;
            if (!document.getElementById('sox-linked-image-modal')) document.body.appendChild(modal);
          });
        });
      }
      setTimeout(showModalOnclick, 2500); // autoShowCommentImages runs after 2 seconds, so this actually never executes!
    },

    addTagsToHNQs: function () {
      // Description: Show HNQ tags on hover in the sidebar

      const FILTER_QUESTION_TAGS = '!)5IW-5Quf*cV5LToe(J0BjSBXW19';
      const tagsSpan = document.createElement('span');
      tagsSpan.style.innerText = 'SOX: hover over titles to show tags';
      tagsSpan.className = 'sox-addTagsToHNQs-span';

      function insertTagsList(anchor) {
        if (anchor.parentElement.querySelector('.sox-hnq-question-tags-tooltip')) return;
        const tagNames = '<span class="sox-hnq-question-tags-tooltip">' + anchor.dataset.tags + '</span>';
        anchor.insertAdjacentHTML('afterend', tagNames);
      }

      [...document.querySelectorAll('#hot-network-questions h4')].forEach(hotQuestion => {
        hotQuestion.display = 'inline';
        hotQuestion.insertAdjacentElement('afterend', tagsSpan);
      });

      [...document.querySelectorAll('#hot-network-questions li a')].forEach(el => {
        const id = sox.helpers.getIDFromAnchor(el);
        const sitename = sox.helpers.getSiteNameFromAnchor(el);

        el.addEventListener('mouseenter', () => {
          // sort of caching: hide the tooltip on mouseleave and show it - if it exists on mouseenter
          const tooltip = el.parentElement.querySelector('.sox-hnq-question-tags-tooltip');
          if (tooltip) {
            tooltip.style.display = 'block';
            return;
          }
          sox.helpers.getFromAPI({
            endpoint: 'questions',
            ids: id,
            sitename,
            filter: FILTER_QUESTION_TAGS,
            useCache: true, // Single ID, so no point
          }, items => {
            el.dataset.tags = items[0].tags.join(', ');
            insertTagsList(el);
          });
        });

        el.addEventListener('mouseleave', () => {
          const tooltip = el.parentElement.querySelector('.sox-hnq-question-tags-tooltip');
          if (tooltip) tooltip.style.display = 'none';
        });
      });
    },

    scrollChatRoomsList: function () {
      // Description: Enable scrolling for room list in usercards and sidebar when there are many rooms

      window.addEventListener('sox-chat-user-popup', () => {
        const node = document.querySelector('.popup.user-popup');
        if (node.classList.contains('sox-scrollChatRoomsList-user-popup')) return;
        node.classList.add('sox-scrollChatRoomsList-user-popup');
      });

      const roomsContainer = document.getElementById('my-rooms').parentElement;
      if (roomsContainer.classList.contains('sox-scrollChatRoomsList-sidebar')) return;
      roomsContainer.classList.add('sox-scrollChatRoomsList-sidebar');
    },

    copyCommentMarkdown: function () {
      // Description: Adds button to copy the markdown of a comment next to them

      if (document.querySelector('.tmCCodeBtn')) return; // compatibility with https://stackapps.com/q/8296

      [...document.querySelectorAll('.comment-body')].forEach(comment => {
        const soxReplyLink = comment.querySelector('.soxReplyLink');
        const copyButton = sox.sprites.getSvg('copy', 'SOX: copy comment markdown');
        copyButton.style.cursor = 'pointer';
        copyButton.style.display = 'd-none';
        const commentId = +comment.parentElement.parentElement.getAttribute('data-comment-id');

        soxReplyLink ? soxReplyLink.appendChild(copyButton) : comment.appendChild(copyButton);
        comment.addEventListener('mouseover', () => { copyButton.style.display = 'block'; });
        comment.addEventListener('mouseleave', () => { copyButton.style.display = 'none'; });

        copyButton.addEventListener('click', function() {
          sox.helpers.getFromAPI({
            endpoint: 'comments',
            ids: [commentId],
            filter: '!*JxbB6N6w(LGV_JR',
            sitename: sox.site.url,
            featureId: 'copyCommentMarkdown',
            cacheDuration: 10, // Cache for 10 minutes
          }, items => {
            if (items[0] && items[0].body_markdown) {
              GM_setClipboard(items[0].body_markdown);
              window.alert('Copied comment markdown to clipboard!');
            } else {
              window.alert('There was an error getting the comment markdown. Please raise an issue on GitHub!');
              sox.error('copyCommentMarkdown: could not get markdown from API. Returned data for comment ID ' + commentId + ' was', items);
            }
          });
        });
      });
    },

    addAnswerCountToQuestionHeader: function () {
      // Description: Add the post's answer count under the question title

      const answers = document.querySelector("#answers-header h2").innerText.split(' ')[0];
      const toInsert = '<div class="grid--cell ws-nowrap mb8 ml16"><span class="fc-light mr4">Answers</span> ' + answers + '</div>';
      document.querySelector(".grid.fw-wrap").insertAdjacentHTML("beforeEnd", toInsert);
    }
  };
})(window.sox = window.sox || {}, jQuery);
