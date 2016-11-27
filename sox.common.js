(function(sox, $, undefined) {
    'use strict';
    var SOX_SETTINGS = 'SOXSETTINGS';
    var commonInfo = JSON.parse(GM_getResourceText('common'));

    sox.info = {
        version: (typeof GM_info !== 'undefined' ? GM_info.script.version : 'unknown'),
        handler: (typeof GM_info !== 'undefined' ? GM_info.scriptHandler : 'unknown'),
        apikey: 'lL1S1jr2m*DRwOvXMPp26g((',
        debugging: GM_getValue('SOX-debug', false)
    };

    sox.debug = function() {
        if(!sox.info.debugging) return;
        for (var arg = 0; arg < arguments.length; ++arg) {
            console.debug('SOX: ', arguments[arg]);
        }
    };

    sox.log = function() {
        for (var arg = 0; arg < arguments.length; ++arg) {
            console.log('SOX: ', arguments[arg]);
        }
    };

    sox.warn = function() {
        for (var arg = 0; arg < arguments.length; ++arg) {
            console.warn('SOX: ', arguments[arg]);
        }
    };

    sox.error = function() {
        for (var arg = 0; arg < arguments.length; ++arg) {
            console.error('SOX: ', arguments[arg]);
        }
    };

    sox.loginfo = function() {
        for (var arg = 0; arg < arguments.length; ++arg) {
            console.info('SOX: ', arguments[arg]);
        }
    };

    //var Stack = (typeof StackExchange === "undefined" ? window.eval('if (typeof StackExchange != "undefined") StackExchange') : StackExchange) | undefined;
    var Chat = (typeof CHAT === "undefined" ? window.eval("typeof CHAT != 'undefined' ? CHAT : undefined") : CHAT);
    sox.debug(Chat);
    var Stack = (typeof Chat === "undefined" ? (typeof StackExchange === "undefined" ? window.eval('if (typeof StackExchange != "undefined") StackExchange') : StackExchange) : undefined);
    sox.debug(Stack);

    sox.exists = function(path) {
        if(!Stack) return false;
        var toCheck = path.split('.'),
            cont = true,
            o = Stack,
            i;
        for (i = 0; i < toCheck.length; i++) {
            if (!cont) return false;
            if (!(toCheck[i] in o)) cont = false;
            o = o[toCheck[i]];
        }
        return cont;
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
            sox.debug(keys);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                GM_deleteValue(key);
            }
        },
        get accessToken() {
            sox.debug('SOX Access Token: ' + (GM_getValue('SOX-accessToken', false) === false ? 'NOT SET' : 'SET'));
            return GM_getValue('SOX-accessToken', false);
        },
        writeToConsole: function(hideAccessToken) {
            sox.loginfo('logging sox stored values --- ');
            var keys = GM_listValues();
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if(hideAccessToken && key == 'SOX-accessToken') {
                    sox.loginfo('access token set');
                } else {
                    sox.loginfo(key, GM_getValue(key));
                }
            }
        }
    };

    sox.helpers = {
        getFromAPI: function(type, id, sitename, callback, sortby, asyncYesNo) {
            sox.debug('Getting From API with URL: https://api.stackexchange.com/2.2/' + type + '/' + id + '?order=desc&sort=' + (sortby || 'creation') + '&site=' + sitename + '&key=' + sox.info.apikey + '&access_token=' + sox.settings.accessToken);
            $.ajax({
                type: 'get',
                async: (typeof asyncYesNo === 'undefined' ? true : false),
                url: 'https://api.stackexchange.com/2.2/' + type + '/' + id + '?order=desc&sort=' + (sortby || 'creation') + '&site=' + sitename + '&key=' + sox.info.apikey + '&access_token=' + sox.settings.accessToken,
                success: function(d) {
                    if (d.backoff) {
                        sox.error('SOX Error: BACKOFF: ' + d.backoff);
                    } else {
                        callback(d);
                    }
                },
                error: function(a, b, c) {
                    sox.error('SOX Error: ' + b + ' ' + c);
                }
            });
        },
        observe: function(elements, callback, toObserve) {
            sox.debug('observe: ' + elements);
            sox.debug(toObserve);
            var observer = new MutationObserver(function(mutations, observer) {
                for (var i = 0; i < mutations.length; i++) {
                    for (var a = 0; a < mutations[i].addedNodes.length; a++) {
                        var $a = $(mutations[i].addedNodes[a]);
                        if ($a && $a.is((Array.isArray(elements) ? elements.join(',') : elements))) {
                            callback(mutations[i].addedNodes[a]);
                            sox.debug('fire (added): ' + elements);
                        }
                    }
                    for (var r = 0; r < mutations[i].removedNodes.length; r++) {
                        var $r = $(mutations[i].removedNodes[r]);
                        if ($r && $r.is((Array.isArray(elements) ? elements.join(',') : elements))) {
                            callback(mutations[i].addedNodes[r]);
                            sox.debug('fire (removed): ' + elements);
                        }
                    }
                }
            });
            if (toObserve) {
                for (var i = 0; i < toObserve.length; i++) { //could be multiple elements with querySelectorAll
                    observer.observe(toObserve[i], {
                        attributes: true,
                        childList: true,
                        characterData: true,
                        subtree: true
                    });
                }
            } else {
                observer.observe(document.body, {
                    attributes: true,
                    childList: true,
                    characterData: true,
                    subtree: true
                });
            }
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
        id: (sox.exists('options.site.id') ? Stack.options.site.id : undefined),
        get name() {
            if (Chat) {
                return $('#footer-logo a').attr('title');
            } else if (sox.exists('options.site.name')) {
                return Stack.options.site.name;
            }
            return undefined;
        },

        get type() {
            if (Chat) {
                return this.types.chat;
            } else if (Stack) {
                if (sox.exists('options.site') && Stack.options.site.isMetaSite) {
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
            } else if(sox.location.on('area51')) {
                return 'area51';
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
        matchWithPattern: function(pattern, urlToMatchWith) { //commented version @ https://jsfiddle.net/shub01/t90kx2dv/
            if(pattern == 'SE1.0') { //SE.com && Area51.SE.com special checking
                if(urlToMatchWith) {
                    if(urlToMatchWith.match(/https?:\/\/stackexchange\.com\/?/) || sox.location.matchWithPattern('*://area51.stackexchange.com/*')) return true;
                } else {
                    if(location.href.match(/https?:\/\/stackexchange\.com\/?/) || sox.location.matchWithPattern('*://area51.stackexchange.com/*')) return true;
                }
                return false;
            }
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
                return sox.exists('options.user.userId') ? Stack.options.user.userId : undefined;
            }
        },
        get rep() {
            if (sox.site.type == sox.site.types.chat) {
                return Chat.RoomUsers.current().reputation;
            } else {
                return sox.exists('options.user.rep') ? Stack.options.user.rep : undefined;
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
            return sox.exists('options.user.isRegistered') ? Stack.options.user.isRegistered : undefined;
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
