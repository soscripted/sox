(function(sox, $) {
  'use strict';
  const SOX_SETTINGS = 'SOXSETTINGS';
  const commonInfo = JSON.parse(GM_getResourceText('common'));
  const lastVersionInstalled = GM_getValue('SOX-lastVersionInstalled');

  sox.info = {
    version: (typeof GM_info !== 'undefined' ? GM_info.script.version : 'unknown'),
    handler: (typeof GM_info !== 'undefined' ? GM_info.scriptHandler : 'unknown'),
    apikey: 'lL1S1jr2m*DRwOvXMPp26g((',
    debugging: GM_getValue('SOX-debug', false),
    lastVersionInstalled: lastVersionInstalled,
  };

  sox.NEW_TOPBAR = location.href.indexOf('area51') === -1;

  sox.debug = function() {
    if (!sox.info.debugging) return;
    for (let arg = 0; arg < arguments.length; ++arg) {
      console.debug('SOX: ', arguments[arg]);
    }
  };

  sox.log = function() {
    for (let arg = 0; arg < arguments.length; ++arg) {
      console.log('SOX: ', arguments[arg]);
    }
  };

  sox.warn = function() {
    for (let arg = 0; arg < arguments.length; ++arg) {
      console.warn('SOX: ', arguments[arg]);
    }
  };

  sox.error = function() {
    for (let arg = 0; arg < arguments.length; ++arg) {
      console.error('SOX: ', arguments[arg]);
    }
  };

  sox.loginfo = function() {
    for (let arg = 0; arg < arguments.length; ++arg) {
      console.info('SOX: ', arguments[arg]);
    }
  };

  let Chat;
  let Stack;
  if (location.href.indexOf('github.com') === -1) { //need this so it works on FF -- CSP blocks window.eval() it seems
    Chat = (typeof window.CHAT === 'undefined' ? window.eval('typeof CHAT != \'undefined\' ? CHAT : undefined') : CHAT);
    Stack = (typeof Chat === 'undefined' ? (typeof StackExchange === 'undefined' ? window.eval('if (typeof StackExchange != "undefined") StackExchange') : (StackExchange || window.StackExchange)) : undefined);
  }

  sox.Stack = Stack;

  sox.exists = function(path) {
    if (!Stack) return false;
    const toCheck = path.split('.');

    let cont = true;
    let o = Stack;
    let i;

    for (i = 0; i < toCheck.length; i++) {
      if (!cont) return false;
      if (!(toCheck[i] in o)) cont = false;
      o = o[toCheck[i]];
    }
    return cont;
  };

  sox.ready = function(func) {
    $(() => {
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
      const settings = GM_getValue(SOX_SETTINGS);
      return settings === undefined ? undefined : JSON.parse(settings);
    },
    save: function(settings) {
      GM_setValue(SOX_SETTINGS, typeof settings === 'string' ? settings : JSON.stringify(settings)); //if importing, it will already be a string so don't stringify the string!
    },
    reset: function() {
      const keys = GM_listValues();
      sox.debug(keys);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        GM_deleteValue(key);
      }
    },
    get accessToken() {
      const accessToken = GM_getValue('SOX-accessToken', false);
      return (accessToken == -2 ? false : accessToken); //if the user was already asked once, the value is set to -2, so make sure this is returned as false
    },
    writeToConsole: function(hideAccessToken) {
      sox.loginfo('logging sox stored values --- ');
      const keys = GM_listValues();
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (hideAccessToken && key == 'SOX-accessToken') {
          sox.loginfo('access token set');
        } else {
          sox.loginfo(key, GM_getValue(key));
        }
      }
    },
  };

  function throttle(fn, countMax, time) {
    let counter = 0;

    setInterval(() => {
      counter = 0;
    }, time);

    return function() {
      if (counter < countMax) {
        counter++;
        fn.apply(this, arguments);
      }
    };
  }

  sox.helpers = {
    getFromAPI: function(details, callback) {
      let { ids } = details;
      const {
        endpoint,
        childEndpoint,
        sort = 'creation',
        order = 'desc',
        sitename,
        filter,
        limit,
      } = details;
      const baseURL = 'https://api.stackexchange.com/2.2/';
      const queryParams = [];

      if (filter) queryParams.push(`filter=${filter}`);
      if (order) queryParams.push(`order=${order}`);
      if (limit) queryParams.push(`pagesize=${limit}`);
      queryParams.push(`sort=${sort}`);
      queryParams.push(`site=${sitename}`);
      queryParams.push(`key=${sox.info.apikey}`);
      queryParams.push(`access_token=${sox.settings.accessToken}`);
      const queryString = queryParams.join('&');

      // IDs are optional for endpoints like /questions
      if (ids && Array.isArray(ids)) ids = ids.join(';');
      const idPath = ids ? `/${ids}` : '';
      let queryURL;
      if (childEndpoint) {
        // e.g. /posts/{ids}/revisions
        queryURL = `${baseURL}${endpoint}${idPath}/${childEndpoint}?${queryString}`;
      } else {
        // e.g. /questions/{ids}
        queryURL = `${baseURL}${endpoint}${idPath}?${queryString}`;
      }
      sox.debug('Getting From API with URL', queryURL);

      $.ajax({
        type: 'get',
        url: queryURL,
        success: function(d) {
          if (d.backoff) {
            sox.error('SOX Error: BACKOFF: ' + d.backoff);
          } else if (d.error_id == 502) {
            sox.error('THROTTLE VIOLATION', d);
          } else if (d.error_id == 403) {
            sox.warn('Access token invalid! Opening window to get new one');
            window.open('https://stackexchange.com/oauth/dialog?client_id=7138&scope=no_expiry&redirect_uri=http://soscripted.github.io/sox/');
            alert('Your access token is no longer valid. A window has been opened to request a new one.');
          } else {
            callback(d);
          }
        },
        error: function(a, b, c) {
          sox.error('SOX Error: ' + b + ' ' + c);
        },
      });
    },
    observe: function(elements, callback, toObserve) {
      sox.debug('observe: ' + elements);
      const observer = new MutationObserver(throttle(mutations => {
        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          const target = mutation.target;
          const addedNodes = mutation.addedNodes;

          if (addedNodes) {
            for (let n = 0; n < addedNodes.length; n++) {
              if ($(addedNodes[n]).find(elements).length) {
                callback(target);
                sox.debug('fire: node: ', addedNodes[n]);
                return;
              }
            }
          }

          if ($(target).is(elements)) { //TODO: maybe add OR to find subelements for childList events?
            callback(target);
            sox.debug('fire: target: ', target);
            return;
          }
        }
      }, 250));

      if (toObserve) {
        for (let i = 0; i < toObserve.length; i++) { //could be multiple elements with querySelectorAll
          observer.observe(toObserve[i], {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true,
          });
        }
      } else {
        observer.observe(document.body, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
        });
      }
    },
    newElement: function(type, elementDetails) {
      const extras = {};
      const allowed = ['text', 'checkbox', 'radio', 'textarea', 'span'];

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

        $.each(elementDetails, (k, v) => {
          extras[k] = v;
        });
        return $('<' + type + '/>', extras);
      } else {
        return false;
      }
    },
    getIDFromAnchor: function(anchor) {
      return anchor.href ? sox.helpers.getIDFromLink(anchor.href) : null;
    },
    getSiteNameFromAnchor: function(anchor) {
      return anchor.href ? sox.helpers.getSiteNameFromLink(anchor.href) : null;
    },
    // answer ID, question ID, user ID, comment ID ("posts/comments/ID" NOT "comment1545_5566")
    getIDFromLink: function(link) {
      // test cases: https://regex101.com/r/6P9sDX/2
      const idMatch = link.match(/\/(\d+)($|\/|\?)/);
      return idMatch ? +idMatch[1] : null;
    },
    getSiteNameFromLink: function(link) {
      const siteRegex = /(((.+)\.)?(stackexchange|stackoverflow|superuser|serverfault|askubuntu|stackapps|mathoverflow|programmers|bitcoin))\.com/;
      const siteMatch = link.replace(/https?:\/\//, '').match(siteRegex);
      return siteMatch ? siteMatch[1] : null;
    },
    createModal: function (params) {
      const $dialog = $('<aside/>', {
        'class': 's-modal js-modal-overlay js-modal-close js-stacks-managed-popup js-fades-with-aria-hidden sox-custom-dialog',
        'role': 'dialog',
        'aria-hidden': false,
      });
      if (params.css) $dialog.css(params.css);
      if (params.id) $dialog.attr('id', params.id);
      const $dialogInnerContainer = $('<div/>', {
        'class': 's-modal--dialog js-modal-dialog ',
        'style': 'min-width: 568px;',// top: 227.736px; left: 312.653px;',
      });
      const $header = $('<h1/>', {
        'class': 's-modal--header fs-headline1 fw-bold mr48 js-first-tabbable',
        'text': params.header,
      });
      const $mainContent = $('<div/>', {
        'class': 's-modal--body sox-custom-dialog-content',
      });
      if (params.html) $mainContent.html(params.html);
      const $closeButton = $('<button/>', {
        'class': 's-modal--close s-btn s-btn__muted js-modal-close js-last-tabbable',
        'click': () => $('.sox-custom-dialog').remove(),
      }).append($('<svg aria-hidden="true" class="svg-icon m0 iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41L10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7z"></path></svg>'));

      $dialogInnerContainer.append($header).append($mainContent).append($closeButton);
      $dialog.append($dialogInnerContainer);

      return $dialog;
    },
    addButtonToHelpMenu: function (params) {
      const $li = $('<li/>');
      const $a = $('<a/>', {
        'href': 'javascript:void(0)',
        'id': params.id,
        'text': `SOX: ${params.linkText}`,
      });
      const $span = $('<span/>', {
        'class': 'item-summary',
        'text': params.summary,
      });
      $li.on('click', params.click);
      $li.append($a.append($span));
      $('.topbar-dialog.help-dialog.js-help-dialog > .modal-content ul').append($li);
    },
  };

  sox.site = {
    types: {
      main: 'main',
      meta: 'meta',
      chat: 'chat',
      beta: 'beta',
    },
    id: (sox.exists('options.site.id') ? Stack.options.site.id : undefined),
    currentApiParameter: sox.helpers.getSiteNameFromLink(location.href),
    get name() {
      if (Chat) {
        return $('#footer-logo a').attr('title');
      } else { //using StackExchange object doesn't give correct name (eg. `Biology` is called `Biology Stack Exchange` in the object)
        return $('.js-topbar-dialog-corral .modal-content.current-site-container .current-site-link div').attr('title');
      }
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
      return null;
    },
    get icon() {
      return 'favicon-' + $('.current-site a:not([href*=\'meta\']) .site-icon').attr('class').split('favicon-')[1];
    },
    url: location.hostname, //e.g. "meta.stackexchange.com"
    href: location.href, //e.g. "https://meta.stackexchange.com/questions/blah/blah"
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
      if (pattern == 'SE1.0') { //SE.com && Area51.SE.com special checking
        if (urlToMatchWith) {
          if (urlToMatchWith.match(/https?:\/\/stackexchange\.com\/?/) || (sox.location.matchWithPattern('*://area51.stackexchange.com/*') && sox.site.href.indexOf('.meta.') === -1)) return true;
        } else {
          if (location.href.match(/https?:\/\/stackexchange\.com\/?/) || (sox.location.matchWithPattern('*://area51.stackexchange.com/*') && sox.site.href.indexOf('.meta.') === -1)) return true;
        }
        return false;
      }
      let currentSiteScheme; let currentSiteHost; let currentSitePath;
      if (urlToMatchWith) {
        const split = urlToMatchWith.split('/');
        currentSiteScheme = split[0];
        currentSiteHost = split[2];
        currentSitePath = '/' + split.slice(-(split.length - 3)).join('/');
      } else {
        currentSiteScheme = location.protocol;
        currentSiteHost = location.hostname;
        currentSitePath = location.pathname;
      }

      const matchSplit = pattern.split('/');
      let matchScheme = matchSplit[0];
      let matchHost = matchSplit[2];
      let matchPath = matchSplit.slice(-(matchSplit.length - 3)).join('/');

      matchScheme = matchScheme.replace(/\*/g, '.*');
      matchHost = matchHost.replace(/\./g, '\\.').replace(/\*\\\./g, '.*.?').replace(/\\\.\*/g, '.*').replace(/\*$/g, '.*');
      matchPath = '^/' + matchPath.replace(/\//g, '\\/').replace(/\*/g, '.*');

      if (currentSiteScheme.match(new RegExp(matchScheme)) && currentSiteHost.match(new RegExp(matchHost)) && currentSitePath.match(new RegExp(matchPath))) {
        return true;
      }
      return false;
    },
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
        const $uname = $('.top-bar div.gravatar-wrapper-24'); //used to be $('body > div.topbar > div > div.topbar-links > a > div.gravatar-wrapper-24');
        return ($uname.length ? $uname.attr('title') : false);
      }
    },
    get loggedIn() {
      return sox.exists('options.user.isRegistered') ? Stack.options.user.isRegistered : undefined;
    },
    hasPrivilege: function(privilege) {
      if (this.loggedIn) {
        const rep = (sox.site.type == 'beta' ? commonInfo.privileges.beta[privilege] : commonInfo.privileges.graduated[privilege]);
        return this.rep > rep;
      }
      return false;
    },
  };

})(window.sox = window.sox || {}, jQuery);
