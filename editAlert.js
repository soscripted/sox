/*jshint loopfunc: true, esversion: 6*/
/*
- to show in notification:
    - delete button
    - title if notification is a comment (add current title to saved object when watching a comments section)
*/
(function(sox, $, undefined) {
    console.log('running editAlert.js');
    //TODO add to SOX stylesheet when adding this feature to SOX
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
                    padding-top: 9px;
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
                    background-color: blue;
                    display: block;
                    color: #FFF;
                    font-weight: bold;
                    text-indent: 0;
                    border-radius: 2px;
                    padding: 1px 6px 1px 6px;
                    font-size: 11px;
                    line-height: 1;
                    width: 8px;
                    position: absolute;
                    height: 11px;
                    margin-left: 7px;
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
                }

                .sox-editNotification-messageType {
                    color: gray;
                    text-transform: uppercase;
                    font-size: 11px;
                }
                `);

    function addNotification(details, callback, alreadySaved) {
        console.log('adding notification with details:', details);
        var text = '';
        if (details.newLink && details.newScore) {
            if (details.score && details.newState) { //newAnswersStateChange; sitename, title, newLink, newScore, score, newState
                text = (details.newAnswerCount === 1 ? 'new answer, state change' : 'new answers, state change'); // details.newState;
            } else { //newAnswers; sitename, title, newLink, newScore
                text = 'new answers'; //details.newAnswerCount === 1 ? 'A new answer has been posted on this question' : 'New answers have been posted on this question';
            }
        } else if (details.score && details.newState) { //stateChange; sitename, title, score, newState
            text = 'state change'; //'This question is now ' + details.newState;
        } else if (details.editComment || details.newTags) {
            if (details.newTags) {
                if (details.editComment ) {//editRetag; sitename, title, link, editComment, score, newTags
                    text = 'edited, new tags'; //'This question has been edited (' + details.editComment + ') and retagged (' + details.newTags.join(', ') + ')';
                } else { //retag; sitename, title, link, newTags, score
                    text = 'retag'; //'This question was retagged (' + details.newTags.join(', ') + ')';
                }
            } else { //edit; sitename, title, link, editComment, score
                text = 'edited'; //'This question has been edited (' + details.editComment + ')';
            }
        } else if (details.commentBody && details.commentsLink && details.newCommentsCount > 0) {
            text = (details.newCommentsCount === 1 ? 'new comment' : 'new comments'); // + ' (' + (details.commentBody.length > 100 ? $('<div>').html(details.commentBody.substr(0, 100)).text() + '...' : $('<div>').html(details.commentBody.substr(0, 100)).text()) + ')'; //div creation is to unescape string for eg. quotes
        }

        if (text) {
            var $li = $('<li>').append($('<a>', {
                'href': details.link || details.newLink || details.commentsLink,
                'class': alreadySaved ? '' : 'new'
            }).append($('<div>', {
                'class': 'site-icon favicon favicon-' + (details.sitename == 'meta' ? 'stackexchangemeta' : details.sitename),
                'style': 'margin-right: 10px'
            })).append((details.score || details.newScore ? details.score || details.newScore : '') + ' ' + details.title)).append($('<span>', {
                'style': 'color: black; margin-left: 5px',
                'html': $('<span/>', {
                    'text': text,
                    'class': 'sox-editNotification-messageType'
                })
            }));

            $('#sox-editNotificationDialogList').prepend($li);

            var noOfNotifications = $('#sox-editNotificationDialogList li .new').length;
            //if double figures, add padding to fix alignment:
            if (noOfNotifications) $('.sox-editNotificationButtonCount').css('padding-right', noOfNotifications > 9 ? '9px' : '6px').text(noOfNotifications).show();
            callback({'addedNotification': true});

            var nots = JSON.parse(GM_getValue('sox-editNotification-notifications', '[]'));
            if (!alreadySaved) alreadySaved = nots.filter(function(d) {
                return d.postId == details.originalPostId;
            }).length;
            if (!alreadySaved) {
                nots.push(details);
                GM_setValue('sox-editNotification-notifications', JSON.stringify(nots));
            }
            return;
        }
        callback({'addedNotification': false});
    }

    //GM_deleteValue('sox-editNotification-postsToWatch');
    //GM_deleteValue('sox-editNotification-commentsToWatch');
    //GM_deleteValue('sox-editNotification-notifications');
    var postsToWatch = JSON.parse(GM_getValue('sox-editNotification-postsToWatch', '[]')),
        commentsToWatch = JSON.parse(GM_getValue('sox-editNotification-commentsToWatch', '[]')),
        notifications = JSON.parse(GM_getValue('sox-editNotification-notifications', '[]')),
        apiQuestionFilter = '!SCam31W85iAdF11znRBpj2qWFPRJV_*8fTZTOPnclcMRL3Dxjmxr-5DJdNc07fPo',
        apiAnswerFilter = '!*IXxMt)cy3)mYENixz4JCogmlz1T(H0s*KHikYPCS4H3YAaTeot5E.A9HbhuHZ',
        apiRevisionFilter = '!*K)GWE1gDcf3YaWY',
        commentsFilter = '!*K)GSjDWh5AAh)g(',
        options = {
            'retag': 'retag',
            'edit': 'edit',
            'state change': 'stateChange',
            'new answers': 'newAnswers'
        },
        $ul = $('<ul>', {
            'id': 'sox-edit-notification-options-list'
        }),
        throttled = JSON.parse(GM_getValue('sox-editNotification-throttled', '{"throttled": false}'));

    console.log('postsToWatch', postsToWatch);
    console.log('commentsToWatch', commentsToWatch);
    console.log('throttled', throttled);
    console.log('notifications', notifications);

    //TODO: when moved to SOX, this line can go
    $('<link/>', {
        rel: 'stylesheet',
        href: 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'
    }).appendTo('head');

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
                    $('.sox-editNotificationButtonCount').hide();
                    $button.removeClass('topbar-icon-on glow');
                    $count.text('');
                }
            }
        }),
        $icon = $('<i/>', {
            class: 'fa fa-edit'
        }),
        $count = $('<span/>', {
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
            if ($dialog.is(':visible')) {
                $('.sox-editNotificationButtonCount').hide();
                $button.removeClass('topbar-icon-on glow');
                $count.text('');
            }
            $dialog.hide();
        }
    });

    //---------------------------------/notification dialog------------------------------//

    if(!sox.location.on('/users/')) {
        $('.comments').before('<i title="watch for new comments" class="fa fa-pencil-square-o sox-notify-on-change sox-watch-comments"></i>');
        $('.post-menu').append('<span class="lsep"></span><i title="watch post for changes" class="fa fa-pencil-square-o sox-notify-on-change sox-watch-post"></i></a>');
    }

    function fromAPI(url, throttled, callback) {
        if (throttled.throttled) {
            if (new Date().getTime() < throttled.time + 7200000) { //7200000 == 2 hours
                callback(false);
                return;
            } else {
                GM_setValue('sox-editNotification-throttled', JSON.stringify('{"throttled": false}'));
            }
        }
        console.log('getting from API with URL: ', url);
        $.ajax({
            method: 'get',
            url: url,
            success: function(d) {
                if (d.error_id == 502) {
                    callback(false);
                } else {
                    callback(d);
                }
            },
            async: false //make sure the notification is added at the right time
        });
    }

    //----------------------------------MAIN PART---------------------------------------//
    if (notifications.length) {
        $.each(notifications, function(i, o) {
            console.log('looping saved notifications. currently on:', o);
            addNotification(o, function(d) {
                if (d.addedNotification) {
                    console.log('added saved notification:', o);
                }
            }, true); //true => alreadySaved, to not re-add to notifications object again
        });
    }

    if (postsToWatch.length) { //make the watch icon black if the post is already on the watch list
        console.log('about to start looping postsToWatch:', postsToWatch);
        $.each(postsToWatch, function(i, o) {
            console.log('looping postsToWatch. currently on:', o);
            var currentType = o.type,
                currentPostId = o.postId,
                currentSitename = o.sitename,
                lastCheckedTime = o.lastCheckedTime,
                lastCheckedState = o.lastCheckedState,
                lastCheckedAnswerIds = o.lastCheckedAnswerIds || [], //if undefined, make an empty array for comparison later
                currentOptions = o.options,
                detailsWeKnow = {},
                currentSiteUrl = currentSitename + '.stackexchange.com';

            if (currentSitename === 'superuser') currentSiteUrl = 'superuser.com';
            if (currentSitename === 'serverfault') currentSiteUrl = 'serverfault.com';
            if (currentSitename === 'stackoverflow') currentSiteUrl = 'stackoverflow.com';
            if (currentSitename === 'meta') currentSiteUrl = 'meta.stackexchange.com';

            var $post = $('div[data-' + currentType + 'id="' + currentPostId + '"]');
            $post.find('.sox-watch-post').removeClass('fa-pencil-square-o').addClass('fa-pencil-square');

            //FIRST see what's changed then check whether what's changed matches the user's settings and add notification accordingly.
            if (new Date().getTime() >= lastCheckedTime + 900000) { //15 mins = 900000
                console.log('Been more than 15 (or 10) minutes since checking post. Doing API request for', o);
                if (currentOptions.indexOf('newAnswers') !== -1 || currentOptions.indexOf('stateChange') !== -1) { //newAnswers || stateChange
                    //do API request to /questions or /answers
                    fromAPI('http://api.stackexchange.com/2.2/' + currentType + 's/' + currentPostId + '?site=' + currentSitename + '&filter=' + (currentType == 'question' ? apiQuestionFilter : apiAnswerFilter), throttled, function(data) {
                        console.log('data retrieved from API:', data);
                        if (!data) { //throttle
                            console.log('Erorr: throttled');
                            throttled = {
                                "throttled": true,
                                "time": new Date().getTime()
                            };
                            GM_setValue('sox-editNotification-throttled', JSON.stringify(throttled));
                            return false;
                        }

                        var newAnswerIds = (data.items[0].answers ? data.items[0].answers.map(function(o) {
                                return o.answer_id;
                            }) : []),
                            newState = (data.items[0].closed_details ? 'closed (' + data.items[0].closed_reason + ')': 'open'),
                            differentAnswerIds = [];

                        if (newAnswerIds.length && lastCheckedAnswerIds) { //if there are new answers, and there were old answers
                            console.log('newAnswerIds:', newAnswerIds);
                            differentAnswerIds = newAnswerIds.filter(function(i) {
                                return lastCheckedAnswerIds.indexOf(i) === -1;
                            });
                            console.log('lastCheckedAnswerIds', lastCheckedAnswerIds);
                        }

                        console.log('newAnswerIds:', newAnswerIds);
                        console.log('lastCheckedAnswerIds', lastCheckedAnswerIds);

                        var answer, newLink, score, i;
                        if (currentOptions.indexOf('newAnswers') !== -1 && currentOptions.indexOf('stateChange') == -1) { //newAnswers && !stateChange
                            //check for whether new answerId exists, notification = 'new answer'
                            //http://stackoverflow.com/a/6230314/3541881 checking for whether they are equal
                            //check first whether there are *any* answers at all, and if there are, check for whether there are any new ones
                            if (newAnswerIds && lastCheckedAnswerIds.sort().join(',') !== newAnswerIds.sort().join(',')) {
                                //we have new answers (IDs in differentAnswerIds)

                                for (i = 0; i< newAnswerIds.length; i++) {
                                    answer = $.grep(data.items[0].answers, function(d) {
                                        return d.answer_id == newAnswerIds[i];
                                    })[0];
                                    newLink = answer.link;
                                    score = answer.score;
                                }
                                detailsWeKnow.sitename = currentSitename;
                                detailsWeKnow.title = data.items[0].title;
                                detailsWeKnow.newLink = newLink;
                                detailsWeKnow.newScore = score;
                                detailsWeKnow.newAnswerCount = differentAnswerIds.length;
                            }
                        } else if (currentOptions.indexOf('newAnswers') == -1 && currentOptions.indexOf('stateChange') !== -1) { //!newAnswers && stateChange
                            //check for whether lastCheckedState is same, notification = 'state change'
                            if (lastCheckedState !== newState) {
                                //question state has changed
                                detailsWeKnow.sitename = currentSitename;
                                detailsWeKnow.newState = newState;
                                detailsWeKnow.title = data.items[0].title;
                                detailsWeKnow.link = data.items[0].link;
                                detailsWeKnow.score =  data.items[0].score;
                            }
                        } else if (currentOptions.indexOf('stateChange') !== -1 && currentOptions.indexOf('newAnswers') !== -1) { //newAnswers && stateChange
                            //check for whether new answerId exists, and whether state is different, notification = 'state change and new answer'
                            if ((newAnswerIds.length && lastCheckedAnswerIds.sort().join(',') !== newAnswerIds.sort().join(',')) || lastCheckedState !== newState) {
                                //new answer IDs in differentAnswerIds

                                for (i = 0; i< newAnswerIds.length; i++) {
                                    answer = $.grep(data.items[0].answers, function(d) {
                                        return d.answer_id == newAnswerIds[i];
                                    })[0];
                                    newLink = answer.link;
                                    score = answer.score;
                                }

                                detailsWeKnow.sitename = currentSitename;
                                if (newLink && score) {
                                    detailsWeKnow.newLink = newLink;
                                    detailsWeKnow.newScore = score;
                                    detailsWeKnow.title = data.items[0].title;
                                    detailsWeKnow.newState = newState;
                                    detailsWeKnow.newAnswerCount = differentAnswerIds.length;
                                }
                            }
                        }

                        detailsWeKnow.originalPostId = currentPostId;

                        addNotification(detailsWeKnow, function(r) {
                            if (r.addedNotification) { //now it can only check at the earliest 15 mins later
                                console.log('changing lastCheckedTime to current time');
                                o.lastCheckedTime = new Date().getTime();
                                console.log('resaving newAnswerIds', newAnswerIds);
                                o.lastCheckedAnswerIds = newAnswerIds;
                            } else { //now it can only check at the earliest 10 mins later (just reducing the wait for posts with no activity)
                                console.log('changing lastCheckedTime to time 10 minutes ago');
                                o.lastCheckedTime = new Date().getTime() - 600000; //600000ms == 10 mins
                            }
                        });
                    });
                }
                if (currentOptions.indexOf('edit') !== -1 || currentOptions.indexOf('retag') !== -1) { //edit || retag
                    //do API request to posts/id/revisions
                    fromAPI('http://api.stackexchange.com/2.2/posts/' + currentPostId + '/revisions?site=' + currentSitename + '&filter=' + apiRevisionFilter, throttled, function(data) {
                        console.log('data retrieved from API:', data);
                        if (!data) { //throttle
                            console.log('Erorr: throttled');
                            throttled = {
                                "throttled": true,
                                "time": new Date().getTime()
                            };
                            GM_setValue('sox-editNotification-throttled', JSON.stringify(throttled));
                            return false;
                        }

                        var retag = data.items[0].last_tags ? true : false,
                            edit = data.items[0].creation_date*1000 > lastCheckedTime,
                            itemIndex;

                        if (data.items.length != 1) { //if there's only one revision, then there have been no edits (rev 1 is the original post)
                            for (var z = 0; z < data.items.length; z++) { //vote_based revision means state change, ie. no edit
                                if (data.items[z].revision_type !== 'vote_based') itemIndex = z; break;
                            }
                            if (currentOptions.indexOf('retag') !== -1 && currentOptions.indexOf('edit') === -1) { //retag
                                if (retag) {
                                    detailsWeKnow.sitename = currentSitename;
                                    detailsWeKnow.title = data.items[itemIndex].title;
                                    detailsWeKnow.link = 'http://' + currentSiteUrl + '/' + data.items[itemIndex].post_type[0] + '/' + data.items[itemIndex].post_id; //data.items[itemIndex].post_type[0] => 'question'/'answer'->'q'/'a
                                    detailsWeKnow.newTags = data.items[itemIndex].tags;
                                    detailsWeKnow.title = data.items[itemIndex].title || data.items[data.items.length-1].title;
                                }
                            } else if (currentOptions.indexOf('retag') === -1 && currentOptions.indexOf('edit') !== -1) { //edit
                                if (edit && !retag) { //if retag wasn't selected, then don't add notification if retag occured
                                    detailsWeKnow.sitename = currentSitename;
                                    detailsWeKnow.title = data.items[itemIndex].title;
                                    detailsWeKnow.link = 'http://' + currentSiteUrl + '/' + data.items[itemIndex].post_type[0] + '/' + data.items[itemIndex].post_id; //data.items[itemIndex].post_type[0] => 'question'/'answer'->'q'/'a
                                    detailsWeKnow.editComment = data.items[itemIndex].comment;
                                    detailsWeKnow.title = data.items[itemIndex].title || data.items[data.items.length-1].title;
                                }
                            } else { //both
                                if (edit && retag) {
                                    detailsWeKnow.sitename = currentSitename;
                                    detailsWeKnow.title = data.items[itemIndex].title;
                                    detailsWeKnow.link = 'http://' + currentSiteUrl + '/' + data.items[itemIndex].post_type[0] + '/' + data.items[itemIndex].post_id; //data.items[0].post_type[0] => 'question'/'answer'->'q'/'a
                                    detailsWeKnow.editComment = data.items[itemIndex].comment;
                                    detailsWeKnow.newTags = data.items[itemIndex].tags;
                                    detailsWeKnow.title = data.items[itemIndex].title || data.items[data.items.length-1].title;
                                }
                            }
                        }

                        detailsWeKnow.originalPostId = currentPostId;

                        addNotification(detailsWeKnow, function(r) {
                            if (r.addedNotification) { //now it can only check at the earliest 15 mins later
                                console.log('changing lastCheckedTime to current time');
                                o.lastCheckedTime = new Date().getTime();
                            } else { //now it can only check at the earliest 10 mins later (just reducing the wait for posts with no activity)
                                console.log('changing lastCheckedTime to time 10 minutes ago');
                                o.lastCheckedTime = new Date().getTime() - 600000; //600000ms == 10 mins
                            }
                        });
                    });
                }
            }
        });
        GM_setValue('sox-editNotification-postsToWatch', JSON.stringify(postsToWatch));
    }

    if (commentsToWatch.length) {
        console.log('about to start looping commentsToWatch:', commentsToWatch);
        $.each(commentsToWatch, function(i, o) {
            console.log('looping commentsToWatch. currently on:', o);
            var currentPostId = o.postId,
                currentSitename = o.sitename,
                lastCheckedTime = o.lastCheckedTime,
                lastCheckedCommentIds = o.lastCheckedCommentIds,
                title = o.title,
                currentSiteUrl = currentSitename + '.stackexchange.com';

            if (currentSitename === 'superuser') currentSiteUrl = 'superuser.com';
            if (currentSitename === 'serverfault') currentSiteUrl = 'serverfault.com';
            if (currentSitename === 'stackoverflow') currentSiteUrl = 'stackoverflow.com';
            if (currentSitename === 'meta') currentSiteUrl = 'meta.stackexchange.com';

            var $comments = $('#comments-' + currentPostId);
            $comments.prev('.sox-watch-comments').removeClass('fa-pencil-square-o').addClass('fa-pencil-square'); //make the watch icon black if the comments section is already on the watch list

            if (new Date().getTime() >= lastCheckedTime + 900000) { //15 mins = 900000
                console.log('Been more than 15 (or 10) minutes since checking comments. Doing API request for', o);
                fromAPI('http://api.stackexchange.com/2.2/posts/' + currentPostId + '/comments?filter=' + commentsFilter + '&site=' + currentSitename, throttled, function(data) {
                    console.log('data retrieved from API:', data);
                    if (!data) { //throttle
                        console.log('Erorr: throttled');
                        throttled = {
                            "throttled": true,
                            "time": new Date().getTime()
                        };
                        GM_setValue('sox-editNotification-throttled', JSON.stringify(throttled));
                        return false;
                    }

                    var newCommentIds = data.items.map(function(d) {
                        return d.comment_id;
                    });
                    var differentCommentIds = newCommentIds.filter(function(i) {
                        return lastCheckedCommentIds.indexOf(i) === -1;
                    });
                    if (newCommentIds.length) {
                        addNotification({
                            'sitename': currentSitename,
                            'postId': currentPostId,
                            'commentBody': (data.items.length && 'body' in data.items[0] ? data.items[0].body : undefined),
                            'commentsLink': (data.items.length && 'post_type' in data.items[0] ? 'http://' + currentSiteUrl + '/' + data.items[0].post_type[0] + '/' + currentPostId + '#comments-' + currentPostId: undefined),
                            'newCommentsCount': differentCommentIds.length,
                            'originalPostId': currentPostId,
                            'title': title
                        }, function(r) {
                            if (r.addedNotification) { //now it can only check at the earliest 15 mins later
                                console.log('updating lastCheckedTime for comment', o);
                                o.lastCheckedTime = new Date().getTime();
                                console.log('resaving newCommentIds', newCommentIds);
                                o.lastCheckedCommentIds = newCommentIds;
                                console.log('new comment object', o);
                            } else { //now it can only check at the earliest 10 mins later (just reducing the wait for posts with no activity)
                                console.log('changing lastCheckedTime to time 10 minutes ago');
                                o.lastCheckedTime = new Date().getTime() - 600000; //600000ms == 10 mins
                            }
                        });
                    } else {
                        console.log('changing lastCheckedTime to time 10 minutes ago');
                        o.lastCheckedTime = new Date().getTime() - 600000; //600000ms == 10 mins
                    }
                });
            }
        });
        GM_setValue('sox-editNotification-commentsToWatch', JSON.stringify(commentsToWatch));
    }
    //----------------------------------/MAIN PART---------------------------------------//

    //setup div that appears when you click on 'watch post' icon
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
        var $post = $(this).parents('.question, .answer'),
            postId = ($post.hasClass('question') ? $post.attr('data-questionid') : $post.attr('data-answerid'));

        if ($(this).hasClass('fa-pencil-square-o')) { //toggle button state
            $(this).removeClass('fa-pencil-square-o').addClass('fa-pencil-square');
            commentsToWatch.push({
                'postId': postId,
                'title': $('#question-header > h1 > a').text(),
                'sitename': sox.site.currentApiParameter,
                'lastCheckedTime': new Date().getTime(),
                'lastCheckedCommentIds': $(this).next('.comments').find('tr.comment').map(function() { //get the IDs of all the comments on this post, returns [] if no comments
                    return $(this).attr('id').split('-')[1];
                }).get()
            });
        } else if ($(this).hasClass('fa-pencil-square')) {
            $(this).removeClass('fa-pencil-square').addClass('fa-pencil-square-o');
            commentsToWatch.filter(function(o, i) { //delete from commentsToWatch array
                if (o.postId == postId && o.sitename == sox.site.currentApiParameter) commentsToWatch.splice(i, 1);
                GM_setValue('sox-editNotification-commentsToWatch', JSON.stringify(commentsToWatch));
            });
        }

        console.log('commentsToWatch', commentsToWatch);
        GM_setValue('sox-editNotification-commentsToWatch', JSON.stringify(commentsToWatch));
    });

    $(document).on('click', '.sox-watch-post', function(e) {
        var $post = $(this).parents('.question, .answer'),
            isQuestion = $post.hasClass('question'),
            questionTitle = $('#question-header').text().trim(),
            questionState = (questionTitle.substr(questionTitle.length - 11) == '[duplicate]' || questionTitle.substr(questionTitle.length - 8) == '[closed]' || questionTitle.substr(questionTitle.length - 9) == '[on hold]' ? 'closed' : 'open'); //long winded way of finding question state without using StackExchange object (not compatabile with FF)

        if (isQuestion) {
            $optionsDiv.find('#stateChange, #newAnswers').parents('li').show();
        } else {
            $optionsDiv.find('#stateChange, #newAnswers, #retag').parents('li').hide();
        }
        var currentPostIfExists = postsToWatch.filter(function(d) {
            return d.postId == $post.attr('data-answerid') || $post.attr('data-questionid');
        });
        if(currentPostIfExists.length) {
            var currentChosenOptions = currentPostIfExists[0].options;
            $optionsDiv.find('#' + currentChosenOptions.join(',#')).prop('checked', true); //mark chosen options as checked
        }

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
        if ($postToggle.hasClass('fa-pencil-square-o')) $postToggle.removeClass('fa-pencil-square-o').addClass('fa-pencil-square');
        $optionsDiv.hide();
        console.log('postsToWatch', postsToWatch);
        GM_setValue('sox-editNotification-postsToWatch', JSON.stringify(postsToWatch));

    });

    $optionsDivCancel.click(function() {
        var $optionsDiv = $(this).parents('#sox-edit-notification-options'),
            type = $optionsDiv.attr('data-posttype'),
            postId = $optionsDiv.attr('data-postid'),
            $post = $('div[data-' + type + 'id="' + postId + '"]'),
            $postToggle = $post.find('.sox-watch-post');

        //toggle button state
        if ($postToggle.hasClass('fa-pencil-square')) $postToggle.removeClass('fa-pencil-square').addClass('fa-pencil-square-o');
        $optionsDiv.hide();

        postsToWatch.filter(function(o, i) { //delete from postsToWatch array
            if (o.postId == postId && o.sitename == sox.site.currentApiParameter) postsToWatch.splice(i, 1);
            GM_setValue('sox-editNotification-postsToWatch', JSON.stringify(postsToWatch));
        });
    });

    $(document).click(function(e) { //close options div if clicked outside it
        var $target = $(e.target),
            isToggle = $target.is('.sox-watch-post, #sox-edit-notification-options'),
            isChild = $target.parents('.sox-watch-post, #sox-edit-notification-options').is('.sox-watch-post, #sox-edit-notification-options');

        if (!isToggle && !isChild) $optionsDiv.hide();
    });
})(window.sox = window.sox || {}, jQuery);
