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
        },
        get soxAccessToken() {
            return GM_getValue('SOX-accessToken', false);
        },
        soxApiKey: 'lL1S1jr2m*DRwOvXMPp26g((',
        getFromAPI: function(type, id, sitename, callback, sortby) {
          $.getJSON('https://api.stackexchange.com/2.2/' + type + '/' + id + '?order=desc&sort=' + (sortby || 'creation') + '&site=' + sitename, callback);
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
        get apiSiteName() {
            if (Chat || Stack) {
                return this.apiParameter(this.name);
            }
        },
        get metaApiSiteName() {
            if (Chat || Stack) {
                return 'meta.' + this.apiSiteName;
            }
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
            if(commonInfo.apiParameters.hasOwnProperty(siteName)){
              return commonInfo.apiParameters[siteName];
            }
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
        match: function(pattern) { //commented version @ https://jsfiddle.net/shub01/t90kx2dv/
          var currentSiteScheme = location.protocol,
              currentSiteHost = location.hostname,
              currentSitePath = location.pathname,
              matchSplit = pattern.split('/'),
              matchScheme = matchSplit[0],
              matchHost = matchSplit[2],
              matchPath = matchSplit.slice(-(matchSplit.length-3)).join('/');

          matchScheme = matchScheme.replace(/\*/g, ".*");
          matchHost = matchHost.replace(/\./g, "\\.").replace(/\*\\\./g, ".*.?").replace(/\\\.\*/g, ".*").replace(/\*$/g, ".*");;
          matchPath = '^\/' + matchPath.replace(/\//g, "\\/").replace(/\*/g, ".*");
          console.log(matchScheme, matchHost, matchPath)

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
            var privilege = {};
            if (user.loggedIn) {
                var rep = (sox.site.type == 'beta' ? commonInfo.privileges.beta[privilege] : commonInfo.privileges.graduated[privilege]);
                return user.rep > rep;
            }
            return false;
        }
    };

})(window.sox = window.sox || {}, jQuery);
