/*jshint multistr: true */
(function(sox, $, undefined) {
    'use strict';

    sox.enhancedEditor = {
        startFeature: function() {
            sox.helpers.observe('li[id^="wmd-redo-button"], textarea[id^="wmd-input"]', function() {
                $('textarea[id^="wmd-input"].processed').each(function() {
                    sox.enhancedEditor.init($(this).attr('id'));
                });

                $('.edit-post').click(function() {
                    var $that = $(this);
                    sox.helpers.observe('#wmd-redo-button-' + $that.attr('href').split('/')[2], function() {
                        sox.enhancedEditor.init($that.parents('table').find('.inline-editor textarea.processed').attr('id'));
                    });
                });
            });
        },

        init: function(wmd) {
            var s = '#' + wmd; //s is the selector we pass onto each function so the action is applied to the correct textarea (and not, for example the 'add answer' textarea *and* the 'edit' textarea!)
            if ($(s).parents('.question, .answer').find('.enhancedEditor-toolbar').length) return;
            sox.enhancedEditor.startInsertLink(s);
            sox.enhancedEditor.betterTabKey(s);
            sox.enhancedEditor.keyboardShortcuts(s);

            $(s).before("<span class='enhancedEditor-toolbar' id='enhancedEditor|" + s + "'>&nbsp;<span id='findReplace'>Find & Replace</span> | <span id='autoCorrect'>Auto correct</span></span>");

            $('#findReplace').click(function(e) {
                sox.enhancedEditor.findReplace($(this).parent().attr('id').split('|')[1]);
                e.preventDefault();
                e.stopPropagation();
            });
            $('#autoCorrect').click(function(e) {
                sox.enhancedEditor.autoCorrect($(this).parent().attr('id').split('|')[1]);
                e.preventDefault();
                e.stopPropagation();
            });
            $(document).on('click', '.enhancedEditor-closeDialog', function() {
                $(this).parent().hide();
            });

            $(document).click(function(event) {
                //doesn't work with #enhancedEditor-aceEditor for some reason... so skip it
                if (!$(event.target).closest('#enhancedEditor-insertLinkDialog, #enhancedEditor-insertImageDialog').length) {
                    $('#enhancedEditor-insertLinkDialog, #enhancedEditor-insertImageDialog').hide();
                }
            });
        },

        startInsertLink: function(s) {
            var linkDiv = "<div id='enhancedEditor-insertLinkDialog' class='wmd-prompt-dialog enhancedEditor-centered' style='position:fixed; display:none;'> \
                  <span class='enhancedEditor-closeDialog'>x</span>\
                  <h2>Insert link</h2>\
                  <div class='addURL'>\
                      <div class='addOwnUrl-container'>Enter URL:\
                          <input class='ownURL' type='url' value='http://' />\
                          <input class='go' id='ownGo' type='button' value='insert' />\
                      </div>\
                      <br>\
                      <hr class='or'>\
                      <div class='DDG-container'>\
                          <div id='DDG-suggestion'>\
                              <div class='DDG-go'>\
                                  <input class='go' id='suggestGo' type='button' value='insert' />\
                              </div>\
                              <div id='DDG-header'></div>\
                              <div id='DDG-text'></div>\
                          </div>\
                          <br>\
                          <div class='DDG-credit'><a href='http://google.com'>Results from DuckDuckGo</a>\
                          </div>\
                     </div>\
                  </div>\
              </div>";
            $('body').append(linkDiv);

            setTimeout(function() {
                $('#wmd-link-button > span').click(function(e) {
                    $('#DDG-header').html('');
                    $('#DDG-text').html('');
                    $('#DDG-credit a').attr('href', 'http://google.com');
                    $('#enhancedEditor-insertLinkDialog').show(500);
                    setTimeout(function() {
                        var query = $(s).getSelection();

                        $.getJSON("http://api.duckduckgo.com/?q=" + query.text + "&format=json&t=stackExchangeEditorPro&callback=?", function(json) {
                            $('#DDG-header').append("<a href='" + json.AbstractURL + "'>" + json.Heading + "</a>");
                            $('#DDG-text').append(json.Abstract);
                            $('.DDG-credit a').attr('href', json.AbstractURL);
                        });

                        $('#ownGo').click(function() {
                            sox.enhancedEditor.addLink(query, $(this).prev().val(), s);
                        });
                        $('#suggestGo').click(function() {
                            sox.enhancedEditor.addLink(query, $('#DDG-header a').attr('href'), s);
                        });
                    }, 1000);
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });
            }, 3000);
        },

        betterTabKey: function(s) {
            $(s).on('keydown', function(e) {
                if (e.which === 9) { //http://stackoverflow.com/a/25430815/3541881
                    e.preventDefault();
                    var start = this.selectionStart;
                    var end = this.selectionEnd;
                    var val = this.value;
                    var selected = val.substring(start, end);
                    var re = /^/gm;
                    var count = selected.match(re).length;


                    this.value = val.substring(0, start) + selected.replace(re, '\t') + val.substring(end);
                    this.selectionStart = start;
                    this.selectionEnd = end + count;
                }
            });
        },

        findReplace: function(s) {
            if ($('.enhancedEditor-toolbar.findReplace').length) {
                $('.enhancedEditor-toolbar.findReplace').remove();
            } else {
                $(s).prev().after("<div class='enhancedEditor-toolbar findReplace'><input id='find' type='text' placeholder='Find'><input id='modifier' type='text' placeholder='Modifier'><input id='replace' type='text' placeholder='Replace with'><input id='replaceGo' type='button' value='Go'></div>");
            }
            $(document).on('click', '.findReplace #replaceGo', function() {
                var regex = new RegExp($('.findReplace #find').val(), $('.findReplace #modifier').val());
                var oldval = $(s).val();
                var newval = oldval.replace(regex, $('.findReplace #replace').val());
                $(s).val(newval);
                sox.enhancedEditor.refreshPreview();
            });
        },

        autoCorrect: function(s) {
            var oldVal = $(s).val();
            var newVal = oldVal.replace(/\bi\b/g, "I") //capitalise 'I'
                .replace(/\.{3,}/gi, "...") //truncate ellipses
                .replace(/(\.{3,})?([,.!?;:])(\S)/g, "$1 $2") //add space after punctuation
                .replace(/\s(\?|!)/g, "$1") //remove space before !/?
                .replace(/\bwud\b/gi, "would") //wud->would
                .replace(/\bcud\b/gi, "could") //cud->could
                .replace(/\bshud\b/gi, "should") //shud->should
                .replace(/\b(plz|pls)\b/gi, "please") //plz/pls->please
                .replace(/\bi'(ve|ll|m|d)\b/gi, "I'$1") //i'(anything)->I'(anything)
                .replace(/\bu\b/gi, "you") //u->you
                .replace(/\bure?\b/gi, "your") //ur(e)->your
                .replace(/\b(d)ont\b/gi, "$1on't")
                .replace(/\b(t)eh\b/gi, "$1he")
                .replace(/\b(()?:ubunto|ubunut|ubunutu|ubunu|ubntu|ubutnu|uuntu|unbuntu|ubunt|ubutu)\b/gi, "$1buntu")
                .replace(/\b(a)rent\b/gi, "$1ren't")
                .replace(/\b(c)ant\b/gi, "$1an't")
                .replace(/\b(c)ouldnt\b/gi, "$1ouldn't")
                .replace(/\b(d)idnt\b/gi, "$1idn't")
                .replace(/\b(d)oesnt\b/gi, "$1oesn't")
                .replace(/\b(d)ont\b/gi, "$1on't")
                .replace(/\b(h)adnt\b/gi, "$1adn't")
                .replace(/\b(h)asnt\b/gi, "$1asn't")
                .replace(/\b(h)avent\b/gi, "$1aven't")
                .replace(/\b(h)ed\b/gi, "$1e'd")
                .replace(/\b(h)es\b/gi, "$1e's")
                .replace(/\b(I)d\b/gi, "$1'd")
                .replace(/\b(I)m\b/gi, "$1'm")
                .replace(/\b(I)ve\b/gi, "$1've")
                .replace(/\b(i)snt\b/gi, "$1sn't")
                .replace(/\b(m)ightnt\b/gi, "$1ightn't")
                .replace(/\b(m)ustnt\b/gi, "$1ustn't")
                .replace(/\b(s)hant\b/gi, "$1han't")
                .replace(/\b(s)hes\b/gi, "$1he's")
                .replace(/\b(s)houldnt\b/gi, "$1houldn't")
                .replace(/\b(t)hats\b/gi, "$1hat's")
                .replace(/\b(t)heres\b/gi, "$1here's")
                .replace(/\b(t)heyd\b/gi, "$1hey'd")
                .replace(/\b(t)heyll\b/gi, "$1hey'll")
                .replace(/\b(t)heyre\b/gi, "$1hey're")
                .replace(/\b(t)heyve\b/gi, "$1hey've")
                .replace(/\b(w)eve\b/gi, "$1e've")
                .replace(/\b(w)erent\b/gi, "$1eren't")
                .replace(/\b(w)hatll\b/gi, "$1hat'll")
                .replace(/\b(w)hatre\b/gi, "$1hat're")
                .replace(/\b(w)hats\b/gi, "$1hat's")
                .replace(/\b(w)hatve\b/gi, "$1hat've")
                .replace(/\b(w)heres\b/gi, "$1here's")
                .replace(/\b(w)hod\b/gi, "$1ho'd")
                .replace(/\b(w)holl\b/gi, "$1ho'll")
                .replace(/\b(w)hove\b/gi, "$1ho've")
                .replace(/\b(w)ont\b/gi, "$1on't")
                .replace(/\b(w)ouldnt\b/gi, "$1ouldn't")
                .replace(/\b(y)oud\b/gi, "$1ou'd")
                .replace(/\b(y)oull\b/gi, "$1ou'll")
                .replace(/\b(y)oure\b/gi, "$1ou're")
                .replace(/\b(y)ouve\b/gi, "$1ou've")
                .replace(/(^.)/gm, function(txt) { //Capitalise new line first character
                    return txt.toUpperCase();
                })
                .replace(/.+?[\.\?\!](\s|$)/g, function(txt) { //Fix capitalisation. http://stackoverflow.com/a/20442069/3541881
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            $(s).val(newVal);

            sox.enhancedEditor.refreshPreview();
        },

        addLink: function(query, url, s) {
            $(s).replaceSelectedText('[' + query.text + '](' + url + ')');
            $('#enhancedEditor-insertLinkDialog').hide();
            sox.enhancedEditor.refreshPreview();
        },

        keyboardShortcuts: function(s) {
            //Replace default SE bindings
            $(document).keydown(function(e) {
                if (e.which == 71 && e.ctrlKey) { //ctrl+g (images)
                    $('#enhancedEditor-insertImageDialog').show(500);
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                }
                if (e.which == 76 && e.ctrlKey) { //ctrl+l (links)
                    $('#enhancedEditor-insertLinkDialog').show(500);
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                }
            });
            $(s).keydown(function(e) {
                if (e.which == 70 && e.ctrlKey) { //ctrl+f (find+replace)
                    $('#findReplace').trigger('click');
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                }
            });
        },

        refreshPreview: function() {
            var Stack = (typeof StackExchange === "undefined" ? window.eval('StackExchange') : StackExchange);
            if (Stack.MarkdownEditor) {
                Stack.MarkdownEditor.refreshAllPreviews();
            }
        }
    };
})(window.sox = window.sox || {}, jQuery);
