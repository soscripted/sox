(function(sox, $, undefined) {
    'use strict';
    var SOX_SETTINGS = 'SOXSETTINGS';
    var commonInfo = JSON.parse(GM_getResourceText('common'));

    var Stack = (typeof StackExchange === "undefined" ? window.eval('StackExchange') : StackExchange);
    var Chat = (typeof CHAT === "undefined" ? undefined : CHAT);

    sox.info = {
        version: (typeof GM_info !== 'undefined' ? GM_info.script.version : 'unknown'),
        handler: (typeof GM_info !== 'undefined' ? GM_info.scriptHandler : 'unknown'),
        apikey: 'lL1S1jr2m*DRwOvXMPp26g(('
    };

    sox.ready = function(func) {
        $(function() {
            if (Stack) {
                if (Stack.ready) {
                    Stack.ready(func());
                } else {
                    func();
                }
            } else {
                func();
            }
        });
    };

    sox.settings = {
        available: GM_getValue(SOX_SETTINGS, -1) != -1,
        load: function() {
            var settings = GM_getValue(SOX_SETTINGS);
            return settings === undefined ? undefined : JSON.parse(settings);
        },
        save: function(settings) {
            GM_setValue(SOX_SETTINGS, JSON.stringify(settings));
        },
        reset: function() {
            var keys = GM_listValues();
            console.log(keys);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                GM_deleteValue(key);
            }
        },
        get accessToken() {
            console.log('SOX Access Token: ' + (GM_getValue('SOX-accessToken', false) === false ? 'NOT SET' : 'SET'));
            return GM_getValue('SOX-accessToken', false);
        },
        writeToConsole: function() {
            console.log('logging sox stored values --- ');
            var keys = GM_listValues();
            for (i = 0; i < keys.length; i++) {
                var key = keys[i];
                console.log(key, GM_getValue(key));
            }
        }
    };

    sox.helpers = {
        notify: function(message) {
            // eg: sox.helpers.notify('message one', 'message two');
            for (var arg = 0; arg < arguments.length; ++arg) {
                console.log('SOX: ', arguments[arg]);
            }
        },
        getFromAPI: function(type, id, sitename, callback, sortby) {
            console.log('Getting From API with URL: https://api.stackexchange.com/2.2/' + type + '/' + id + '?order=desc&sort=' + (sortby || 'creation') + '&site=' + sitename + '&key=' + sox.info.apikey + '&access_token=' + sox.settings.accessToken);
            $.ajax({
                type: 'get',
                url: 'https://api.stackexchange.com/2.2/' + type + '/' + id + '?order=desc&sort=' + (sortby || 'creation') + '&site=' + sitename + '&key=' + sox.info.apikey + '&access_token=' + sox.settings.accessToken,
                success: function(d) {
                    if(d.backoff) {
                        console.log('SOX Error: BACKOFF: ' + d.backoff);
                    } else {
                        callback(d);
                    }
                },
                error: function(a, b, c) {
                    console.log('SOX Error: ' + b + ' ' + c);
                }
            });
        },
        observe: function(elements, callback, toObserve) {
            console.log('observe: ' + elements);
            new MutationObserver(function(mutations, observer) {
                for (var i = 0; i < mutations.length; i++) {
                    for (var j = 0; j < mutations[i].addedNodes.length; j++) {
                        var $o = $(mutations[i].addedNodes[j]);
                        if ($o && $o.is((Array.isArray(elements) ? elements.join(',') : elements))) {
                            callback(mutations[i].addedNodes[j]);
                            console.log('fire: ' + elements);
                        }
                    }
                }
            }).observe(toObserve || document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });
        },
        newElement: function(type, elementDetails) {
            var extras = {},
                allowed = ['text', 'checkbox', 'radio', 'textarea', 'span'];
            if (allowed.indexOf(type) != -1) {
                if (type == 'text') {
                    type = 'input';
                    extras.type = 'input';
                } else if (type == 'checkbox') {
                    type = 'input';
                    extras.type = 'checkbox';
                } else if (type == 'radio') {
                    type = 'input';
                    extras.type = 'radio';
                } else if (type == 'textarea') {
                    if (!elementDetails.text) {
                        elementDetails.text = elementDetails.value;
                    }
                }

                $.each(elementDetails, function(k, v) {
                    extras[k] = v;
                });
                return $('<' + type + '/>', extras);
            } else {
                return false;
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
        apiParameter: function(siteName) {
            if (commonInfo.apiParameters.hasOwnProperty(siteName)) {
                return commonInfo.apiParameters[siteName];
            }
        },
        metaApiParameter: function(siteName) {
            if (Chat || this.apiParameter(siteName)) {
                return 'meta.' + this.apiParameter(siteName);
            }
        },
        get currentApiParameter() {
            return this.apiParameter(this.name);
        },
        get icon() {
            return "favicon-" + $(".current-site a:not([href*='meta']) .site-icon").attr('class').split('favicon-')[1];
        },
        url: location.hostname,
        href: location.href
    };

    sox.location = {
        // location helpers
        on: function(location) {
            return window.location.href.indexOf(location) > -1 ? true : false;
        },
        get onUserProfile() {
            return this.on('/users/');
        },
        get onQuestion() {
            return this.on('/questions/');
        },
        match: function(pattern, urlToMatchWith) { //commented version @ https://jsfiddle.net/shub01/t90kx2dv/
            var currentSiteScheme, currentSiteHost, currentSitePath;
            if (urlToMatchWith) {
                var split = urlToMatchWith.split('/');
                currentSiteScheme = split[0];
                currentSiteHost = split[2];
                currentSitePath = '/' + split.slice(-(split.length - 3)).join('/');
            } else {
                currentSiteScheme = location.protocol;
                currentSiteHost = location.hostname;
                currentSitePath = location.pathname;
            }

            var matchSplit = pattern.split('/'),
                matchScheme = matchSplit[0],
                matchHost = matchSplit[2],
                matchPath = matchSplit.slice(-(matchSplit.length - 3)).join('/');

            matchScheme = matchScheme.replace(/\*/g, ".*");
            matchHost = matchHost.replace(/\./g, "\\.").replace(/\*\\\./g, ".*.?").replace(/\\\.\*/g, ".*").replace(/\*$/g, ".*");
            matchPath = '^\/' + matchPath.replace(/\//g, "\\/").replace(/\*/g, ".*");

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
                return Chat.RoomUsers.current().reputation;
            } else {
                return Stack ? Stack.options.user.rep : undefined;
            }
        },
        get name() {
            if (sox.site.type == sox.site.types.chat) {
                return Chat.RoomUsers.current().name;
            } else {
                return Stack && this.loggedIn ? decodeURI(Stack.options.user.profileUrl.split('/')[5]) : undefined;
            }
        },
        get loggedIn() {
            return Stack ? Stack.options.user.isRegistered : undefined;
        },
        hasPrivilege: function(privilege) {
            if (this.loggedIn) {
                var rep = (sox.site.type == 'beta' ? commonInfo.privileges.beta[privilege] : commonInfo.privileges.graduated[privilege]);
                return this.rep > rep;
            }
            return false;
        }
    };

})(window.sox = window.sox || {}, jQuery);
