(function(sox, $, undefined) {
    'use strict';

    sox.features = { //SOX functions must go in here
        moveBounty: function() {
            // Description: For moving bounty to the top

            $('.bounty-notification').insertAfter('.question .fw-wrap'); //$('.bounty-notification').length condition isn't necessary; this line will run only if the element exists
            $('.bounty-link.bounty').closest('ul').insertAfter('.question .fw-wrap');
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
            sox.debug('markEmployees user IDs', ids);

            var url = 'https://api.stackexchange.com/2.2/users/{ids}?pagesize=100&site={site}&key={key}&access_token={access_token}'
                .replace('{ids}', ids.join(';'))
                .replace('{site}', sox.site.currentApiParameter)
                .replace('{key}', sox.info.apikey)
                .replace('{access_token}', sox.settings.accessToken);

            $.ajax({
                url: url,
                success: function(data) {
                    sox.debug('markEmployees returned data', data);
                    for (var i = 0; i < data.items.length; i++) {
                        var userId = data.items[i].user_id,
                            isEmployee = data.items[i].is_employee;

                        if (isEmployee) {
                            $links.filter('a[href^="/users/' + userId + '/"]').after('<span class="fab fa-stack-overflow" title="employee" style="padding: 0 5px; color: ' + $('.mod-flair').css('color') + '"></span>');
                        }
                    }
                }
            });
        },

        copyCommentsLink: function() {
            // Description: Adds the 'show x more comments' link before the commnents
            // Test on e.g. https://meta.stackexchange.com/questions/125439/

            $('.js-show-link.comments-link').each(function() {
                if (!$(this).parent().prev().find('.comment-text').length) return; //https://github.com/soscripted/sox/issues/196

                var $btnToAdd = $(this).clone();
                $btnToAdd.on('click', function(e) {
                    e.preventDefault();
                    $(this).hide();
                });

                $(this).parent().parent().prepend($btnToAdd);

                $(this).click(function() {
                    $btnToAdd.hide();
                });
            });

            $(document).on('click', '.js-add-link', function() { //https://github.com/soscripted/sox/issues/239
                var commentParent = ($(this).parents('.answer').length ? '.answer' : '.question');
                $(this).closest(commentParent).find('.js-show-link.comments-link').hide();
            });
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

            function color() {
                var answererID;

                $('.answercell').each(function(i, obj) {
                    answererID = +this.querySelector('.post-signature:nth-last-of-type(1) a[href^="/users"]').href.match(/\d+/)[0];

                    $(this.nextElementSibling.querySelectorAll('.comment-user[href^="/users/' + answererID + '/"]')).addClass('sox-answerer');
                });
            }

            color();
            $(document).on('sox-new-comment', color);
        },


        kbdAndBullets: function() {
            // Description: For adding buttons to the markdown toolbar to surround selected test with KBD or convert selection into a markdown list

            function replaceSelectedText(node, newText) {
                var sS = node.selectionStart,
                    sE = node.selectionEnd,
                    val = node.value,
                    valBefore = val.substring(0, sS),
                    valMid = val.substring(sS, sE),
                    valAfter = val.substring(sE);

                // situation contrary to our expectation
                if (sS === sE) {
                    return;
                }

                node.value = valBefore + newText + valAfter;
                node.selectionStart = node.selectionEnd = sS + newText.length;

                StackExchange.MarkdownEditor.refreshAllPreviews();
                node.focus();
            }

            function getSelection(node) {
                return node.value.substring(node.selectionStart, node.selectionEnd);
            }

            function surroundSelectedText(textarea, start, end) {
                // same wrapper code on either side (`$...$`)
                if (typeof end === "undefined") end = start;

                /*--- Expected behavior:
                    When there is some text selected: (unwrap it if already wrapped)
                    "]text["         --> "**]text[**"
                    "**]text[**"     --> "]text["
                    "]**text**["     --> "**]**text**[**"
                    "**]**text**[**" --> "]**text**["
                    When there is no text selected:
                    "]["             --> "**placeholder text**"
                    "**][**"         --> ""
                    Note that `]` and `[` denote the selected text here.
                */

                var selS = textarea.selectionStart,
                    selE = textarea.selectionEnd,
                    value = textarea.value,
                    valBefore = value.substring(0, selS),
                    valMid = value.substring(selS, selE),
                    valAfter = value.substring(selE),
                    startLen = start.length,
                    endLen = end.length,
                    generatedWrapper,
                    // handle trailing spaces
                    trimmedSelection = valMid.match(/^(\s*)(\S?(?:.|\n|\r)*\S)(\s*)$/) || ["", "", "", ""],
                    command = start + end;

                // determine if text is currently wrapped
                if (valBefore.endsWith(start) && valAfter.startsWith(end)) {
                    textarea.value = valBefore.substring(0, valBefore.length - startLen) + valMid + valAfter.substring(endLen);
                    textarea.selectionStart = valBefore.length - startLen;
                    textarea.selectionEnd = (valBefore + valMid).length - startLen;
                    textarea.focus();
                } else {
                    valBefore += trimmedSelection[1];
                    valAfter = trimmedSelection[3] + valAfter;
                    valMid = trimmedSelection[2];

                    generatedWrapper = start + valMid + end;

                    textarea.value = valBefore + generatedWrapper + valAfter;
                    textarea.selectionStart = valBefore.length + start.length;
                    textarea.selectionEnd = (valBefore + generatedWrapper).length - end.length;
                    textarea.focus();
                }

                StackExchange.MarkdownEditor.refreshAllPreviews();
                node.focus();
            }


            function addBullets(node) {
                var list = '- ' + getSelection(node).split('\n').join('\n- ');
                replaceSelectedText(node, list);
            }

            function addKbd(node) {
                surroundSelectedText(node, "<kbd>", "</kbd>");
            }

            function getTextarea(button) {
                // li -> ul -> #wmd-button-bar -> .wmd-container
                return button.parentNode.parentNode.parentNode.querySelector("textarea");
            }

            var kbdBtn = '<li class="wmd-button wmd-kbd-button" title="surround selected text with <kbd> tags"><span style="background-image:none;">kbd</span></li>',
                listBtn = '<li class="wmd-button wmd-bullet-button" title="add dashes (\'-\') before every line to make a bullet list"><span style="background-image:none;">&#x25cf;</span></li>';

            function loopAndAddHandlers() {
                $('[id^="wmd-redo-button"]').each(function() {
                    if (!this.dataset.kbdAdded) {
                        $(this).after(kbdBtn + listBtn);
                        this.dataset.kbdAdded = true;
                    }
                });
            }

            $(document).on('sox-edit-window', loopAndAddHandlers);

            loopAndAddHandlers();

            document.addEventListener('keydown', function(event) {
                var kC = event.keyCode,
                    target = event.target;

                if (target && target.tagName === "TEXTAREA" && event.altKey) {
                    if (kC === 76) addBullets(target); // l
                    else if (kC === 75) addKbd(target); // k
                }
            });

            $(document).on('click', '.wmd-kbd-button, .wmd-bullet-button', function(event) {
                var textarea = getTextarea(this);

                if (this.classList.contains("wmd-kbd-button")) addKbd(textarea);
                else addBullets(textarea);
            });
        },

        editComment: function() {
            // Description: For adding checkboxes when editing to add pre-defined edit reasons

            function addCheckboxes() {
                var $editCommentField = $('[id^="edit-comment"]');
                if (!$editCommentField.length) return; //https://github.com/soscripted/sox/issues/246

                function toLocaleSentenceCase(str) {
                    return str.substr(0, 1).toLocaleUpperCase() + str.substr(1);
                }
                $('#reasons').remove(); //remove the div containing everything, we're going to add/remove stuff now:
                if (/\/edit/.test(window.location.href) || $('[class^="inline-editor"]').length || $('.edit-comment').length) {
                    $editCommentField.after('<div id="reasons" style="float:left;clear:both"></div>');

                    $.each(JSON.parse(GM_getValue('editReasons')), function(i, obj) {
                        $('#reasons').append('<label class="sox-editComment-reason"><input type="checkbox" value="' + this[1] + '"</input>' + this[0] + '</label>&nbsp;');
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
                            if (!$editCommentField.val()) {
                                $editCommentField.val(toLocaleSentenceCase($(this).val()));
                            } else {
                                $editCommentField.val($editCommentField.val() + '; ' + $(this).val());
                            }
                            var newEditComment = $editCommentField.val(); //Remove the last space and last semicolon
                            $editCommentField.val(newEditComment).focus();
                        } else if (!this.checked) { //Remove it from the summary
                            $editCommentField.val(toLocaleSentenceCase($editCommentField.val().replace(new RegExp(toLocaleSentenceCase($(this).val()) + ';? ?'), ''))); //for beginning values
                            $editCommentField.val($editCommentField.val().replace($(this).val() + '; ', '')); //for middle values
                            $editCommentField.val($editCommentField.val().replace(new RegExp(';? ?' + $(this).val()), '')); //for last value
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
                        if (sox.user.name !== $(this).find('.comment-text a.comment-user').text()) { //make sure the link is not added to your own comments
                            $(this).find('.comment-text').css('overflow-x', 'hidden');
                            $(this).find('.comment-text .comment-body').append('<span class="soxReplyLink" title="reply to this user" style="margin-left: -7px">&crarr;</span>');
                        }
                    }
                });
            }

            $(document).on('click', 'span.soxReplyLink', function() {
                var parentDiv = $(this).closest('.post-layout');
                var textToAdd = '@' + $(this).parent().find('a.comment-user').text().replace(/\s/g, '').replace(/♦/, ''); //eg. @USERNAME
                if (!parentDiv.find('textarea').length) parentDiv.find('a.js-add-link')[0].click(); //show the textarea, http://stackoverflow.com/a/10559680/

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
                var isQuestionLink = /\/(q|questions)\//,
                    FILTER_QUESTION_TITLE = "!)5IW-5QufDkXACxq_MT8aYkZRhm9";

                $('.post-text a:not(.expand-post-sox), .comment-copy a:not(.expand-post-sox)').each(function() {
                    var href = this.href.replace(/https?:\/\//, "").replace(/www\./, ""),
                        siteName,
                        questionID;

                    if (!href) return;

                    siteName = sox.helpers.getSiteNameFromLink(href);
                    questionID = sox.helpers.getIDFromLink(href);

                    // if it is a bare link is to a question on a SE site
                    if (questionID && siteName && isQuestionLink.test(href) && this.innerText.replace(/https?:\/\//, "").replace(/www\./, "") === href) {
                        sox.helpers.getFromAPI('questions', questionID, siteName, FILTER_QUESTION_TITLE, function(json) {
                            this.innerHTML = json.items[0].title;
                        }.bind(this));
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
                if (!document.getElementsByClassName('sox-hot').length) {
                    document.getElementById('feed').innerHTML = '<p>SOX: One of the 100 hot network questions!</p>';

                    //display:block to fix https://github.com/soscripted/sox/issues/243:
                    $(document.getElementById('question-header')).css('display', 'block').prepend('<div title="SOX: this is a hot network question!" ' + (sox.location.on('english.stackexchange.com') ? 'style="padding:13px"' : '') + ' class="sox-hot"><i class="fab fa-free-code-camp"></i><div>');
                }
            }
            $(document.getElementById('qinfo')).after('<div id="feed"></div>');

            if (sox.location.on('/questions') || $('.question-summary').length) {
                let proxyUrl = 'https://cors-anywhere.herokuapp.com/', //CORS proxy
                    hnqJSONUrl = 'https://stackexchange.com/hot-questions-for-mobile',
                    requestUrl = proxyUrl + hnqJSONUrl;

                $.get(requestUrl, function(results) {
                    if (sox.location.on('/questions/')) {
                        $.each(results, function(i, o) {
                            if (document.URL.indexOf(o.site + '/questions/' + o.question_id) > -1) addHotText();
                        });
                    } else {
                        $('.question-summary').each(function() {
                            let id = $(this).attr('id').split('-')[2];
                            if (results.filter(function(d) {
                                    return d.question_id == id;
                                }).length) {
                                $(this).find('.summary h3').prepend('<div title="SOX: this question is a hot network question!" class="sox-hot" style="font-size:x-large;float:none;display:inline"><i class="fab fa-free-code-camp"></i></div>');
                            }
                        });
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
                    let href = this.href,
                        parent = this.parentNode;
                    
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

            var sitename = sox.site.currentApiParameter,
                WHITESPACES = '&nbsp;&nbsp;&nbsp;',
                COMMENT_SCORE_FILTER = "!)5IW-5QufDkXACxq_MT8bhYD9b.m";

            function addLabelsAndHandlers() {
                $('.history-table td b a[href*="#comment"]').each(function() {
                    if (!$(this).parent().find('.showCommentScore').length) {
                        var id = +this.href.match(/comment(\d+)_/)[1];

                        $(this).after('<span class="showCommentScore" id="' + id + '">' + WHITESPACES + 'show comment score</span>');
                    }
                });

                $('.showCommentScore').css('cursor', 'pointer').on('click', function() {
                    sox.helpers.getFromAPI('comments', this.id, sitename, COMMENT_SCORE_FILTER, function(json) {
                        this.innerHTML = WHITESPACES + json.items[0].score;
                    }.bind(this));
                });
            }

            addLabelsAndHandlers();
            sox.helpers.observe('.history-table', addLabelsAndHandlers);
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

            var sitename = sox.site.currentApiParameter,
                questionID,
                questionIDs = [],
                // questionID: [tagArray, insertedTagDOM]
                // second element is for caching, in case more than
                // one answer in the search list belongs to the same question
                tagsForQuestionIDs = {},
                QUESTION_TAGS_FILTER = "!)8aDT8Opwq-vdo8";

            // get corresponding question's ID for each answer
            $('div[id*="answer"]').each(function() {
                questionID = getQuestionIDFromAnswerDIV(this);
                // cache value for later reference
                this.dataset.questionid = questionID;
                questionIDs.push(questionID);
            });

            sox.helpers.getFromAPI('questions', questionIDs.join(';'), sitename, QUESTION_TAGS_FILTER, function(json) {
                var items = json.items,
                    item,
                    itemsLength = items.length;

                for (var i = 0; i < itemsLength; i++) {
                    item = items[i];
                    tagsForQuestionIDs[item.question_id] = [item.tags, null];
                }

                $('div[id*="answer"]').each(function() {
                    var $this = $(this),
                        id = +this.dataset.questionid,
                        tagsForThisQuestion = tagsForQuestionIDs[id][0],
                        currTag,
                        $insertedTag = tagsForQuestionIDs[id][1];

                    for (var x = 0; x < tagsForThisQuestion.length; x++) {
                        currTag = tagsForThisQuestion[x];
                        $insertedTag = $this.find('.summary .tags').append('<a href="/questions/tagged/' + currTag + '" class="post-tag">' + currTag + '</a>');
                        addClassToInsertedTag($insertedTag);
                    }
                });
            }, 'creation&pagesize=60');
        },

        stickyVoteButtons: function() {
            // Description: For making the vote buttons stick to the screen as you scroll through a post
            // https://github.com/shu8/SE_OptionalFeatures/pull/14:
            // https://github.com/shu8/Stack-Overflow-Optional-Features/issues/28: Thanks @SnoringFrog for fixing this!

            $('.votecell > .vote').css({ //.votecell is necessary; e.g., the number of votes of questions on the Questions list for a site uses the .vote class too
                'position': '-webkit-sticky',
                'position': 'sticky',
                'top': parseInt($('.container').css('margin-top'), 10) + parseInt($('body').css('padding-top'), 10) //Seems like most sites use margin-top on the container, but Meta and SO use padding on the body
            });
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

            $(document).on('mouseenter', '#your-communities-section > ul > li > a', function() {
                var href = this.href.replace(/https?:\/\//, ""),
                    link,
                    chatLink = 'https://chat.stackexchange.com?tab=site&host=' + href.replace(/\/.*/, "");

                if (href === "meta.stackexchange.com/") { //Meta SE's chat link is a bit different
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
                favicon = sox.site.icon,
                metaName = 'meta.' + sox.site.currentApiParameter,
                lastQuestions = {},
                FILTER_QUESTION_TITLE_LINK = "!BHMIbze0EQ*ved8LyoO6rNk25qGESy",
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
                    'class': '-link',
                    title: 'Moderator inbox (recent meta questions)',
                    click: function(e) {
                        e.preventDefault();
                        $diamond.toggleClass('topbar-icon-on');
                        $dialog.toggle();
                    }
                }).append($('<svg/>', { //Updated with the new mod diamond icon
                    'aria-hidden': true,
                    class: 'svg-icon',
                    viewBox: "0 0 18 18",
                    width: 18,
                    height: 18
                }).append($('<path/>', {
                    d: "M8.4.78c.33-.43.87-.43 1.3 0l5.8 7.44c.33.43.33 1.13 0 1.56l-5.8 7.44c-.33.43-.87.43-1.2 0L2.6 9.78a1.34 1.34 0 0 1 0-0.156L8.4.78z"
                })));

            $diamond.html($diamond.html()); //Reloads the diamond icon, which is necessary when adding an SVG using jQuery.

            $dialog.append($header).append($content.append($questions));
            $('.-secondary > .-item:not(:has(.my-profile)):eq(1)').before($('<li/>').addClass('-item').append($diamond));
            

            $dialog.css({
                'top': $('.top-bar').height(),
                'right': $('.-container').outerWidth() - $('#metaNewQuestionAlertButton').parent().position().left - $('#metaNewQuestionAlertButton').outerWidth()
            });

            if ($('#metaNewQuestionAlertButton').length) $('.js-topbar-dialog-corral').append($dialog);

            $(document).mouseup(function(e) {
                if (!$dialog.is(e.target) &&
                    $dialog.has(e.target).length === 0 &&
                    !$(e.target).is('#metaNewQuestionAlertButton, svg, path')) {
                    $dialog.hide();
                    $diamond.removeClass("topbar-icon-on");
                }
            });

            if (GM_getValue(NEWQUESTIONS, -1) == -1) {
                GM_setValue(NEWQUESTIONS, JSON.stringify(lastQuestions));
            } else {
                lastQuestions = JSON.parse(GM_getValue(NEWQUESTIONS));
            }

            sox.helpers.getFromAPI("questions", false, metaName, FILTER_QUESTION_TITLE_LINK, function(json) {
                var items = json.items,
                    latestQuestion = items[0].title;

                if (latestQuestion != lastQuestions[metaName]) {
                    $diamond.css('color', '#0077cc');

                    for (var i = 0, len = items.length; i < len; i++) {
                        var title = items[i].title,
                            link = items[i].link;

                        addQuestion(title, link);
                    }

                    lastQuestions[metaName] = latestQuestion;

                    $diamond.click(function() {
                        GM_setValue(NEWQUESTIONS, JSON.stringify(lastQuestions));
                    });
                }
            }, "activity&pagesize=5");

            function addQuestion(title, link) {
                var $li = $('<li/>'),
                    $link = $('<a/>', {
                        href: link
                    }),
                    $icon = $('<div/>', {
                        'class': 'site-icon favicon ' + favicon
                    }),
                    $message = $('<div/>', {
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

            // for use in dataset
            // used for hideCertainQuestions feature compatability
            var QUESTION_STATE_KEY = "soxQuestionState",
                FILTER_QUESTION_CLOSURE_NOTICE = "!)Ei)3K*irDvFA)l92Lld3zD9Mu9KMQ59-bgpVw7D9ngv5zEt3";

            function addLabel(index, question) {
                // don't run if question already has tag added
                if (question.dataset[QUESTION_STATE_KEY]) return;

                var $anchor = $(question.querySelector('.summary h3 a')),
                    text = $anchor.text().trim(),
                    id = sox.helpers.getIDFromAnchor($anchor[0]);

                //https://github.com/soscripted/sox/issues/181
                $('.question-summary .answer-hyperlink, .question-summary .question-hyperlink, .question-summary .result-link a').css('display', 'inline');
                $('.summary h3').css('line-height', '1.2em'); //fixes line height on "Questions" page

                var noticeRegex = /\[(duplicate|closed|migrated|on hold)\]$/,
                    noticeMatch = text.match(noticeRegex),
                    noticeName = noticeMatch && noticeMatch[1],
                    queryType = "questions";

                if (!noticeName) return;

                $anchor.text(text.replace(noticeRegex, ""));
                question.dataset[QUESTION_STATE_KEY] = noticeName;

                switch (noticeName) {
                    case "duplicate":
                        sox.helpers.getFromAPI(queryType, id, sox.site.currentApiParameter, FILTER_QUESTION_CLOSURE_NOTICE, function(data) {
                            var question = data.items[0],
                                questionId = question.closed_details.original_questions[0].question_id;

                            //styling for https://github.com/soscripted/sox/issues/181

                            //NOTE: the `data-searchsession` attribute is to workaround a weird line of code in SE *search* pages,
                            //which changes the `href` of anchors in in `.result-link` containers to `data-searchsession`
                            //See https://github.com/soscripted/sox/pull/348#issuecomment-404245056
                            $anchor.after("&nbsp;<a data-searchsession='/questions/" + questionId + "' style='display: inline' href='https://" + sox.site.url + "/q/" + questionId + "'><span class='standOutDupeCloseMigrated-duplicate' title='click to visit duplicate'>&nbsp;duplicate&nbsp;</span></a>");
                        });
                        break;
                    case "closed":
                    case "on hold":
                        sox.helpers.getFromAPI(queryType, id, sox.site.currentApiParameter, FILTER_QUESTION_CLOSURE_NOTICE, function(data) {
                            var question = data.items[0],
                                details = question.closed_details,
                                users = details.by_users.reduce((str, user) => str + ", " + user.display_name, "").substr(2),
                                closureDate = new Date(question.closed_date * 1000),
                                timestamp = closureDate.toLocaleString(),
                                closeNotice = (details.on_hold ? "put on hold" : "closed") + " as ",
                                closeText = details.on_hold ? "on hold" : "closed",
                                cssClass = details.on_hold ? "onhold" : "closed";

                            $anchor.after('&nbsp;<span class="standOutDupeCloseMigrated-' + cssClass + '" title="' + closeNotice + details.reason + ' by ' + users + ' on ' + timestamp + '">&nbsp;' + closeText + '&nbsp;</span>');
                        });
                        break;
                    case "migrated":
                        sox.helpers.getFromAPI('questions', id, sox.site.currentApiParameter, FILTER_QUESTION_CLOSURE_NOTICE, function(data) {
                            var question = data.items[0],
                                migratedToSite = question.migrated_to.other_site.name,
                                textToAdd = 'migrated to ' + migratedToSite;

                            $anchor.after("&nbsp;<span class='standOutDupeCloseMigrated-migrated' title='" + textToAdd + "'>&nbsp;migrated&nbsp;</span>");
                        });
                        break;
                }
            }

            // Find the questions and add their id's and statuses to an object
            $('.question-summary').each(addLabel);

            sox.helpers.observe('#user-tab-questions, #question-mini-list', function() { //new questions on homepage, or for on user profile page
                $('.question-summary').each(addLabel);
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
                    $('.tag-editor').parent().parent().removeAttr('style'); //remove style from both div style='position:relative'
                    $('.tag-editor').parent().parent().parent().removeAttr('style'); //remove style from both div style='position:relative'

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
                if (jNode.is('.inline-editor, .wmd-button-bar')) jNode = jNode.find('[id^="wmd-redo-button"]');
                if (!jNode.length) return;
                console.log('jnode', jNode);

                var itemid = jNode[0].id.replace(/^\D+/g, '');
                var toAppend = (itemid.length > 0 ? '-' + itemid : ''); //helps select tags specific to the question/answer being
                // edited (or new question/answer being written)
                setTimeout(function() {
                    if (jNode.closest('.post-editor').find('.sox-sbs-toggle').length) return; //don't add again if already exists

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
                if ($(target).is('.wmd-button-bar')) return; //don't want to catch extra mutation event for button bar
                console.log('sox-edit-window', target);
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

        addAuthorNameToInboxNotifications: function(settings) {
            // Description: To add the author's name to inbox notifications

            function setAuthorName(node) {
                var prependToMessage = Object.keys(settings).length !== 0 ? settings.addNameBeforeMessageOrAtTop : false, //for https://github.com/soscripted/sox/issues/347
                    link = node.firstElementChild.href,
                    id,
                    matches = {
                        comments: ["posts/comments", "!SWJnaN4ZecdHc*iADu"],
                        answers: ["com/a/", "!1zSn*g7xPUIQr.yCmkAiu"],
                        "suggested-edits": ["/suggested-edits/", "!Sh2oL2BQQ2W(roUyy9"]
                    },
                    filter;

                if (!link) return;

                var sitename = sox.helpers.getSiteNameFromLink(link),
                    apiCallType = null;

                for (var key in matches) {
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

                sox.helpers.getFromAPI(apiCallType, id, sitename, filter, function(json) {
                    sox.debug('addAuthorNameToInboxNotifications JSON returned from API', json);

                    // https://github.com/soscripted/sox/issues/233
                    var temporaryDIV = $("<div>");

                    if (!json.items.length) {
                        return;
                    }

                    var author = (link.indexOf('/suggested-edits/') > -1 ? json.items[0].proposing_user.display_name : json.items[0].owner.display_name),
                        $author = $('<span/>', {
                            class: 'sox-notification-author',
                            text: (prependToMessage ? '' : ' by ') + temporaryDIV.html(author).text() + (prependToMessage ? ': ' : '') //https://github.com/soscripted/sox/issues/347
                        }),
                        $header = $(node.querySelector('.item-header')),
                        $type = $header.find('.item-type').clone(),
                        $creation = $header.find('.item-creation').clone();

                    if (prependToMessage) {
                        $(node).find('.item-summary').prepend($author);
                    } else {
                        //fix conflict with soup fix mse207526 - https://github.com/vyznev/soup/blob/master/SOUP.user.js#L489
                        $header.empty().append($type).append($author).append($creation);
                    }
                });
            }

            var inboxClass = 'inbox-dialog',
                PROCESSED_CLASS = "sox-authorNameAdded",
                MAX_PROCESSED_AT_ONCE = 20;

            sox.helpers.observe("." + inboxClass, function(node) {
                var inboxDialog = document.getElementsByClassName(inboxClass)[0],
                    unprocessedElements = inboxDialog.querySelectorAll(".inbox-item:not(." + PROCESSED_CLASS + ")"),
                    lim = Math.min(unprocessedElements.length, MAX_PROCESSED_AT_ONCE),
                    element;

                for (var x = 0; x < lim; x++) {
                    element = unprocessedElements[x];
                    setAuthorName(element);
                    element.classList.add(PROCESSED_CLASS);
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

        quickAuthorInfo: function() {
            // Description: Shows when the post's author was last active and their registration state

            function addLastSeen(userDetailsFromAPI) {
                $('.question, .answer, .reviewable-post').each(function() {
                    sox.debug('current post', $(this));

                    var anchor = this.querySelector('.post-signature:last-child .user-details a[href^=\"/users\"]');

                    if (!anchor) {
                        return;
                    }

                    var id = sox.helpers.getIDFromAnchor(anchor);
                    sox.debug('quickAuthorInfo addLastSeen(): current id', id);
                    sox.debug('quickAuthorInfo addLastSeen(): userdetailscurrent id', userDetailsFromAPI[id]);

                    if (!id || !(userDetailsFromAPI[id] && !this.getElementsByClassName('sox-last-seen').length)) {
                        return;
                    }

                    var lastSeenDate = new Date(userDetailsFromAPI[id].last_seen),
                        type = userDetailsFromAPI[id].type === 'unregistered' ? ' (unregistered)' : '';

                    $(this).find('.user-info').last().append(
                        "<div style='color: #848d95; font-size: 11px; padding-top: 38px' title='last seen'><i class='fas fa-user-clock'></i>&nbsp;<time class='timeago sox-last-seen' datetime='" +
                        lastSeenDate.toISOString() + "' title='" + //datetime
                        lastSeenDate.toJSON().replace('T', ' ').replace('.000', '') + "'>" + //title, https://github.com/soscripted/sox/issues/204 hacky but short way '.000' always works because SE doesn't do such precise times
                        lastSeenDate.toLocaleString() + "</time>" + type //contents of tag
                    );
                });

                $("time.timeago").timeago();
            }

            function getIdsAndAddDetails(postAuthors) {
                var FILTER_USER_LASTSEEN_TYPE = "!*MxL2H2Vp3iPIKLu";

                $('.question, .answer, .reviewable-post').each(function() {
                    var userDetailsAnchor = this.querySelector('.post-signature:last-child .user-details a[href^=\"/users\"]'),
                        userid, username;

                    if (userDetailsAnchor) {
                        userid = sox.helpers.getIDFromAnchor(userDetailsAnchor);
                        username = userDetailsAnchor.innerText;

                        if (userid !== 0) postAuthors[userid] = username;
                    } else {
                        sox.loginfo('Could not find user user link for: ', this);
                    }
                });

                sox.helpers.getFromAPI('users', Object.keys(postAuthors).join(';'), sox.site.currentApiParameter, FILTER_USER_LASTSEEN_TYPE, function(data) {
                    sox.debug('quickAuthorInfo api dump', data);

                    var userDetailsFromAPI = {};
                    data.items.forEach(function(user) {
                        userDetailsFromAPI[user.user_id] = {
                            'last_seen': user.last_access_date * 1000,
                            'type': user.user_type
                        };
                    });

                    sox.debug('quickAuthorInfo userdetailsfromapi', userDetailsFromAPI);
                    addLastSeen(userDetailsFromAPI);

                    $(document).on('sox-new-comment', function() { //make sure it doesn't disappear when adding a new comment!
                        addLastSeen(userDetailsFromAPI);
                    });
                }, 'creation');
            }

            // key:id, value:username
            var postAuthors = {};

            sox.helpers.observe('.review-content', function() {
                getIdsAndAddDetails(postAuthors);
            });

            getIdsAndAddDetails(postAuthors);

            sox.debug('quickAuthorInfo answerer IDs', postAuthors);
            sox.debug('quickAuthorInfo API call parameters', 'users', Object.keys(postAuthors).join(';'), sox.site.currentApiParameter);
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
            // Description: Filter hot network questions in the sidebar based on their attributes such as title, site, etc.

            function createRegex(list) {
                return new RegExp("\\b" + list.replace(",", "|").replace(" ", "") + "\\b", 'i');
            }

            function insertTagsList(anchor) {
                if ($(anchor).parent().find('.sox-hnq-question-tags-tooltip').length) return;
                $(anchor).after('<span class="sox-hnq-question-tags-tooltip">' + anchor.dataset.tags + '</span>');
            }

            var WORDS_TO_BLOCK = settings.wordsToBlock,
                SITES_TO_BLOCK = settings.sitesToBlock,
                TITLES_TO_HIDE = settings.titlesToHideRegex && settings.titlesToHideRegex.split(','),
                FILTER_QUESTION_TAGS = "!)5IW-5Quf*cV5LToe(J0BjSBXW19";

            if (SITES_TO_BLOCK) SITES_TO_BLOCK = SITES_TO_BLOCK.split(',');

            $('#hot-network-questions h4').css('display', 'inline').after($('<span/>', {
                'style': 'color:  grey; display: block; margin-bottom: 10px;',
                'text': 'SOX: hover over titles to show tags'
            }));

            $('#hot-network-questions li a').each(function() {
                var i,
                    id = sox.helpers.getIDFromAnchor(this),
                    sitename = sox.helpers.getSiteNameFromAnchor(this);

                //NOTE: to hide questions, we use a class that has 'display: none !important'.
                //This is to make sure questions that were previously hidden don't appear after the user clicks 'more hot questions',
                //because the questions are *already* on the page before the button is clicked, but just hidden!

                if (WORDS_TO_BLOCK) {
                    if (createRegex(WORDS_TO_BLOCK).test(this.innerText)) $(this).parent().addClass('sox-hot-network-question-filter-hide');
                }

                if (SITES_TO_BLOCK) {
                    let href = this.href;
                    for (let i = 0; i < SITES_TO_BLOCK.length; i++) {
                        if (sox.location.matchWithPattern(SITES_TO_BLOCK[i], href)) {
                            $(this).parent().addClass('sox-hot-network-question-filter-hide');
                        }
                    }
                }

                if (TITLES_TO_HIDE) {
                    let title = this.innerText;
                    for (i = 0; i < TITLES_TO_HIDE.length; i++) {
                        if (title.match(new RegExp(TITLES_TO_HIDE[i]))) {
                            $(this).parent().hide();
                        }
                    }
                }

                var PLACEHOLDER = "fetching tags...";

                this.addEventListener("mouseenter", function() {
                    if (!this.dataset.tags) {
                        sox.helpers.getFromAPI('questions', id, sitename, FILTER_QUESTION_TAGS, function(d) {
                            this.dataset.tags = d.items[0].tags.join(', ');
                            insertTagsList(this);
                        }.bind(this));

                        this.dataset.tags = PLACEHOLDER;
                    } else if (typeof this.dataset.tags !== "undefined" && this.dataset.tags !== PLACEHOLDER) {
                        insertTagsList(this);
                    } else {
                        insertTagsList(this, PLACEHOLDER);
                    }
                });
                this.addEventListener("mouseleave", function() {
                    let tooltip = this.parentNode.querySelector('.sox-hnq-question-tags-tooltip');
                    if (tooltip) tooltip.remove();
                });
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

            let proxyUrl = 'https://cors-anywhere.herokuapp.com/', //CORS proxy
                metaUrl = sox.Stack.options.site.childUrl,
                requestUrl = proxyUrl + metaUrl + '/review';

            $.get(requestUrl, function(d) {
                let $doc = $(d),
                    total = 0,
                    $metaDashboardEl = $('.dashboard-item').last().find('.dashboard-count');

                $doc.find('.dashboard-num').each(function() {
                    total += +$(this).text();
                });

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

            var PROCESSED_ID = "sox-showQuestionStateInSuggestedEditReviewQueue-checked";

            $(document).on('sox-new-review-post-appeared', function() {
                if (document.getElementById(PROCESSED_ID)) return;

                var $anchor = $('.summary h2 a'),
                    postId = sox.helpers.getIDFromAnchor($anchor[0]),
                    QUESTION_STATE_FILTER = '!-MOiNm40B3fle5H6oLVI3nx6UQo(vNstn';

                sox.helpers.getFromAPI('questions', postId, sox.site.currentApiParameter, QUESTION_STATE_FILTER, function(data) {
                    $('body').append($('<div/>', {
                        'id': PROCESSED_ID,
                        'style': 'display: none'
                    }));

                    if (data.closed_reason) {
                        if (data.closed_reason === 'duplicate') {
                            $anchor.after("&nbsp;<span class='standOutDupeCloseMigrated-duplicate'>&nbsp;duplicate&nbsp;</span></a>");
                        } else if (data.closed_details.on_hold === true) { //on-hold
                            $anchor.after('&nbsp;<span class="standOutDupeCloseMigrated-onhold">&nbsp;on hold&nbsp;</span>');
                        } else if (data.closed_details.on_hold === false && data.closed_reason == 'off-topic') { //closed
                            $anchor.after('&nbsp;<span class="standOutDupeCloseMigrated-closed">&nbsp;closed&nbsp;</span>');
                        }
                    }
                }, 'creation');
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
                    reader = new FileReader(),
                    clipboard = e.clipboardData || e.originalEvent.clipboardData,
                    items = clipboard && clipboard.items;

                if (!isTextarea) return;

                for (var i = 0, len = items && items.length; i < len; i++)
                    if (/^image/.test(items[i].type)) {
                        blob = items[i].getAsFile();
                        break;
                    }

                if (!blob) return;

                reader.addEventListener("load", function(image) {
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
                        url: '/upload/image?https=true',
                        type: 'POST',
                        data: {
                            'fkey': sox.Stack.options.user.fkey,
                            'source': 'computer',
                            'filename': 'image.png',
                            'upload-url': image.target.result.split(',')[1] //remove the 'data:...''
                        },
                        success: function(data) {
                            /* data === `<html>
                                <head>
                                <script>
                                    window.parent.closeDialog("https://i.stack.imgur.com/blah.png");
                                </script>
                                </head>
                                <body></body>
                                </html>`
                            */

                            // the URL is guaranteed to begin with HTTPS (StackExchange uses it by default)
                            // and also to begin with i.stack
                            // won't hardcode the rest of the URL to keep it future proof
                            var link = data.match(/(https:\/\/i\.stack.*)\"/)[1],
                                PLACEHOLDER = "enter image description here",
                                nSS = node.selectionStart;

                            $(node).insertText("![" + PLACEHOLDER + "](" + link + ")", nSS);
                            // auto-select the placeholder
                            node.selectionStart = nSS + 2; // 2 is for the "!["
                            node.selectionEnd = node.selectionStart + PLACEHOLDER.length;
                        },
                        error: function(data) {
                            sox.error(data);
                            alert("SOX: Sorry, there was an error uploading the image to Imgur.");
                        }
                    });
                });

                reader.readAsDataURL(blob);
            });
        },

        onlyShowCommentActionsOnHover: function() {
            // Description: Only show the comment actions (flag/upvote) when hovering over a comment

            function addCSS() {
                $('.comment').addClass('sox-onlyShowCommentActionsOnHover');
            }
            
            $(document).on('sox-new-comment', addCSS);
            addCSS();
        },

        showTagWikiLinkOnTagPopup: function() {
            sox.helpers.observe('.tag-popup', function() {
                let tagName = $('.tag-popup .float-right').attr('href').match("/feeds/tag/(.*)")[1], //extract from feed URL button
                    wikiUrl = '//' + sox.site.url + '/tags/' + tagName + '/info';
                
                $('.tag-popup .mr8:last').after($('<span/>', {
                    'class': 'sox-tag-popup-wiki-link',
                    'html': '<a href="' + wikiUrl + '">wiki</a>',
                    'title': 'view tag wiki (added by SOX)'
                }));
            });
        }
    };
})(window.sox = window.sox || {}, jQuery);