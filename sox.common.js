(function(sox, $, undefined) {
    'use strict';

    var StackExchange = window.StackExchange ? window.StackExchange : undefined;
    var Chat = window.CHAT ? window.CHAT : undefined;

    sox.ready = function(func) {
        $(function() {
            return StackExchange ? StackExchange.ready(func) : func();
        });
    };

    sox.helpers = {
        // eg: sox.helpers.notify('message one', 'message two');
        notify: function(message) {
            for (var arg = 0; arg < arguments.length; ++arg) {
                console.log('sox:', arguments[arg]);
            }
        }
    };

    sox.user = {
        get id() {
            if (sox.site.type == sox.site.types.chat) {
                return Chat ? Chat.RoomUsers.current().id : undefined;
            } else {
                return StackExchange ? StackExchange.options.user.id : undefined;
            }
        },
        get rep() {
            if (sox.site.type == sox.site.types.chat) {
                return Chat ? Chat.RoomUsers.current().reputation : undefined;
            } else {
                return StackExchange ? StackExchange.options.user.rep : undefined;
            }
        },
        get name() {
            if (sox.site.type == sox.site.types.chat) {
                return Chat ? Chat.RoomUsers.current().name : undefined;
            } else {
                return StackExchange ? decodeURI(StackExchange.options.user.profileUrl.split('/')[5]) : undefined;
            }
        },
        get loggedIn() {
            return StackExchange ? StackExchange.options.user.isRegistered : undefined;
        },
        hasPrivelage: function(privelage) {
            var privelages = {}; // load from so.json file
            if (user.loggedIn) {
                var rep = site.type == beta ? privelages.beta[privelage] : privelages.graduated[privelage];
                return user.rep > rep;
            }
            return false;
        }
    };

    sox.site = {
        id: StackExchange ? StackExchange.options.site.id : undefined,
        get name() {
            if (Chat) {
                $('#footer-logo a').attr('title')
            } else if (StackExchange) {
                StackExchange.options.site.name
            }
            return undefined;
        },
        get type() {
            if (Chat) {
                return sox.site.types.chat;
            } else if (StackExchange) {
                if (StackExchange.options.site.isMetaSite) {
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
        types: {
            main: 'main',
            meta: 'meta',
            chat: 'chat',
            beta: 'beta'
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
            return this.on('/users');
        },
        get onQuestion() {
            return this.on('/questions');
        }
    };

})(window.sox = window.sox || {}, jQuery);
