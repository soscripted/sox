SOHelper = {
    getUserId: function () {
        return StackExchange.options.user.userId;
    },

    getUsername: function() {
        var $uname = $('body > div.topbar > div > div.topbar-links > a > div.gravatar-wrapper-24');
        return ($uname.length ? $uname.attr('title') : false);
    },

    getReputation: function() {
        return StackExchange.options.user.rep;
    },

    getSiteURL: function(type) {
        return (type == 'full' ? location.href : location.hostname);
    },

    getSiteName: function() {
        return (SOHelper.getSiteType() === 'chat' ? $('#footer-logo a').attr('title') : StackExchange.options.site.name);
    },

    getAPISiteName: function() {
        return location.href.split('/')[2].split('.')[0];
    },

    getSiteIcon: function() {
        return "favicon-" + $(".current-site a:not([href*='meta']) .site-icon").attr('class').split('favicon-')[1];
    },

    getMetaSiteIcon: function() {
        return "favicon-" + $(".current-site a[href*='meta'] .site-icon").attr('class').split('favicon-')[1];
    },

    isBeta: function() {
        return !!$('.beta-title').length;
    },

    getQuestionId: function() {
        return StackExchange.question.getQuestionId();
    },

    isLoggedIn: function() {
        return StackExchange.options.user.isRegistered;
    },

    isOnUserProfile: function() {
        return location.href.indexOf('/users/') > -1;
    },

    getFromAPI: function(type, id, sitename, callback, sortby) {
        $.getJSON('https://api.stackexchange.com/2.2/' + type + '/' + id + '?order=desc&sort=' + (sortby || 'creation') + '&site=' + sitename, callback);
    },

    getSiteType: function() {
        if(window.CHAT) {
            return 'chat';
        } else {
            if (StackExchange.options.site) {
                if (StackExchange.options.site.isMetaSite) {
                    return 'meta';
                } else {
                    if ($('.beta-title').length) {
                        return 'beta';
                    } else {
                        return 'graduated';
                    }
                }
            }
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
            var repNeeded = SOHelper.isBeta() ? betaPrivs[priv] : graduatedPrivs[priv];
            return SOHelper.getReputation() > repNeeded;
        };
    })()
};
