(function(sox, $, undefined) {
    'use strict';

    sox.features = { //SOX functions must go in here
        moveBounty: function() {
            // Description: For moving bounty to the top

            $('.bounty-notification').insertAfter('.question .fw'); //$('.bounty-notification').length condition isn't necessary; this line will run only if the element exists
            $('[id="bounty-link bounty"]').closest('tr').insertAfter('.question .fw');
        },

        dragBounty: function() {
            // Description: Makes the bounty window draggable

            sox.helpers.observe('#start-bounty-popup', function() {
                $('#start-bounty-popup').draggable({
                    drag: function() {
                        $(this).css({
                            'width': 'auto',
                            'height': 'auto'
                        });
                    }
                }).css('cursor', 'move');
            });
        },

        renameChat: function() {
            // Description: Renames Chat tabs to prepend 'Chat' before the room name

            if (sox.site.type == 'chat') {
                var match = document.title.match(/^(\(\d*\*?\) )?(.* \| [^|]*)$/);
                document.title = (match[1] || '') + 'Chat - ' + match[2];
            }
        },

        markEmployees: function() {
            // Description: Adds an Stack Overflow logo next to users that *ARE* a Stack Overflow Employee

            function unique(list) {
                //credit: GUFFA https://stackoverflow.com/questions/12551635/12551709#12551709
                var result = [];
                $.each(list, function(i, e) {
                    if ($.inArray(e, result) == -1) result.push(e);
                });
                return result;
            }

            var $links = $('.comment a, .deleted-answer-info a, .employee-name a, .user-details a').filter('a[href^="/users/"]');
            var ids = [];

            $links.each(function() {
                var href = $(this).attr('href'),
                    id = href.split('/')[2];
                ids.push(id);
            });

            ids = unique(ids);

            var url = 'https://api.stackexchange.com/2.2/users/{ids}?site={site}&key={key}&access_token={access_token}'
                .replace('{ids}', ids.join(';'))
                .replace('{site}', sox.site.currentApiParameter)
                .replace('{key}', sox.info.apikey)
                .replace('{access_token}', sox.settings.accessToken);

            $.ajax({
                url: url
            }).success(function(data) {
                for (var i = 0; i < data.items.length; i++) {
                    var userId = data.items[i].user_id,
                        isEmployee = data.items[i].is_employee;

                    if (isEmployee) {
                        $links.filter('a[href^="/users/' + userId + '/"]').after('<span class="fa fa-stack-overflow" title="employee" style="padding: 0 5px; color: ' + $('.mod-flair').css('color') + '"></span>');
                    }
                }
            });
        },

        copyCommentsLink: function() {
            // Description: Adds the 'show x more comments' link before the commnents

            $('.js-show-link.comments-link').each(function() {
                if (!$(this).parent().prev().find('.comment-text').length) return; //https://github.com/soscripted/sox/issues/196

                var $this2 = $(this);
                $('<tr><td></td><td>' + $this2.clone().wrap('<div>').parent().html() + '</td></tr>').insertBefore($(this).parent().closest('tr')).click(function() {
                    $(this).hide();
                });

                var commentParent = ($(this).parents('.answer').length ? '.answer' : '.question');
                $(this).click(function() {
                    $(this).closest(commentParent).find('.js-show-link.comments-link').hide();
                });
            });

            $(document).on('click', '.js-add-link', function() { //https://github.com/soscripted/sox/issues/239
                var commentParent = ($(this).parents('.answer').length ? '.answer' : '.question');
                $(this).closest(commentParent).find('.js-show-link.comments-link').hide();
            });

        },

        fixedTopbar: function(settings) {
            // Description: For making the topbar fixed (always stay at top of screen)
            // Modified by shu8

            //Add class to page for topbar, calculated for every page for different sites.
            //If the Area 51 popup closes or doesn't exist, $('#notify-table').height() = 0
            var $topbar = sox.NEW_TOPBAR ? $('.top-bar') : $('.topbar');
            var paddingToAdd = $('#notify-table').height() + $topbar.height();

            if ($('.topbar').length) {
                GM_addStyle('.fixed-topbar-sox { padding-top: ' + paddingToAdd + 'px !important}');
                $topbar.css('margin-top', -$topbar.height() + 'px');
            }

            function adjust() { //http://stackoverflow.com/a/31408076/3541881 genius! :)
                setTimeout(function() {
                    sox.debug('fixedtopbar adjust function running');
                    var id;
                    if (location.href.indexOf('#comment') > -1) {
                        id = window.location.hash.match(/^#comment(\d+)_/)[1];
                        sox.debug('fixedtopbar comment in hash and getBoundingClientRect', $('#comment-' + id)[0], $('#comment-' + id)[0].getBoundingClientRect());
                        if ($('#comment-' + id)[0].getBoundingClientRect().top < 30) {
                            window.scrollBy(0, -paddingToAdd);
                            sox.debug('fixedtopbar adjusting');
                        }
                    } else {
                        id = window.location.hash.match(/^#(\d+)/)[1];
                        sox.debug('fixedtopbar answer in hash and getBoundingClientRect', $('#answer-' + id)[0], $('#answer-' + id)[0].getBoundingClientRect());
                        if ($('#answer-' + id)[0].getBoundingClientRect().top < 30) {
                            window.scrollBy(0, -paddingToAdd);
                            sox.debug('fixedtopbar adjusting');
                        }
                    }
                }, 10);
            }

            if (sox.site.type == 'chat') { //For some reason, chats don't need any modification to the body
                $topbar.css({
                    'position': 'fixed',
                    'z-index': '900',
                    'margin-top': 0
                });

                //https://github.com/soscripted/sox/issues/221
                $('.notification').css('margin-top', paddingToAdd + 'px');
                sox.helpers.observe('.notification', function() {
                    $('.notification').css('margin-top', paddingToAdd + 'px');
                });
            } else {
                if (sox.location.on('askubuntu.com')) {
                    if (!settings.enableOnAskUbuntu) return; //Disable on Ask Ubuntu if user said so
                    $('#custom-header').css('visibility', 'hidden'); //Preserves spacing, unlike .remove()
                    $topbar.css('width', '100%');
                    $('.topbar-wrapper').css('width', '1060px');
                }

                $('body').addClass('fixed-topbar-sox');

                $topbar.css({
                    'position': 'fixed',
                    'z-index': '900'
                });

                //Area 51 popup:
                $('#notify-table').css({
                    'position': 'fixed',
                    'z-index': '900',
                    'margin-top': -paddingToAdd + 'px'
                });

                //https://github.com/soscripted/sox/issues/74
                if (location.href.indexOf('#') > -1) adjust();
                $(window).bind('hashchange', adjust);
                if (typeof MathJax !== "undefined") MathJax.Hub.Queue(adjust);

                sox.helpers.observe('#notify-container,#notify--1', function() { //Area51: https://github.com/soscripted/sox/issues/152#issuecomment-267885889
                    if (!$('#notify--1').length) $('body').attr('style', 'padding-top: ' + $topbar.height() + 'px !important'); //.css() doesn't work...?
                });

                //Placing the following in this if statement should hopefully prevent a fixed review bar in Ask Ubuntu. However I can't test this on Stack Overflow's or Ask Ubuntu's review:
                if (sox.location.on('/review/')) { //https://github.com/soscripted/sox/issues/180
                    sox.helpers.observe('.review-bar', function() {
                        if ($('.review-bar').css('position') === 'fixed') {
                            $('.review-bar').addClass('fixed-topbar-sox');
                            $('.review-bar').css('margin-top', paddingToAdd + 'px');
                        } else {
                            $('.review-bar').removeClass('fixed-topbar-sox');
                        }
                    });
                }
            }
        },

        highlightQuestions: function() {
            // Description: For highlighting only the tags of favorite questions

            function highlight() {
                $('.tagged-interesting').removeClass('tagged-interesting sox-tagged-interesting').addClass('sox-tagged-interesting');
            }

            var color;
            if (sox.location.on('superuser.com')) { //superuser
                color = '#00a1c9';
            } else if (sox.location.on('stackoverflow.com')) { //stackoverflow
                color = '#f69c55';
            } else if (sox.location.on('serverfault.com')) {
                color = '#EA292C';
            } else { //for all other sites
                color = $('.post-tag').css('color');
            }

            $('<style type="text/css">.sox-tagged-interesting:before{background: ' + color + ';}</style>').appendTo('head');

            highlight();

            if ($('.question-summary').length) {
                var target = document.body;
                // TODO use new observer helper

                new MutationObserver(function(mutations) {
                    $.each(mutations, function(i, mutation) {
                        if (mutation.attributeName == 'class') {
                            highlight();
                            return false; //no point looping through everything; if *something* has changed, assume everything has
                        }
                    });
                }).observe(target, {
                    "attributes": true,
                    "childList": true,
                    "characterData": true,
                    "subtree": true
                });
            }
        },

        displayName: function() {
            // Description: For displaying username next to avatar on topbar

            var name = sox.user.name;
            var $span = $('<span/>', {
                class: 'reputation links-container',
                style: $('.top-bar').css('background-color') == 'rgb(250, 250, 251)' ? 'color: #535a60; padding-right: 12px; font-size: 13px;' : 'color: white; padding-right: 12px; font-size: 13px;',
                title: name,
                text: name
            });
            $span.insertBefore('.gravatar-wrapper-24');
        },

        colorAnswerer: function() {
            // Description: For highlighting the names of answerers on comments

            function colour() {
                $('.answercell').each(function(i, obj) {
                    $(this).parent().next().find('.comment-user:contains("' + $.trim($(this).find('.user-details').last().clone().children('.-flair').remove().end().text()) + '")').css({
                        'background-color': '#f9e2b6',
                        'padding': '1px 5px'
                    }); //Find the comments on each post that contain the answerer's name. Also, .last() is necessary, or else it will use the name of someone who edits the answer.
                });
            }

            colour();
            $(document).on('sox-new-comment', colour);
        },


        kbdAndBullets: function() {
            // Description: For adding buttons to the markdown toolbar to surround selected test with KBD or convert selection into a markdown list

            function addBullets($node) {
                var list = '- ' + $node.getSelection().text.split('\n').join('\n- ');
                $node.replaceSelectedText(list);
                StackExchange.MarkdownEditor.refreshAllPreviews();
            }

            function addKbd($node) {
                $node.surroundSelectedText("<kbd>", "</kbd>");
                var surroundedText = $node.getSelection(),
                    trimmed = surroundedText.text.trim();

                if ($node.getSelection().text !== '') {
                    //https://github.com/soscripted/sox/issues/240
                    //https://github.com/soscripted/sox/issues/189
                    //if no trimming occured, then we have to add another space
                    $node.replaceSelectedText(trimmed);
                    $node.insertText(' ', surroundedText.end + (trimmed == surroundedText.text ? 6 : 5), 'collapseToEnd'); //add a space after the `</kbd>`
                }

                StackExchange.MarkdownEditor.refreshAllPreviews();
            }

            function getTextarea(button) {
                // li -> ul -> #wmd-button-bar -> .wmd-container
                return button.parentNode.parentNode.parentNode.querySelector("textarea");
            }

            function loopAndAddHandlers() {
                var kbdBtn = '<li class="wmd-button" id="wmd-kbd-button" title="surround selected text with <kbd> tags"><span style="background-image:none;">kbd</span></li>',
                    listBtn = '<li class="wmd-button" id="wmd-bullet-button" title="add dashes (\'-\') before every line to make a bullet list"><span style="background-image:none;">&#x25cf;</span></li>';

                $('[id^="wmd-redo-button"]').each(function() {
                    if (!$(this).parent().find('#wmd-kbd-button').length) $(this).after(kbdBtn + listBtn);
                });
            }

            $(document).on('sox-edit-window', loopAndAddHandlers);

            loopAndAddHandlers();

            document.addEventListener('keydown', function(event) {
                var kC = event.keyCode,
                    target = event.target;

                if (target && /^wmd-input/.test(target.id) && event.altKey) {
                    if (kC === 76) addBullets($(target)); // l
                    else if (kC === 75) addKbd($(target)); // k
                }
            });

            $(document).on('click', '#wmd-kbd-button, #wmd-bullet-button', function(event) {
                var id = this.id,
                    textarea = $(getTextarea(this));

                if (id === "wmd-kbd-button") addKbd(textarea);
                else addBullets(textarea);
            });
        },

        editComment: function() {
            // Description: For adding checkboxes when editing to add pre-defined edit reasons

            function addCheckboxes() {
                var editCommentField = $('[id^="edit-comment"]');
                if (!editCommentField.length) return; //https://github.com/soscripted/sox/issues/246

                function toLocaleSentenceCase(str) {
                    return str.substr(0, 1).toLocaleUpperCase() + str.substr(1);
                }
                $('#reasons').remove(); //remove the div containing everything, we're going to add/remove stuff now:
                if (/\/edit/.test(window.location.href) || $('[class^="inline-editor"]').length || $('.edit-comment').length) {
                    $('.form-submit').before('<div id="reasons" style="float:left;clear:both"></div>');

                    $.each(JSON.parse(GM_getValue('editReasons')), function(i, obj) {
                        $('#reasons').append('<label><input type="checkbox" value="' + this[1] + '"</input>' + this[0] + '</label>&nbsp;');
                    });

                    $('#reasons input[type="checkbox"]').css('vertical-align', '-2px');

                    $('#reasons label').hover(function() {
                        $(this).css({ //on hover
                            'background-color': 'gray',
                            'color': 'white'
                        });
                    }, function() {
                        $(this).css({ //on un-hover
                            'background-color': 'inherit',
                            'color': 'inherit'
                        });
                    });

                    $('#reasons input[type="checkbox"]').change(function() {
                        if (this.checked) { //Add it to the summary
                            if (!editCommentField.val()) {
                                editCommentField.val(toLocaleSentenceCase($(this).val()));
                            } else {
                                editCommentField.val(editCommentField.val() + '; ' + $(this).val());
                            }
                            var newEditComment = editCommentField.val(); //Remove the last space and last semicolon
                            editCommentField.val(newEditComment).focus();
                        } else if (!this.checked) { //Remove it from the summary
                            editCommentField.val(toLocaleSentenceCase(editCommentField.val().replace(new RegExp(toLocaleSentenceCase($(this).val()) + ';? ?'), ''))); //for beginning values
                            editCommentField.val(editCommentField.val().replace($(this).val() + '; ', '')); //for middle values
                            editCommentField.val(editCommentField.val().replace(new RegExp(';? ?' + $(this).val()), '')); //for last value
                        }
                    });
                }
            }

            function displayDeleteValues() {
                //Display the items from list and add buttons to delete them

                $('#currentValues').html(' ');
                $.each(JSON.parse(GM_getValue('editReasons')), function(i, obj) {
                    $('#currentValues').append(this[0] + ' - ' + this[1] + '<input type="button" id="' + i + '" value="Delete"><br />');
                });
                addCheckboxes();
            }

            var div = '<div id="dialogEditReasons" class="sox-centered wmd-prompt-dialog"><span id="closeDialogEditReasons" style="float:right;">Close</span><span id="resetEditReasons" style="float:left;">Reset</span> \
                        <h2>View/Remove Edit Reasons</h2> \
                        <div id="currentValues"></div> \
                        <br /> \
                        <h3>Add a custom reason</h3> \
                        Display Reason:	<input type="text" id="displayReason"> \
                        <br /> \
                        Actual Reason: <input type="text" id="actualReason"> \
                        <br /> \
                        <input type="button" id="submitUpdate" value="Submit"> \
                    </div>';

            $('body').append(div);
            $('#dialogEditReasons').draggable().css('position', 'absolute').css('text-align', 'center').css('height', '60%').hide();

            $('#closeDialogEditReasons').css('cursor', 'pointer').click(function() {
                $(this).parent().hide(500);
            });

            $('#resetEditReasons').css('cursor', 'pointer').click(function() { //manual reset
                var options = [ //Edit these to change the default settings
                    ['formatting', 'Improved Formatting'],
                    ['spelling', 'Corrected Spelling'],
                    ['grammar', 'Fixed grammar'],
                    ['greetings', 'Removed thanks/greetings']
                ];
                if (confirm('Are you sure you want to reset the settings to Formatting, Spelling, Grammar and Greetings')) {
                    GM_setValue('editReasons', JSON.stringify(options));
                    alert('Reset options to default. Refreshing...');
                    location.reload();
                }
            });

            if (GM_getValue('editReasons', -1) == -1) { //If settings haven't been set/are empty
                var defaultOptions = [
                    ['formatting', 'Improved Formatting'],
                    ['spelling', 'Corrected Spelling'],
                    ['grammar', 'Fixed grammar'],
                    ['greetings', 'Removed thanks/greetings']
                ];
                GM_setValue('editReasons', JSON.stringify(defaultOptions)); //save the default settings
            } else {
                var options = JSON.parse(GM_getValue('editReasons')); //If they have, get the options
            }

            $('#dialogEditReasons').on('click', 'input[value="Delete"]', function() { //Click handler to delete when delete button is pressed
                var delMe = $(this).attr('id');
                options.splice(delMe, 1); //actually delete it
                GM_setValue('editReasons', JSON.stringify(options)); //save it
                displayDeleteValues(); //display the items again (update them)
            });

            $('#submitUpdate').click(function() { //Click handler to update the array with custom value
                if (!$('#displayReason').val() || !$('#actualReason').val()) {
                    alert('Please enter something in both the textboxes!');
                } else {
                    var arrayToAdd = [$('#displayReason').val(), $('#actualReason').val()];
                    options.push(arrayToAdd); //actually add the value to array

                    GM_setValue('editReasons', JSON.stringify(options)); //Save the value

                    // moved display call after setvalue call, list now refreshes when items are added
                    displayDeleteValues(); //display the items again (update them)

                    //reset textbox values to empty
                    $('#displayReason').val('');
                    $('#actualReason').val('');

                }
            });

            setTimeout(function() {
                addCheckboxes();
                //Add the button to update and view the values in the help menu:
                $('.topbar-dialog.help-dialog.js-help-dialog > .modal-content ul').append("<li><a href='javascript:void(0)' id='editReasonsLink'>Edit Reasons     \
                                                                                      <span class='item-summary'>Edit your personal edit reasons for SE sites</span></a></li>");
                $('.topbar-dialog.help-dialog.js-help-dialog > .modal-content ul #editReasonsLink').on('click', function() {
                    displayDeleteValues();
                    $('#dialogEditReasons').show(500); //Show the dialog to view and update values
                });
            }, 500);
            $(document).on('sox-edit-window', addCheckboxes);

            $('.post-menu > .edit-post').click(function() {
                setTimeout(function() {
                    addCheckboxes();
                }, 500);
            });
        },

        shareLinksPrivacy: function() {
            // Description: Remove your user ID from the 'share' link

            sox.helpers.observe('.share-tip', function() {
                const toRemove = ' (includes your user id)';
                var popup = $('.share-tip');
                var origHtml = popup.html();
                if (origHtml.indexOf(toRemove) == -1) return; //don't do anything if the function's already done its thing
                popup.html(function() {
                    return origHtml.replace(toRemove, '');
                });

                var inputBox = $('.share-tip input'),
                    origLink = inputBox.val();
                inputBox.val(origLink.match(/.+\/(q|a)\/[0-9]+/g));
                inputBox.select();
            });
        },

        shareLinksMarkdown: function() {
            // Description: For changing the 'share' button link to the format [name](link)

            sox.helpers.observe('.share-tip', function() {
                var link = $('.share-tip input').val(),
                    title = $('meta[name="twitter:title"]').attr('content').replace(/\[(.*?)\]/g, '\[$1\]'); //https://github.com/soscripted/sox/issues/226, https://github.com/soscripted/sox/issues/292

                if (link.indexOf(title) !== -1) return; //don't do anything if the function's already done its thing
                $('.share-tip input').val('[' + title + '](' + link + ')');
                $('.share-tip input').select();
                document.execCommand('copy'); //https://github.com/soscripted/sox/issues/177
            });
        },

        commentShortcuts: function() {
            // Description: For adding support in comments for Ctrl+K,I,B to add code backticks, italicise, bolden selection

            $('.comments').on('keydown', 'textarea', function(e) {
                if (e.which == 75 && e.ctrlKey) { //ctrl+k (code)
                    $(this).surroundSelectedText('`', '`');
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                }
                if (e.which == 73 && e.ctrlKey) { //ctrl+i (italics)
                    $(this).surroundSelectedText('*', '*');
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                }
                if (e.which == 66 && e.ctrlKey) { //ctrl+b (bold)
                    $(this).surroundSelectedText('**', '**');
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
                    $(this).find('.post-menu').append('<span class="lsep">|</span><a id="showSpoiler-' + $(this).attr("id") + '" href="javascript:void(0)">unspoil</span>');
                }
            });
            $('a[id*="showSpoiler"]').click(function() {
                var x = $(this).attr('id').split(/-(.+)?/)[1];
                $('#' + x + ' .spoiler').removeClass('spoiler');
            });
        },

        spoilerTip: function() {
            // Description: For adding some text to spoilers to tell people to hover over it

            function addSpoilerTip() {
                $('.spoiler').prepend('<div id="isSpoiler" style="color:red; font-size:smaller; float:right;">hover to show spoiler<div>');
                $('.spoiler').hover(function() {
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
                $('.comment').each(function() {
                    if (!$(this).find('.soxReplyLink').length) { //if the link doesn't already exist
                        if ($('.topbar-links a span:eq(0)').text() != $(this).find('.comment-text a.comment-user').text()) { //make sure the link is not added to your own comments
                            $(this).find('.comment-text').css('overflow-x', 'hidden');
                            $(this).find('.comment-text .comment-body').append('<span class="soxReplyLink" title="reply to this user" style="margin-left: -7px">&crarr;</span>');
                        }
                    }
                });
            }

            $(document).on('click', 'span.soxReplyLink', function() {
                var parentDiv = $(this).parent().parent().parent().parent();
                var textToAdd = '@' + $(this).parent().find('a.comment-user').text().replace(/\s/g, '').replace(/♦/, ''); //eg. @USERNAME
                if (!parentDiv.find('textarea').length) parentDiv.next('div').find('a.js-add-link')[0].click(); //show the textarea, http://stackoverflow.com/a/10559680/

                var $textarea = parentDiv.find('textarea');
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
                var sites = ['stackexchange', 'stackoverflow', 'superuser', 'serverfault', 'askubuntu', 'stackapps', 'mathoverflow', 'programmers', 'bitcoin'];

                $('.post-text a').not('.expand-post-sox').each(function() {
                    var anchor = $(this),
                        href = $(this).attr('href');
                    if (!href) return;
                    if (sites.indexOf(href.split('/')[2].split('.')[0]) > -1) { //if the link is to an SE site (not, for example, to google), do the necessary stuff
                        if (href.indexOf('/questions/') > -1) { //if the link is to a question
                            if ($(this).text() == href) { //if there isn't text on it (ie. bare url)
                                var sitename = href.split('/')[2].split('.')[0],
                                    id = href.split('/')[4];

                                sox.helpers.getFromAPI('questions', id, sitename, function(json) {
                                    anchor.html(json.items[0].title); //Get the title and add it in
                                }, 'activity');
                            }
                        }
                    }
                });
            }

            expandLinks();
            $(document).on('sox-new-review-post-appeared', expandLinks);
        },

        confirmNavigateAway: function() {
            // Description: For adding a 'are you ure you want to go away' confirmation on pages where you have started writing something

            if (window.location.href.indexOf('questions/') >= 0) {
                $(window).bind('beforeunload', function() {
                    if ($('.comment-form textarea').length && $('.comment-form textarea').val()) {
                        return 'Do you really want to navigate away? Anything you have written will be lost!';
                    }
                    return;
                });
            }
        },

        sortByBountyAmount: function() {
            // Description: For adding some buttons to sort bounty's by size

            if ($('.bounty-indicator').length) { //if there is at least one bounty on the page
                $('.question-summary').each(function() {
                    var bountyAmount = $(this).find('.bounty-indicator').text().replace('+', '');
                    if (bountyAmount) {
                        $(this).attr('data-bountyamount', bountyAmount).addClass('hasBounty'); //add a 'bountyamount' attribute to all the questions
                    }
                });

                var $wrapper = $('#question-mini-list').length ? $('#question-mini-list') : $wrapper = $('#questions'); //homepage/questions tab

                //filter buttons:
                $('.subheader').after('<span>sort by bounty amount:&nbsp;&nbsp;&nbsp;</span><span id="largestFirst">largest first&nbsp;&nbsp;</span><span id="smallestFirst">smallest first</span>');

                //Thanks: http://stackoverflow.com/a/14160529/3541881
                $('#largestFirst').css('cursor', 'pointer').on('click', function() { //largest first
                    $wrapper.find('.question-summary.hasBounty').sort(function(a, b) {
                        return +b.getAttribute('data-bountyamount') - +a.getAttribute('data-bountyamount');
                    }).prependTo($wrapper);
                });

                //Thanks: http://stackoverflow.com/a/14160529/3541881
                $('#smallestFirst').css('cursor', 'pointer').on('click', function() { //smallest first
                    $wrapper.find('.question-summary.hasBounty').sort(function(a, b) {
                        return +a.getAttribute('data-bountyamount') - +b.getAttribute('data-bountyamount');
                    }).prependTo($wrapper);
                });
            }
        },

        isQuestionHot: function() {
            // Description: For adding some text to questions that are in the hot network questions list

            function addHotText() {
                if (!$('.sox-hot').length) {
                    $('#feed').html('<p>One of the 100 hot network questions!</p>');

                    //display:block to fix https://github.com/soscripted/sox/issues/243:
                    $('#question-header').css('display', 'block').prepend('<div title="this is a hot network question!" ' + (sox.location.on('english.stackexchange.com') ? 'style="padding:13px"' : '') + ' class="sox-hot"><i class="fa fa-free-code-camp"></i><div>');
                }
            }
            $('#qinfo').after('<div id="feed"></div>');

            if (sox.location.on('/questions') || $('.question-summary').length) {
                $.ajax({
                    type: 'get',
                    url: 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D"http%3A%2F%2Fstackexchange.com%2Fhot-questions-for-mobile"&format=json',
                    success: function(d) {
                        var results = d.query.results.json.json;
                        if (sox.location.on('/questions/')) {
                            $.each(results, function(i, o) {
                                if (document.URL.indexOf(o.site + '/questions/' + o.question_id) > -1) {
                                    addHotText();
                                }
                            });
                        } else {
                            $('.question-summary').each(function() {
                                var id = $(this).attr('id').split('-')[2];
                                if (results.filter(function(d) {
                                        return d.question_id == id;
                                    }).length) {
                                    $(this).find('.summary h3').prepend('<div title="this question is a hot network question!" class="sox-hot" style="font-size:x-large;float:none;display:inline"><i class="fa fa-free-code-camp"></i></div>');
                                }
                            });
                        }
                    }
                });
            }
        },

        localTimestamps: function(settings) {
            // Description: Gets local timestamp

            $("span.relativetime:contains(at), span.relativetime-clean:contains(at)").each(updateTS);

            function updateTS() {
                var utcTimestamp = $(this).attr("title"),
                    matches = utcTimestamp.match(/^([\d]{4})-([\d]{2})-([\d]{2}) ([\d]{2}):([\d]{2}):([\d]{2}) ?(?:Z|UTC|GMT(?:[+\-]00:?00))$/),
                    monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                if (!matches)
                    return;

                var date = new Date(
                    Date.UTC(
                        parseInt(matches[1], 10),
                        parseInt(matches[2], 10) - 1,
                        parseInt(matches[3], 10),
                        parseInt(matches[4], 10),
                        parseInt(matches[5], 10),
                        parseInt(matches[6], 10)
                    )
                );

                var month = monthNames[date.getMonth()],
                    hour = date.getHours(),
                    minute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(),
                    year = ((date.getFullYear() - 2000) < 10 ? '0' : '') + (date.getFullYear() - 2000),
                    dayTime = "";

                if (settings.twelveHours) {
                    dayTime = "am";

                    if (date.getHours() >= 12) {
                        dayTime = "pm";
                        hour -= 12;
                    }

                    if (hour === 0)
                        hour += 12;
                }

                var newTimestamp = (new Date()).getFullYear() == date.getFullYear() ? month + " " + date.getDate() + " at " + hour + ":" + minute + dayTime : month + " " + date.getDate() + " '" + year + " at " + hour + ":" + minute + dayTime;

                $(this).attr("title", newTimestamp).text(newTimestamp);
            }
        },

        autoShowCommentImages: function() {
            // Description: For auto-inlining any links to imgur images in comments

            function showImages() {
                $('.comment .comment-text .comment-copy a').each(function() {
                    var href = this.getAttribute('href'),
                        parent = this.parentNode;

                    if (href && (/i(\.stack)?\.imgur\.com/.test(href))) {
                        if (!parent.querySelectorAll('img[src="' + href + '"]').length) {
                            //add image to end of comments, but keep link in same position
                            parent.innerHTML += '<br><a href="' + href + '"><img src="' + href + '" style="max-width:100%"></a>';
                            parent.removeChild(this);
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

            var sitename = sox.site.currentApiParameter;

            function addLabelsAndHandlers() {
                $('.history-table td b a[href*="#comment"]').each(function() {
                    if (!$(this).parent().find('.showCommentScore').length) {
                        var id = $(this).attr('href').split('#')[1].split('_')[0].replace('comment', '');
                        $(this).after('<span class="showCommentScore" id="' + id + '">&nbsp;&nbsp;&nbsp;show comment score</span>');
                    }
                });
                $('.showCommentScore').css('cursor', 'pointer').on('click', function() {
                    var $that = $(this);
                    sox.helpers.getFromAPI('comments', $that.attr('id'), sitename, function(json) {
                        $that.html('&nbsp;&nbsp;&nbsp;' + json.items[0].score);
                    });
                });
            }

            addLabelsAndHandlers();
            sox.helpers.observe('.history-table', addLabelsAndHandlers);
        },

        answerTagsSearch: function() {
            // Description: For adding tags to answers in search

            var sitename = sox.site.currentApiParameter,
                ids = [],
                idsAndTags = {};

            $('div[id*="answer"]').each(function() { //loop through all *answers*
                ids.push($(this).find('.result-link a').attr('href').split('/')[2]); //Get the IDs for the questions for all the *answers*
            });

            sox.helpers.getFromAPI('questions', ids.join(';'), sitename, function(json) {
                //$.getJSON('https://api.stackexchange.com/2.2/questions/' + ids.join(';') + '?pagesize=60&site=' + sitename, function(json) {
                var itemsLength = json.items.length;
                for (var i = 0; i < itemsLength; i++) {
                    idsAndTags[json.items[i].question_id] = json.items[i].tags;
                }

                $('div[id*="answer"]').each(function() { //loop through all *answers*
                    var id = $(this).find('.result-link a').attr('href').split('/')[2]; //get their ID
                    var $that = $(this);
                    for (var x = 0; x < idsAndTags[id].length; x++) { //Add the appropiate tags for the appropiate answer
                        $that.find('.summary .tags').append('<a href="/questions/tagged/' + idsAndTags[id][x] + '" class="post-tag">' + idsAndTags[id][x] + '</a>'); //add the tags and their link to the answers
                    }
                    $that.find('.summary .tags a').each(function() {
                        if ($(this).text().indexOf('status-') > -1) { //if it's a mod tag
                            $(this).addClass('moderator-tag'); //add appropiate class
                        } else if ($(this).text().match(/\b(discussion|feature-request|support|bug)\b/)) { //if it's a required tag
                            $(this).addClass('required-tag'); //add appropiate class
                        }
                    });
                });
            }, 'creation&pagesize=60');
        },

        stickyVoteButtons: function() {
            // Description: For making the vote buttons stick to the screen as you scroll through a post
            // https://github.com/shu8/SE_OptionalFeatures/pull/14:
            // https://github.com/shu8/Stack-Overflow-Optional-Features/issues/28: Thanks @SnoringFrog for fixing this!

            stickcells();
            $(document).on('sox-new-review-post-appeared', stickcells);

            $(window).scroll(function() {
                stickcells();
            });

            function stickcells() {
                var $votecells = $('.votecell');

                $votecells.each(function() {
                    var $topbar = sox.NEW_TOPBAR ? $('.top-bar') : $('.topbar'),
                        topbarHeight = (sox.location.on('askubuntu.com') ? 13 + ($topbar.css('position') == 'fixed' ? 0 : $topbar.outerHeight()) : 0) + $topbar.outerHeight(), //Ask Ubuntu needs an extra shift for some reason
                        offset = $('.review-bar').outerHeight() + ($topbar.css('position') == 'fixed' ? topbarHeight : 0);

                    var $voteCell = $(this),
                        $vote = $voteCell.find('.vote'),
                        vcOfset = $voteCell.offset(),
                        scrollTop = $(window).scrollTop(),
                        endPos;

                    $voteCell.css('min-width', Math.floor($vote.width()));

                    if ($vote.length) //This value strangely alternates between existing and not existing. This if statement ensures we only get its value when it exists, so no errors.
                        endPos = $voteCell.next().find('.fw, .fw-wrap').offset().top; //I think a bit above the end of the post (where the "edit", "delete", etc. buttons lie) is a good place to stop the stickiness.

                    $voteCell.on('DOMNodeInserted', function() { //Fix dismissable message boxes, like "Please consider adding a comment if you think this post can be improved." when downvoting
                        $vote.find('.message-dismissable').css({
                            position: "absolute",
                            "white-space": "nowrap"
                        });
                    });

                    if (vcOfset.top + 1.5 * $vote.outerHeight() < endPos && vcOfset.top < scrollTop + offset) { //Left condition is to get rid of a sticky zone on extremely short posts. Right condition allows stickiness unless we're above the post.
                        $vote.parent().css('margin-right', '15px');
                        if (scrollTop + offset + $vote.outerHeight() < endPos) { //Allow stickiness unless we've scrolled down past the post.
                            $vote.css({
                                position: 'fixed',
                                top: offset,
                                left: $('#left-sidebar').length ? '' : $voteCell.offset().left - $(window).scrollLeft() //Prevent the buttons from moving horizontally if we scroll left/right, https://github.com/soscripted/sox/issues/334
                            });
                        } else {
                            $vote.css({
                                position: 'absolute',
                                top: endPos - $vote.outerHeight() - topbarHeight, //Leave the button at its bottommost position
                                left: $('#left-sidebar').length ? '' : $voteCell.offset().left //Prevents weird bug if you scroll to the end while scrolling horizontally, https://github.com/soscripted/sox/issues/334
                            });
                        }
                    } else {
                        $vote.removeAttr('style'); //Remove any stickiness
                        $vote.parent().removeAttr('style'); //Remove any stickiness
                    }
                });
            }
        },

        titleEditDiff: function() {
            // Description: For showing the new version of a title in a diff separately rather than loads of crossing outs in red and additions in green

            function betterTitle() {
                sox.debug('ran betterTitle from titleEditDiff');
                var $questionHyperlink = $('.summary h2 .question-hyperlink').clone(),
                    $questionHyperlinkTwo = $('.summary h2 .question-hyperlink').clone(),
                    link = $('.summary h2 .question-hyperlink').attr('href'),
                    added = ($questionHyperlinkTwo.find('.diff-delete').remove().end().text()),
                    removed = ($questionHyperlink.find('.diff-add').remove().end().text());


                if ($('.summary h2 .question-hyperlink').find('.diff-delete, .diff-add').length && !($('.sox-better-title').length)) {
                    if (!$('.sox-better-title-toggle').length) $('.summary h2 .question-hyperlink').before('<i class="sox-better-title-toggle fa fa-toggle-on" title="toggle SOX better title diff"></i>');
                    $('.summary h2 .question-hyperlink').addClass('sox-original-title-diff').hide();
                    $('.summary h2 .question-hyperlink').after('<a href="' + link + '" class="question-hyperlink sox-better-title"><span class="diff-delete">' + removed + '</span><span class="diff-add">' + added + '</span></a>');
                }
            }
            betterTitle();
            sox.helpers.observe('.review-status, .review-content, .suggested-edit, .post-id', betterTitle);

            $(document).on('click', '.sox-better-title-toggle', function() { //https://github.com/soscripted/sox/issues/166#issuecomment-269925059
                if ($('.sox-original-title-diff').is(':visible')) {
                    $(this).addClass('fa-toggle-on').removeClass('fa-toggle-off');
                    $('.sox-original-title-diff').hide();
                    $('.sox-better-title').show();
                } else {
                    $(this).removeClass('fa-toggle-on').addClass('fa-toggle-off');
                    $('.sox-original-title-diff').show();
                    $('.sox-better-title').hide();
                }
            });
        },

        metaChatBlogStackExchangeButton: function() {
            // Description: For adding buttons next to sites under the StackExchange button that lead to that site's meta and chat
            // NOTE: this feature used to have a 'blog' button as well, but it wasn't very useful so was removed

            $(document).on('mouseenter', '#your-communities-section > ul > li > a', function() {
                var href = $(this).attr('href').split('://').pop(), //Get rid of http:// or https:// from url
                    link,
                    chatLink = 'https://chat.stackexchange.com?tab=site&host=' + href.split('/').shift();

                if (href.indexOf('stackapps') > -1) {

                } else if (href === "meta.stackexchange.com") {
                    chatLink = 'https://chat.meta.stackexchange.com';
                } else if (href.indexOf('meta') > -1) {
                    link = 'https://' + href.split('meta.').shift() + href.split('meta.').pop();
                    chatLink = 'https://chat.stackexchange.com?tab=site&host=' + href.split('meta.').shift() + href.split('meta.').pop().split('/').shift(); //We don't need "meta." in the chat links
                } else if (href.indexOf('.stackexchange.com') > -1 || href.indexOf('.stackoverflow.com') > -1) {
                    link = 'https://' + href.split('.').shift() + '.meta' + href.split(href.split('.').shift()).pop();
                } else {
                    link = 'https://meta.' + href;
                }

                if (href.indexOf('stackoverflow.com') > -1 && !href.match(/(pt|ru|es|ja|.meta)/i)) {
                    chatLink = 'https://chat.stackoverflow.com';
                }

                //All sites have either a chat link or meta link
                $(this).find('.rep-score').stop(true).delay(135).fadeOut(20);
                $(this).append('<div class="related-links" style="float: right; display: none;">' +
                    (link ?
                        (link.indexOf('area51.meta') > -1 ? '<a href="' + link + '">discuss</a>' : (href.indexOf('meta') > -1 ? '<a href="' + link + '">main</a>' : '<a href="' + link + '">meta</a>')) :
                        '') +
                    (chatLink ? '<a href="' + chatLink + '">chat</a>' : '') +
                    '</div>');
                $(this).find('.related-links').delay(135).css('opacity', 0).animate({
                    opacity: 1,
                    width: 'toggle'
                }, 200);

            }).on('mouseleave', '#your-communities-section > ul > li > a', function() {
                $(this).find('.rep-score').stop(true).fadeIn(110);
                $(this).find('.related-links').remove();
            });
        },

        metaNewQuestionAlert: function() {
            // Description: For adding a fake mod diamond that notifies you if there has been a new post posted on the current site's meta

            //DO NOT RUN ON META OR CHAT OR SITES WITHOUT A META
            if ((sox.site.type != 'main' && sox.site.type != 'beta') || !$('.related-site').length) return;

            var NEWQUESTIONS = 'metaNewQuestionAlert-lastQuestions',
                DIAMONDON = 'metaNewQuestionAlert-diamondOn',
                DIAMONDOFF = 'metaNewQuestionAlert-diamondOff',
                favicon = sox.site.icon,
                metaName = 'meta.' + sox.site.currentApiParameter,
                lastQuestions = {},
                apiLink = 'https://api.stackexchange.com/2.2/questions?pagesize=5&order=desc&sort=activity&site=' + metaName,
                $dialog = $('<div/>', {
                    id: 'metaNewQuestionAlertDialog',
                    'class': 'topbar-dialog dno new-topbar'
                }),
                $header = $('<div/>', {
                    'class': 'header'
                }).append($('<h3/>', {
                    text: 'new meta posts'
                })),
                $content = $('<div/>', {
                    'class': 'modal-content'
                }),
                $questions = $('<ul/>', {
                    id: 'metaNewQuestionAlertDialogList',
                    'class': 'js-items items'
                }),
                $diamond = $('<a/>', {
                    id: 'metaNewQuestionAlertButton',
                    href: '#',
                    'class': '-link metaNewQuestionAlert-diamondOff',
                    title: 'Moderator inbox (recent meta questions)',
                    click: function(e) {
                        e.preventDefault();
                        $diamond.toggleClass('topbar-icon-on');
                        $dialog.toggle();
                    }
                }).css({
                    'background-image': 'url(//cdn.sstatic.net/img/share-sprite-new.svg?v=78be252218f3)'
                });

            $dialog.append($header).append($content.append($questions));
            if (sox.NEW_TOPBAR) {
                $('.top-bar .-container .-secondary .-item:eq(1)').after($('<li/>').addClass('-item').append($diamond));
            } else {
                $diamond.appendTo('div.network-items');
            }
            $dialog.css('top', $('.top-bar').height());
            if ($('#metaNewQuestionAlertButton').length) $('.js-topbar-dialog-corral').append($dialog);

            $(document).mouseup(function(e) {
                if (!$dialog.is(e.target) &&
                    $dialog.has(e.target).length === 0 &&
                    !$(e.target).is('#metaNewQuestionAlertButton')) {
                    $dialog.hide();
                    $diamond.removeClass("topbar-icon-on");
                }
            });

            if (GM_getValue(NEWQUESTIONS, -1) == -1) {
                GM_setValue(NEWQUESTIONS, JSON.stringify(lastQuestions));
            } else {
                lastQuestions = JSON.parse(GM_getValue(NEWQUESTIONS));
            }

            $.getJSON(apiLink, function(json) {
                var latestQuestion = json.items[0].title;
                if (latestQuestion == lastQuestions[metaName]) {
                    //if you've already seen the stuff
                    $diamond.removeClass(DIAMONDON).addClass(DIAMONDOFF);
                } else {
                    $diamond.removeClass(DIAMONDOFF).addClass(DIAMONDON);

                    for (var i = 0; i < json.items.length; i++) {
                        var title = json.items[i].title,
                            link = json.items[i].link;
                        //author = json.items[i].owner.display_name;
                        addQuestion(title, link);

                    }
                    lastQuestions[metaName] = latestQuestion;

                    $diamond.click(function() {
                        GM_setValue(NEWQUESTIONS, JSON.stringify(lastQuestions));
                    });
                }
            });

            function addQuestion(title, link) {
                var $li = $('<li/>');
                var $link = $('<a/>', {
                    href: link
                });
                var $icon = $('<div/>', {
                    'class': 'site-icon favicon ' + favicon
                });
                var $message = $('<div/>', {
                    'class': 'message-text'
                }).append($('<h4/>', {
                    html: title
                }));

                $link.append($icon).append($message).appendTo($li);
                $questions.append($li);
            }
        },

        betterCSS: function() {
            // Description: For adding the better CSS for the voting buttons and favourite button

            function addCSS() {
                $('.vote-down-off, .vote-down-on, .vote-up-off, .vote-up-on, .star-off, .star-on').addClass('sox-better-css');
                $('head').append('<link rel="stylesheet" href="https://rawgit.com/shu8/SE-Answers_scripts/master/coolMaterialDesignCss.css" type="text/css" />');
                $('#hmenus').css('-webkit-transform', 'translateZ(0)');
            }
            addCSS();
            $(document).on('sox-new-review-post-appeared', addCSS);
        },

        standOutDupeCloseMigrated: function() {
            // Description: For adding cooler signs that a questions has been closed/migrated/put on hod/is a dupe

            function addLabel($question) {
                if ($question.attr('data-sox-question-state')) return; //don't run if question already has tag added

                var $anchor = $question.find('.summary a:eq(0)');
                var text = $anchor.text().trim();
                var id = $anchor.attr('href').split('/')[2];

                //https://github.com/soscripted/sox/issues/181
                $('.question-summary .answer-hyperlink, .question-summary .question-hyperlink, .question-summary .result-link a').css('display', 'inline');
                $('.summary h3').css('line-height', '1.2em'); //fixes line height on "Questions" page

                if (text.substr(text.length - 11) == '[duplicate]') {
                    $anchor.text(text.substr(0, text.length - 11)); //remove [duplicate]
                    $question.attr('data-sox-question-state', 'duplicate'); //used for hideCertainQuestions feature compatability
                    $.get('//' + location.hostname + '/questions/' + id, function(d) {
                        //styling for https://github.com/soscripted/sox/issues/181
                        $anchor.after("&nbsp;<a style='display: inline' href='" + $(d).find('.question-status.question-originals-of-duplicate a:eq(0)').attr('href') + "'><span class='standOutDupeCloseMigrated-duplicate' title='click to visit duplicate'>&nbsp;duplicate&nbsp;</span></a>"); //add appropiate message
                    });

                } else if (text.substr(text.length - 8) == '[closed]') {
                    $anchor.text(text.substr(0, text.length - 8)); //remove [closed]
                    $question.attr('data-sox-question-state', 'closed'); //used for hideCertainQuestions feature compatability
                    $.get('//' + location.hostname + '/questions/' + id, function(d) {
                        $anchor.after('&nbsp;<span class="standOutDupeCloseMigrated-closed" title="' + $(d).find('.question-status h2').text() + '">&nbsp;closed&nbsp;</span>'); //add appropiate message
                    });

                } else if (text.substr(text.length - 10) == '[migrated]') {
                    $anchor.text(text.substr(0, text.length - 10)); //remove [migrated]
                    $question.attr('data-sox-question-state', 'migrated'); //used for hideCertainQuestions feature compatability
                    $.get("https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22" + encodeURIComponent('https://' + location.hostname + '/questions/' + id) + "%22&diagnostics=true", function(d) {
                        var text,
                            questionStatus = $(d).find('.question-status:last');
                        if (questionStatus.length) {
                            if (questionStatus.text().indexOf('migrated from')) {
                                text = 'migrated from ' + questionStatus.find('h2 a').text();
                            }
                        } else {
                            text = 'migrated to' + $(d).find('.current-site .site-icon').attr('title');
                        }
                        $anchor.after("&nbsp;<span class='standOutDupeCloseMigrated-migrated' title='" + text + "'>&nbsp;migrated&nbsp;</span>"); //add appropiate message
                    });

                } else if (text.substr(text.length - 9) == '[on hold]') {
                    $anchor.text(text.substr(0, text.length - 9)); //remove [on hold]
                    $question.attr('data-sox-question-state', 'on hold'); //used for hideCertainQuestions feature compatability
                    $.get('//' + location.hostname + '/questions/' + id, function(d) {
                        $anchor.after('&nbsp;<span class="standOutDupeCloseMigrated-onhold" title="' + $(d).find('.question-status h2').text() + '">&nbsp;on hold&nbsp;</span>'); //add appropiate message
                    });
                }
            }


            $('.question-summary').each(function() { //Find the questions and add their id's and statuses to an object
                addLabel($(this));
            });
            sox.helpers.observe('#user-tab-questions, #question-mini-list', function() { //new questions on homepage, or for on user profile page
                $('.question-summary').each(function() { //Find the questions and add their id's and statuses to an object
                    addLabel($(this));
                });
            });
        },

        editReasonTooltip: function() {
            // Description: For showing the latest revision's comment as a tooltip on 'edit [date] at [time]'

            function getComment(url, $that) {
                $.get(url, function(responseText, textStatus, XMLHttpRequest) {
                    sox.debug('SOX editReasonTooltip URL: ' + url);
                    sox.debug('SOX editReasonTooltip text: ' + $(XMLHttpRequest.responseText).find('.revision-comment:eq(0)')[0].innerHTML);
                    sox.debug('SOX editReasonTooltip: adding to tooltip');
                    $that.find('.sox-revision-comment').attr('title', $(XMLHttpRequest.responseText).find('.revision-comment:eq(0)')[0].innerHTML);
                    sox.debug('SOX editReasonTooltip: finished adding to tooltip');
                    sox.debug('SOX editReasonTooltip: tooltip is now: ' + $that.find('.sox-revision-comment').attr('title'));

                });
            }

            function loopAndAddTooltip() {
                $('.question, .answer').each(function() {
                    if ($(this).find('.post-signature').length > 1) {
                        var id = $(this).attr('data-questionid') || $(this).attr('data-answerid');
                        $(this).find('.post-signature:eq(0)').find('.user-action-time a').wrapInner('<span class="sox-revision-comment"></span>');
                        var $that = $(this);
                        getComment(location.protocol + '//' + sox.site.url + '/posts/' + id + '/revisions', $that);
                    }
                });
            }
            loopAndAddTooltip();
            $(document).on('sox-new-review-post-appeared', loopAndAddTooltip);
        },

        addSBSBtn: function(settings) {
            // Description: For adding a button to the editor toolbar to toggle side-by-side editing
            // Thanks szego (@https://github.com/szego) for completely rewriting this! https://github.com/shu8/SE-Answers_scripts/pull/2

            function startSBS(toAppend) {
                //variables to reduce DOM searches
                var wmdinput = $('#wmd-input' + toAppend);
                var wmdpreview = $('#wmd-preview' + toAppend);
                var posteditor = $('#post-editor' + toAppend);
                var draftsaved = $('#draft-saved' + toAppend);
                var draftdiscarded = $('#draft-discarded' + toAppend);

                $('#wmd-button-bar' + toAppend).toggleClass('sbs-on');

                draftsaved.toggleClass('sbs-on');
                draftdiscarded.toggleClass('sbs-on');
                posteditor.toggleClass('sbs-on');
                posteditor.find('.wmd-container').parent().toggleClass('sbs-on-left-side');
                wmdinput.parent().toggleClass('sbs-on'); //wmdinput.parent() has class wmd-container
                wmdpreview.toggleClass('sbs-on');
                if (sox.location.on('/edit-tag-wiki/')) $('#post-form').toggleClass('sbs-on'); //https://github.com/soscripted/sox/issues/247

                if (toAppend.length > 0) { //options specific to making edits on existing questions/answers
                    posteditor.find('.hide-preview').toggleClass('sbs-on');

                    //hack: float nuttiness for "Edit Summary" box
                    var editcommentp1 = $('#edit-comment' + toAppend).parent().parent().parent().parent().parent();
                    editcommentp1.toggleClass('edit-comment-p1 sbs-on');
                    editcommentp1.parent().toggleClass('edit-comment-p2 sbs-on');
                } else if (window.location.pathname.indexOf('questions/ask') > -1) { //extra CSS for 'ask' page
                    wmdpreview.toggleClass('sbs-newq');
                    draftsaved.toggleClass('sbs-newq');
                    draftdiscarded.toggleClass('sbs-newq');
                    $('.tag-editor').parent().toggleClass('tag-editor-p sbs-on sbs-newq');
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

                    if (toAppend.length > 0) { //current sbs toggle is for an edit
                        $('.votecell').addClass('sbs-on');
                    }

                    //stretch the text input window to match the preview length
                    // - "215" came from trial and error
                    // - Can this be done using toggleClass?
                    var previewHeight = wmdpreview.height();
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
                if (jNode.is('textarea')) jNode = jNode.parent().find('[id^="wmd-redo-button"]');
                if (!jNode.length) return;

                var itemid = jNode[0].id.replace(/^\D+/g, '');
                var toAppend = (itemid.length > 0 ? '-' + itemid : ''); //helps select tags specific to the question/answer being
                // edited (or new question/answer being written)
                setTimeout(function() {
                    if (jNode.parent().find('.sox-sbs-toggle').length) return; //don't add again if already exists

                    var sbsBtn = '<li class="wmd-button sox-sbs-toggle" title="side-by-side-editing" style="left: 500px;width: 170px;"> \
<div id="wmd-sbs-button' + toAppend + '" style="background-image: none;">SBS</div></li>';
                    jNode.after(sbsBtn);

                    //add click listener to sbsBtn
                    jNode.next().on('click', function() {
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

            //This is a heavily modified version by szego <https://github.com/szego/SE-Answers_scripts/blob/master/side-by-side-editing.user.js>:
            if (window.location.pathname.indexOf('questions/ask') < 0) { //not posting a new question
                //get question and answer IDs for keeping track of the event listeners
                var anchorList = $('#answers > a'), //answers have anchor tags before them of the form <a name="#">, where # is the answer ID
                    numAnchors = anchorList.length,
                    itemIDs = [];

                for (var i = 1; i <= numAnchors - 2; i++) { //the first and last anchors aren't answers
                    itemIDs.push(anchorList[i].name);
                }
                itemIDs.push($('.question').data('questionid'));

                //event listeners for adding the sbs toggle buttons for editing existing questions or answers
                for (i = 0; i <= numAnchors - 2; i++) {
                    sox.helpers.observe('#wmd-redo-button-' + itemIDs[i], SBS);
                }
            }

            //event listener for adding the sbs toggle button for posting new questions or answers
            $(document).on('sox-edit-window', function(e, target) {
                SBS(target);
            });

            $('li[id^="wmd-redo-button"]').each(function() {
                SBS($(this));
            });

            //https://github.com/soscripted/sox/issues/163
            $('#tagnames').parent('.form-item').css('float', 'left');
            $('#edit-comment').parent('.form-item').css('float', 'left');

            sox.helpers.observe('.wmd-preview.sbs-on', function() {
                $('#tag-suggestions').parent().css('position', 'static'); //https://github.com/soscripted/sox/issues/140
            });
        },

        alwaysShowImageUploadLinkBox: function() {
            // Description: For always showing the 'Link from the web' box when uploading an image.

            sox.helpers.observe('.image-upload', function(n) {
                var toClick = $('.image-upload form div.modal-options-default.tab-page > a');
                if (toClick.length) toClick[0].click();
            });
        },

        addAuthorNameToInboxNotifications: function() {
            // Description: To add the author's name to inbox notifications

            function getAuthorName($node) {
                if ($node) {
                    var type = $node.find('.item-header .item-type').text(),
                        link = $node.find('a').eq(0).attr('href'),
                        apiurl, id;

                    if (!link) return;

                    var sitename = link.split('com/')[0].replace(/https?\:\/\//, '') + 'com';

                    //the ||'s are for fixing https://github.com/soscripted/sox/issues/242:
                    if (type == 'comment' || link.indexOf('posts/comments/') > -1) {
                        id = link.split('/')[5].split('?')[0];
                        apiurl = 'https://api.stackexchange.com/2.2/comments/' + id + '?order=desc&sort=creation&site=' + sitename;
                    } else if (type == 'answer' || link.indexOf('com/a/') > -1) {
                        id = link.split('/')[4].split('?')[0];
                        apiurl = 'https://api.stackexchange.com/2.2/answers/' + id + '?order=desc&sort=creation&site=' + sitename;
                    } else if (type == 'edit suggested' || link.indexOf('/suggested-edits/') > -1) {
                        id = link.split('/')[4];
                        apiurl = 'https://api.stackexchange.com/2.2/suggested-edits/' + id + '?order=desc&sort=creation&site=' + sitename;
                    } else {
                        sox.loginfo('SOX does not currently support get author information for type: ' + type);
                        return;
                    }

                    sox.debug('addAuthorNameToInboxNotifications: ', $node, id, apiurl);

                    $.getJSON(apiurl, function(json) {
                        sox.debug('addAuthorNameToInboxNotifications JSON returned from API', json);
                        if (json.items.length) {
                            var author = (type === 'edit suggested' || link.indexOf('/suggested-edits/') > -1 ? json.items[0].proposing_user.display_name : json.items[0].owner.display_name),
                                $author = $('<span/>', {
                                    class: 'author',
                                    text: " by " + $('<div>').html(author).text() //https://github.com/soscripted/sox/issues/233
                                });

                            var $header = $node.find('.item-header'),
                                $type = $header.find('.item-type').clone(),
                                $creation = $header.find('.item-creation').clone();

                            //fix conflict with soup fix mse207526 - https://github.com/vyznev/soup/blob/master/SOUP.user.js#L489
                            $header.empty().append($type).append($author).append($creation);
                        }
                    });
                }
            }

            sox.helpers.observe('.inbox-dialog', function(node) {
                var $addedNode = $(node);
                for (var x = 0; x < 21; x++) { //first 20 items
                    getAuthorName($addedNode.find('.inbox-item').eq(x));
                }
            });
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
                        scrollTop: 0
                    }, 50);
                    return false;
                }
            }).append($('<i/>', {
                'class': 'fa fa-angle-double-up fa-3x'
            })).appendTo('body');

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

            var group = {
                POST: 1,
                SPAM: 2,
                OFFENSIVE: 3,
                COMMENT: 4
            };
            var type = {
                TOTAL: 'flags',
                WAITING: 'waiting',
                HELPFUL: 'helpful',
                DECLINED: 'declined',
                DISPUTED: 'disputed',
                AGEDAWAY: 'aged away',
                RETRACTED: 'retracted'
            };

            var count,
                percentage;

            function addPercentage(group, type, percentage) {
                var $span = $('<span/>', {
                    text: '({0}%)'.replace('{0}', percentage),
                    style: 'margin-left:5px; color: #999; font-size: 12px;'
                });
                $('td > a[href*="group=' + group + '"]:contains("' + type + '")').after($span);
            }

            function calculatePercentage(count, total) {
                var percent = (count / total) * 100;
                return +percent.toFixed(2);
            }

            function getFlagCount(group, type) {
                var flagCount = 0;
                flagCount += Number($('td > a[href*="group=' + group + '"]:contains("' + type + '")')
                    .parent()
                    .prev()
                    .text()
                    .replace(',', ''));
                return flagCount;
            }

            // add percentages
            for (var groupKey in group) {
                var item = group[groupKey],
                    total = getFlagCount(item, type.TOTAL);
                for (var typeKey in type) {
                    var typeItem = type[typeKey];
                    if (typeKey !== 'TOTAL') {
                        count = getFlagCount(item, typeItem);
                        percentage = calculatePercentage(count, total);
                        //sox.debug(groupKey + ": " + typeKey + " Flags -- " + count);
                        addPercentage(item, typeItem, percentage);
                    }
                }
            }
        },

        linkedPostsInline: function() {
            // Description: Displays linked posts inline with an arrow

            function getIdFromUrl(url) {
                if (url.indexOf('/questions/tagged/') !== -1) return false;

                if (url.indexOf('/a/') > -1) { //eg. http://meta.stackexchange.com/a/26764/260841
                    return url.split('/a/')[1].split('/')[0];

                } else if (url.indexOf('/q/') > -1) { //eg. http://meta.stackexchange.com/q/26756/260841
                    return url.split('/q/')[1].split('/')[0];

                } else if (url.indexOf('/questions/') > -1) {
                    if (url.indexOf('#') > -1) { //then it's probably an answer, eg. http://meta.stackexchange.com/questions/26756/how-do-i-use-a-small-font-size-in-questions-and-answers/26764#26764
                        return url.split('#')[1];

                    } else { //then it's a question
                        return url.split('/questions/')[1].split('/')[0];
                    }
                }
            }

            function addButton() {
                $('.post-text a, .comments .comment-copy a').each(function() {
                    var url = $(this).attr('href');

                    //https://github.com/soscripted/sox/issues/205 -- check link's location is to same site, eg if on SU, don't allow on M.SU
                    //http://stackoverflow.com/a/4815665/3541881
                    if (url &&
                        $('<a>').prop('href', url).prop('hostname') == location.hostname &&
                        url.indexOf('#comment') == -1 &&
                        url.indexOf('/edit') == -1 && //https://github.com/soscripted/sox/issues/281
                        getIdFromUrl(url) && //getIdFromUrl(url) makes sure it won't fail later on
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
                    var $that = $(this);
                    var id = getIdFromUrl($(this).next().attr('href'));
                    $.get(location.protocol + '//' + sox.site.url + '/posts/' + id + '/body', function(d) {
                        var div = '<div class="linkedPostsInline-loaded-body-sox">' + d + '</div>';
                        $that.next().after(div);
                    });
                }
            });
        },

        hideHotNetworkQuestions: function() {
            // Description: Hides the Hot Network Questions module from the sidebar

            $('#hot-network-questions').remove();
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

            var $hotMetaPostsHeader = $('#sidebar .community-bulletin .related').find('div:contains("Hot Meta Posts")');
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
            // Description: Hides the "Love This Site?"" module from the sidebar

            $('#sidebar #newsletter-ad').parent().remove();
        },

        downvotedPostsEditAlert: function() {
            // Description: Adds a notification to the inbox if a question you downvoted and watched is edited

            //GM_deleteValue('downvotedPostsEditAlert');
            //GM_deleteValue('downvotedPostsEditAlert-notifications');

            function addEditNotification(link, title, sitename, notificationPostId, unread, editor, editorLink, editTime, type, postsToCheck) {
                sox.debug('downvotedPostsEditAlert addEditNotification editTime', editTime);
                var id = link.split('/')[4];
                sox.helpers.getFromAPI('posts', id + '/revisions', sitename, function(d) {
                    var comment = d.items[0].comment;
                    var $li = $('<li/>', {
                        'class': 'question-close-notification' + (unread ? ' unread-item' : '')
                    });
                    var $link = $('<a/>', {
                        href: link
                    });
                    var $icon = $('<div/>', {
                        'class': 'site-icon favicon favicon-stackexchange'
                    });
                    var $message = $('<div/>', {
                        'class': 'message-text'
                    }).append($('<h4/>', {
                        html: (type === 'question' ? 'Q: ' : 'A: ') + title + ' (edited by ' + editor + ' at ' + new Date(editTime * 1000).toLocaleString() + ') ' + (id in postsToCheck ? '<span title="watching is still active for this post" style="float:right"><i class="fa fa-eye"></i></span>' : ''),
                        title: comment
                    })).append($('<span/>', {
                        'class': 'downvotedPostsEditAlert-delete',
                        style: 'color:blue;border: 1px solid gray;',
                        id: 'delete_' + sitename + '-' + notificationPostId,
                        text: 'delete'
                    }));

                    //$('#downvotedPostsEditAlertButton').addClass(unread ? 'glow' : '');
                    $link.append($icon).append($message).appendTo($li);
                    if ($('#downvotedPostsEditAlertDialog #downvotedPostsEditAlertList').find('a[href*="' + link + '"]').length) {
                        $('#downvotedPostsEditAlertDialog #downvotedPostsEditAlertList a[href*="' + link + '"]').parent().replaceWith($li);
                    } else {
                        $('#downvotedPostsEditAlertDialog #downvotedPostsEditAlertList').prepend($li);
                    }
                    var count = $('#downvotedPostsEditAlertList li.unread-item').length;
                    if (count) {
                        $('.downvotedPostsEditAlertButtonCount').text(count).show();
                    } else {
                        $('.downvotedPostsEditAlertButtonCount').hide();
                    }
                }, 'creation?pagesize=1', false);
            }

            function sendWebSocket(websocketSiteCodes, sitename, questionId) {
                sox.debug('downvotedPostsEditAlert: sending websocket message: ' + websocketSiteCodes[sitename] + "-question-" + questionId);
                w.send(websocketSiteCodes[sitename] + "-question-" + questionId);
            }

            var $dialog = $('<div/>', {
                    id: 'downvotedPostsEditAlertDialog',
                    'class': 'topbar-dialog dno new-topbar'
                }),
                $header = $('<div/>', {
                    'class': 'header'
                }).append($('<h3/>', {
                    text: 'edited posts'
                })),
                $content = $('<div/>', {
                    'class': 'modal-content'
                }),
                $posts = $('<ul/>', {
                    id: 'downvotedPostsEditAlertList',
                    'class': 'js-items items'
                }),
                $button = $('<a/>', {
                    id: 'downvotedPostsEditAlertButton',
                    class: '-link downvotedPostsEditAlert-buttonOff',
                    title: 'Watched posts that have been edited',
                    'style': 'color: #858c93; background-image: none;',
                    href: '#',
                    click: function(e) {
                        e.preventDefault();
                        $button.toggleClass('topbar-icon-on');
                        $dialog.toggle();
                    }
                }),
                $icon = $('<i/>', {
                    class: 'fa fa-edit'
                }),
                $count = $('<div/>', {
                    'class': 'downvotedPostsEditAlertButtonCount',
                    'style': 'display:none'
                });

            $button.append($count).append($icon);

            if (sox.NEW_TOPBAR) {
                $('.top-bar .-container .-secondary .-item:eq(1)').after($('<li/>').addClass('-item').append($button));
            } else {
                $button.appendTo('div.network-items');
                $dialog.css('left', $('#downvotedPostsEditAlertButton').position().left);
            }
            $dialog.css('top', $('.top-bar').height());
            if ($('#downvotedPostsEditAlertButton').length) $('.js-topbar-dialog-corral').append($dialog);

            $(document).click(function(e) { //close dialog if clicked outside it
                var $target = $(e.target),
                    isToggle = $target.is('#downvotedPostsEditAlertButton, #downvotedPostsEditAlertDialog'),
                    isChild = $target.parents('#downvotedPostsEditAlertButton, #downvotedPostsEditAlertDialog').is("#downvotedPostsEditAlertButton, #downvotedPostsEditAlertDialog");

                if (!isToggle && !isChild) {
                    $dialog.hide();
                    $button.removeClass('topbar-icon-on glow');
                    $count.text('');
                }
            });

            var websocketSiteCodes = {
                "3dprinting": "640",
                "academia": "415",
                "ham": "520",
                "android": "139",
                "anime": "477",
                "arduino": "540",
                "area51": "11",
                "gaming": "41",
                "ai": "658",
                "crafts": "650",
                "apple": "118",
                "patents": "463",
                "askubuntu": "89",
                "astronomy": "514",
                "aviation": "528",
                "alcohol": "532",
                "hermeneutics": "320",
                "bicycles": "126",
                "biology": "375",
                "bitcoin": "308",
                "blender": "502",
                "boardgames": "147",
                "buddhism": "565",
                "chemistry": "431",
                "chess": "435",
                "chinese": "371",
                "christianity": "304",
                "civicrm": "605",
                "codereview": "196",
                "coffee": "597",
                "cogsci": "391",
                "communitybuilding": "571",
                "scicomp": "363",
                "computergraphics": "633",
                "cs": "419",
                "craftcms": "563",
                "stats": "65",
                "crypto": "281",
                "datascience": "557",
                "dba": "182",
                "drupal": "220",
                "earthscience": "553",
                "ebooks": "530",
                "economics": "591",
                "electronics": "135",
                "elementaryos": "621",
                "emacs": "583",
                "engineering": "595",
                "english": "97",
                "ell": "481",
                "ethereum": "642",
                "expatriates": "546",
                "expressionengine": "471",
                "freelancing": "500",
                "french": "299",
                "gamedev": "53",
                "gardening": "269",
                "genealogy": "467",
                "gis": "79",
                "german": "253",
                "graphicdesign": "174",
                "hardwarerecs": "635",
                "health": "607",
                "hinduism": "567",
                "hsm": "587",
                "history": "324",
                "diy": "73",
                "homebrew": "156",
                "security": "162",
                "islam": "455",
                "italian": "524",
                "japanese": "257",
                "joomla": "555",
                "korean": "654",
                "languagelearning": "646",
                "latin": "644",
                "law": "617",
                "bricks": "336",
                "lifehacks": "593",
                "linguistics": "312",
                "magento": "479",
                "martialarts": "403",
                "mathematica": "387",
                "matheducators": "548",
                "math": "69",
                "mathoverflow": "504",
                "meta": "4",
                "judaism": "248",
                "monero": "656",
                "mechanics": "224",
                "movies": "367",
                "musicfans": "601",
                "music": "240",
                "mythology": "615",
                "networkengineering": "496",
                "opendata": "498",
                "opensource": "619",
                "parenting": "228",
                "money": "93",
                "productivity": "277",
                "pets": "518",
                "philosophy": "265",
                "photo": "61",
                "fitness": "216",
                "physics": "151",
                "poker": "379",
                "politics": "475",
                "portuguese": "625",
                "programmers": "131",
                "codegolf": "200",
                "pm": "208",
                "puzzling": "559",
                "quant": "204",
                "raspberrypi": "447",
                "retrocomputing": "648",
                "reverseengineering": "489",
                "robotics": "469",
                "rpg": "122",
                "russian": "451",
                "salesforce": "459",
                "scifi": "186",
                "cooking": "49",
                "serverfault": "2",
                "sharepoint": "232",
                "dsp": "295",
                "skeptics": "212",
                "sqa": "244",
                "softwarerecs": "536",
                "sound": "512",
                "space": "508",
                "spanish": "353",
                "sports": "411",
                "stackapps": "101",
                "stackoverflow": "1",
                "pt": "526",
                "es": "637",
                "ru": "609",
                "startups": "573",
                "superuser": "3",
                "sustainability": "483",
                "tex": "85",
                "outdoors": "395",
                "workplace": "423",
                "cstheory": "114",
                "tor": "516",
                "travel": "273",
                "tridion": "485",
                "unix": "106",
                "ux": "102",
                "vi": "599",
                "video": "170",
                "webapps": "34",
                "webmasters": "45",
                "windowsphone": "427",
                "woodworking": "603",
                "wordpress": "110",
                "worldbuilding": "579",
                "writers": "166",
                "rus": "613",
                "ja": "581"
            };

            var postsToCheck = JSON.parse(GM_getValue('downvotedPostsEditAlert', '{}'));
            var notifications = JSON.parse(GM_getValue('downvotedPostsEditAlert-notifications', '{}'));
            sox.debug('downvotedPostsEditAlert posts to check', postsToCheck);
            sox.debug('downvotedPostsEditAlert notifications', notifications);

            $(document).on('click', '.downvotedPostsEditAlert-delete', function(e) {
                e.preventDefault();
                e.stopPropagation();
                sox.debug('downvotedPostsEditAlert: deleting notification from notifications object');
                var base = $(this).attr('id').split('delete_')[1];
                var sitename = base.split('-')[0];
                var postId = base.split('-')[1];
                delete notifications[+postId];
                sox.debug('downvotedPostsEditAlert: new notifications object', notifications);
                GM_setValue('downvotedPostsEditAlert-notifications', JSON.stringify(notifications));
                $(this).parents('.question-close-notification').remove(); //hide the notification in the inbox dropdown
            });

            if (!sox.location.on('.com/tour') && !sox.location.on('area51.stackexchange.com')) { //https://github.com/soscripted/sox/issues/151
                $('.post-menu').each(function() {
                    var id;
                    var $parent = $(this).parents('.question, .answer');
                    if ($parent.length) {
                        if ($parent.hasClass('question')) {
                            id = +$parent.attr('data-questionid');
                        } else {
                            id = +$parent.attr('data-answerid');
                        }
                    }
                    $(this).append("<span class='lsep'></span><a " + (id in postsToCheck ? "style='color:green; font-weight:bold'" : "") + "class='downvotedPostsEditAlert-watchPostForEdits'>notify on edit</a>");
                });
            }

            $('.downvotedPostsEditAlert-watchPostForEdits').click(function() {
                var questionId = document.URL.split('/')[4];
                var postId = $(this).parents('.question, .answer').attr('data-answerid') || questionId;
                var sitename = sox.site.currentApiParameter;
                var posts = Object.keys(postsToCheck);
                var index = posts.indexOf(postId);

                if (index > -1) { //already exists, so remove it
                    $(this).removeAttr('style');
                    delete postsToCheck[posts[index]];
                } else { //new watch item
                    $(this).css({
                        'color': 'green',
                        'font-weight': 'bold'
                    });
                    postsToCheck[postId] = {
                        'questionId': questionId,
                        'addedDate': new Date().getTime(),
                        'sitename': sitename
                    };
                }
                GM_setValue('downvotedPostsEditAlert', JSON.stringify(postsToCheck));
            });

            //set up websockets
            var w = new WebSocket("wss://qa.sockets.stackexchange.com/");
            var posts = Object.keys(postsToCheck);
            w.onmessage = function(e) {
                var data = JSON.parse(e.data);
                var sitename;
                var title;
                data.data = JSON.parse(data.data);
                sox.debug('downvotedPostsEditAlert Received Data:', data.data);
                if (data.data.a == 'post-edit' && posts.indexOf((data.data.id).toString()) > -1) {
                    for (var c in websocketSiteCodes) {
                        if (websocketSiteCodes[c] == data.action.split('-')[0]) {
                            sitename = c;
                            sox.helpers.getFromAPI('posts', data.data.id, sitename, function(d) {
                                title = d.items[0].title;
                                notifications[data.data.id] = {
                                    'sitename': sitename,
                                    'url': 'https://' + sitename + '.stackexchange.com/' + (d.items[0].post_type == 'question' ? 'q/' : 'a/') + data.data.id,
                                    'title': title,
                                    'editor': d.items[0].last_editor.display_name,
                                    'editor_link': d.items[0].last_editor.link,
                                    'edit_date': d.items[0].last_edit_date,
                                    'type': d.items[0].post_type
                                };
                                GM_setValue('downvotedPostsEditAlert-notifications', JSON.stringify(notifications));
                                addEditNotification('https://' + sitename + '.stackexchange.com/' + (d.items[0].post_type == 'question' ? 'q/' : 'a/') + data.data.id, title + ' [LIVE]', sitename, data.data.id, true, d.items[0].last_editor.display_name, d.items[0].last_editor.link, d.items[0].last_edit_date, d.items[0].post_type, postsToCheck);
                                sox.debug('downvotedPostsEditAlert: adding notification from live');
                            }, 'activity&filter=!-*f(6qkz8Rkb');
                        }
                    }
                }
            };

            $.each(notifications, function(i, o) {
                addEditNotification(o.url, o.title, o.sitename, i, false, o.editor, o.editor_link, o.edit_date, o.type, postsToCheck);
            });

            console.log(postsToCheck);
            if (!$.isEmptyObject(postsToCheck)) {
                sox.debug(postsToCheck);
                $.each(postsToCheck, function(i, o) {
                    sox.debug('downvotedPostsEditAlert: Last Checked Time: ' + o.lastCheckedTime);
                    if (new Date().getTime() >= ((o.lastCheckedTime || 0) + 900000)) { //an hour: 3600000ms, 15 minutes: 900000ms, 1 minute: 60000ms
                        sox.helpers.getFromAPI('posts', i, o.sitename, function(json) {
                            sox.debug('downvotedPostsEditAlert json:', json);
                            sox.debug('downvotedPostsEditAlert check:', json.items[0].last_edit_date + '>' + (o.lastCheckedTime || o.addedDate) / 1000);
                            sox.debug('downvotedPostsEditAlert evaluation', json.items[0].last_edit_date > (o.lastCheckedTime || o.addedDate) / 1000);
                            if (json.items[0].last_edit_date > (o.lastCheckedTime || o.addedDate) / 1000) {
                                sox.debug('downvotedPostsEditAlert: adding notification from api');
                                addEditNotification(json.items[0].link, json.items[0].title + ' [API]', json.items[0].link.split('/')[2].split('.')[0], i, true, json.items[0].last_editor.display_name, json.items[0].last_editor.link, json.items[0].last_edit_date, json.items[0].post_type, postsToCheck);
                                notifications[i] = {
                                    'sitename': json.items[0].link.split('/')[2].split('.')[0],
                                    'url': json.items[0].link,
                                    'title': json.items[0].title,
                                    'editor': json.items[0].last_editor.display_name,
                                    'editor_link': json.items[0].last_editor.link,
                                    'edit_date': json.items[0].last_edit_date,
                                    'type': json.items[0].post_type
                                };
                                GM_setValue('downvotedPostsEditAlert-notifications', JSON.stringify(notifications));
                            }
                        }, "activity&filter=!-*f(6qkz8Rkb", false); //false means async=false
                        o.lastCheckedTime = new Date().getTime();
                    }
                    GM_setValue('downvotedPostsEditAlert', JSON.stringify(postsToCheck));
                    sox.debug(w);
                    sox.debug(w.readyState);
                    if (w.readyState === 1) {
                        sendWebSocket(websocketSiteCodes, o.sitename, o.questionId);
                    } else {
                        w.onopen = function() {
                            sox.debug('websocket opened');
                            sendWebSocket(websocketSiteCodes, o.sitename, o.questionId);
                        };
                    }
                });
            } else {
                $dialog.text('empty');
            }
        },

        chatEasyAccess: function() {
            // Description: Adds options to give a user read/write/no access in chat from their user popup dialog

            sox.helpers.observe('.user-popup', function(node) {
                var $node = $(node).parent();
                var id = $node.find('a')[0].href.split('/')[4];

                //NOTE: $(node) !== $node
                if ($(node).find('.chatEasyAccess').length) return;
                if ($('.chatEasyAccess').length) $('.chatEasyAccess').remove();

                //NOTE: $(node) !== $node
                $(node).append('<div class="chatEasyAccess">give <b id="read-only">read</b> / <b id="read-write">write</b> / <b id="remove">no</b> access</div>');
                $(document).on('click', '.chatEasyAccess b', function() {
                    var $that = $(this);
                    $.ajax({
                        url: 'https://chat.stackexchange.com/rooms/setuseraccess/' + location.href.split('/')[4],
                        type: 'post',
                        data: {
                            'fkey': fkey().fkey,
                            'userAccess': $that.attr('id'),
                            'aclUserId': id
                        },
                        success: function(d) {
                            if (d === '') {
                                alert('Successfully changed user access');
                            } else {
                                alert(d);
                            }
                        }
                    });
                });
            });
        },

        topAnswers: function() {
            // Description: Adds a box above answers to show the most highly-scoring answers

            var count = 0;
            var $topAnswers = $('<div/>', {
                    id: 'sox-top-answers',
                    style: 'padding-bottom: 10px; border-bottom: 1px solid #eaebec;'
                }),
                $table = $('<table/>', {
                    style: 'margin:0 auto;'
                }),
                $row = $('<tr/>');

            $table.append($row).appendTo($topAnswers);

            function score(e) {
                return +$(e).parent().find('.vote-count-post').text();
            }

            function compareByScore(a, b) {
                return score(b) - score(a);
            }

            $(':not(.deleted-answer) .answercell').slice(1).sort(compareByScore).slice(0, 5).each(function() {
                count++;
                var id = $(this).find('.short-link').attr('id').replace('link-post-', ''),
                    score = $(this).prev().find('.vote-count-post').text(),
                    icon = 'vote-up-off';

                if (score > 0) {
                    icon = 'vote-up-on';
                }
                if (score < 0) {
                    icon = 'vote-down-on';
                }

                var $column = $('<td/>', {
                        style: 'width: 100px; text-align: center;'
                    }),
                    $link = $('<a/>', {
                        href: '#' + id
                    }),
                    $icon = $('<i/>', {
                        class: icon,
                        style: 'margin-bottom: 0;'
                    });

                $link.append($icon).append('Score: ' + score);
                $column.append($link).appendTo($row);
            });

            if (count > 0) {
                $('#answers div.answer:first').before($topAnswers);
                $table.css('width', count * 100 + 'px');
            }
        },

        tabularReviewerStats: function() {
            // Description: Adds a notification to the inbox if a question you downvoted and watched is edited
            // Idea by lolreppeatlol @ http://meta.stackexchange.com/a/277446/260841 :)

            sox.helpers.observe('.review-more-instructions', function() {
                var info = {};
                $('.review-more-instructions ul:eq(0) li').each(function() {
                    var text = $(this).text(),
                        username = $(this).find('a').text(),
                        link = $(this).find('a').attr('href'),
                        approved = text.match(/approved (.*?)[a-zA-Z]/)[1],
                        rejected = text.match(/rejected (.*?)[a-zA-Z]/)[1],
                        improved = text.match(/improved (.*?)[a-zA-Z]/)[1];
                    info[username] = {
                        'link': link,
                        'approved': approved,
                        'rejected': rejected,
                        'improved': improved
                    };
                });
                var $editor = $('.review-more-instructions ul:eq(1) li'),
                    editorName = $editor.find('a').text(),
                    editorLink = $editor.find('a').attr('href'),
                    editorApproved = $editor.clone().find('a').remove().end().text().match(/([0-9]+)/g)[0], //`+` matches 'one or more' to make sure it works on multi-digit numbers!
                    editorRejected = $editor.clone().find('a').remove().end().text().match(/([0-9]+)/g)[1]; //https://stackoverflow.com/q/11347779/3541881 for fixing https://github.com/soscripted/sox/issues/279
                info[editorName] = {
                    'link': editorLink,
                    'approved': editorApproved,
                    'rejected': editorRejected
                };
                var table = "<table><tbody><tr><th style='padding: 4px;'>User</th><th style='padding: 4px;'>Approved</th><th style='padding: 4px;'>Rejected</th><th style='padding: 4px;'>Improved</th style='padding: 4px;'></tr>";
                $.each(info, function(user, details) {
                    table += "<tr><td style='padding: 4px;'><a href='" + details.link + "'>" + user + "</a></td><td style='padding: 4px;'>" + details.approved + "</td><td style='padding: 4px;'>" + details.rejected + "</td><td style='padding: 4px;'>" + (details.improved ? details.improved : 'N/A') + "</td></tr>";
                });
                table += "</tbody></table>";
                $('.review-more-instructions p, .review-more-instructions ul').remove();
                $('.review-more-instructions').append(table);
            });
        },

        linkedToFrom: function() {
            // Description: Add an arrow to linked posts in the sidebar to show whether they are linked to or linked from

            /*var currentQuestionId = location.href.split('/')[4],
                linkedQuestions = {},
                keys = [];

            $('.linked a.question-hyperlink').each(function() {
                linkedQuestions[$(this).attr('href').split('/')[4]] = $(this);
            });

            keys = Object.keys(linkedQuestions);
            console.log(currentQuestionId);
            console.log(linkedQuestions);
            console.log(keys);

           sox.helpers.getFromAPI('posts', keys.join(';'), sox.site.currentApiParameter, function(d) {
               console.log(d);
               var items = d.items;
               for (var i = 0; i < items.length; i++) {
                   var $body = $(items[i].body);
                   console.log($body);
                   if ($body.find('a[href*="' + currentQuestionId + '"]').not('.spacer a').length) {
                       $(linkedQuestions[items.post_id]).append('<i class="fa fa-chevron-left" title="Current question is linked from this question" style="color:black;margin-left:5px;"></i>');
                   }
               }
           }, 'activity&filter=!LH22RNnZjCnsF)6E22pmFx');*/

            var currentId = location.href.split('/')[4];
            $('.linked .spacer a.question-hyperlink').each(function() {
                var id = $(this).attr('href').split('/')[4];
                if ($('a[href*="' + id + '"]').not('.spacer a').length) {
                    var $that = $(this);
                    $that.append('<i class="fa fa-chevron-right"  title="Current question links to this question" style="color:black;margin-left:5px;"></i>');
                    $.ajax({
                        url: '/questions/' + id,
                        type: 'get',
                        dataType: 'html',
                        async: 'false',
                        success: function(d) {
                            if ($(d).find('a[href*="' + currentId + '"]').not('.spacer a').length) {
                                $that.append('<i class="fa fa-chevron-left" title="Current question is linked from this question" style="color:black;margin-left:5px;"></i>');
                            }
                        }
                    });
                } else {
                    $(this).append('<i class="fa fa-chevron-left" title="Current question is linked from this question" style="color:black;margin-left:5px;"></i>');
                }
            });
        },

        alignBadgesByClass: function() {
            // Description: Aligns badges by their class (bronze/silver/gold) on user profiles

            var numbers = {
                    'gold': 0,
                    'silver': 0,
                    'bronze': 0
                },
                classes = ['gold', 'silver', 'bronze'],
                acs = {};

            $('.user-accounts tr .badges').each(function(i, o) {
                var b, s, g;
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
                    'gold': g
                };
            });
            $.each(acs, function(k, v) {
                var $badgesTd = $('.user-accounts tr .badges').eq(k);
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
                'display': 'inline-block'
            });

        },

        quickAuthorInfo: function() { //TODO: make this feature work without needing to set async to false, which is a hacky way of fixing it atm
            // Description: Shows when the post's author was last active and their registration state in the comments section

            function addLastSeen(userDetailsFromAPI) {
                $('.question, .answer, .reviewable-post').each(function() {
                    sox.debug('current post', $(this));
                    if ($(this).find('.post-signature a').length) {
                        var $anchor = $(this).find('.post-signature .user-details:last a:last');
                        var id = $anchor.length ? $anchor.attr('href').split('/')[2] : undefined;
                        sox.debug('quickAuthorInfo addLastSeen(): current id', id);
                        sox.debug('quickAuthorInfo addLastSeen(): userdetailscurrent id', userDetailsFromAPI[id]);
                        if (userDetailsFromAPI[id] && !$(this).find('.sox-last-seen').length) {
                            var lastSeenDate = new Date(userDetailsFromAPI[id].last_seen);
                            var type = '';
                            if (userDetailsFromAPI[id].type === 'unregistered') {
                                type = ' (unregistered)';
                            }
                            $(this).find('.user-info').last().append(
                                "<div style='color: #848d95; font-size: 11px; padding-top: 38px'><i class='fa fa-clock-o'></i>&nbsp;<time class='timeago sox-last-seen' datetime='" +
                                lastSeenDate.toISOString() + "' title='" + //datetime
                                lastSeenDate.toJSON().replace('T', ' ').replace('.000', '') + "'>" + //title, https://github.com/soscripted/sox/issues/204 hacky but short way '.000' always works because SE doesn't do such precise times
                                lastSeenDate.toLocaleString() + "</time>" + type //contents of tag
                            );
                        }
                    }
                });
                $("time.timeago").timeago();
            }

            function getIdsAndAddDetails(answerers) {
                $('.question, .answer, .reviewable-post').each(function() {
                    var $userDetailsAnchor = $(this).find('.post-signature .user-details a').last();
                    if ($userDetailsAnchor.length) {
                        var userid = ($userDetailsAnchor.attr('href') ? $userDetailsAnchor.attr('href').split('/')[2] : 0);
                        var username = $userDetailsAnchor.text();
                        if (userid !== 0) answerers[userid] = username;
                    } else {
                        sox.loginfo('Could not find user user link for: ', $(this));
                    }
                });

                sox.helpers.getFromAPI('users', Object.keys(answerers).join(';'), sox.site.currentApiParameter, function(data) {
                    sox.debug('quickAuthorInfo api dump', data);

                    var userDetailsFromAPI = {};
                    $.each(data.items, function(k, v) {
                        userDetailsFromAPI[v.user_id] = {
                            'last_seen': v.last_access_date * 1000,
                            'type': v.user_type
                        };
                    });
                    sox.debug('quickAuthorInfo userdetailsfromapi', userDetailsFromAPI);
                    addLastSeen(userDetailsFromAPI);

                    $(document).on('sox-new-comment', function() { //make sure it doesn't disappear when adding a new comment!
                        addLastSeen(userDetailsFromAPI);
                    });
                }, 'creation', 'false'); //false means async=false;
            }

            var answerers = {};

            sox.helpers.observe('.review-content', function() {
                getIdsAndAddDetails(answerers);
            });

            getIdsAndAddDetails(answerers);

            sox.debug('quickAuthorInfo answerer IDs', answerers);
            sox.debug('quickAuthorInfo API call parameters', 'users', Object.keys(answerers).join(';'), sox.site.currentApiParameter);
        },

        hiddenCommentsIndicator: function() {
            // Description: Darkens the border underneath comments if there are hidden comments underneath it

            $('.question, .answer').each(function() {
                if ($(this).find('.js-show-link.comments-link:visible').length) {
                    var postId = $(this).attr('data-questionid') || $(this).attr('data-answerid'),
                        x = [],
                        y = [],
                        protocol = location.protocol,
                        hostname = location.hostname,
                        baseUrl = protocol + '//' + hostname;
                    $.get(baseUrl + '/posts/' + postId + '/comments', function(d) {
                        var $commentCopy = $('#comments-' + postId + ' .comment-text .comment-copy');

                        $(d).find('.comment-text').each(function(i) {
                            x.push($(this).find('.comment-copy').text());
                        });

                        $commentCopy.filter(function(d) {
                            y.push(x.indexOf($commentCopy.eq(d).text()));
                        });

                        for (var i = 0; i < y.length; i++) {
                            if (y[i] != y[i + 1] - 1) {
                                $commentCopy.filter(function(d) {
                                    return $(this).text() == x[y[i]];
                                }).parent().parent().parent().find('.comment-actions, .comment-text').css('border-bottom-color', 'gray');
                            }
                        }
                    });
                }
            });
        },

        hotNetworkQuestionsFiltering: function(settings) {
            // Description: Filter hot network questions in the sidebar based on their attributes such as title, site, etc..

            $('#hot-network-questions li a').each(function() {
                var i;
                if (settings.wordsToBlock && settings.wordsToBlock !== '') {
                    var words = $(this).text().split(' '),
                        wordsToBlock = settings.wordsToBlock.split(',');
                    for (i = 0; i < wordsToBlock.length; i++) {
                        if (words.indexOf(wordsToBlock[i]) != -1) {
                            $(this).parent().hide();
                        }
                    }
                }
                if (settings.sitesToBlock && settings.sitesToBlock !== '') {
                    var site = $(this).attr('href'),
                        sitesToBlock = settings.sitesToBlock.split(',');
                    for (i = 0; i < sitesToBlock.length; i++) {
                        if (sox.location.matchWithPattern(sitesToBlock[i], site)) {
                            $(this).parent().hide();
                        }
                    }
                }
                if (settings.titlesToHideRegex && settings.titlesToHideRegex !== '') {
                    var title = $(this).text(),
                        titlesToHide = settings.titlesToHideRegex.split(',');
                    for (i = 0; i < titlesToHide.length; i++) {
                        if (title.match(new RegExp(titlesToHide))) {
                            $(this).parent().hide();
                        }
                    }
                }
                $(this).append('<i class="fa fa-tags getQuestionTags"></i>');
            });

            $('.getQuestionTags').hover(function(e) {
                if (!$(this).attr('data-tags')) {
                    var $that = $(this),
                        id = $(this).parent().attr('href').split('/')[4],
                        sitename = $(this).parent().attr('href').split('/')[2];

                    sox.helpers.getFromAPI('questions', id, sitename, function(d) {
                        $that.attr('data-tags', d.items[0].tags.join(', '));
                    });
                }
            }, function() {
                if (!$(this).next().hasClass('tooltip') && $(this).attr('data-tags')) {
                    $(this).after('<span class="tooltip" style="display: block;margin-left: 5px;background-color: #eeeefe;border: 1px solid darkgrey;font-size: 11px;padding: 1px;">' + $(this).attr('data-tags') + '</span>');
                    $(this).remove();
                }
            });
        },

        warnNotLoggedIn: function() {
            // Description: Add a small notice at the bottom left of the screen if you are not logged in when browsing an SE site

            var div = $('<div/>', {
                id: 'loggedInReminder',
                style: 'position: fixed; right: 0; bottom: 50px; background-color: rgba(200, 200, 200, 1); width: 200px; text-align: center; padding: 5px; color: black; font-weight:bold',
                html: 'SOX: You are not logged in. You should <a href="/users/login">log in</a> to continue enjoying SE.'
            });

            function checkAndAddReminder() {
                if (!sox.user.loggedIn && !sox.location.on('winterbash2016.stackexchange.com')) {
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
                    'pointer-events': 'none' //disables the anchor tag (jQuery off() doesn't work)
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
                    'pointer-events': 'none' //disables the anchor tag (jQuery off() doesn't work)
                })
                .parent().attr('title', 'You cannot vote on your own posts.'); //.parent() is to add the title to the .vote div
        },

        replyToOwnChatMessages: function() {
            // Description: Adds a reply button to your own chat messages so you can reply to your own messages easier and quicker
            // I use $(document).on instead of .each, since using .each wouldn't apply to messages loaded via "Load more messages" and "Load to my last message"

            $(document).on('mouseenter', '.mine .message', function() {
                    //Remove excess spacing to the left of the button (by emptying .meta, which has "&nbsp" in it), and set the button color to the background color
                    $(this).find('.meta').empty().css({
                        "background-color": $(this).parent().css("background-color"),
                        "padding-right": "1px"
                    }).show().append(replySpan);
                    //The "padding-right: 1px" is to avoid some weird bug I can't figure out how to fix
                }).on('mouseleave', '.mine .message', function() {
                    $(this).find('.meta').hide().find('.newreply').remove();
                })

                //Do the same thing if you hover over the timestamp
                .on('mouseenter', '.mine .timestamp', function() {
                    $(this).next().find('.meta').empty().css({
                        "background-color": $(this).parent().css("background-color"),
                        "padding-right": "1px"
                    }).show().append(replySpan);
                }).on('mouseleave', '.mine .timestamp', function() {
                    $(this).next().find('.meta').hide().find('.newreply').remove();
                })

                .on('click', '.newreply.added-by-sox', function(e) {
                    var $message = $(e.target).closest('.message'),
                        id = $message.attr('id').split('-')[1],
                        rest = $('#input').focus().val().replace(/^:([0-9]+)\s+/, '');
                    $('#input').val(':' + id + ' ' + rest).focus();
                });

            var replySpan = $('<span/>', {
                class: 'newreply added-by-sox',
                'title': 'link my next chat message as a reply to this'
            });
        },

        hideCertainQuestions: function(settings) {
            // Description: Hide certain questions depending on your choices

            if (settings.duplicate || settings.closed || settings.migrated || settings.onHold) {
                $('.question-summary').each(function() { //Find the questions and add their id's and statuses to an object
                    var $question = $(this);
                    var $anchor = $(this).find('.summary a:eq(0)');
                    var text = $anchor.text().trim();

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
                var length = $('.answer.deleted-answer').hide().length;
                $('.answers-subheader h2').append(' (' + length + ' deleted & hidden)');
            }
        },

        inlineEditorEverywhere: function() {
            // Description: Enabled inline editor on all sites
            // Written by @nicael: http://stackapps.com/questions/6216/inline-editor-regardless-of-reputation, and copied with nicael's permission

            if (sox.Stack.using) {
                $(".suggest-edit-post").removeClass("suggest-edit-post").addClass("edit-post");
                sox.Stack.using("inlineEditing", function() {
                    sox.Stack.inlineEditing.init();
                });
            } else {
                sox.warn('inlineEditorEverywhere error: sox.Stack.using not found');
                sox.debug('inlineEditorEverywhere: Stack object:', sox.Stack);
            }
        },

        flagPercentageBar: function() {
            // Description: Adds a coloured percentage bar above the pane on the right of the flag summary page to show percentage of helpful flags

            var helpfulFlags = 0;
            $("td > a:contains('helpful')").parent().prev().each(function() {
                helpfulFlags += parseInt($(this).text().replace(",", ""));
            });

            var declinedFlags = 0;
            $("td > a:contains('declined')").parent().prev().each(function() {
                declinedFlags += parseInt($(this).text().replace(",", ""));
            });

            if (helpfulFlags > 0) {

                var percentHelpful = Number(Math.round((helpfulFlags / (helpfulFlags + declinedFlags)) * 100 + 'e2') + 'e-2');

                if (percentHelpful > 100) percentHelpful = 100;

                var percentColor;
                if (percentHelpful >= 90) {
                    percentColor = "limegreen";
                } else if (percentHelpful >= 80) {
                    percentColor = "darkorange";
                } else if (percentHelpful < 80) {
                    percentColor = "red";
                }

                //this is for the dynamic part; the rest of the CSS is in the main CSS file
                GM_addStyle("#sox-flagPercentProgressBar:after {\
                               background: " + percentColor + ";\
                               width: " + percentHelpful + "%;\
                           }");

                $("#flag-stat-info-table").before("<h3 id='sox-flagPercentHelpful' title='only helpful and declined flags are counted'><span id='percent'>" + percentHelpful + "%</span> helpful</h3>");
                $("#sox-flagPercentHelpful span#percent").css("color", percentColor);

                $("#sox-flagPercentHelpful").after("<div id='sox-flagPercentProgressBar'></div>");
            }
        },

        showMetaReviewCount: function() {
            // Description: Adds the total count of meta reviews on the main site on the /review page

            $.get('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Fmeta.' + location.hostname + '%2Freview%22&diagnostics=true', function(d) {
                var $doc = $(d);
                var total = 0;

                $doc.find('.dashboard-num').each(function() {
                    total += +$(this).text();
                });

                var $metaDashboardEl = $('.dashboard-item').last().find('.dashboard-count');
                $metaDashboardEl.append($('<div/>', {
                    text: total,
                    'title': total,
                    'class': 'dashboard-num'
                }));
                $metaDashboardEl.append($('<div/>', {
                    text: (total == 1 ? 'post' : 'posts'),
                    'class': 'dashboard-unit'
                }));
            });
        },

        copyCode: function() {
            // Description: Add a button to code in posts to let you copy it

            //button uses CSS mainly from http://stackoverflow.com/a/30810322/3541881
            function addButton() {
                //https://github.com/soscripted/sox/issues/218#issuecomment-281148327 reason for selector:
                //http://stackoverflow.com/a/11061657/3541881

                $('pre:not(:has(.sox-copyCodeButton))').before('<i class="fa fa-clipboard sox-copyCodeButton" style="display: none; position: relative; background-color: #eff0f1; margin-left: -15px"></i>'); //relative position prevents code from being in front of button

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
                    if (!$('.sox-copyCodeTextarea').length) $('body').append('<textarea class="sox-copyCodeTextarea">');
                    $('.sox-copyCodeTextarea').val($(this).next('pre').text());
                    $('.sox-copyCodeTextarea').select();
                    document.execCommand('copy');
                    $(this).effect("highlight", {
                        color: 'white'
                    }, 3000);
                } catch (e) {
                    sox.info('Browser doesn\'t support execComand for copyCode feature');
                }
            });
        },

        dailyReviewBar: function() {
            // Description: Adds a progress bar showing how many reviews you have left in the day

            function addBar() {
                var currentUrl = location.href.split('/'),
                    sliced = currentUrl.slice(0, currentUrl.length - 1).join('/'),
                    urlToGet;

                if ($('.reviewable-post').length) {
                    urlToGet = sliced + '/stats';
                } else {
                    urlToGet = currentUrl.join('/') + '/stats';
                }

                $.get(urlToGet, function(d) {
                    var count = +$(d).find('.review-stats-count-current-user').first().text().trim(),
                        width = (count / 20) * 100;
                    if ($('#sox-daily-review-count').length) {
                        $('#sox-daily-review-count').find('#badge-progress-bar').css('width', width);
                        $('#sox-daily-review-count').find('#badge-progress-count').text(count);
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
                    var href = $(this).attr('href');
                    for (var i = 0; i < settings.length; i++) {
                        if (sox.location.matchWithPattern(settings[i], href)) {
                            $(this).prepend('<i class="fa fa-external-link openLinksInNewTab-externalLink"></i>');
                            $(this).prop('target', '_blank');
                        }
                    }
                });
            }
        },

        showQuestionStateInSuggestedEditReviewQueue: function() {
            // Description: Show question's current state in the suggested edit review queue (duplicate, off-topic, etc.)

            $(document).on('sox-new-review-post-appeared', function() {
                if ($('#sox-showQuestionStateInSuggestedEditReviewQueue-checked').length) return; //already checked
                var postId = $('.summary h2 a').attr('href').split('/')[2];

                sox.helpers.getFromAPI('questions', postId, sox.site.currentApiParameter, function(data) {
                    $('body').append($('<div/>', {
                        'id': 'sox-showQuestionStateInSuggestedEditReviewQueue-checked',
                        'style': 'display: none'
                    }));
                    if (data.closed_reason) {
                        if (data.closed_reason == 'duplicate') {
                            $anchor.after("&nbsp;<span class='standOutDupeCloseMigrated-duplicate'>&nbsp;duplicate&nbsp;</span></a>");
                        } else if (data.closed_details.on_hold === true) { //on-hold
                            $anchor.after('&nbsp;<span class="standOutDupeCloseMigrated-onhold">&nbsp;on hold&nbsp;</span>');
                        } else if (data.closed_details.on_hold === false && data.closed_reason == 'off-topic') { //closed
                            $anchor.after('&nbsp;<span class="standOutDupeCloseMigrated-closed">&nbsp;closed&nbsp;</span>');
                        }
                    }
                }, 'creation&filter=!-MOiNm40B3fle5H6oLVI3nx6UQo(vNstn');
            });
        },

        addTimelineAndRevisionLinks: function() {
            // Description: Add timeline and revision links to the bottom of each post for quick access to them

            $('.question, .answer').each(function() {
                $(this).find('.post-menu').append($('<a/>', {
                    'href': '//' + sox.site.url + '/posts/' + sox.site.href.split('/')[4] + '/revisions',
                    'text': 'revisions'
                })).append($('<a/>', {
                    'href': '//' + sox.site.url + '/posts/' + sox.site.href.split('/')[4] + '/timeline',
                    'text': 'timeline'
                }));
            });
        },

        findAndReplace: function() { //Salvaged from old 'enhanced editor' feature
            // Description: adds a 'find and replace' option to the markdown editor

            function startLoop() {
                $('textarea[id^="wmd-input"].processed').each(function() {
                    main($(this).attr('id'));
                });

                $('.edit-post').click(function() {
                    var $that = $(this);
                    sox.helpers.observe('#wmd-redo-button-' + $that.attr('href').split('/')[2], function() {
                        main($that.parents('table').find('.inline-editor textarea.processed').attr('id'));
                    });
                });
            }

            function main(wmd) {
                var s = '#' + wmd; //s is the selector we pass onto each function so the action is applied to the correct textarea (and not, for example the 'add answer' textarea *and* the 'edit' textarea!)
                if ($(s).parents('.wmd-container').find('#findReplace').length) return;

                $('.wmd-button-bar').css('margin-top', '0'); //https://github.com/soscripted/sox/issues/203

                $(s).before("<div class='findReplaceToolbar'><span id='findReplace'>Find & Replace</span></div>");

                $(document).on('click', '#findReplace', function(e) {
                    if ($('.findReplaceInputs').length) {
                        $('.findReplaceInputs').remove();
                    } else {
                        $(this).parent().append("<div class='findReplaceInputs'><input id='find' type='text' placeholder='Find'><input id='modifier' type='text' placeholder='Modifier'><input id='replace' type='text' placeholder='Replace with'><input id='replaceGo' type='button' value='Go'></div>");
                    }
                    $(document).on('click', '.findReplaceToolbar #replaceGo', function() {
                        var regex = new RegExp($('.findReplaceToolbar #find').val(), $('.findReplaceToolbar #modifier').val());
                        var oldval = $(this).parent().parent().parent().find('textarea').val();
                        var newval = oldval.replace(regex, $('.findReplaceToolbar #replace').val());
                        $(this).parent().parent().parent().find('textarea').val(newval);

                        var Stack = (typeof StackExchange === "undefined" ? window.eval('StackExchange') : StackExchange);
                        if (Stack.MarkdownEditor) Stack.MarkdownEditor.refreshAllPreviews();
                    });
                    e.preventDefault();
                    e.stopPropagation();
                });

                $(s).keydown(function(e) {
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

        pasteImagesDirectly: function() {
            // Description: paste images into textarea without using image dialog

            document.addEventListener('paste', function(e) {
                var node = e.target,
                    isTextarea = node && node.tagName === "TEXTAREA",
                    blob,
                    clipboard = e.clipboardData || e.originalEvent.clipboardData,
                    items = clipboard && clipboard.items;

                if (!isTextarea) return;

                for (var i = 0, len = items && items.length; i < len; i++)
                    if (/^image/.test(items[i].type)) {
                        blob = items[i].getAsFile();
                        break;
                    }

                if (!blob) return;

                let r = new FileReader();
                r.onload = function(image) {
                    /*NOTE: the image can either be uploaded to SE's imgur account using the undocumented API, which can
                    break at any time, or using the normal imgur API. If the SE approach ever stops working,
                    use the following instead:
                    $.ajax({
                        url: 'https://api.imgur.com/3/image',
                        headers: {
                            'Authorization': 'Client-ID e54d6bf725000d6' //this is @shu8's for SOX
                        },
                        type: 'POST',
                        data: {
                            'image': image.target.result.split(',')[1] //remove the 'data:...''
                        },
                        success: function(data) {
                            let link = data.data.link;
                            $(e.target).insertText('![image](' + link + ')', $(e.target).getSelection().start); //rangyinputs!
                        },
                        error: function(data) {
                            sox.error(data);
                            alert("Sorry, there was an error uploading the image to Imgur.");
                        }
                    });
                    */
                    $.ajax({
                        url: 'https://' + sox.site.url + '/upload/image?https=true',
                        type: 'POST',
                        data: {
                            'fkey': sox.Stack.options.user.fkey,
                            'source': 'computer',
                            'filename': 'image.png',
                            'upload-url': image.target.result.split(',')[1] //remove the 'data:...''
                        },
                        success: function(data) {
                            /*NOTE: data === `<html>
                                <head>
                                <script>
                                    window.parent.closeDialog("https://i.stack.imgur.com/blah.png");
                                </script>
                                </head>
                                <body></body>
                                </html>`
                            */
                            //NOTE: the following extracts the link from the response. it's messy, could probably be better!
                            let link = JSON.stringify($($(data)[1]).html()).match(/(http.*?)"/)[1].replace("\\", "");
                            $(node).insertText('![image](' + link + ')', $(node).getSelection().start); //rangyinputs!
                        },
                        error: function(data) {
                            sox.error(data);
                            alert("SOX: Sorry, there was an error uploading the image to Imgur.");
                        }
                    });
                }
                r.readAsDataURL(blob);
            });
        }
    };
})(window.sox = window.sox || {}, jQuery);