SOHelper = {
    getUsername: function() {
        $uname = $('body > div.topbar > div > div.topbar-links > a > div.gravatar-wrapper-24');
        return ($uname.length ? $uname.attr('title') : false);
    },

    getReputation: function() {
        $rep = $('div.topbar-links .links-container>span.reputation');
        return ($rep.length ? $rep.text().trim().replace(',', '') : false);
    },

    getSiteName: function(type) {
        return (type == 'api' ? location.href.split('/')[2].split('.')[0] : $('.current-site-link').text().trim());
    },

    isBeta: function() {
        return !!$('.beta-title').length;
    },

    getQuestionId: function() {
        return window.location.href.split('/')[4];
    },

    isLoggedIn: function() {
        return !$('.call-to-login').length;
    },

    isOnUserProfile: function() {
        return location.href.indexOf('/users/') > -1;
    },
    
    getSiteType: function() {
        if($('#jplayer').length && /^chat\./.test(location.hostname)) {
            return 'chat';
        } else if (/^meta\./.test(location.hostname)) {
            return 'meta';
        } else {
            return 'main';
        }
    },

    hasPriv: (function() { //IIFE returning function saves instantiating privs multiple times
        var graduatedPrivs = {
            'access review queues': 2000,
            'access to moderator tools': 10000,
            'approve tag wiki edits': 5000,
            'cast close and reopen votes': 3000,
            'comment everywhere': 5,
            'create chat rooms': 100,
            'create gallery chat rooms': 1000,
            'create posts': 1,
            'create tag synonyms': 2500,
            'create tags': 500,
            'create wiki posts': 10,
            'edit community wiki': 100,
            'edit questions and answers': 2000,
            'established user': 1000,
            'flag posts': 15,
            'participate in meta': 5,
            'protect questions': 15000,
            'reduce ads': 200,
            'remove new user restrictions': 10,
            'set bounties': 75,
            'talk in chat': 20,
            'trusted user': 20000,
            'view close votes': 250,
            'vote down': 125,
            'vote up': 15
        };
        var betaPrivs = {
            'access review queues': 350,
            'access to moderator tools': 2000,
            'approve tag wiki edits': 1500,
            'cast close and reopen votes': 500,
            'comment everywhere': 50,
            'create chat rooms': 100,
            'create gallery chat rooms': 1000,
            'create posts': 1,
            'create tag synonyms': 1250,
            'create tags': 150,
            'create wiki posts': 10,
            'edit community wiki': 100,
            'edit questions and answers': 1000,
            'established user': 750,
            'flag posts': 15,
            'participate in meta': 5,
            'protect questions': 3500,
            'remove new user restrictions': 10,
            'set bounties': 75,
            'talk in chat': 20,
            'trusted user': 4000,
            'view close votes': 250,
            'vote down': 125,
            'vote up': 15
        };
        return function(priv) {        
            if (!SOHelper.isLoggedIn()) {
                return false;
            }
            var repNeeded = SOHelper.getSiteType() == 'graduated' ? graduatedPrivs[priv] : betaPrivs[priv];
            return SOHelper.getReputation() > repNeeded;
        }
    })();
}
