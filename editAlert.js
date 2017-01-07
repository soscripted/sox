/*
TODO:
posts = [{ //check for edits, (closure, reopen, new answers if question)
    type: 'question/answer',
    postId: 1234,
    sitename: 'meta',
    lastCheckedTime: 12344566,
    lastCheckedState: (optional) 'open/closed',
    lastCheckedAnswerIds: (optional) [1, 2, 3],
    options: ['retag', 'edit', 'state change', 'new answers']
}, {}, ...]

/questions/ids filter: !SCam31W85iAdF11znRBpj2qWFPRJV_*8fTZTOPnclcMRL3Dxjmxr-5DJdNc07fPo
/answers/ids filter:   !*IXxMt)cy3)mYENixz4JCogmlz1T(H0s*KHikYPCS4H3YAaTeot5E.A9HbhuHZ
/posts/ids/revisions filter: !*K)GWE1gDcf3YaWY

/posts/ids/revisions:
    - to check for retag, check if items[0].last_tags exists
    - to check whether body has been edited, check whether items[0].body exists
    - if title changed, items[0].last_title will exist

comments = [{
    postId: 12
    sitename: 'meta',
    lastCheckedTime: 12344566,
    lastCheckedCommentIds: (optional) [1, 2, 3]
}]

- add helper function to add notification
- add helper function to get required info from API

- to show in notification:
    - site logo (favicon on left)
    - delete button
    - retag/edit/state change/new answer
    - comment/post current score

    - if retag: new tags
    - if edit: edit comment
    - if state change: new state (colour?)
    - if new answer: time and user and score of latest answer, (how many new answers?), whether accepted
    - if new comment: comment body? time, author, score

NOTE: NEED TO MULTIPLY SE TIMES BY 1000!!
*/
(function(sox, $, undefined) {
    GM_addStyle(`.sox-watch-post {
                    margin-left: 5px;
                }
                .sox-notify-on-change {
                    cursor: pointer;
                }
                #sox-edit-notification-options {
                    position: absolute;
                    display: none;
                    margin-left: 5px;
                }
                #sox-edit-notification-options-list {
                    list-style-type: none;
                    margin-left: 15px;
                }
                #sox-edit-notification-options-save {
                    cursor: pointer;
                    color: green;
                }
                #sox-edit-notification-options-cancel {
                    cursor: pointer;
                }
                #sox-editNotificationDialogButton {
                    background-image: none;
                    padding-top: 10px;
                    font-size: 14px;
                    color: #858c93;
                    height: 24px !important;
                    min-width: 34px;
                    cursor: pointer;
                }

                #sox-editNotificationDialogButton:hover {
                    color: #999;
                }

                .sox-editNotificationButtonCount {
                    background-color: red;
                    width: 22px;
                    margin-left: 4px;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    position: absolute;
                    font-size: 20px;
                    top: 8px;
                }

                #sox-editNotificationDialog {
                    top: 34px;
                    left: 264px;
                    width: 377px;
                    display: none;
                }

                #sox-editNotificationDialogButton.glow {
                    -webkit-text-stroke-color: blue;
                    -webkit-text-stroke-width: 3px;
                }`);

    function addNotification(details) {
        var $li = $('<li>').append($('<a>').append($('<div>', {
            'class': 'site-icon favicon favicon-codereview',
            'style': 'margin-right: 10px'
        })).append('Question Title')).append($('<span>', {
            'style': 'color: black; margin-left: 5px',
            'text': 'question closed'
        }));

        $('#sox-editNotificationDialogList').prepend($li);
    }

    var postsToWatch = JSON.parse(GM_getValue('sox-editNotification-postsToWatch', '[]')), //[{"type":"question","postId":"289490","sitename":"meta","lastCheckedTime":1483799031360,"options":["edit"],"lastCheckedState":"open"}],
        commentsToWatch = JSON.parse(GM_getValue('sox-editNotification-commentsToWatch', '[]')),
        notifications = JSON.parse(GM_getValue('sox-editNotification-notifications', '[]')),
        apiQuestionFilter = '!SCam31W85iAdF11znRBpj2qWFPRJV_*8fTZTOPnclcMRL3Dxjmxr-5DJdNc07fPo',
        apiAnswerFilter = '!*IXxMt)cy3)mYENixz4JCogmlz1T(H0s*KHikYPCS4H3YAaTeot5E.A9HbhuHZ',
        apiRevisionFilter = '!*K)GWE1gDcf3YaWY',
        options = {
            'retag': 'retag',
            'edit': 'edit',
            'state change': 'stateChange',
            'new answers': 'newAnswers'
        },
        $ul = $('<ul>', {
            'id': 'sox-edit-notification-options-list'
        });

    //---------------------------------notification dialog------------------------------//
    var $dialog = $('<div/>', {
            id: 'sox-editNotificationDialog',
            'class': 'topbar-dialog achievements-dialog dno'
        }),
        $header = $('<div/>', {
            'class': 'header'
        }).append($('<h3/>', {
            text: 'recent activity'
        })),
        $content = $('<div/>', {
            'class': 'modal-content'
        }),
        $posts = $('<ul/>', {
            id: 'sox-editNotificationDialogList',
            'class': 'js-items items'
        }),
        $button = $('<a/>', {
            id: 'sox-editNotificationDialogButton',
            class: 'topbar-icon yes-hover sox-editNotification-buttonOff',
            title: 'Watched posts that have been edited',
            'style': 'color: #858c93; background-image: none; height: 24px;',
            href: '#',
            click: function(e) {
                e.preventDefault();
                $('#sox-editNotificationDialog').toggle();
                if ($('#sox-editNotificationDialog').is(':visible')) {
                    $(this).addClass('topbar-icon-on');
                } else {
                    $(this).removeClass('topbar-icon-on');
                }
            }
        }),
        $icon = $('<i/>', {
            class: 'fa fa-edit'
        }),
        $count = $('<div/>', {
            'class': 'sox-editNotificationButtonCount',
            'style': 'display:none'
        });

    $button.append($count).append($icon).appendTo('div.network-items');

    $dialog.css('left', $('#sox-editNotificationDialogButton').position().left).append($header).append($content.append($posts)).prependTo('.js-topbar-dialog-corral');

    $('#sox-editNotificationDialogButton').hover(function() { //open on hover, just like the normal dropdowns
        if ($('.topbar-icon').not('#sox-editNotificationDialogButton').hasClass('topbar-icon-on')) {
            $('.topbar-dialog').hide();
            $('.topbar-icon').removeClass('topbar-icon-on').removeClass('icon-site-switcher-on');
            $(this).addClass('topbar-icon-on');
            $('#sox-editNotificationDialog').show();
        }
    }, function() {
        $('.topbar-icon').not('#sox-editNotificationDialogButton').hover(function() {
            if ($('#sox-editNotificationDialogButton').hasClass('topbar-icon-on')) {
                $('#sox-editNotificationDialog').hide();
                $('#sox-editNotificationDialogButton').removeClass('topbar-icon-on');
                var which = $(this).attr('class').match(/js[\w-]*\b/);
                if (which) which = which[0].split('-')[1];
                if (which != 'site') { //site-switcher dropdown is slightly different
                    $('.' + which + '-dialog').not('#sox-settings-dialog, #metaNewQuestionAlertDialog, #sox-editNotificationDialog').show();
                    $(this).addClass('topbar-icon-on');
                } else {
                    $('.siteSwitcher-dialog').show();
                    $(this).addClass('topbar-icon-on').addClass('icon-site-switcher-on'); //icon-site-switcher-on is special to the site-switcher dropdown (StackExchange button)
                }
            }
        });
    });

    $(document).click(function(e) { //close dialog if clicked outside it
        var $target = $(e.target),
            isToggle = $target.is('#sox-editNotificationDialog, #sox-editNotificationDialogButton'),
            isChild = $target.parents('#sox-editNotificationDialog, #sox-editNotificationDialogButton').is("#sox-editNotificationDialog, #sox-editNotificationDialogButton");

        if (!isToggle && !isChild) {
            $dialog.hide();
            $button.removeClass('topbar-icon-on glow');
            $count.text('');
        }
    });

    //---------------------------------/notification dialog------------------------------//

    $('.comments').before('<i title="watch for new comments" class="fa fa-envelope-o sox-notify-on-change sox-watch-comments"></i>');
    $('.post-menu').append('<span class="lsep"></span><i title="watch post for changes" class="fa fa-envelope-o sox-notify-on-change sox-watch-post"></i></a>');


    function fromAPI(url, callback) {
        $.getJSON(url, callback);
    }
    //----------------------------------MAIN PART---------------------------------------//
    if (postsToWatch.length) { //make the envelope sign black if the post is already on the watch list
        $.each(postsToWatch, function(i, o) {
            var currentType = o.type,
                currentPostId = o.postId,
                currentSitename = o.sitename,
                lastCheckedTime = o.lastCheckedTime,
                lastCheckedState = o.lastCheckedState,
                lastCheckedAnswerIds = o.lastCheckedAnswerIds,
                currentOptions = o.options;
                /*options = {
                    'retag': 'retag',
                    'edit': 'edit',
                    'state change': 'stateChange',
                    'new answers': 'newAnswers'
                }*/

            var $post = $('div[data-' + currentType + 'id="' + currentPostId + '"]');
            $post.find('.sox-watch-post').removeClass('fa-envelope-o').addClass('fa-envelope');

            //TODO: do the API checking
            if ((new Date().getTime() + 900000) >= lastCheckedTime) {
                if (options.indexOf('newAnswers') !== -1 || options.indexOf('stateChange') !== -1) { //newAnswers || stateChange
                    //do API request to /questions or /answers
                    fromAPI('http://api.stackexchange.com/2.2/' + currentType + 's/' + currentPostId + '?sitename=' + currentSitename + 'filter=' + (currentType == 'question' ? apiQuestionFilter : apiAnswerFilter), function(data) {
                        var newAnswerIds = (data.items[0].answers ? data.items[0].answers.map(function(o) {
                                return o.answer_id;
                            }) : []),
                            newState = (data.items[0].closed_details ? 'closed': 'open'),
                            differentAnswerIds = [];

                        if (newAnswerIds) {
                            differentAnswerIds = newAnswerIds.filter(function(i) {
                                return lastCheckedAnswerIds.indexOf(i) === -1;
                            });
                        }

                        if (options.indexOf('newAnswers') !== -1 && options.indexOf('stateChange') == -1) { //newAnswers && !stateChange
                            //check for whether new answerId exists, notification = 'new answer'
                            //http://stackoverflow.com/a/6230314/3541881 checking for whether they are equal
                            if (lastCheckedAnswerIds.sort().join(',') !== newAnswerIds.sort().join(',')) {
                                //we have new answers (IDs in differentAnswerIds)
                                addNotification({
                                    'sitename': currentSitename,
                                    'notificationType': 'newAnswers',
                                    'link': data.items[0].link, //TODO: CHANGE [0] TO INDEX OF ITEM WITH ID IN differentAnswerIds
                                });
                            }
                        } else if (options.indexOf('newAnswers') == -1 && options.indexOf('stateChange') !== -1) { //!newAnswers && stateChange
                            //check for whether lastCheckedState is same, notification = 'state change'
                            if (lastCheckedState !== newState) {
                                //question state has changed
                                addNotification({
                                    'sitename': currentSitename,
                                    'notificationType': 'stateChange',
                                    'newState': newState,
                                    'title': data.items[0].title,
                                    'link': data.items[0].link
                                });
                            }
                        } else if (options.indexOf('stateChange') !== -1 && options.indexOf('newAnswers') !== -1) { //newAnswers && stateChange
                            //check for whether new answerId exists, and whether state is different, notification = 'state change and new answer'
                            if (lastCheckedAnswerIds.sort().join(',') !== newAnswerIds.sort().join(',') || lastCheckedState !== newState) {
                                //new answer IDs in differentAnswerIds
                                addNotification({
                                    'sitename': currentSitename,
                                    'notificationType': 'newAnswersStateChange',
                                    'newState': newState,
                                    'title': data.items[0].title,
                                    'link': data.items[0].link
                                });
                            }
                        }
                    });
                }
                if (options.indexOf('edit') !== -1 || options.indexOf('retag') !== -1) { //edit || retag
                    //do API requst to posts/id/revisions
                    var retag = true, //TRUE/FALSE FROM API
                        edit = true; //TRUE/FALSE FROM API
                    if (options.indexOf('retag') !== -1) { //retag
                        //check for retag and edit comment, notification = 'edit and retag'
                    } else { //edit
                        //check for edit comment, notification = 'edit'
                    }
                }
            }
        });
    }
    if (commentsToWatch.length) { //make the envelope sign black if the comments section is already on the watch list
        $.each(commentsToWatch, function(i, o) {
            var currentPostId = o.postId,
                currentSitename = o.sitename,
                lastCheckedTime = o.lastCheckedTime,
                lastCheckedCommentIds = o.lastCheckedCommentIds;

            var $comments = $('comments-' + currentPostId);
            $comments.prev('.sox-watch-comments').removeClass('fa-envelope-o').addClass('fa-envelope');
            //TODO: do the API checking

        });
    }
    //----------------------------------/MAIN PART---------------------------------------//

    //setup div that appears when you click on 'watch post' envelope
    $.each(options, function(text, id) { //create list items, in form <label><input type='checkbox' id='id'>text</label>
        $ul.append($('<li>').append($('<label>').append($('<input>', {
            'id': id,
            'type': 'checkbox'
        })).append(text)));
    });
    $ul.find('#edit').prop('checked', true); //by default, 'edit' is checked.
    $('body').append($('<div/>', { //add options div to DOM, add ul to div, append checkmark sign to the ul
        'id': 'sox-edit-notification-options',
    }).append($ul.append($('<i>', {
        'class': 'fa fa-check',
        'id': 'sox-edit-notification-options-save',
        'title': 'watch post'
    })).append($('<i>', {
        'class': 'fa fa-times',
        'id': 'sox-edit-notification-options-cancel',
        'title': 'stop watching post'
    }))));

    var $optionsDiv = $('#sox-edit-notification-options'),
        $optionsDivList = $('#sox-edit-notification-options-list'),
        $optionsDivSave = $('#sox-edit-notification-options-save'),
        $optionsDivCancel = $('#sox-edit-notification-options-cancel');

    //all the handlers for clicking on watch icons, clicking save, clicking cancel, closing div if clicked outside
    $(document).on('click', '.sox-watch-comments', function() {
        var $post = $(this).parents('.question, .answer');

        if ($(this).hasClass('fa-envelope-o')) { //toggle button state
            $(this).removeClass('fa-envelope-o').addClass('fa-envelope');
        } else if ($(this).hasClass('fa-envelope')) {
            $(this).removeClass('fa-envelope').addClass('fa-envelope-o');
        }

        commentsToWatch.push({
            'postId': ($post.hasClass('question') ? $post.attr('data-questionid') : $post.attr('data-answerid')),
            'sitename': sox.site.currentApiParameter,
            'lastCheckedTime': new Date().getTime(),
            'lastCheckedCommentIds': $(this).next('.comments').find('tr.comment').map(function() { //get the IDs of all the comments on this post, returns [] if no comments
                return $(this).attr('id').split('-')[1];
            }).get()
        });

        console.log('commentsToWatch', commentsToWatch);
        //TODO: GM_setValue
    });

    $(document).on('click', '.sox-watch-post', function(e) {
        var $post = $(this).parents('.question, .answer'),
            isQuestion = $post.hasClass('question'),
            questionTitle = $('#question-header').text().trim(),
            questionState = (questionTitle.substr(questionTitle.length - 11) == '[duplicate]' || questionTitle.substr(questionTitle.length - 8) == '[closed]' || questionTitle.substr(questionTitle.length - 9) == '[on hold]' ? 'closed' : 'open'); //long winded way of finding question state without using StackExchange object (not compatabile with FF)

        $optionsDiv //add the post details as data-* attributes now for use later (when clicking save)
        .attr('data-postid', isQuestion ? $post.attr('data-questionid') : $post.attr('data-answerid'))
        .attr('data-posttype', isQuestion ? 'question' : 'answer')
        .attr('data-questionstate', isQuestion ? questionState : '')
        .css({
            'left': e.pageX,
            'top': e.pageY
        }).show();
    });

    $optionsDivSave.click(function() {
        var chosenOptions = $optionsDivList.find('input:checked').map(function() { //returns array of chosen options
                return $(this).attr('id');
            }).get(),
            $optionsDiv = $(this).parents('#sox-edit-notification-options'),
            type = $optionsDiv.attr('data-posttype'),
            postId = $optionsDiv.attr('data-postid'),
            $post = $('div[data-' + type + 'id="' + postId + '"]'),
            $postToggle = $post.find('.sox-watch-post');

        postsToWatch.push({
            'type': type,
            'postId': postId,
            'sitename': sox.site.currentApiParameter,
            'lastCheckedTime': new Date().getTime(),
            'options': chosenOptions,
            'lastCheckedState': type == 'question' ? $optionsDiv.attr('data-questionstate') : ''
        });

        //toggle button state
        if ($postToggle.hasClass('fa-envelope-o')) $postToggle.removeClass('fa-envelope-o').addClass('fa-envelope');
        $optionsDiv.hide();
        console.log('postsToWatch', postsToWatch);
        //TODO: GM_setValue
    });

    $optionsDivCancel.click(function() {
        var $optionsDiv = $(this).parents('#sox-edit-notification-options'),
            type = $optionsDiv.attr('data-posttype'),
            postId = $optionsDiv.attr('data-postid'),
            $post = $('div[data-' + type + 'id="' + postId + '"]'),
            $postToggle = $post.find('.sox-watch-post');

        //toggle button state
        if ($postToggle.hasClass('fa-envelope')) $postToggle.removeClass('fa-envelope').addClass('fa-envelope-o');
        $optionsDiv.hide();

        postsToWatch.filter(function(o, i) { //delete from postsToWatch array
            if (o.postId == postId && o.sitename == sox.site.currentApiParameter) postsToWatch.splice(i, 1);
        });
        //TODO: GM_setValue
    });

    $(document).click(function(e) { //close options div if clicked outside it
        var $target = $(e.target),
            isToggle = $target.is('.sox-watch-post, #sox-edit-notification-options'),
            isChild = $target.parents('.sox-watch-post, #sox-edit-notification-options').is('.sox-watch-post, #sox-edit-notification-options');

        if (!isToggle && !isChild) $optionsDiv.hide();
    });
})(window.sox = window.sox || {}, jQuery);
