(function(sox, $, undefined) {
    'use strict';

    var StackExchange = window.StackExchange ? window.StackExchange : undefined;
    var Chat = window.CHAT ? window.CHAT : undefined;

    sox.ready = function(func) {
        console.log('sox.ready');

        return StackExchange ? StackExchange.ready(func) : func();
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
        hasPrivelage: function() {

        }
    };

    sox.site = {
        id: StackExchange ? StackExchange.options.site.id : undefined,
        name: StackExchange ? StackExchange.options.site.name : undefined,
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
        url: undefined,
        apiParam: undefined,
        icon: undefined

    };

})(window.sox = window.sox || {}, jQuery);
