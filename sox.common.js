/* globals CHAT, StackExchange, jQuery */
(function(sox, $) {
  'use strict';
  const SOX_SETTINGS = 'SOXSETTINGS';
  const commonInfo = JSON.parse(GM_getResourceText('common'));
  const lastVersionInstalled = GM_getValue('SOX-lastVersionInstalled');
  var hookAjaxObject = {};

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
      console.debug('SOX:', arguments[arg]);
    }
  };

  sox.log = function() {
    for (let arg = 0; arg < arguments.length; ++arg) {
      console.log('SOX:', arguments[arg]);
    }
  };

  sox.warn = function() {
    for (let arg = 0; arg < arguments.length; ++arg) {
      console.warn('SOX:', arguments[arg]);
    }
  };

  sox.error = function() {
    for (let arg = 0; arg < arguments.length; ++arg) {
      console.error('SOX:', arguments[arg]);
    }
  };

  sox.loginfo = function() {
    for (let arg = 0; arg < arguments.length; ++arg) {
      console.info('SOX:', arguments[arg]);
    }
  };

  let Chat;
  let Stack;
  if (location.href.indexOf('github.com') === -1) { //need this so it works on FF -- CSP blocks window.eval() it seems
    Chat = (typeof window.CHAT === 'undefined' ? window.eval('typeof CHAT != \'undefined\' ? CHAT : undefined') : CHAT);
    Stack = (typeof Chat === 'undefined'
             ? (typeof StackExchange === 'undefined'
                ? window.eval('if (typeof StackExchange != "undefined") StackExchange')
                : (StackExchange || window.StackExchange))
             : undefined);
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
      // If importing, it will already be a string so there's no need to stringify it
      GM_setValue(SOX_SETTINGS, typeof settings === 'string' ? settings : JSON.stringify(settings));
    },
    reset: function() {
      const keys = GM_listValues();
      sox.debug(keys);
      keys.forEach(key => GM_deleteValue(key));
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

  sox.sprites = {
    getSvg: function (name, tooltip, css) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');

      if (tooltip) {
        svg.setAttribute('title', tooltip);
        title.textContent = tooltip;
        svg.appendChild(title);
      }

      use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#sox_${name}`);
      svg.appendChild(use);

      svg.classList.add('sox-sprite');
      svg.classList.add(`sox-sprite-${name}`);
      return svg;
    },
  };

  sox.helpers = {
    getFromAPI: function (details, callback) {
      let {
        ids,
        useCache = true,
      } = details;

      const {
        endpoint,
        childEndpoint,
        sort = 'creation',
        order = 'desc',
        sitename,
        filter,
        limit,
        page,
        featureId,
        cacheDuration = 3, // Minutes to cache data for
      } = details;
      const baseURL = 'https://api.stackexchange.com/2.2/';
      const queryParams = [];

      // Cache can only be used if the featureId and IDs (as an array) have been provided
      useCache = featureId && useCache && Array.isArray(ids);
      const apiCache = JSON.parse(GM_getValue('SOX-apiCache', '{}'));

      if (!(featureId in apiCache)) apiCache[featureId] = {};
      const featureCache = apiCache[featureId];

      if (!(endpoint in featureCache)) featureCache[endpoint] = [];
      const endpointCache = featureCache[endpoint];

      const endpointToIdFieldNames = {
        'questions': 'question_id',
        'answers': 'answer_id',
        'users': 'user_id',
        'comments': 'comment_id',
      };

      if (filter) queryParams.push(`filter=${filter}`);
      if (order) queryParams.push(`order=${order}`);
      if (limit) queryParams.push(`pagesize=${limit}`);
      if (page) queryParams.push(`page=${page}`);
      queryParams.push(`sort=${sort}`);
      queryParams.push(`site=${sitename}`);
      queryParams.push(`key=${sox.info.apikey}`);
      queryParams.push(`access_token=${sox.settings.accessToken}`);
      const queryString = queryParams.join('&');

      let finalItems = [];
      if (useCache) {
        // Count backwards so splicing doesn't change indices
        for (let i = ids.length; i >= 0; i--) {
          const cachedItemIndex = endpointCache.findIndex(item => {
            const idFieldName = endpointToIdFieldNames[endpoint];
            return item[idFieldName] === +ids[i];
          });

          // Cache results for max. cacheDuraction minutes (convert to milliseconds)
          const earliestRequestTime = new Date().getTime() - (60 * cacheDuration * 1000);
          if (cachedItemIndex !== -1) {
            const cachedItem = endpointCache[cachedItemIndex];
            if (cachedItem.sox_request_time >= earliestRequestTime) {
              // If we have a cached item for this ID, delete it from `ids` so we don't request the API for it
              sox.debug(`API: [${featureId}:/${endpoint}/${ids[i]}] Using cached API item`);
              finalItems.push(cachedItem);
              ids.splice(i, 1);
            } else {
              // The cached item is now stale (too old); delete it
              sox.debug(`API: [${featureId}:/${endpoint}/${ids[i]}] Deleting stale cached item`);
              endpointCache.splice(cachedItemIndex, 1);
            }
          }
        }
      }

      // IDs are optional for endpoints like /questions
      if (ids && Array.isArray(ids)) {
        if (ids.length) {
          ids = ids.join(';');
        } else if (useCache) {
          // The cache had details for all IDs; no need to request API at all
          sox.debug(`API: [${featureId}:/${endpoint}] API Cache had details for all requested IDs, skipping API request`);
          GM_setValue('SOX-apiCache', JSON.stringify(apiCache));
          sox.debug('API: Saving new cache', apiCache);
          callback(finalItems);
          return;
        }
      }

      const idPath = ids ? `/${ids}` : '';
      let queryURL;
      if (childEndpoint) {
        // e.g. /posts/{ids}/revisions
        queryURL = `${baseURL}${endpoint}${idPath}/${childEndpoint}?${queryString}`;
      } else {
        // e.g. /questions/{ids}
        queryURL = `${baseURL}${endpoint}${idPath}?${queryString}`;
      }
      sox.debug(`API: Sending request to URL: '${queryURL}'`);

      fetch(queryURL).then(apiResponse => apiResponse.json()).then(responseJson => {
        if (responseJson.backoff) {
          sox.error('SOX Error: BACKOFF: ' + responseJson.backoff);
        } else if (responseJson.error_id == 502) {
          sox.error('THROTTLE VIOLATION', responseJson);
        } else if (responseJson.error_id == 403) {
          sox.warn('Access token invalid! Opening window to get new one');
          window.open('https://stackexchange.com/oauth/dialog?client_id=7138&scope=no_expiry&redirect_uri=http://soscripted.github.io/sox/');
          alert('Your access token is no longer valid. A window has been opened to request a new one.');
        } else {
          if (useCache) {
            responseJson.items.forEach(item => {
              item.sox_request_time = new Date().getTime();
              finalItems.push(item);
              endpointCache.push(item);
            });
            GM_setValue('SOX-apiCache', JSON.stringify(apiCache));
            sox.debug('API: saving new cache', apiCache);
          } else {
            finalItems = responseJson.items;
          }
          callback(finalItems);
        }
      });
    },
    observe: function (targets, elements, callback) {
      sox.debug(`OBSERVE: '${elements}' on target(s)`, targets);
      if (!targets || (Array.isArray(targets) && !targets.length)) return;

      const observer = new MutationObserver(throttle(mutations => {
        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          const target = mutation.target;
          const addedNodes = mutation.addedNodes;

          if (addedNodes) {
            for (let n = 0; n < addedNodes.length; n++) {
              if ($(addedNodes[n]).find(elements).length) {
                sox.debug('fire: node: ', addedNodes[n]);
                callback(target);
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
      }, 1500));

      if (Array.isArray(targets)) {
        for (let i = 0; i < targets.length; i++) {
          const target = targets[i];
          if (!target) continue;

          observer.observe(target, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true,
          });
        }
      } else {
        observer.observe(targets, {
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
      const idMatch = link.match(/\/(\d+)/);
      return idMatch ? +idMatch[1] : null;
    },
    getSiteNameFromLink: function(link) {
      const siteRegex = /(((.+)\.)?(((stackexchange|stackoverflow|superuser|serverfault|askubuntu|stackapps))(?=\.com))|mathoverflow\.net)/;
      const siteMatch = link.replace(/https?:\/\//, '').match(siteRegex);
      return siteMatch ? siteMatch[1] : null;
    },
    createModal: function (params) {
      const closeButtonSvg = `<svg aria-hidden="true" class="svg-icon m0 iconClearSm" width="14" height="14" viewBox="0 0 14 14">
                                <path d="M12 3.41L10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7z"></path>
                              </svg>`;

      const dialog = document.createElement('aside');
      dialog.className = 's-modal js-modal-overlay js-modal-close js-stacks-managed-popup js-fades-with-aria-hidden sox-custom-dialog';
      dialog.role = 'dialog';
      dialog.ariaHidden = false;
      if (params.id) dialog.id = params.id;

      const dialogInnerContainer = document.createElement('div');
      dialogInnerContainer.className = 's-modal--dialog js-modal-dialog';
      dialogInnerContainer.style.minWidth = '568px'; // top: 227.736px; left: 312.653px;

      // if (params.css) $dialog.css(params.css)
      // if (params.css) $dialogInnerContainer.css(params.css);

      const header = document.createElement('h1');
      header.className = 's-modal--header fs-headline1 fw-bold mr48 js-first-tabbable sox-custom-dialog-header';
      header.innerHTML = params.header;
      const mainContent = document.createElement('div');
      mainContent.className = 's-modal--body sox-custom-dialog-content';
      if (params.html) mainContent.innerHTML = params.html;

      const closeButton = document.createElement('button');
      closeButton.className = 's-modal--close s-btn s-btn__muted js-modal-close js-last-tabbable';
      closeButton.onclick = () => document.querySelector('.sox-custom-dialog').remove();
      closeButton.insertAdjacentHTML('beforeend', closeButtonSvg);

      dialogInnerContainer.appendChild(header);
      dialogInnerContainer.appendChild(mainContent);
      dialogInnerContainer.appendChild(closeButton);
      dialog.appendChild(dialogInnerContainer);

      return dialog;
    },
    addButtonToHelpMenu: function (params) {
      const liElement = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.href = 'javascript:void(0)';
      anchor.id = params.id;
      anchor.innerText = `SOX: ${params.linkText}`;
      const span = document.createElement('span');
      span.className = 'item-summary';
      span.innerText = params.summary;

      liElement.addEventListener('click', params.click);
      anchor.appendChild(span);
      liElement.appendChild(anchor);
      document.querySelector('.topbar-dialog.help-dialog.js-help-dialog .modal-content ul').appendChild(liElement);
    },
    surroundSelectedText: function(textarea, start, end) {
      // same wrapper code on either side (`$...$`)
      if (typeof end === 'undefined') end = start;

      /*--- Expected behavior:
        When there is some text selected: (unwrap it if already wrapped)
        "]text["         --> "**]text[**"
        "**]text[**"     --> "]text["
        "]**text**["     --> "**]**text**[**"
        "**]**text**[**" --> "]**text**["
        When there is no text selected:
        "]["             --> "**placeholder text**"
        "**][**"         --> ""
        Note that `]` and `[` denote the selected text here.
    */

      const selS = textarea.selectionStart < textarea.selectionEnd ? textarea.selectionStart : textarea.selectionEnd;
      const selE = textarea.selectionStart > textarea.selectionEnd ? textarea.selectionStart : textarea.selectionEnd;
      const value = textarea.value;
      const startLen = start.length;
      const endLen = end.length;

      let valBefore = value.substring(0, selS);
      let valMid = value.substring(selS, selE);
      let valAfter = value.substring(selE);
      let generatedWrapper;

      // handle trailing spaces
      const trimmedSelection = valMid.match(/^(\s*)(\S?(?:.|\n|\r)*\S)(\s*)$/) || ['', '', '', ''];

      // determine if text is currently wrapped
      if (valBefore.endsWith(start) && valAfter.startsWith(end)) {
        textarea.value = valBefore.substring(0, valBefore.length - startLen) + valMid + valAfter.substring(endLen);
        textarea.selectionStart = valBefore.length - startLen;
        textarea.selectionEnd = (valBefore + valMid).length - startLen;
        textarea.focus();
      } else {
        valBefore += trimmedSelection[1];
        valAfter = trimmedSelection[3] + valAfter;
        valMid = trimmedSelection[2];

        generatedWrapper = start + valMid + end;

        textarea.value = valBefore + generatedWrapper + valAfter;
        textarea.selectionStart = valBefore.length + start.length;
        textarea.selectionEnd = (valBefore + generatedWrapper).length - end.length;
        textarea.focus();
      }

      sox.Stack.MarkdownEditor.refreshAllPreviews();
    },
    getCssProperty: function(element, propertyValue) {
      return window.getComputedStyle(element).getPropertyValue(propertyValue);
    },
    runAjaxHooks: function() {
      let originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', function() {
          for (const key in hookAjaxObject) {
            if (this.responseURL.match(new RegExp(key))) hookAjaxObject[key](); // if the URL matches the regex, then execute the respective function
          }
        });
        originalOpen.apply(this, arguments);
      }
    },
    addAjaxListener: function(regexToMatch, functionToExecute) {
      if (!regexToMatch) { // all information has been inserted in hookAjaxObject
        sox.helpers.runAjaxHooks();
        return;
      }
      hookAjaxObject[regexToMatch] = functionToExecute;
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
        return document.querySelector('#footer-logo a').title;
      } else { //using StackExchange object doesn't give correct name (eg. `Biology` is called `Biology Stack Exchange` in the object)
        return document.querySelector('.js-topbar-dialog-corral .modal-content.current-site-container .current-site-link div').title;
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
          if (document.querySelector('.beta-title')) {
            return this.types.beta;
          } else {
            return this.types.main;
          }
        }
      }
      return null;
    },
    get icon() {
      return 'favicon-' + document.querySelector('.current-site a:not([href*=\'meta\']) .site-icon').className.split('favicon-')[1];
    },
    url: location.hostname, // e.g. "meta.stackexchange.com"
    href: location.href, // e.g. "https://meta.stackexchange.com/questions/blah/blah"
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
          if (urlToMatchWith.match(/https?:\/\/stackexchange\.com\/?/)
              || (sox.location.matchWithPattern('*://area51.stackexchange.com/*') && sox.site.href.indexOf('.meta.') === -1)) return true;
        } else {
          if (location.href.match(/https?:\/\/stackexchange\.com\/?/) ||
              (sox.location.matchWithPattern('*://area51.stackexchange.com/*') && sox.site.href.indexOf('.meta.') === -1)) return true;
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
        const username = document.querySelector('.s-topbar--item.s-user-card .s-avatar');
        return (username ? username.title : '');
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
