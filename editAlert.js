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

comments = [{
    postId: 12
    sitename: 'meta',
    lastCheckedTime: 12344566,
    lastCheckedCommentIds: (optional) [1, 2, 3]
}]

- add helper function to add notification
- add helper function to get required info from API
- at page load, loop through postsToWatch and commentsToWatch and retrospectively add the fa-envelope class if it is added

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
                }`);

    var postsToWatch = JSON.parse(GM_getValue('sox-editNotification-postsToWatch', '[]')), //[{"type":"question","postId":"289490","sitename":"meta","lastCheckedTime":1483799031360,"options":["edit"],"lastCheckedState":"open"}],
        commentsToWatch = JSON.parse(GM_getValue('sox-editNotification-commentsToWatch', '[]')),
        options = {
            'retag': 'retag',
            'edit': 'edit',
            'state change': 'stateChange',
            'new answers': 'newAnswers'
        },
        $ul = $('<ul>', {
            'id': 'sox-edit-notification-options-list'
        });

    $('.comments').before('<i title="watch for new comments" class="fa fa-envelope-o sox-notify-on-change sox-watch-comments"></i>');
    $('.post-menu').append('<span class="lsep"></span><i title="watch post for changes" class="fa fa-envelope-o sox-notify-on-change sox-watch-post"></i></a>');

    if (postsToWatch.length) { //make the envelope sign black if the post is already on the watch list
        $.each(postsToWatch, function(i, o) {
            var $post = $('div[data-' + o.type + 'id="' + o.postId + '"]');
            $post.find('.sox-watch-post').removeClass('fa-envelope-o').addClass('fa-envelope');
        });
    }
    if (commentsToWatch.length) { //make the envelope sign black if the comments section is already on the watch list
        $.each(commentsToWatch, function(i, o) {
            var $comments = $('comments-' + o.postId);
            $comments.prev('.sox-watch-comments').removeClass('fa-envelope-o').addClass('fa-envelope');
        });
    }

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
