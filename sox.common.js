(function(sox, $, undefined) {
    'use strict';
    var SOX_SETTINGS = 'SOXSETTINGS';

    var Stack = typeof StackExchange === "undefined" ? undefined : StackExchange;
    var Chat = typeof CHAT === "undefined" ? undefined : CHAT;

    sox.info = {
      version: typeof GM_info !== 'undefined' ? GM_info.script.version : 'unknown',
      handler: typeof GM_info !== 'undefined' ? GM_info.scriptHandler : 'unknown'
    }

    sox.ready = function(func) {
        $(function() {
            return Stack ? Stack.ready(func) : func();
        });
    };

    sox.settings = {
        available: GM_getValue(SOX_SETTINGS, -1) != -1,
        load: function() {
            return JSON.parse(GM_getValue(SOX_SETTINGS));
        },
        save: function(settings) {
            GM_setValue(SOX_SETTINGS, JSON.stringify(settings));
        },
        reset: function() {
            GM_deleteValue(SOX_SETTINGS);
        }
    };

    sox.helpers = {
        // eg: sox.helpers.notify('message one', 'message two');
        notify: function(message) {
            for (var arg = 0; arg < arguments.length; ++arg) {
                console.log('sox:', arguments[arg]);
            }
        }
    };


    sox.site = {
        id: Stack ? Stack.options.site.id : undefined,
        get name() {
            if (Chat) {
                return $('#footer-logo a').attr('title');
            } else if (Stack) {
                return Stack.options.site.name;
            }
            return undefined;
        },
        types: {
            main: 'main',
            meta: 'meta',
            chat: 'chat',
            beta: 'beta'
        },
        get type() {
            if (Chat) {
                return sox.site.types.chat;
            } else if (Stack) {
                if (Stack.options.site.isMetaSite) {
                    return sox.site.types.meta;
                } else {
                    // check if site is in beta or graduated
                    if ($('.beta-title').length > 0) {
                        return sox.site.types.beta;
                    } else {
                        return sox.site.types.main;
                    }
                }
            }
        },

        url: location.hostname,
        href: location.href,
        apiParameter: function(site) {
            var sites = {}; // load from so.json file
            if (sites.hasOwnProperty(site)) {
                return (sites[site]);
            }
        },
        icon: undefined

    };

    sox.location = {
        // location helpers
        on: function(location) {
            return window.location.href.indexOf(location) > -1 ? true : false;
        },
        get onUserProfile() {
            return this.on('/users/' + sox.user.id);
        },
        get onQuestion() {
            return this.on('/questions');
        }
        match: function(pattern) {

            var currentSiteScheme = location.protocol,
                currentSiteHost = location.hostname,
                currentSitePath = location.pathname;
            var matchSplit = pattern.split('/'),
                matchScheme = matchSplit[0],
                matchHost = matchSplit[2],
                matchPath = matchSplit.slice(matchSplit.length == 4 ? -1 : -2).join('/');

            //replace any stars (`*`)
            matchScheme = matchScheme.replace(/\*/g, ".*");

            /*
            first, escape any legit dots (`.`),
            then replace any (now escaped) stars (`*\.`),
            then replace any (now escaped) single stars (`\.*`)
            */
            matchHost = matchHost.replace(/\./g, "\\.").replace(/\*\\\./g, ".*.?").replace(/\\\.\*/g, ".*");

            /*
            first, escape any legit slashes (`/`),
            then replace any stars (`*`),
            */
            matchPath = matchPath.replace(/\//g, "\\/").replace(/\*/g, ".*");

            if (currentSiteScheme.match(new RegExp(matchScheme)) && currentSiteHost.match(new RegExp(matchHost)) && currentSitePath.match(new RegExp(matchPath))) {
                return true;
            }
            return false;
        }
    };

    sox.user = {
        get id() {
            if (sox.site.type == sox.site.types.chat) {
                return Chat ? Chat.RoomUsers.current().id : undefined;
            } else {
                return Stack ? Stack.options.user.userId : undefined;
            }
        },
        get rep() {
            if (sox.site.type == sox.site.types.chat) {
                return Chat ? Chat.RoomUsers.current().reputation : undefined;
            } else {
                return Stack ? Stack.options.user.rep : undefined;
            }
        },
        get name() {
            if (sox.site.type == sox.site.types.chat) {
                return Chat ? Chat.RoomUsers.current().name : undefined;
            } else {
                return Stack ? decodeURI(Stack.options.user.profileUrl.split('/')[5]) : undefined;
            }
        },
        get loggedIn() {
            return Stack ? Stack.options.user.isRegistered : undefined;
        },
        hasPrivelage: function(privelage) {
            /*var privelages = {}; // load from so.json file
            if (user.loggedIn) {
                var rep = (site.type == beta ? privelages.beta[privelage] : privelages.graduated[privelage]);
                return user.rep > rep;
            }*/
            return false;
        }
    };


})(window.sox = window.sox || {}, jQuery);
