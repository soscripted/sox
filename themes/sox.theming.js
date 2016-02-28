var theming = function() {
    var siteName = SOHelper.getSiteName(),
        siteType = SOHelper.getSiteType();
    ////cdn.sstatic.net/sitename/all.css
    var FONT_JSON = GM_getValue('FONTS'),
        THEME_JSON = GM_getValue('THEMES') || '',
        REPO_JSON = GM_getValue('REPOS'),
        FAVICON_URLS = GM_getValue('FAVICONS'),
        SPRITESHEET_URLS = GM_getValue('SPRITESHEETS');
        //JS_URL = GM_getValue(siteName + '_' + siteType + '_' + THEME_NAME + '_URL'), //TODO: load as extension module
    if (FONT_JSON) {
        var ALL_FONTS = FONT_JSON ? JSON.parse(FONT_JSON) : {};
        var FONTS = $.extend(true, {}, ALL_FONTS.all || {}, ALL_FONTS[siteName] || {});
        var ALL_THEMES = THEME_JSON ? JSON.parse(THEME_JSON) : {};
        var THEME = $.extend(true, {}, ALL_THEMES.all || {}, ALL_THEMES[siteName] || {});
        var FAVICONS = FAVICON_JSON ? JSON.parse(FAVICON_JSON) : {};
        var REPOS = REPO_JSON ? JSON.parse(REPO_JSON) : [];
    }

    if (THEME.contains('.')) {
        var themeParts = THEME_NAME.split('.');
        THEME = $.get(REPOS[themeParts[0]] + themeParts[1] + '.css'); //TODO: spritesheet svg as well?
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

var changeTheme = function() {
    var REPO_JSON = GM_getValue('THEME_REPOS'),
        REPOS = REPO_JSON ? JSON.parse(REPO_JSON) : null;
    for(var i in REPOS) {
        repo = REPOS[i];
        
    }
}
//TODO: load repos
