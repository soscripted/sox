SOHelper = {
    getUsername: function() {
        $uname = $('body > div.topbar > div > div.topbar-links > a > div.gravatar-wrapper-24');
        return ($uname.length ? $uname.attr('title') : -1);
    },

    getReputation: function() {
        $rep = $('div.topbar-links .links-container>span.reputation');
        return ($rep.length ? $rep.text().trim().replace(',', '') : -1);
    },

    getSiteName: function(type) {
        $location = $(location).attr('href');
        return (type == 'api' ? $location.split('/')[2].split('.')[0] : $('div.modal-content.current-site-container > ul > li > a').text().trim());
    },

    getSiteType: function() {
        return ($('.beta-title').length ? 'beta' : 'graduated');
    },

    getQuestionId: function() {
        return window.location.href.split('/')[4];
    },

    isLoggedIn: function() {
        return ($('.call-to-login').length ? false : true);
    },

    isOnUserProfile: function() {
        return ($(location).attr('href').indexOf('/users/') > -1 ? true : false);
    },

    hasPriv: function(priv) {
        graduatedPrivs = {
            "access review queues": 2000,
            "access to moderator tools": 10000,
            "approve tag wiki edits": 5000,
            "cast close and reopen votes": 3000,
            "comment everywhere": 5,
            "create chat rooms": 100,
            "create gallery chat rooms": 1000,
            "create posts": 1,
            "create tag synonyms": 2500,
            "create tags": 500,
            "create wiki posts": 10,
            "edit community wiki": 100,
            "edit questions and answers": 2000,
            "established user": 1000,
            "flag posts": 15,
            "participate in meta": 5,
            "protect questions": 15000,
            "reduce ads": 200,
            "remove new user restrictions": 10,
            "set bounties": 75,
            "talk in chat": 20,
            "trusted user": 20000,
            "view close votes": 250,
            "vote down": 125,
            "vote up": 15
        };
        betaPrivs = {
            "access review queues": 350,
            "access to moderator tools": 2000,
            "approve tag wiki edits": 1500,
            "cast close and reopen votes": 500,
            "comment everywhere": 50,
            "create chat rooms": 100,
            "create gallery chat rooms": 1000,
            "create posts": 1,
            "create tag synonyms": 1250,
            "create tags": 150,
            "create wiki posts": 10,
            "edit community wiki": 100,
            "edit questions and answers": 1000,
            "established user": 750,
            "flag posts": 15,
            "participate in meta": 5,
            "protect questions": 3500,
            "remove new user restrictions": 10,
            "set bounties": 75,
            "talk in chat": 20,
            "trusted user": 4000,
            "view close votes": 250,
            "vote down": 125,
            "vote up": 15
        };
        if (!SEUserscripts.isLoggedIn) {
            return
        }
        rep = SEUserscripts.getReputation();
        repNeeded = (SEUserscripts.getSiteType() == 'graduated' ? graduatedPrivs[priv] : betaPrivs[priv])
        return (rep > repNeeded ? true : false)
    }
}
