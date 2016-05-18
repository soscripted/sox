(function(sox, $, undefined) {
    'use strict';
    var SOX_SETTINGS = 'SOXSETTINGS';
    var commonInfo = JSON.parse(GM_getResourceText('common'));

    var Stack = (typeof StackExchange === "undefined" ? undefined : StackExchange);
    var Chat = (typeof CHAT === "undefined" ? undefined : CHAT);

    sox.info = {
      version: (typeof GM_info !== 'undefined' ? GM_info.script.version : 'unknown'),
      handler: (typeof GM_info !== 'undefined' ? GM_info.scriptHandler : 'unknown')
    };

    sox.ready = function(func) {
        $(function() {
            return Stack ? Stack.ready(func) : func();
        });
    };

    sox.settings = {
        available: GM_getValue(SOX_SETTINGS, -1) != -1,
        load: function() {
            return JSON.parse(GM_getValue(SOX_SETTINGS, 'null'));
        },
        save: function(settings) {
            GM_setValue(SOX_SETTINGS, JSON.stringify(settings));
        },
        reset: function() {
            GM_deleteValue(SOX_SETTINGS);
        }
    };

    sox.helpers = {
        notify: function(message) {
            // eg: sox.helpers.notify('message one', 'message two');
            for (var arg = 0; arg < arguments.length; ++arg) {
                console.log('SOX: ', arguments[arg]);
            }
        }
    };

    sox.site = {
        types: {
            main: 'main',
            meta: 'meta',
            chat: 'chat',
            beta: 'beta'
        },
        id: Stack ? Stack.options.site.id : undefined,
        get name() {
            if (Chat) {
                return $('#footer-logo a').attr('title');
            } else if (Stack) {
                return Stack.options.site.name;
            }
            return undefined;
        },
        get type() {
            if (Chat) {
                return this.types.chat;
            } else if (Stack) {
                if (Stack.options.site.isMetaSite) {
                    return this.types.meta;
                } else {
                    // check if site is in beta or graduated
                    if ($('.beta-title').length > 0) {
                        return this.types.beta;
                    } else {
                        return this.types.main;
                    }
                }
            }
        },
        url: location.hostname,
        href: location.href,
        apiParameter: function(siteName) {
            if(commonInfo.apiParameters.hasOwnProperty(siteName)){
              return commonInfo.apiParameters[siteName];
            }
        },
        icon: undefined // TODO wire this up
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
        },
        match: function(pattern) { //commented version @ https://jsfiddle.net/shub01/t90kx2dv/
            var currentSiteScheme = location.protocol,
                currentSiteHost = location.hostname,
                currentSitePath = location.pathname,
                matchSplit = pattern.split('/'),
                matchScheme = matchSplit[0],
                matchHost = matchSplit[2],
                matchPath = matchSplit.slice(matchSplit.length == 4 ? -1 : -2).join('/');

            matchScheme = matchScheme.replace(/\*/g, ".*");
            matchHost = matchHost.replace(/\./g, "\\.").replace(/\*\\\./g, ".*.?").replace(/\\\.\*/g, ".*").replace(/\*$/g, ".*");;
            matchPath = matchPath.replace(/\//g, "\\/").replace(/\*/g, ".*");

            if (currentSiteScheme.match(new RegExp(matchScheme))
            && currentSiteHost.match(new RegExp(matchHost))
            && currentSitePath.match(new RegExp(matchPath))) {
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
                return Chat.RoomUsers.current().reputation;
            } else {
                return Stack ? Stack.options.user.rep : undefined;
            }
        },
        get name() {
            if (sox.site.type == sox.site.types.chat) {
                return Chat.RoomUsers.current().name;
            } else {
                return Stack ? decodeURI(Stack.options.user.profileUrl.split('/')[5]) : undefined;
            }
        },
        get loggedIn() {
            return Stack ? Stack.options.user.isRegistered : undefined;
        },
        hasPrivilege: function(privilege) {
            //TODO: pull privilege from common.info.json file
            /*var privilege = {};
            if (user.loggedIn) {
                var rep = (site.type == beta ? privilege.beta[privilege] : privilege.graduated[privilege]);
                return user.rep > rep;
            }*/
            return false;
        }
    };

})(window.sox = window.sox || {}, jQuery);
