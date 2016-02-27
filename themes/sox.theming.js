var theming = function() {
    var siteName = SOHelper.getSiteName(),
        siteType = SOHelper.getSiteType();
    ////cdn.sstatic.net/sitename/all.css
    var FONTS = JSON.parse(GM_getValue(siteName + '_ALL')),
        THEME_NAME = GM_getValue(siteName + '_THEME'),
        REPOS = GM_getValue('THEME_REPOS'),
        FAVICONS = JSON.parse(GM_getValue('FAVICONS')),
        THEME = '',
        THEME_URL = '',
        SPRITESHEET_URL = '';
        //JS_URL = GM_getValue(siteName + '_' + siteType + '_' + THEME_NAME + '_URL'), //TODO: load as extension module
    if (THEME_NAME.contains('.')) {
        var themeParts = THEME_NAME.split('.');
        THEME = $.get(REPOS[themeParts[0]] + themeParts[1] + '.css');
            //TODO: spritesheet svg as well?
    } else {
        THEME_URL = GM_getValue(siteName + '_' + siteType + '_' + THEME_NAME + '_CSS_URL');
        SPRITESHEET_URL = GM_getValue(siteName + '_' + siteType + '_' + THEME_NAME + '_SPRITESHEET');
        THEME = GM_getValue(siteName + '_' + siteType + '_' + THEME_NAME + '_CSS');
    }
    //TODO: load from CSS to GM as new theme, combine themes?

    //Replace spritesheet
    if (SPRITESHEET_URL) {
        $('head').append($('<style/>', {
            html: '.envelope-on, .envelope-off, .vote-up-off, .vote-up-on, .vote-down-off, .vote-down-on, .star-on, .star-off, .comment-up-off, .comment-up-on, .comment-flag, .edited-yes, .feed-icon, .vote-accepted-off, .vote-accepted-on, .vote-accepted-bounty, .badge-earned-check, .delete-tag, .grippie, .expander-arrow-hide, .expander-arrow-show, .expander-arrow-small-hide, .expander-arrow-small-show, .anonymous-gravatar, .badge1, .badge2, .badge3, .gp-share, .fb-share, .twitter-share, #notify-containerspan.notify-close, .migrated.to, .migrated.from { background-url: ' + SPRITESHEET_URL + '; }'
        }));
    }
    //TODO: images from multiple sources?

    //Replace CSS
    if (THEME_URL) {
        $('head').append($('<link/>', {
            'rel': 'stylesheet',
            'type': 'text/css',
            'href': THEME_URL
        }));
    } else if (THEME) {
        $('head').append($('<style/>', {
            'html': THEME
        }));
    }

    //Replace favicons
    if (FAVICONS) {
        if(FAVICONS[siteName]) $('link[rel="shortcut icon"]').attr('href', FAVICONS[siteName]);
        $('.small-site-logo').each(function(i, el){
            var site = /\/([^\/]+)\/img/.exec(el.attr('src'));
            if(FAVICONS[site]) el.attr('src', FAVICONS[site]);
        });
    }

    $('body').append($('<div/>', {
        'id': 'upload'
    }).css({
        'position': 'absolute',
        'z-index': '10',
        'height': '100%',
        'width': '100%',
        'background': 'rgba(255, 255, 255, 0.75)',
        'display': 'none',
        'top': '0',
        'margin': '10px',
        'border': 'dashed 10px #888'
    }));

    //Quick theme changer
    $('html').on('dragenter', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#upload').show();
    });
    $('html').on('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#upload').hide();
    });
    $('html').on('drop', function(e) { //TODO: fix this and get file name - if file:// + image upload
        e.preventDefault();
        e.stopPropagation();
        $('#upload').hide();
        console.log(e);
    });

    //TODO: fix uploading, detect filetype then conditionally show - if (chat && (extension === 'sox.css' || extension === 'sox.theme.js' || extension === 'png' || extension === 'jpg') {$('#upload').show();}
    // then set url: GM_setValue(siteName_siteType_(css|js), url)
    //TODO: support modifying html + js

    //TODO: get other settings from PPCG script - e.g. question of the day
};
