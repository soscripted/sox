/*jshint multistr: true, loopfunc: true*/
/*global GM_getValue, GM_setValue, fkey*/

(function(sox, $, undefined) {
    'use strict';

    sox.features = { //SOX functions must go in here

        grayOutVotes: function() {
            // Description: Grays out votes AND vote count

            if ($('.deleted-answer').length) {
                $('.deleted-answer .vote-down-off, .deleted-answer .vote-up-off, .deleted-answer .vote-count-post').css('opacity', '0.5');
            }
        },

        moveBounty: function() {
            // Description: For moving bounty to the top

            if ($('.bounty-notification').length) {
                $('.bounty-notification').insertAfter('.question .fw');
                $('.question .bounty-notification .votecell').remove();
            }
        },

        dragBounty: function() {
            // Description: Makes the bounty window draggable

            sox.helpers.observe('#start-bounty-popup', function() {
                $('#start-bounty-popup').draggable().css('cursor', 'move');
            });

        },

        renameChat: function() {
            // Description: Renames Chat tabs to prepend 'Chat' before the room name

            if (sox.site.type == 'chat') {
                document.title = 'Chat - ' + document.title;
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

            var $links = $('.comment a, .deleted-answer-info a, .employee-name a, .started a, .user-details a').filter('a[href^="/users/"]');
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
                for (var i = 0, len = data.items.length; i < len; i++) {
                    var userId = data.items[i].user_id,
                        isEmployee = data.items[i].is_employee;

                    if (isEmployee) {
                        $links.filter('a[href^="/users/' + userId + '/"]').append('<i class="fa fa-stack-overflow" title="employee" style="padding: 0 5px"></i>');
                    }
                }
            });
        },

        bulletReplace: function() {
            // Description: Replaces disclosure bullets with normal ones

            $('.dingus').each(function() {
                $(this).html('&#x25cf;');
            });
        },

        addEllipsis: function() {
            // Description: Adds an ellipsis to long names

            $('.user-info .user-details').css('text-overflow', 'ellipsis');
        },

        copyCommentsLink: function() {
            // Description: Adds the 'show x more comments' link before the commnents

            $('.js-show-link.comments-link').each(function() {
                var $this2 = $(this);
                $('<tr><td></td><td>' + $this2.clone().wrap('<div>').parent().html() + '</td></tr>').insertBefore($(this).parent().closest('tr')).click(function() {
                    $(this).hide();
                });
                var commentParent;
                // Determine if comment is on a question or an answer
                if ($(this).parents('.answer').length) {
                    commentParent = '.answer';
                } else {
                    commentParent = '.question';
                }

                $(this).click(function() {
                    $(this).closest(commentParent).find('.js-show-link.comments-link').hide();
                });
            });

        },

        fixedTopbar: function() {
            // Description: For making the topbar fixed (always stay at top of screen)

            $('.topbar').css({
                'position': 'fixed',
                'top': '0',
                'z-index': '1001',
                'width': '100%'
            });

            $('body > .page, body .container, div.wrapper > header').css('padding-top', '34px');
            $('body .custom-header, body #custom-header, div#scroller,div.review-bar').css('top', '34px');
            $('div#custom-header').css('margin-top', '34px');
            $('.new-topbar .container').css('background-position', 'center 0');
            $('#overlay-header').css('top', '34px');

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
                style: 'color: white;',
                title: name,
                text: name
            });
            $span.insertBefore('.gravatar-wrapper-24');
        },

        colorAnswerer: function() {
            // Description: For highlighting the names of answerers on comments

            $('.answercell').each(function(i, obj) {
                var x = $(this).find('.user-details a').text();
                $('.answer .comment-user').each(function() {
                    if ($(this).text() == x) {
                        $(this).css('background-color', 'orange');
                    }
                });
            });

            sox.helpers.observe('.comment', function() {
                sox.features.colorAnswerer();
            });
        },

        kbdAndBullets: function() {
            // Description: For adding buttons to the markdown toolbar to surround selected test with KBD or convert selection into a markdown list

            function addBullets($node) {
                var list = '- ' + $node.getSelection().text.split('\n').join('\n- ');
                $node.replaceSelectedText(list);
            }

            function addKbd($node) {
                $node.surroundSelectedText("<kbd>", "</kbd>");
            }

            var kbdBtn = '<li class="wmd-button" title="surround selected text with <kbd> tags" style="left: 400px;"><span id="wmd-kbd-button" style="background-image: none;">kbd</span></li>';
            var listBtn = '<li class="wmd-button" title="add dashes (\"-\") before every line to make a bulvar point list" style="left: 425px;"><span id="wmd-bullet-button" style="background-image:none;">&#x25cf;</span></li>';

            sox.helpers.observe('[id^="wmd-redo-button"]', function() {
                $('[id^="wmd-redo-button"]').after(kbdBtn);
                $('[id^="wmd-redo-button"]').after(listBtn);
                $('#wmd-kbd-button').on('click', function() {
                    addKbd($(this).parents('div[id*="wmd-button-bar"]').parent().find('textarea'));
                });
                $('#wmd-bullet-button').on('click', function() {
                    addBullets($(this).parents('div[id*="wmd-button-bar"]').parent().find('textarea'));
                });
            });

            $('[id^="wmd-input"]').bind('keydown', 'alt+l', function() {
                addBullets($(this).parents('div[id*="wmd-button-bar"]').parent().find('textarea'));
            });

            $('[id^="wmd-input"]').bind('keydown', 'alt+k', function() {
                addKbd($(this).parents('div[id*="wmd-button-bar"]').parent().find('textarea'));
            });
        },

        editComment: function() {
            // Description: For adding checkboxes when editing to add pre-defined edit reasons

            function addCheckboxes() {
                $('#reasons').remove(); //remove the div containing everything, we're going to add/remove stuff now:
                if (/\/edit/.test(window.location.href) || $('[class^="inline-editor"]').length) {
                    $('.form-submit').before('<div id="reasons"></div>');

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
                            'background-color': 'white',
                            'color': 'inherit'
                        });
                    });

                    var editCommentField = $('[id^="edit-comment"]');
                    $('#reasons input[type="checkbox"]').change(function() {
                        if (this.checked) { //Add it to the summary
                            if (!editCommentField.val()) {
                                editCommentField.val(editCommentField.val() + $(this).val().replace(/on$/g, ''));
                            } else {
                                editCommentField.val(editCommentField.val() + '; ' + $(this).val().replace(/on$/g, ''));
                            }
                            var newEditComment = editCommentField.val(); //Remove the last space and last semicolon
                            editCommentField.val(newEditComment).focus();
                        } else if (!this.checked) { //Remove it from the summary
                            editCommentField.val(editCommentField.val().replace($(this).val() + '; ', '')); //for middle/beginning values
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

            $('.post-menu > .edit-post').click(function() {
                setTimeout(function() {
                    addCheckboxes();
                }, 500);
            });
        },

        shareLinksMarkdown: function() {
            // Description: For changing the 'share' button link to the format [name](link)

            sox.helpers.observe('.share-tip', function() {
                var link = $('.share-tip input').val();
                $('.share-tip input').val('[' + $('#question-header a').html() + '](' + link + ')');
                $('.share-tip input').select();
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

            $('.spoiler').prepend('<div id="isSpoiler" style="color:red; font-size:smaller; float:right;">hover to show spoiler<div>');
            $('.spoiler').hover(function() {
                $(this).find('#isSpoiler').hide(500);
            }, function() {
                $(this).find('#isSpoiler').show(500);
            });
        },

        commentReplies: function() {
            // Description: For adding reply links to comments

            $('.comment').each(function() {
                if ($('.topbar-links a span:eq(0)').text() != $(this).find('.comment-text a.comment-user').text()) { //make sure the link is not added to your own comments
                    $(this).append('<span id="replyLink" title="reply to this user">&crarr;</span>');
                }
            });

            $('span#replyLink').css('cursor', 'pointer').on('click', function() {
                var parentDiv = $(this).parent().parent().parent().parent();
                var textToAdd = '@' + $(this).parent().find('.comment-text a.comment-user').text().replace(/\s/g, '').replace(/♦/, '') + ' '; //eg. @USERNAME [space]

                if (parentDiv.find('textarea').length) {
                    parentDiv.find('textarea').append(textToAdd); //add the name
                } else {
                    parentDiv.next('div').find('a.js-add-link')[0].click(); //show the textarea, http://stackoverflow.com/a/10559680/
                    parentDiv.find('textarea').append(textToAdd); //add the name
                }
            });
        },

        parseCrossSiteLinks: function() {
            // Description: For converting cross-site links to their titles

            var sites = ['stackexchange', 'stackoverflow', 'superuser', 'serverfault', 'askubuntu', 'stackapps', 'mathoverflow', 'programmers', 'bitcoin'];

            $('.post-text a').not('.expand-post-sox').each(function() {
                var anchor = $(this),
                    href = $(this).attr('href');
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
        },

        confirmNavigateAway: function() {
            // Description: For adding a 'are you ure you want to go away' confirmation on pages where you have started writing something

            if (window.location.href.indexOf('questions/') >= 0) {
                $(window).bind('beforeunload', function() {
                    if ($('.comment-form textarea').length && $('.comment-form textarea').val()) {
                        return 'Do you really want to navigate away? Anything you have written will be lost!';
                    } else {
                        return;
                    }
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
                    $('#question-header').prepend('<div title="this question is a hot network question!" class="sox-hot">HOT<div>');
                }
            }
            $('#qinfo').after('<div id="feed"></div>');

            $.ajax({
                type: 'get',
                url: 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D"http%3A%2F%2Fstackexchange.com%2Fhot-questions-for-mobile"&format=json',
                success: function(d) {
                    var results = d.query.results.json.json;
                    $.each(results, function(i, o) {
                        if (document.URL.indexOf(o.site + '/questions/' + o.question_id) > -1) {
                            addHotText();
                        }
                    });
                }
            });
        },

        autoShowCommentImages: function() {
            // Description: For auto-inlining any links to imgur images in comments

            $('.comment .comment-text .comment-copy a').each(function() {
                if ($(this).attr('href').indexOf('imgur.com') != -1) {
                    var image = $(this).attr('href');
                    $(this).parent().append('<img src="' + image + '" width="100%">'); //add image to end of comments, but keep link in same position
                }
            });
        },

        showCommentScores: function() {
            // Description: For adding a button on your profile comment history pages to show your comment's scores

            var sitename = sox.site.currentApiParameter;
            $('.history-table td b a[href*="#comment"]').each(function() {
                var id = $(this).attr('href').split('#')[1].split('_')[0].replace('comment', '');
                $(this).after('<span class="showCommentScore" id="' + id + '">&nbsp;&nbsp;&nbsp;show comment score</span>');
            });
            $('.showCommentScore').css('cursor', 'pointer').on('click', function() {
                var $that = $(this);
                sox.helpers.getFromAPI('comments', $that.attr('id'), sitename, function(json) {
                    $that.html('&nbsp;&nbsp;&nbsp;' + json.items[0].score);
                });
            });
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
                        } else if ($(this).text().match(/(discussion|feature-request|support|bug)/)) { //if it's a required tag
                            $(this).addClass('required-tag'); //add appropiate class
                        }
                    });
                });
            }, 'creation&pagesize=60');
        },

        stickyVoteButtons: function() {
            // Description: For making the vote buttons stick to the screen as you scroll through a post
            //https://github.com/shu8/SE_OptionalFeatures/pull/14:
            //https://github.com/shu8/Stack-Overflow-Optional-Features/issues/28: Thanks @SnoringFrog for fixing this!

            var $votecells = $(".votecell");
            $votecells.css("width", "61px");

            stickcells();

            $(window).scroll(function() {
                stickcells();
            });

            function stickcells() {
                $votecells.each(function() {
                    var $topbar = $('.topbar'),
                        topbarHeight = $topbar.outerHeight(),
                        offset = 10;
                    if ($topbar.css('position') == 'fixed') {
                        offset += topbarHeight;
                    }
                    var $voteCell = $(this),
                        $vote = $voteCell.find('.vote'),
                        vcOfset = $voteCell.offset(),
                        scrollTop = $(window).scrollTop();
                    if (vcOfset.top - scrollTop - offset <= 0) {
                        if (vcOfset.top + $voteCell.height() - scrollTop - offset - $vote.height() > topbarHeight) {
                            $vote.css({
                                position: 'fixed',
                                left: vcOfset.left + 4,
                                top: offset
                            });
                        } else {
                            $vote.removeAttr("style");
                        }
                    } else {
                        $vote.removeAttr("style");
                    }
                });
            }
        },

        titleEditDiff: function() {
            // Description: For showing the new version of a title in a diff separately rather than loads of crossing outs in red and additions in green


            sox.helpers.observe('.review-status', function() {
                var $questionHyperlink = $('.summary h2 .question-hyperlink').clone(),
                    $questionHyperlinkTwo = $('.summary h2 .question-hyperlink').clone(),
                    link = $('.summary h2 .question-hyperlink').attr('href'),
                    added = ($questionHyperlinkTwo.find('.diff-delete').remove().end().text()),
                    removed = ($questionHyperlink.find('.diff-add').remove().end().text());

                if ($('.summary h2 .question-hyperlink').find('.diff-delete, .diff-add').length) {
                    $('.summary h2 .question-hyperlink').hide();
                    $('.summary h2 .question-hyperlink').after('<a href="' + link + '" class="question-hyperlink"><span class="diff-delete">' + removed + '</span><span class="diff-add">' + added + '</span></a>');
                }
            });
        },

        metaChatBlogStackExchangeButton: function() {
            // Description: For adding buttons next to sites under the StackExchange button that lead to that site's meta, chat and blog

            var blogSites = ['math', 'serverfault', 'english', 'stats', 'diy', 'bicycles', 'webapps', 'mathematica', 'christianity', 'cooking', 'fitness', 'cstheory', 'scifi', 'tex', 'security', 'islam', 'superuser', 'gaming', 'programmers', 'gis', 'apple', 'photo', 'dba'],
                link,
                blogLink = '//' + 'blog.stackexchange.com';

            $('#your-communities-section > ul > li > a').hover(function() {
                if ($(this).attr('href').substr(0, 6).indexOf('meta') == -1) {
                    link = 'http://meta.' + $(this).attr('href').substr(2, $(this).attr('href').length - 1);
                    if (blogSites.indexOf($(this).attr('href').split('/')[2].split('.')[0]) != -1) {
                        blogLink = '//' + $(this).attr('href').split('/')[2].split('.')[0] + '.blogoverflow.com';
                    }

                    $(this).find('.rep-score').hide();
                    $(this).append('<div class="related-links" style="float: right;"> \
                                 <a href="' + link + '">meta</a> \
                                 <a href="http://chat.stackexchange.com">chat</a> \
                                 <a href="' + blogLink + '">blog</a> \
                                </div>');
                }
            }, function() {
                $(this).find('.rep-score').show();
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
                    'class': 'topbar-dialog achievements-dialog dno'
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
                    'class': 'topbar-icon yes-hover metaNewQuestionAlert-diamondOff',
                    click: function() {
                        $diamond.toggleClass('topbar-icon-on');
                        $dialog.toggle();
                    }
                });

            $dialog.append($header).append($content.append($questions)).prependTo('.js-topbar-dialog-corral');
            $('#soxSettingsButton').after($diamond);

            $('#metaNewQuestionAlertButton').hover(function() { //open on hover, just like the normal dropdowns
                if ($('.topbar-icon').not('#metaNewQuestionAlertButton').hasClass('topbar-icon-on')) {
                    $('.topbar-dialog').hide();
                    $('.topbar-icon').removeClass('topbar-icon-on').removeClass('icon-site-switcher-on');
                    $(this).addClass('topbar-icon-on');
                    $('#metaNewQuestionAlertDialog').show();
                }
            }, function() {
                $('.topbar-icon').not('#metaNewQuestionAlertButton').hover(function() {
                    if ($('#metaNewQuestionAlertButton').hasClass('topbar-icon-on')) {
                        $('#metaNewQuestionAlertDialog').hide();
                        $('#metaNewQuestionAlertButton').removeClass('topbar-icon-on');
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

            $('head').append('<link rel="stylesheet" href="https://cdn.rawgit.com/shu8/SE-Answers_scripts/master/coolMaterialDesignCss.css" type="text/css" />');
        },

        standOutDupeCloseMigrated: function() {
            // Description: For adding cooler signs that a questions has been closed/migrated/put on hod/is a dupe

            $('head').append('<link rel="stylesheet" href="https://rawgit.com/shu8/SE-Answers_scripts/master/dupeClosedMigratedCSS.css" type="text/css" />'); //add the CSS

            $('.question-summary').each(function() { //Find the questions and add their id's and statuses to an object
                var $anchor = $(this).find('.summary a:eq(0)');
                var text = $anchor.text().trim();
                var id = $anchor.attr('href').split('/')[2];

                if (text.substr(text.length - 11) == '[duplicate]') {
                    $anchor.text(text.substr(0, text.length - 11)); //remove [duplicate]
                    $.get('//' + location.hostname + '/questions/' + id, function(d) {
                        $anchor.after("&nbsp;<a href='" + $(d).find('.question-status.question-originals-of-duplicate a:eq(0)').attr('href') + "'><span class='duplicate' title='click to visit duplicate'>&nbsp;duplicate&nbsp;</span></a>"); //add appropiate message
                    });

                } else if (text.substr(text.length - 8) == '[closed]') {
                    $anchor.text(text.substr(0, text.length - 8)); //remove [closed]
                    $.get('//' + location.hostname + '/questions/' + id, function(d) {
                        $anchor.after("&nbsp;<span class='closed' title='" + $(d).find('.question-status h2').text() + "'>&nbsp;closed&nbsp;</span>"); //add appropiate message
                    });

                } else if (text.substr(text.length - 10) == '[migrated]') {
                    $anchor.text(text.substr(0, text.length - 10)); //remove [migrated]
                    $.get("https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22" + encodeURIComponent('http://' + location.hostname + '/questions/' + id) + "%22&diagnostics=true", function(d) {
                        $anchor.after("&nbsp;<span class='migrated' title='migrated to " + $(d).find('.current-site .site-icon').attr('title') + "'>&nbsp;migrated&nbsp;</span>"); //add appropiate message
                    });

                } else if (text.substr(text.length - 9) == '[on hold]') {
                    $anchor.text(text.substr(0, text.length - 9)); //remove [on hold]
                    $.get('//' + location.hostname + '/questions/' + id, function(d) {
                        $anchor.after("&nbsp;<span class='onhold' title='" + $(d).find('.question-status h2').text() + "'>&nbsp;onhold&nbsp;</span>"); //add appropiate message
                    });
                }
            });
        },

        editReasonTooltip: function() {
            // Description: For showing the latest revision's comment as a tooltip on 'edit [date] at [time]'

            function getComment(url, $that) {
                $.get(url, function(responseText, textStatus, XMLHttpRequest) {
                    console.log('SOX editReasonTooltip URL: ' + url);
                    console.log($that);
                    console.log('SOX editReasonTooltip text: ' + $(XMLHttpRequest.responseText).find('.revision-comment:eq(0)')[0].innerHTML);
                    $that.find('.sox-revision-comment').attr('title', $(XMLHttpRequest.responseText).find('.revision-comment:eq(0)')[0].innerHTML);
                });
            }
            $('.question, .answer').each(function() {
                if ($(this).find('.post-signature').length > 1) {
                    var id = $(this).attr('data-questionid') || $(this).attr('data-answerid');
                    $(this).find('.post-signature:eq(0)').find('.user-action-time a').wrapInner('<span class="sox-revision-comment"></span>');
                    var $that = $(this);
                    getComment('http://' + sox.site.url + '/posts/' + id + '/revisions', $that);
                }
            });
        },

        addSBSBtn: function() {
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
                wmdinput.parent().toggleClass('sbs-on'); //wmdinput.parent() has class wmd-container
                wmdpreview.toggleClass('sbs-on');

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
                var itemid = jNode[0].id.replace(/^\D+/g, '');
                var toAppend = (itemid.length > 0 ? '-' + itemid : ''); //helps select tags specific to the question/answer being
                // edited (or new question/answer being written)
                setTimeout(function() {
                    var sbsBtn = '<li class="wmd-button" title="side-by-side-editing" style="left: 500px;width: 170px;"> \
<div id="wmd-sbs-button' + toAppend + '" style="background-image: none;"> \
Toggle SBS?</div></li>';
                    jNode.after(sbsBtn);

                    //add click listener to sbsBtn
                    jNode.next().on('click', function() {
                        startSBS(toAppend);
                    });

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
                    //waitForKeyElements('#wmd-redo-button-' + itemIDs[i], SBS);
                    sox.helpers.observe('#wmd-redo-button-' + itemIDs[i], SBS);
                }
            }

            //event listener for adding the sbs toggle button for posting new questions or answers
            //waitForKeyElements('#wmd-redo-button', SBS);
            sox.helpers.observe('#wmd-redo-button', SBS);
        },

        alwaysShowImageUploadLinkBox: function() {
            // Description: For always showing the 'Link from the web' box when uploading an image.

            sox.helpers.observe('.image-upload form', function(n) {
                $('.image-upload form div.modal-options-default.tab-page > a')[0].click();
            });
        },

        addAuthorNameToInboxNotifications: function() {
            // Description: To add the author's name to inbox notifications

            function getAuthorName($node) {
                if ($node) {
                    var type = $node.find('.item-header .item-type').text(),
                        sitename = $node.find('a').eq(0).attr('href').split('com/')[0].replace('http://', '') + 'com',
                        link = $node.find('a').eq(0).attr('href'),
                        apiurl,
                        id;

                    switch (type) {
                        case 'comment':
                            id = link.split('/')[5].split('?')[0];
                            apiurl = 'https://api.stackexchange.com/2.2/comments/' + id + '?order=desc&sort=creation&site=' + sitename;
                            break;
                        case 'answer':
                            id = link.split('/')[4].split('?')[0];
                            apiurl = 'https://api.stackexchange.com/2.2/answers/' + id + '?order=desc&sort=creation&site=' + sitename;
                            break;
                        case 'edit suggested':
                            id = link.split('/')[4];
                            apiurl = 'https://api.stackexchange.com/2.2/suggested-edits/' + id + '?order=desc&sort=creation&site=' + sitename;
                            break;
                        default:
                            console.log('SOX does not currently support get author information for type: ' + type);
                            return;
                    }

                    $.getJSON(apiurl, function(json) {
                        var author = json.items[0].owner.display_name,
                            $author = $('<span/>', {
                                class: 'author',
                                style: 'padding-left: 5px;',
                                text: author
                            });
                        console.log(author);

                        var $header = $node.find('.item-header'),
                            $type = $header.find('.item-type').clone(),
                            $creation = $header.find('.item-creation').clone();

                        //fix conflict with soup fix mse207526 - https://github.com/vyznev/soup/blob/master/SOUP.user.js#L489
                        $header.empty().append($type).append($author).append($creation);
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

            if (sox.site.type != sox.site.types.chat) { // don't show scrollToTop button while in chat.
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
                })).appendTo('div.container');

                if ($(window).scrollTop() < 200) {
                    $('#sox-scrollToTop').hide();
                }

                $(window).scroll(function() {
                    if ($(this).scrollTop() > 200) {
                        $('#sox-scrollToTop').fadeIn();
                    } else {
                        $('#sox-scrollToTop').fadeOut();
                    }
                });
            }
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
                AGEDAWAY: 'aged away'
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
                        //console.log(groupKey + ": " + typeKey + " Flags -- " + count);
                        addPercentage(item, typeItem, percentage);
                    }
                }
            }
        },

        linkedPostsInline: function() {
            // Description: Displays linked posts inline with an arrow

            function getIdFromUrl(url) {
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

            $('.post-text a, .comments .comment-copy a').each(function() {
                var url = $(this).attr('href');
                if (url && url.indexOf(sox.site.url) > -1 && url.indexOf('#comment') == -1) {
                    $(this).css('color', '#0033ff');
                    $(this).before('<a class="expander-arrow-small-hide expand-post-sox"></a>');
                }
            });

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
                        var div = '<div class="linkedPostsInline-loaded-body-sox" style="background-color: #ffffcc;">' + d + '</div>';
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

        enhancedEditor: function() {
            // Description: Add a bunch of features to the standard markdown editor (autocorrect, find+replace, Ace editor, and more!)

            sox.enhancedEditor.startFeature();
        },

        downvotedPostsEditAlert: function() {
            // Description: Adds a notification to the inbox if a question you downvoted and watched is edited

            //GM_deleteValue('downvotedPostsEditAlert');
            //GM_deleteValue('downvotedPostsEditAlert-notifications');
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

            function addNotification(link, title, sitename, notificationPostId) { //add the notification
                $('div.topbar .icon-inbox').click(function() { //add the actual notification
                    if(notifications[notificationPostId]) {
                        setTimeout(function() {
                            $('div.topbar div.topbar-dialog.inbox-dialog.dno ul').prepend("<li class='inbox-item unread-item question-close-notification'> \
                <a href='" + link + "'> \
                <div class='site-icon favicon favicon-stackexchange' title=''></div> \
                <div class='item-content'> \
                <div class='item-header'> \
                <span class='item-type'>post edit</span> \
                <span class='item-creation'><span class='downvotedPostsEditAlert-markAsRead' style='color:blue;border: 1px solid gray;' onclick='javascript:void(0)' id='markAsRead_" + sitename + '-' + notificationPostId + "'>mark as read</span></span> \
                </div> \
                <div class='item-location'>" + title + "</div> \
                <div class='item-summary'>A post you downvoted has been edited since. Go check it out, and see if you should retract your downvote!</div> \
                </div> \
                </a> \
                </li>");
                        }, 500);
                    }
                });
            }

            function addNumber() {
                var count = 0;
                for (var i in notifications) {
                    if (notifications.hasOwnProperty(i)) {
                        count++;
                    }
                }
                if (count !== 0 && $('div.topbar .icon-inbox span.unread-count').text() === '') { //display the number
                    $('div.topbar .icon-inbox span.unread-count').css('display', 'inline-block').text(count);
                }
            }

            var postsToCheck = JSON.parse(GM_getValue('downvotedPostsEditAlert', '{}'));
            var notifications = JSON.parse(GM_getValue('downvotedPostsEditAlert-notifications', '{}'));
            var lastCheckedTime = GM_getValue('downvotedPostsEditAlert-lastCheckedTime', 0);

            console.log(postsToCheck);
            console.log(notifications);
            console.log(lastCheckedTime);

            $('.post-menu').each(function() {
                var id;
                var $parent = $(this).parents('.question, .answer');
                if($parent.length) {
                    if($parent.hasClass('question')) {
                        id = +$parent.attr('data-questionid');
                    } else {
                        id = +$parent.attr('data-answerid');
                    }
                }
                console.log(id);
                console.log(postsToCheck);
                $(this).append("<span class='lsep'></span><a " + (id in postsToCheck ? "style='color:green' " : "") + "class='downvotedPostsEditAlert-watchPostForEdits'>notify on edit</a>");
            });

            $(document).on('click', '.downvotedPostsEditAlert-markAsRead', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('marking as read');
                var base = $(this).attr('id').split('markAsRead_')[1];
                var sitename = base.split('-')[0];
                var postId = base.split('-')[1];
                delete notifications[+postId];
                console.log('new notifications object', notifications);
                GM_setValue('downvotedPostsEditAlert-notifications', JSON.stringify(notifications));
                $(this).parent().parent().parent().parent().parent().hide(); //hide the notification in the inbox dropdown
            });

            $(document).mouseup(function(e) { //hide on click off
                var container = $('div.topbar-dialog.inbox-dialog.dno > div.modal-content');
                if (!container.is(e.target) && container.has(e.target).length === 0) {
                    container.find('.question-close-notification').remove();
                }
            });

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
                    $(this).css('color', 'green');
                    postsToCheck[postId] = {
                        'questionId': questionId,
                        'addedDate': new Date().getTime(),
                        'sitename': sitename
                    };
                }
                GM_setValue('downvotedPostsEditAlert', JSON.stringify(postsToCheck));
            });

            //set up websockets
            var w = new WebSocket("ws://qa.sockets.stackexchange.com/");
            var posts = Object.keys(postsToCheck);
            w.onmessage = function(e) {
                var data = JSON.parse(e.data);
                var sitename;
                var title;
                data.data = JSON.parse(data.data);
                console.log('Received Data:', data.data);
                if (data.data.a == 'post-edit' && posts.indexOf((data.data.id).toString()) > -1) {
                    for (var c in websocketSiteCodes) {
                        if (websocketSiteCodes[c] == data.action.split('-')[0]) {
                            sitename = c;
                            sox.helpers.getFromAPI('posts', data.data.id, sitename, function(d) {
                                title = d.items[0].title;
                                notifications[data.data.id] = {
                                    'sitename': sitename,
                                    'url': 'http://' + sitename + '.stackexchange.com/posts/' + data.data.id,
                                    'title': title
                                };
                                GM_setValue('downvotedPostsEditAlert-notifications', JSON.stringify(notifications));
                                addNotification('http://' + sitename + '.stackexchange.com/posts/' + data.data.id, title + ' [LIVE]', sitename, data.data.id);
                                console.log('adding notification');
                                addNumber();
                            }, 'activity&filter=!9YdnSEBb8');
                        }
                    }
                }
            };

            if (!$.isEmptyObject(postsToCheck)) {
                $.each(postsToCheck, function(i, o) {
                    if (new Date().getTime() >= ((o.lastCheckedTime || 0) + 3600000)) { //an hour: 3600000
                        var url = "https://api.stackexchange.com/2.2/posts/" + i + "?order=desc&sort=activity&site=" + o.sitename + "&filter=!9YdnSEBb8";
                        $.getJSON(url, function(json) {
                            //TODO: use access token
                            //TODO: change postsToCheck object to have sitename in key for edge-case bug fix
                            if (json.items[0].last_edit_date > (o.lastCheckedTime || o.addedDate) / 1000) {
                                addNotification(json.items[0].link, json.items[0].title + ' [API]', json.items[0].link.split('/')[2].split('.')[0], i);
                                console.log('adding notification from api');
                                notifications[i] = {
                                    'sitename': json.items[0].link.split('/')[2].split('.')[0],
                                    'url': json.items[0].link,
                                    'title': json.items[0].title
                                };
                                GM_setValue('downvotedPostsEditAlert-notifications', JSON.stringify(notifications));
                                addNumber();
                                o.lastCheckedTime = new Date().getTime();
                                GM_setValue('downvotedPostsEditAlert', JSON.parse(postsToCheck));
                            }
                        });
                    }
                    w.onopen = function() {
                        console.log('sending websocket message: ' + websocketSiteCodes[o.sitename] + "-question-" + o.questionId);
                        w.send(websocketSiteCodes[o.sitename] + "-question-" + o.questionId);
                    };
                });
            }
        },

        chatEasyAccess: function() {
            // Description: Adds options to give a user read/write/no access in chat from their user popup dialog

            sox.helpers.observe('.user-popup .last-dates', function(node) {
                var $node = $(node).parent();
                var id = $node.find('a')[0].href.split('/')[4];
                if ($('.chatEasyAccess').length) $('.chatEasyAccess').remove();

                $node.find('div:last-child').last().after('<div class="chatEasyAccess">give <b id="read-only">read</b> / <b id="read-write">write</b> / <b id="remove">no</b> access</div>');
                $(document).on('click', '.chatEasyAccess b', function() {
                    var $that = $(this);
                    $.ajax({
                        url: 'http://chat.stackexchange.com/rooms/setuseraccess/' + location.href.split('/')[4],
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
            }, document.getElementById('chat-body'));
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
                        style: 'margin-bottom: 0; padding-right: 5px;'
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

            sox.helpers.observe('.review-more-instructions ul', function() {
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
                    editorApproved = $editor.text().match(/([0-9])/g)[0],
                    editorRejected = $editor.text().match(/([0-9])/g)[1];
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
                    $badgesTd.append('<span><span class="badge1" style="background-image:none"></span><span class="badgecount">&nbsp;&nbsp;</span></span>');
                }
                if (acs[k].silver) {
                    $badgesTd.append('<span title="' + acs[k].silver + ' silver badges"><span class="badge2"></span><span class="badgecount">' + acs[k].silver + '</span></span>');
                } else {
                    $badgesTd.append('<span><span class="badge1" style="background-image:none"></span><span class="badgecount">&nbsp;&nbsp;</span></span>');
                }
                if (acs[k].bronze) {
                    $badgesTd.append('<span title="' + acs[k].bronze + ' bronze badges"><span class="badge3"></span><span class="badgecount">' + acs[k].bronze + '</span></span>');
                } else {
                    $badgesTd.append('<span><span class="badge1" style="background-image:none"></span><span class="badgecount">&nbsp;&nbsp;</span></span>');
                }
            });

            for (var c = 0; c < 3; c++) {
                var className = classes[c];
                var $thisClassSpan = $('.user-accounts .badges span[title*="' + className + '"]');
                if ($thisClassSpan.length) {
                    $thisClassSpan.each(function() {
                        var text = $(this).text();
                        if (text.length > numbers[className]) {
                            numbers[className] = text.length;
                        }
                    });
                }
                $thisClassSpan.each(function() {
                    var len = $(this).text().length;
                    if (len < numbers[className]) {
                        for (var i = 0; i < numbers[className] - len; i++) {
                            $(this).append('&nbsp;&nbsp;');
                        }
                    }
                });
            }
            $('.user-accounts .badges span').css('margin-right', '3px');
        },

        quickAuthorInfo: function() {
            // Description: Shows when the post's author was last active and their registration state in the comments section

            var answerers = {};
            $('.question, .answer').each(function() {
                var $userDetailsAnchor = $(this).find('.post-signature .user-details a').last();
                if ($userDetailsAnchor.length) {
                    var userid = ($userDetailsAnchor.attr('href') ? $userDetailsAnchor.attr('href').split('/')[2] : 0);
                    var username = $userDetailsAnchor.text();
                    if (userid !== 0) answerers[userid] = username;
                } else {
                    sox.helpers.notify('Could not find user user link for:');
                    console.log($(this));
                }
            });
            var apiUrl = "https://api.stackexchange.com/users/" + Object.keys(answerers).join(';') + "?site=" + sox.site.currentApiParameter;
            $.get(apiUrl, function(data) {
                console.log(data);
                var userDetailsFromAPI = {};
                $.each(data.items, function() {
                    var cur = $(this)[0];
                    userDetailsFromAPI[cur.user_id] = {
                        'last_seen': new Date(cur.last_access_date * 1000).toUTCString(),
                        'creation': new Date(cur.creation_date * 1000).toUTCString(),
                        'type': cur.user_type
                    };
                });
                setTimeout(function() {
                    $('.question, .answer').each(function() {
                        var id = $(this).find('.post-signature .user-details a').last().attr('href').split('/')[2];
                        if (userDetailsFromAPI[id]) {
                            $(this).find('.comments').removeClass('dno');
                            $(this).find('.comments tbody:eq(0)').prepend("<tr class='comment'><td class='comment-actions'></td><td class='comment-text'><div style='display: block;' class='comment-body'>last seen: " + userDetailsFromAPI[id].last_seen + " | type: " + userDetailsFromAPI[id].type + "</div></td></tr>");
                        }
                    });
                }, 500);
            });
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
                        if (sox.location.match(sitesToBlock[i], site)) {
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
            var div = $('<div/>', {
                id: 'loggedInReminder',
                style: 'position: fixed; right: 0; bottom: 50px; background-color: rgba(200, 200, 200, 1); width: 200px; height: 35px; text-align: center; padding: 3px; color: red;',
                html: 'You are not logged in. You should <a href="/users/login">log in</a> to continue enjoying SE.'
            });

            function checkAndAddReminder() {
                if (!sox.user.loggedIn) {
                    if (!$('#loggedInReminder').length) $('body').append(div);
                } else {
                    $('#loggedInReminder').remove();
                }
            }
            checkAndAddReminder();
            setInterval(checkAndAddReminder, 300000); //5 mins
        }
    };
})(window.sox = window.sox || {}, jQuery);
