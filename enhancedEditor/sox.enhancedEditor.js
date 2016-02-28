var enhancedEditor = {
    startFeature: function() {
        setTimeout(function() {
            $.each($('textarea[id^="wmd-input"].processed'), function() {
                enhancedEditor.init($(this).attr('id'));
            });

            $('.edit-post').click(function() {
                $that = $(this);
                setTimeout(function() {
                    enhancedEditor.init($that.parents('table').find('.inline-editor textarea.processed').attr('id'));
                }, 2000);
            });
        }, 2000);        
    },
    
    init: function(wmd) {
        var urls = ['http://cdn.rawgit.com/dwieeb/jquery-textrange/1.x/jquery-textrange.js', 
            'http://rawgit.com/ajaxorg/ace-builds/master/src-noconflict/ace.js',
            'http://rawgit.com/ajaxorg/ace-builds/master/src-noconflict/ext-language_tools.js',
            'http://rawgit.com/ajaxorg/ace-builds/master/src-noconflict/theme-github.js',
            'http://rawgit.com/ajaxorg/ace-builds/master/src-noconflict/mode-javascript.js',
            'http://rawgit.com/ajaxorg/ace-builds/master/src-noconflict/snippets/javascript.js'];

        for (var i = 0; i < urls.length; i++) {
            script = document.createElement('script');
            script.src = urls[i];
            document.head.appendChild(script);
        }
        $('head').append("<link rel='stylesheet' type='text/css' href='https://rawgit.com/soscripted/sox/experimental/enhancedEditor/sox.enhancedEditor.css' />");

        $('[id^="enhancedEditor"]').remove();
        var s = '#'+wmd; //s is the selector we pass onto each function so the action is applied to the correct textarea (and not, for example the 'add answer' textarea *and* the 'edit' textarea!)
        enhancedEditor.startInsertLink(s);
        enhancedEditor.startInsertImages(s);
        enhancedEditor.betterTabKey(s);
        enhancedEditor.keyboardShortcuts(s);
        
        $(s).before("<span class='enhancedEditor-toolbar' id='enhancedEditor|"+s+"'>&nbsp;<span id='startAce'>Insert code (Ace editor)</span> | <span id='findReplace'>Find & Replace</span> | <span id='autoCorrect'>Auto correct</span></span>");

        $('#startAce').click(function(e) {
            enhancedEditor.startAceEditor(s);
            e.preventDefault();
            e.stopPropagation();
        });
        $('#findReplace').click(function(e) {
            enhancedEditor.findReplace($(this).parent().attr('id').split('|')[1]);
            e.preventDefault();
            e.stopPropagation();
        });
        $('#autoCorrect').click(function(e) {
            enhancedEditor.autoCorrect($(this).parent().attr('id').split('|')[1]);
            e.preventDefault();
            e.stopPropagation();
        });
        $(document).on('click', '.enhancedEditor-closeDialog', function() {
            $(this).parent().hide(); 
        });
        
        $(document).click(function(event) { 
            //doesn't work with #enhancedEditor-aceEditor for some reason... so skip it
            if(!$(event.target).closest('#enhancedEditor-insertLinkDialog, #enhancedEditor-insertImageDialog').length) {
                $('#enhancedEditor-insertLinkDialog, #enhancedEditor-insertImageDialog').hide()
            }
        });
    },
    
    startAceEditor: function(s) {
        var aceDiv = "<div id='enhancedEditor-aceEditor' class='wmd-prompt-dialog enhancedEditor-centered' style='position:fixed;'> \
              <select class='enhancedEditor-aceLanguages'></select>\
              <button class='enhancedEditor-addCode'>Add code</button>\
              <span class='enhancedEditor-closeDialog'>x</span>\
              <h2>Ace Editor</h2>\
              <div id='editor'></div>\
          </div>";

        var languages = {
            'CoffeeScript': 'coffee',
            'CSS': 'css',
            'HTML': 'html',
            'JavaScript': 'javascript',
            'JSON': 'json',
            'PHP': 'php',
            'XML': 'xml',
            'AppleScript': 'applescript',
            'Cobol': 'cobol',
            'C#': 'csharp',
            'Python': 'python',
            'Ruby': 'ruby'
        };

        $('body').append(aceDiv);

        $.each(languages, function (lang, file) {
            $('select.enhancedEditor-aceLanguages').append("<option value='"+file+"'>"+lang+"</option>");
        });

        $('select.enhancedEditor-aceLanguages option[value="javascript"]').prop('selected', true);
        setTimeout(function() {
            editor = ace.edit("editor");
            editor.setTheme("ace/theme/github");
            editor.getSession().setMode("ace/mode/javascript");
            editor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true
            });
        }, 2000);

        $('select.enhancedEditor-aceLanguages').on('change', function() {
            editor = ace.edit("editor");
            editor.getSession().setMode("ace/mode/"+$(this).val());
        });

        $(document).on('click', '.enhancedEditor-addCode', function() {
            editor = ace.edit("editor");
            code = editor.getSession().getValue();
            var codeToAdd = '',
                gap = "    ",
                lines = code.split("\n"),
                pos = $(s).textrange('get', 'position'),
                oldVal = $(s).val();

            for(i = 0; i < lines.length; i++) {
                codeToAdd += gap + lines[i] + '\n';
            }

            //http://stackoverflow.com/a/15977052/3541881:
            $(s).val(oldVal.substring(0, pos) + codeToAdd + oldVal.substring(pos));
            
            enhancedEditor.refreshPreview();
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
                setTimeout(function () {
                    query = $(s).textrange();

                    $.getJSON("http://api.duckduckgo.com/?q=" + query.text + "&format=json&t=stackExchangeEditorPro&callback=?", function (json) {
                        $('#DDG-header').append("<a href='" + json.AbstractURL + "'>" + json.Heading + "</a>");
                        $('#DDG-text').append(json.Abstract);
                        $('.DDG-credit a').attr('href', json.AbstractURL);
                    });

                    $('#ownGo').click(function() {
                        enhancedEditor.addLink(query, $(this).prev().val(), s);
                    });
                    $('#suggestGo').click(function() {
                        enhancedEditor.addLink(query, $('#DDG-header a').attr('href'), s); 
                    });
                }, 1000);
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
        }, 3000);
    },
    
    startInsertImages: function(s) {
        var imagesDiv = "<div id='enhancedEditor-insertImageDialog' class='wmd-prompt-dialog enhancedEditor-centered' style='position:fixed; display:none;'> \
              <span class='enhancedEditor-closeDialog'>x</span>\
              <h2>Insert image</h2>\
              <div class='addImage'>\
                  <div class='addOwnImage-container'>Select file:\
                      <input class='ownImage' type='file' />\
                      <input class='go' id='ownGoImage' type='button' value='insert' />\
                      <label class='enhancedEditor-asLinkContainer'><input type='checkbox' id='enhancedEditor-imageAsLink'>Insert smaller image with link to bigger?</label>\
                  </div>\
                  <br>\
                  <hr class='or'>\
                  <div class='addLinkImage-container'>Enter URL:\
                      <input class='URLImage' type='url' value='http://' />\
                      <input class='go' id='goImage' type='button' value='insert' />\
                      <label class='enhancedEditor-asLinkContainer'><input type='checkbox' id='enhancedEditor-imageAsLink'>Insert smaller image with link to bigger?</label>\
                  </div>\
              </div>\
          </div>";
        $('body').append(imagesDiv);

        setTimeout(function() {
            $('#wmd-image-button > span').click(function(e) {
                $('#enhancedEditor-insertImageDialog').show(500);
                setTimeout(function () {
                    query = $(s).textrange();

                    $('#ownGoImage').click(function() {
                        $check = $(this).next();
                        enhancedEditor.uploadToImgur('file', $(this).prev(), function(url) {
                            enhancedEditor.addImageLink(query, url, $check, s);
                        });
                    });
                    $('#goImage').click(function() {
                        $check = $(this).next();
                        enhancedEditor.uploadToImgur('url', $(this).prev(), function(url) {
                            enhancedEditor.addImageLink(query, url, $check, s);                     
                        });
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
        $(s).prev().after("<div class='enhancedEditor-toolbar findReplace'><input id='find' type='text' placeholder='Find'><input id='modifier' type='text' placeholder='Modifier'><input id='replace' type='text' placeholder='Replace with'><input id='replaceGo' type='button' value='Go'></div>");
        $(document).on('click', '.findReplace #replaceGo', function() {
            regex = new RegExp($('.findReplace #find').val(), $('.findReplace #modifier').val());
            oldval = $(s).val();
            newval = oldval.replace(regex, $('.findReplace #replace').val());
            $(s).val(newval);
            enhancedEditor.refreshPreview();
        });
    },
    
    autoCorrect: function(s) {
        var oldVal = $(s).val();
        var newVal = oldVal.replace(/\bi\b/g, "I") //capitalise 'I'
        .replace(/\.\.\.*/gi, "...") //truncate elipses
        .replace(/(?!\.\.\.*)([,.!?;:])(\S)/g, "$1 $2") //add space after punctuation
        .replace(/\s(\?|!)/g, "$1") //remove space before !/?
        .replace(/\bwud\b/gi, "would") //wud->would
        .replace(/\bcant\b/gi, "can't") //cant->can't
        .replace(/\bcud\b/gi, "could") //cud->could
        .replace(/\bwont\b/gi, "won't") //wont->won't
        .replace(/\bshud\b/gi, "should") //shud->should
        .replace(/\b(plz|pls)\b/gi, "please") //plz/pls->please
        .replace(/\bim\b/gi, "I'm") //im->I'm
        .replace(/\bu\b/gi, "you") //u->you
        .replace(/\bure?\b/gi, "your") //ur(e)->your
        .replace(/(^.)/gm,  function (txt) { //Capitalise new line first character
            return txt.toUpperCase();
        })
        .replace(/.+?[\.\?\!](\s|$)/g,  function (txt) { //Fix capitalisation. http://stackoverflow.com/a/20442069/3541881
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        $(s).val(newVal);
        
        enhancedEditor.refreshPreview();
    }, 
    
    addLink: function(query, url, s) {
        $(s).textrange('replace', '['+query.text+']('+url+')');
        $('#enhancedEditor-insertLinkDialog').hide();
        enhancedEditor.refreshPreview();
    },
    
    keyboardShortcuts: function(s) {        
        //Replace default SE bindings
        $(document).keydown(function(e) {
            if(e.which == 71 && e.ctrlKey) { //ctrl+g (images)
                $('#enhancedEditor-insertImageDialog').show(500);
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
            if(e.which == 76 && e.ctrlKey) { //ctrl+l (links)
                $('#enhancedEditor-insertLinkDialog').show(500);
                e.stopPropagation();
                e.preventDefault();
                return false;                
            }
         });
         $(s).keydown(function(e) {
            if(e.which == 65 && e.ctrlKey) { //ctrl+a (ace editor)
                $('#enhancedEditor-aceEditor').show(500);
                e.stopPropagation();
                e.preventDefault();
                return false;                
            }
            if(e.which == 70 && e.ctrlKey) { //ctrl+f (find+replace)
                $('#findReplace').trigger('click');
                e.stopPropagation();
                e.preventDefault();
                return false;                
            }  
        });        
    },
    
    uploadToImgur: function(type, $fileData, callback) {
        var formData = new FormData(),
            data = '';
        if (type=='file') {
            formData.append("image", $fileData[0].files[0]);
        } else {
            data = $fileData.val();
        }

        $.ajax({
            url: "https://api.imgur.com/3/image",
            type: "POST",
            headers: {
                'Authorization': 'Client-ID 1ebf24e58286774'
            },
            data: (type=='file' ? formData : data),
            success: function(response) {
                callback(response.data.link);
            },
            processData: false,
            contentType: false
        });   

    },

    addImageLink: function(query, url, $check, s) {
        if($check.find('input').is(':checked')) {
            urlsplit = url.split('/')[3].split('.');
            urlToUse = 'http://i.imgur.com/'+urlsplit[0]+'m.'+urlsplit[1];
            $(s).textrange('replace', '[!['+query.text+']('+urlToUse+')]('+url+')\n\n<sub>click image for larger variant</sub>');
        } else {
            $(s).textrange('replace', '!['+query.text+']('+url+')');
        }
        $('#enhancedEditor-insertImageDialog').hide();
        enhancedEditor.refreshPreview();
    },
    
    refreshPreview: function() {
        StackExchange.MarkdownEditor.refreshAllPreviews();
    }
};
