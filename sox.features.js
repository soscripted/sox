/*jshint multistr: true */
//TODO: what are post_contents and author for?
var features = { //ALL the functions must go in here

    grayOutVotes: function() {
        // Description: Grays out votes AND vote count

        if ($('.deleted-answer').length) {
            $('.deleted-answer .vote-down-off, .deleted-answer .vote-up-off, .deleted-answer .vote-count-post').css('opacity', '0.5');
        }
    },

    moveBounty: function() {
        // Description: For moving bounty to the top

        if ($('.bounty-notification').length) {
            $('.bounty-notification').insertAfter('.question .fw');
            $('.question .bounty-notification .votecell').remove();
        }
    },

    dragBounty: function() {
        // Description: Makes the bounty window draggable

        $('.bounty-notification').click(function() {
            setTimeout(function() {
                $('#start-bounty-popup').draggable().css('cursor', 'move');
            }, 50);
        });
    },

    renameChat: function() {
        // Description: Renames Chat tabs to prepend 'Chat' before the room name

        if (SOHelper.getSiteType() === 'chat') {
            document.title = 'Chat - ' + document.title;
        }
    },

    exclaim: function() {
        // Description: Removes exclamation marks

        var old = $('td.comment-actions > div > div > div.message-text');
        var newText = old.text().replace("!", ".");
        old.html(newText);
    },

    employeeStar: function() {
        // Description: Adds an star next to users that *might* be a Stack Overflow Employee

        var employees = ['Jeff Atwood', 'Joel Spolsky', 'Jarrod Dixon', 'Geoff Dalgas', 'David Fullerton', 'Korneel Bouman', 'Robert Cartaino', 'Kevin Montrose',
            'MandyK', 'Marc Gravell', 'balpha', 'Matt Sherman', 'Danny Miller', 'Jason Punyon', 'NickC', 'Kyle Brandt', 'Jin', 'Tall Jeff', 'Zypher',
            'Nick Craver', 'Nick Larsen', 'Shog9', 'Greg', 'Alex Miller', 'GuyZee', 'abby hairboat', 'samthebrand', 'Laura', 'Grace Note', 'Dimitar Stanimiroff',
            'Hammer', 'Peter Grace', 'Charles', 'Anna Lear', 'stevvve', 'Bethany', 'Andrew17', 'Kizzle', 'Jay', 'mjibson', 'Stefan Schwarzgruber', 'Will Cole', 'Sean Bave',
            'Robyn', 'Bart Silverstrim', 'Jaydles', 'Maxwell Applebaum', 'Snails', 'Jordan Conner', 'Bodhi', 'cashenhu', 'rb4', 'Maurbawlz', 'CMartin', 'Joe Humphries', 'Max',
            'Oded', 'Val Perez', 'rossipedia', 'Derek Still', 'Tim Post', 'Paul', 'PDePree', 'Sklivvz', 'Todd Jenkins', 'Jim Egan', 'Kaziorex', 'Ben Collins', 'TomOnTime', 'Dr.D',
            'David', 'Sara Rayman', 'Monika P', 'Prefontaine', 'm0sa', 'Jon Ericson', 'Juice', 'Tania', 'Angela', 'Hynes', 'Kasra Rahjerdi', 'Gabe', 'Bret Copeland', 'Arie Litovsky',
            'Pops', 'Megan Spaans', 'Whitney Dwyer', 'Philip Camillo', 'onesysadmin', 'Aurelien Gasser', 'Alyssa Tomback', 'Alex Cresswell', 'couchand', 'Brian Nickel', 'Princess',
            'Yaakov Ellis', 'Ana Hevesi', 'Noureddine Latrech', 'Hertz', 'Jill Ciaccia', 'Tobias Schmidt', 'Jon Chan', 'Johanna Perrin', 'Kristian Bright', 'John LeClerc',
            'Rob Dandorph', 'Jessica Genther', 'Courtny Cotten', 'Stephanie', 'Sean Durkin', 'rla4', 'Alex Warren', 'Jaime Kronick', 'Alexa', 'Samuel Rouayrenc', 'Josh Helfgott',
            'Peter Tarr', 'Shane Madden', 'Nextraztus', 'G-Wiz', 'Dan O\'Boyle', 'yolovolo', 'Griffin Sandberg', 'ODB', 'Mark Villarreal', 'Lowell Gruman Jr.', 'bweber', 'Natalie How',
            'Haney', 'jmac', 'Emmanuel Andem-Ewa', 'Jess Pardue', 'Dean Ward', 'Steve Trout', 'Nicholas Chabanovsky', 'Kelli Ward', 'Noah Neuman', 'Lauren Roemer', 'Heidi Hays',
            'Joe Wilkie', 'Mackenzie Ralston', 'animuson'
        ];

        $('.comment, .deleted-answer-info, .employee-name, .started, .user-details').each(function() { //normal comments, deleted answers (deleted by), SE.com/about, question feed users, question/answer/edit owners
            var $divtext = $(this);
            $.each(employees, function(index, value) {
                if ($divtext.find('a[href*="/users"]').html() == value) {
                    $divtext.find('a[href*="/users"]').append('<span class="mod-flair" title="possible employee">&Star;</span>');
                }
            });
        });
    },

    bulletReplace: function() {
        // Description: Replaces disclosure bullets with normal ones
        $('.dingus').each(function() {
            $(this).html('&#x25cf;');
        });
    },

    addEllipsis: function() {
        // Description: Adds an ellipsis to long names
        $('.user-info .user-details').css('text-overflow', 'ellipsis');
    },

    copyCommentsLink: function() {
        // Description: Adds the 'show x more comments' link before the commnents
        $('.js-show-link.comments-link').each(function() {
            var $this2 = $(this);
            $('<tr><td></td><td>' + $this2.clone().wrap('<div>').parent().html() + '</td></tr>').insertBefore($(this).parent().closest('tr')).click(function() {
                $(this).hide();
            });
            var commentParent;
            // Determine if comment is on a question or an answer
            if ($(this).parents('.answer').length) {
                commentParent = '.answer';
            } else {
                commentParent = '.question';
            }

            $(this).click(function() {
                $(this).closest(commentParent).find('.js-show-link.comments-link').hide();
            });
        });

    },

    /*unHideAnswer: function() { // For unfading a downvoted answer on hover
         $(".downvoted-answer").hover(function() {
             $(this).removeClass("downvoted-answer");
         }, function() {
             $(this).addClass("downvoted-answer");
         });
     },*/

    fixedTopbar: function() {
        // Description: For making the topbar fixed (always stay at top of screen)
        if ($(location).attr('hostname') == 'askubuntu.com') { //AskUbuntu is annoying. UnicornsAreVeryVeryYummy made the below code for AskUbuntu: https://github.com/shu8/Stack-Overflow-Optional-Features/issues/11 Thanks!
            var newUbuntuLinks = $('<div/>', {
                    class: 'fixedTopbar-links'
                }),
                linksWrapper = $('<div/>', {
                    class: 'fixedTopbar-linksList'
                }),
                listOfSites = $('<ul/>', {
                    class: 'fixedTopbar-siteLink'
                }),
                more = $('<li/>', {
                    html: '<a href="#">More</a>',
                    class: 'fixedTopbar-siteLink'
                }),
                sites = {
                    Ubuntu: 'ubuntu.com',
                    Community: 'community.ubuntu.com',
                    'Ask!': 'askubuntu.com',
                    Developer: 'developer.ubuntu.com',
                    Design: 'design.ubuntu.com',
                    Discourse: 'discourse.ubuntu.com',
                    Hardware: 'www.ubuntu.com/certification',
                    Insights: 'insights.ubuntu.com',
                    Juju: 'juju.ubuntu.com',
                    Shop: 'shop.ubuntu.com'
                },
                moreSites = {
                    Apps: 'apps.ubuntu.com',
                    Help: 'help.ubuntu.com',
                    Forum: 'ubuntuforums.org',
                    Launchpad: 'launchpad.net',
                    MAAS: 'maas.ubuntu.com',
                    Canonical: 'canonical' //TODO
                };
            var addSite = function(link, name) {
                listOfSites.append($('<li/>', {
                    html: '<a href="http://' + link + '">' + name + '</a>',
                    class: 'fixedTopbar-siteLink'
                }));
            };
            sites.forEach(function(link, name) {
                addSite(link, name);
            });
            listOfSites.append(more);
            var moreList = $('li', $(more));
            var addMoreSite = function(link, name) {
                moreList.append($('<li/>', {
                    html: '<a href="http://' + link + '">' + name + '</a>',
                    class: 'fixedTopbar-siteLink'
                }));
            };
            moreSites.forEach(function(link, name) {
                addMoreSite(link, name);
            });
            $('.nav-global').remove(); //Ubuntu links
            $('#custom-header').remove();
            linksWrapper.append(listOfSites);
            newUbuntuLinks.append(linksWrapper);
            $('body').append(newUbuntuLinks);
            $('.topbar').addClass('fixedTopbar-stickyToolbar');
            $('.topbar').before($('<div/>', {html: '<br/><br/>'}));
        } else if (SOHelper.getSiteType() !== 'chat') { //for all the normal, unannoying sites, excluding chat ;)
            $('.topbar').css({
                'position': 'fixed',
                'z-index': '1001'
            });

            //Thanks ArtOfCode (http://worldbuilding.stackexchange.com/users/2685/artofcode) for fixing the topbar covering the header :)
            $('#header').css('margin-top', '34px');
            $('.topbar').css('margin-top', '-34px');
        } else if (SOHelper.getSiteType() === 'chat') { //chat is a bit different
            $('.topbar').css('position', 'fixed');
        }

        $('#rep-card-next .percent').after($('#rep-card-next .label').css('z-index', 0)).css('position', 'absolute');
        $('#badge-card-next .percent').after($('#badge-card-next .label').css('z-index', 0)).css('position', 'absolute');
    },

    highlightQuestions: function() {
        // Description: For highlighting only the tags of favorite questions

        function change(betterCSS) {
            var interestingTagsDiv = $('#interestingTags').text();
            var interesting = interestingTagsDiv.split(' ');
            interesting.pop(); //Because there's one extra value at the end

            $('.tagged-interesting > .summary > .tags > .post-tag').filter(function(index) {
                return interesting.indexOf($(this).text()) > -1;
            }).css(betterCSS);

            $('.tagged-interesting').removeClass('tagged-interesting');
        }
        setTimeout(function() { //Need delay to make sure the CSS is applied
            var betterCSS = {};
            if (/superuser/.test(window.hostname)) { //superuser
                betterCSS = {
                    backgroundColor: '#a1eaff',
                    color: 'black'
                };
            } else if (/stackoverflow/.test(window.hostname)) { //stackoverflow
                betterCSS = {
                    backgroundColor: '#ffefc6',
                    borderWidth: '0'
                };
            } else { //if (/stackexchange.com/.test(window.hostname)) {
                //if (window.location.href.indexOf('meta') === -1) { //beta sites
                betterCSS = {
                    backgroundColor: '#c3dafa',
                    borderWidth: '0'
                };
                //}
            }
            change(betterCSS);

            new MutationObserver(function(records) {
                records.forEach(function(mutation) {
                    if(mutation.attributeName == 'class') {
                         change(betterCSS);
                    }
                });
            }).observe(document.querySelector('.question-summary'), {
                childList: true,
                attributes: true
            });
        }, 300);
    },

    displayName: function() {
        // Description: For displaying username next to avatar on topbar
        var uname = SOHelper.getUsername();
        var insertme = '<span class="reputation links-container" style="color:white;" title="' + uname + '">' + uname + '</span>"';
        $(insertme).insertBefore('.gravatar-wrapper-24');
    },

    colorAnswerer: function() {
        // Description: For highlighting the names of answerers on comments
        $('.answercell').each(function(i, obj) {
            var x = $(this).find('.user-details a').text();
            $('.answer .comment-user').each(function() {
                if ($(this).text() == x) {
                    $(this).css('background-color', 'orange');
                }
            });
        });
        $('.js-show-link.comments-link').click(function() { //Keep CSS when 'show x more comments' is clicked
            setTimeout(function() {
                features.colorAnswerer();
            }, 500);
        });
    },

    kbdAndBullets: function() {
        // Description: For adding buttons to the markdown toolbar to surround selected test with KBD or convert selection into a markdown list

        function addBullets() {
            var list = '- ' + $('[id^="wmd-input"]').getSelection().text.split('\n').join('\n- ');
            $('[id^="wmd-input"]').replaceSelectedText(list);
        }

        function addKbd() {
            $('[id^="wmd-input"]').surroundSelectedText("<kbd>", "</kbd>");
        }

        var kbdBtn = '<li class="wmd-button" title="surround selected text with <kbd> tags" style="left: 400px;"><span id="wmd-kbd-button" style="background-image: none;">kbd</span></li>';
        var listBtn = '<li class="wmd-button" title="add dashes (\"-\") before every line to make a bulvar point list" style="left: 425px;"><span id="wmd-bullet-button" style="background-image:none;">&#x25cf;</span></li>';

        setTimeout(function() {
            $('[id^="wmd-redo-button"]').after(kbdBtn);
            $('[id^="wmd-redo-button"]').after(listBtn);
            $('#wmd-kbd-button').on('click', function() {
                addKbd();
            });
            $('#wmd-bullet-button').on('click', function() {
                addBullets();
            });
        }, 500);

        $('[id^="wmd-input"]').bind('keydown', 'alt+l', function() {
            addBullets();
        });

        $('[id^="wmd-input"]').bind('keydown', 'alt+k', function() {
            addKbd();
        });
    },

    editComment: function() {
        // Description: For adding checkboxes when editing to add pre-defined edit reasons

        function addCheckboxes() {
            $('#reasons').remove(); //remove the div containing everything, we're going to add/remove stuff now:
            if (!$('[class^="inline-editor"]').length) { //if there is no inline editor, do nothing
                return;
            }
            if (/\/edit/.test(window.location.href) || $('[class^="inline-editor"]').length) { //everything else
                $('.form-submit').before('<div id="reasons"></div>');

                $.each(JSON.parse(GM_getValue('editReasons')), function(i, obj) {
                    $('#reasons').append('<label><input type="checkbox" value="' + this[1] + '"</input>' + this[0] + '</label>&nbsp;');
                });

                $('#reasons input[type="checkbox"]').css('vertical-align', '-2px');

                $('#reasons label').hover(function() {
                    $(this).css({ //on hover
                        'background-color': 'gray',
                        'color': 'white'
                    });
                }, function() {
                    $(this).css({ //on un-hover
                        'background-color': 'white',
                        'color': 'inherit'
                    });
                });

                var editCommentField = $('[id^="edit-comment"]');
                $('#reasons input[type="checkbox"]').change(function() {
                    if (this.checked) { //Add it to the summary
                        if (!editCommentField.val()) {
                            editCommentField.val(editCommentField.val() + $(this).val().replace(/on$/g, ''));
                        } else {
                            editCommentField.val(editCommentField.val() + '; ' + $(this).val().replace(/on$/g, ''));
                        }
                        var newEditComment = editCommentField.val(); //Remove the last space and last semicolon
                        editCommentField.val(newEditComment).focus();
                    } else if (!this.checked) { //Remove it from the summary
                        editCommentField.val(editCommentField.val().replace($(this).val() + '; ', '')); //for middle/beginning values
                        editCommentField.val(editCommentField.val().replace($(this).val(), '')); //for last value
                    }
                });
            }
        }

        function displayDeleteValues() {
            //Display the items from list and add buttons to delete them
            $('#currentValues').html(' ');
            $.each(JSON.parse(GM_getValue('editReasons')), function(i, obj) {
                $('#currentValues').append(this[0] + ' - ' + this[1] + '<input type="button" id="' + i + '" value="Delete"><br />');
            });
            addCheckboxes();
        }

        var div = '<div id="dialogEditReasons" class="sox-centered wmd-prompt-dialog"><span id="closeDialogEditReasons" style="float:right;">Close</span><span id="resetEditReasons" style="float:left;">Reset</span> \
                        <h2>View/Remove Edit Reasons</h2> \
                        <div id="currentValues"></div> \
                        <br /> \
                        <h3>Add a custom reason</h3> \
                        Display Reason:	<input type="text" id="displayReason"> \
                        <br /> \
                        Actual Reason: <input type="text" id="actualReason"> \
                        <br /> \
                        <input type="button" id="submitUpdate" value="Submit"> \
                    </div>';

        $('body').append(div);
        $('#dialogEditReasons').draggable().css('position', 'absolute').css('text-align', 'center').css('height', '60%').hide();

        $('#closeDialogEditReasons').css('cursor', 'pointer').click(function() {
            $(this).parent().hide(500);
        });

        $('#resetEditReasons').css('cursor', 'pointer').click(function() { //manual reset
            var options = [ //Edit these to change the default settings
                ['formatting', 'Improved Formatting'],
                ['spelling', 'Corrected Spelling'],
                ['grammar', 'Fixed grammar'],
                ['greetings', 'Removed thanks/greetings']
            ];
            if (confirm('Are you sure you want to reset the settings to Formatting, Spelling, Grammar and Greetings')) {
                GM_setValue('editReasons', JSON.stringify(options));
                alert('Reset options to default. Refreshing...');
                location.reload();
            }
        });

        if (GM_getValue('editReasons', -1) == -1) { //If settings haven't been set/are empty
            var defaultOptions = [
                ['formatting', 'Improved Formatting'],
                ['spelling', 'Corrected Spelling'],
                ['grammar', 'Fixed grammar'],
                ['greetings', 'Removed thanks/greetings']
            ];
            GM_setValue('editReasons', JSON.stringify(defaultOptions)); //save the default settings
        } else {
            var options = JSON.parse(GM_getValue('editReasons')); //If they have, get the options
        }

        $('#dialogEditReasons').on('click', 'input[value="Delete"]', function() { //Click handler to delete when delete button is pressed
            var delMe = $(this).attr('id');
            options.splice(delMe, 1); //actually delete it
            GM_setValue('editReasons', JSON.stringify(options)); //save it
            displayDeleteValues(); //display the items again (update them)
        });

        $('#submitUpdate').click(function() { //Click handler to update the array with custom value
            if (!$('#displayReason').val() || !$('#actualReason').val()) {
                alert('Please enter something in both the textboxes!');
            } else {
                var arrayToAdd = [$('#displayReason').val(), $('#actualReason').val()];
                options.push(arrayToAdd); //actually add the value to array

                GM_setValue('editReasons', JSON.stringify(options)); //Save the value

                // moved display call after setvalue call, list now refreshes when items are added
                displayDeleteValues(); //display the items again (update them)

                //reset textbox values to empty
                $('#displayReason').val('');
                $('#actualReason').val('');

            }
        });

        setTimeout(function() {
            addCheckboxes();
            //Add the button to update and view the values in the help menu:
            $('.topbar-dialog.help-dialog.js-help-dialog > .modal-content ul').append("<li><a href='javascript:void(0)' id='editReasonsLink'>Edit Reasons     \
                                                                                      <span class='item-summary'>Edit your personal edit reasons for SE sites</span></a></li>");
            $('.topbar-dialog.help-dialog.js-help-dialog > .modal-content ul #editReasonsLink').on('click', function() {
                displayDeleteValues();
                $('#dialogEditReasons').show(500); //Show the dialog to view and update values
            });
        }, 500);

        $('.post-menu > .edit-post').click(function() {
            setTimeout(function() {
                addCheckboxes();
            }, 500);
        });
    },

    shareLinksMarkdown: function() {
        // Description: For changing the 'share' button link to the format [name](link)
        $('.short-link').click(function() {
            setTimeout(function() {
                var link = $('.share-tip input').val();
                $('.share-tip input').val('[' + $('#question-header a').html() + '](' + link + ')');
                $('.share-tip input').select();
            }, 500);
        });
    },

    commentShortcuts: function() {
        // Description: For adding support in comments for Ctrl+K,I,B to add code backticks, italicise, bolden selection
        $('.js-add-link.comments-link').click(function() {
            setTimeout(function() {
                $('.comments textarea').bind('keydown', 'ctrl+k', function(e) {
                    e.preventDefault();
                    $(this).surroundSelectedText('`', '`');
                });
                $('.comments textarea').bind('keydown', 'ctrl+i', function(e) {
                    e.preventDefault();
                    $(this).surroundSelectedText('*', '*');
                });
                $('.comments textarea').bind('keydown', 'ctrl+b', function(e) {
                    e.preventDefault();
                    $(this).surroundSelectedText('**', '**');
                });
            }, 200);
        });
    },

    unspoil: function() {
        // Description: For adding a button to reveal all spoilers in a post
        $('#answers div[id*="answer"], div[id*="question"]').each(function() {
            if ($(this).find('.spoiler').length) {
                $(this).find('.post-menu').append('<span class="lsep">|</span><a id="showSpoiler-' + $(this).attr("id") + '" href="javascript:void(0)">unspoil</span>');
            }
        });
        $('a[id*="showSpoiler"]').click(function() {
            var x = $(this).attr('id').split(/-(.+)?/)[1];
            $('#' + x + ' .spoiler').removeClass('spoiler');
        });
    },

    /*highlightClosedQuestions: function() { // For highlighting and slightly greying out closed questions when viewing question lists
        $('.question-summary').each(function() {
            if ($(this).find('.summary h3 a').text().indexOf('[on hold]') > -1 || $(this).find('.summary h3 a').text().indexOf('[closed]') > -1) {
                if ($('.cp').length) {
                    $(this).find('.cp').css('border', 'blue').css('border-style', 'dotted').css('border-width', 'thin').css('background-color', '#E0E0E0');
                    $(this).css('opacity', '0.9');
                } else {
                    $(this).find('.votes').css('border', 'blue').css('border-style', 'dotted').css('border-width', 'thin').css('background-color', '#E0E0E0');
                    $(this).css('opacity', '0.9');
                }
            }
        });
    },*/

    quickCommentShortcutsMain: function() {
        // Description: For adding shortcuts to insert pre-defined text into comment fields

        function parseGM() {
            return JSON.parse(GM_getValue('quickCommentShortcutsData'));
        }

        function saveGM(data) {
            GM_setValue('quickCommentShortcutsData', JSON.stringify(data));
        }

        function replaceVars(text, sitename, siteurl, op, answererName) {
            return text.replace(/\$SITENAME\$/gi, sitename).replace(/\$ANSWERER\$/gi, answererName.replace(/\s/gi, '')).replace(/\$OP\$/gi, op).replace(/\$SITEURL\$/gi, siteurl).replace(/\$ANSWERERNORMAL\$/gi, answererName);
        }

        function resetReminderAndTable() {
            $('#quickCommentShortcutsReminder').html('');
            $('#quickCommentShortcuts table').html(' ');
            $('#quickCommentShortcuts table').append('<tr><th>Name</th><th>Shortcut</th><th>Text</th><th>Delete?</th><th>Edit?</th></tr>');
        }

        var sitename = SOHelper.getSiteName(),
            siteurl = 'http://' + $(location).attr('hostname'),
            op = $('.post-signature.owner .user-info .user-details a').text(),
            data = [],
            tableCSS = {
                'border': '1px solid white',
                'padding': '5px',
                'vertical-align': 'middle'
            };

        $('body').append('<div id="quickCommentShortcuts" class="sox-centered wmd-prompt-dialog" style="display:none;"><table></table></div>');
        $('#quickCommentShortcuts').css('width', '100%').css('position', 'absolute').draggable();
        $('body').append('<div id="quickCommentShortcutsReminder" class="quickCommentShortcutsReminder" style="display:none;"></div>');

        if (!GM_getValue('quickCommentShortcutsData') || parseGM().length < 1) {
            data = [
                //Format: ['name', 'shortcut', 'comment text'],
                ['How to ping', 'alt+p', 'To ping other users, please start your comment with an `@` followed by the person\'s username (with no spaces). For example, to ping you, I would use `@$ANSWERER$`. For more information, please see [How do comments replies work?](http://meta.stackexchange.com/questions/43019/how-do-comment-replies-work).'],
                ['Not an answer', 'alt+n', 'This does not provide an answer to the question. To critique or request clarification from an author, leave a comment below their post - you need to gain [reputation]($SITEURL$/faq#reputation) before you can comment on others\' posts to prevent abuse; why don\'t you try and get some by [answering a question]($SITEURL$/unanswered)?'],
                ['Link-only answer', 'alt+l', 'While this link may answer the question, it is better to include the essential parts of the answer here and provide the link for reference. Link-only answers can become invalid if the linked page changes, resulting in your answer being useless and consequently deleted.'],
                ['Ask a new question', 'alt+d', 'If you have a new question, please ask it by clicking the [Ask Question]($SITEURL$/questions/ask) button. Include a link to this question if it helps provide context. You can also [start a bounty]($SITEURL$/help/privileges/set-bounties) to draw more attention to this question.'],
                ['Don\'t add "Thank You"', 'alt+t', 'Please don\'t add \'thank you\' as an answer. Instead, vote up the answers that you find helpful. To do so, you need to have reputation. You can read more about reputation [here]($SITEURL$/faq#reputation).']
            ];
        } else {
            data = parseGM();
        }
        $(function() {
            $(document).on('click', 'a.js-add-link.comments-link', function() {
                var answererName = $(this).parents('div').find('.post-signature:last').first().find('.user-details a').text(),
                    answererId = $(this).parents('div').find('.post-signature:last').first().find('.user-details a').attr('href').split('/')[2],
                    apiUrl = 'https://api.stackexchange.com/2.2/users/' + answererId + '?site=' + SOHelper.getSiteName('api');

                setTimeout(function() {
                    $('.comments textarea').attr('placeholder', 'Use comments to ask for clarification or add more information. Avoid answering questions in comments. Press Alt+O to view/edit/delete Quick Comment Shortcuts data, or press Alt+R to open a box to remind you of the shortcuts.');
                }, 500);

                $.ajax({
                    dataType: "json",
                    url: apiUrl,
                    success: function(json) {
                        var creationDate = json.items[0].creation_date,
                            lastAccess = json.items[0].last_access_date,
                            reputation = json.items[0].reputation,
                            bronze = json.items[0].badge_counts.bronze,
                            silver = json.items[0].badge_counts.silver,
                            gold = json.items[0].badge_counts.gold,
                            type = json.items[0].user_type;

                        var welcomeText = '',
                            newUser = 'No';
                        if ((new Date().getTime() / 1000) - (creationDate) < 864000) {
                            welcomeText = 'Welcome to $SITENAME$ $ANSWERERNORMAL$! ';
                            newUser = 'Yes';
                        }


                        var factfile = '<span id="closeQuickCommentShortcuts" style="float:right;">close</span> \
                                            <h3>User "' + answererName + '" - ' + type + ': <br /> \
                                            Creation Date: ' + new Date(creationDate * 1000).toUTCString() + ' <br /> \
                                            New? ' + newUser + '<br /> \
                                            Last seen: ' + new Date(lastAccess * 1000).toUTCString() + ' <br /> \
                                            Reputation: ' + reputation + ' <br /> \
                                            Badges: <span class="badge1"></span>' + gold + '</span> \
                                            <span class="badge2"></span>' + silver + '</span> \
                                            <span class="badge3"></span>' + bronze + '</span></h3>';

                        var variableList = '<br /><span id="quickCommentShortcutsVariables"><h4>Variables (case-insensitive)</h4> \
                                            <strong>$ANSWERER$</strong> - name of poster of post you\'re commenting on (may be OP) with stripped spaces (eg. JohnDoe)<br /> \
                                            <strong>$ANSWERERNORMAL$</strong> - name of poster of post you\'re commenting on (may be OP) without stripped spaces (eg. John Doe)<br /> \
                                            <strong>$OP$</strong> - name of OP <br /> \
                                            <strong>$SITEURL$</strong> - site URL (eg. http://stackoverflow.com) <br /> \
                                            <strong>$SITENAME$</strong> - site name (eg. Stack Overflow) <br /></span>';

                        $('#quickCommentShortcuts').prepend(factfile);
                        $('#quickCommentShortcuts').append(variableList);
                        $('#closeQuickCommentShortcuts').css('cursor', 'pointer').on('click', function() {
                            $('#quickCommentShortcuts').hide();
                        });

                        $('#quickCommentShortcuts table').append('<tr><th>Name</th><th>Shortcut</th><th>Text</th><th>Delete?</th><th>Edit?</th></tr>');
                        $('#quickCommentShortcuts table').after('<input type="button" id="newComment" value="New Comment">');
                        $('#quickCommentShortcutsReminder').html('');
                        $.each(data, function(i) {
                            $('#quickCommentShortcutsReminder').append(this[0] + ' - ' + this[1] + '<br />');
                            var text = welcomeText + this[2];
                            text = replaceVars(text, sitename, siteurl, op, answererName);
                            $('.comments textarea').bind('keydown', this[1], function() {
                                $(this).append(text);
                            });
                            $('#quickCommentShortcuts table').append('<tr><td>' + this[0] + '</td><td>' + this[1] + '</td><td>' + text + '</td><td><input type="button" id="' + i + '" value="Delete"></td><td><input type="button" id="' + i + '" value="Edit"></td></tr><br />');
                            $('#quickCommentShortcuts').find('table, th, td').css(tableCSS);
                        });

                        $('.comments textarea').on('keydown', null, 'alt+o', function() {
                            $('#quickCommentShortcuts').show();
                            $('body').animate({
                                scrollTop: 0
                            }, 'slow');
                        });
                        $('.comments textarea').bind('keydown', 'alt+r', function() {
                            $('#quickCommentShortcutsReminder').show();
                        });

                        $('#quickCommentShortcuts').on('click', 'input[value="Delete"]', function() {
                            data.splice($(this).attr('id'), 1);
                            saveGM(data);
                            resetReminderAndTable();
                            $.each(data, function(i) {
                                $('#quickCommentShortcutsReminder').append(this[0] + ' - ' + this[1] + '<br />');
                                var text = welcomeText + this[2];
                                $('#quickCommentShortcuts table').append('<tr><td>' + this[0] + '</td><td>' + this[1] + '</td><td>' + text + '</td><td><input type="button" id="' + i + '" value="Delete"></td><td><input type="button" id="' + i + '" value="Edit"></td></tr><br />');
                                $('#quickCommentShortcuts').find('table, th, td').css(tableCSS);
                            });
                        });

                        $('#quickCommentShortcuts').on('click', '#newComment', function() {
                            $(this).hide();
                            $(this).before('<div id="newCommentStuff">Name:<input type="text" id="newCommentName"> \
                                                <br /> Shortcut:<input type="text" id="newCommentShortcut"> \
                                                <br /> Text:<textarea id="newCommentText"></textarea> \
                                                <br /> <input type="button" id="newCommentSave" value="Save"></div>');
                            $('#quickCommentShortcuts #newCommentSave').click(function() {
                                var newName = $('#newCommentName').val(),
                                    newShortcut = $('#newCommentShortcut').val(),
                                    newText = $('#newCommentText').val();
                                data.push([newName, newShortcut, newText]);
                                saveGM(data);
                                resetReminderAndTable();
                                $.each(data, function(i) {
                                    $('#quickCommentShortcutsReminder').append(this[0] + ' - ' + this[1] + '<br />');
                                    var text = welcomeText + this[2];
                                    $('#quickCommentShortcuts table').append('<tr><td>' + this[0] + '</td><td>' + this[1] + '</td><td>' + text + '</td><td><input type="button" id="' + i + '" value="Delete"></td><td><input type="button" id="' + i + '" value="Edit"></td></tr><br />');
                                    $('#quickCommentShortcuts').find('table, th, td').css(tableCSS);
                                });
                                $('#newCommentStuff').remove();
                                $('#quickCommentShortcuts #newComment').show();
                            });
                        });

                        $('#quickCommentShortcuts').on('click', 'input[value="Edit"]', function() {
                            var id = $(this).attr('id');
                            for (var i = 0; i < 3; i++) {
                                $(this).parent().parent().find('td:eq(' + i + ')').replaceWith('<td><input style="width:90%;" type="text" id="' + id + '" value="' + data[id][i].replace(/"/g, '&quot;').replace(/'/g, '&rsquo;') + '"></td>');
                            }
                            $(this).after('<input type="button" value="Save" id="saveEdits">');
                            $(this).hide();
                            $('#quickCommentShortcuts #saveEdits').click(function() {
                                for (var i = 0; i < 3; i++) {
                                    data[id][i] = $(this).parent().parent().find('input[type="text"]:eq(' + i + ')').val();
                                    saveGM(data);
                                }
                                resetReminderAndTable();
                                $.each(data, function(i) {
                                    $('#quickCommentShortcutsReminder').append(this[0] + ' - ' + this[1] + '<br />');
                                    var text = welcomeText + this[2];
                                    $('#quickCommentShortcuts table').append('<tr><td>' + this[0] + '</td><td>' + this[1] + '</td><td>' + text + '</td><td><input type="button" id="' + i + '" value="Delete"></td><td><input type="button" id="' + i + '" value="Edit"></td></tr><br />');
                                    $('#quickCommentShortcuts').find('table, th, td').css(tableCSS);
                                });
                                $(this).remove();
                                $('#quickCommentShortcuts input[value="Edit"]').show();
                            });
                        });
                        $('.comments textarea').blur(function() {
                            $('#quickCommentShortcutsReminder').hide();
                        });
                    }
                });
            });
        });
    },

    spoilerTip: function() {
        // Description: For adding some text to spoilers to tell people to hover over it
        $('.spoiler').prepend('<div id="isSpoiler" style="color:red; font-size:smaller; float:right;">hover to show spoiler<div>');
        $('.spoiler').hover(function() {
            $(this).find('#isSpoiler').hide(500);
        }, function() {
            $(this).find('#isSpoiler').show(500);
        });
    },

    commentReplies: function() {
        // Description: For adding reply links to comments
        $('.comment').each(function() {
            if ($('.topbar-links a span:eq(0)').text() != $(this).find('.comment-text a.comment-user').text()) { //make sure the link is not added to your own comments
                $(this).append('<span id="replyLink" title="reply to this user">&crarr;</span>');
            }
        });

        $('span[id="replyLink"]').css('cursor', 'pointer').on('click', function() {
            var parentDiv = $(this).parent().parent().parent().parent();
            var textToAdd = '@' + $(this).parent().find('.comment-text a.comment-user').text().replace(/\s/g, '').replace(/♦/, '') + ' '; //eg. @USERNAME [space]

            if (parentDiv.find('textarea').length) {
                parentDiv.find('textarea').append(textToAdd); //add the name
            } else {
                parentDiv.next('div').find('a').trigger('click'); //show the textarea
                parentDiv.find('textarea').append(textToAdd); //add the name
            }
        });
    },

    parseCrossSiteLinks: function() {
        // Description: For converting cross-site links to their titles
        var sites = ['stackexchange', 'stackoverflow', 'superuser', 'serverfault', 'askubuntu', 'stackapps', 'mathoverflow', 'programmers', 'bitcoin'];

        $('.post-text a').each(function() {
            var anchor = $(this);
            if (sites.indexOf($(this).attr('href').split('/')[2].split('.')[0]) > -1) { //if the link is to an SE site (not, for example, to google), do the necessary stuff
                if($(this).text() == $(this).attr('href')) { //if there isn't text on it (ie. bare url)
                    var sitename = $(this).attr('href').split('/')[2].split('.')[0],
                        id = $(this).attr('href').split('/')[4];

                    SOHelper.getFromAPI('questions', id, sitename, function(json) {
                        anchor.html(json.items[0].title); //Get the title and add it in
                    }, 'activity');
                }
            }
        });
    },

    /*answerCountSidebar: function() { //For adding the answer count as a tooltip to questions in the sidebar
        $('.sidebar-linked .linked .spacer a, .sidebar-related .related .spacer a').each(function(i) {
            if (!i % 2 == 0) { //odd only (ie. question title)
                var id = $(this).attr('href').split('/')[2],
                    sitename = $(location).attr('hostname').split('.')[0],
                    that = $(this);
                SOHelper.getFromAPI('questions', id,  sitename, function(json) {
                    answers = json.items[0].answer_count;
                    that.attr('title', answers + (answers == 1 ? ' answer' : ' answers'));
                }, 'activity');
            }
        });
    },*/

    linkQuestionAuthorName: function() {
        // Description: For adding a button to the editor toolbar to insert a link to a post and automatically add the author's name
        var div = '<div id="addLinkAuthorName" class="wmd-prompt-dialog sox-centered" style="display:none"> \
            <h5>Insert hyperlink with author\'s name</h5> \
            <br /> \
            <input id="link" placeholder="http://example.com/ \"optional title\"" size="50"> \
            <input id="addLinkOk" value="OK" type="button" style="margin: 10px; display: inline; width: 7em;"><input id="addLinkCancel" value="Cancel" type="button" style="margin: 10px; display: inline; width: 7em;"> \
           </div>';
        $('body').append(div);
        $('#addLinkAuthorName').css('top', '50%').css('position', 'fixed').css('height', '20%');

        $('#addLinkAuthorName #addLinkCancel').on('click', function() {
            $(this).parent().hide();
        });

        $('#addLinkAuthorName #addLinkOk').on('click', function() {
            var textarea = $('#post-editor #wmd-input'),
                link = $('#addLinkAuthorName #link').val(),
                id = link.split('/')[4],
                sitename = link.split('/')[2].split('.')[0],
                title = link.split('"')[1];

            if (link.split('/')[3].substr(0, 1) == 'a') { //for answers
                SOHelper.getFromAPI('answers', id, sitename, function(json) {
                    //Insert at caret thanks to http://stackoverflow.com/a/15977052/3541881
                    var caretPos = document.getElementById('wmd-input').selectionStart,
                        textAreaTxt = textarea.val(),
                        txtToAdd;

                    if (title) {
                        txtToAdd = '[@' + json.items[0].owner.display_name + ' says](' + link + ' "' + title + '")';
                    } else {
                        txtToAdd = '[@' + json.items[0].owner.display_name + ' says](' + link + ')';
                    }

                    textarea.val(textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring(caretPos));
                    $('#addLinkAuthorName').hide();
                }, 'activity');
            } else { //for questions
                SOHelper.getFromAPI('questions', id, sitename, function(json) {
                    //Insert at caret thanks to http://stackoverflow.com/a/15977052/3541881
                    var caretPos = document.getElementById('wmd-input').selectionStart,
                        textAreaTxt = textarea.val(),
                        txtToAdd;

                    if (title) {
                        txtToAdd = '[@' + json.items[0].owner.display_name + ' says](' + json.items[0].link + ' "' + title + '")';
                    } else {
                        txtToAdd = '[@' + json.items[0].owner.display_name + ' says](' + json.items[0].link + ')';
                    }

                    textarea.val(textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring(caretPos));
                    $('#addLinkAuthorName').hide();
                }, 'activity');
            }
        });

        var liSpan = '<li class="wmd-button" title="Hyperlink (with author name)" style="left: 450px;"><span id="wmd-author-link-button" style="background-position: -40px 0px;"></span></li>';

        setTimeout(function() {
            $('[id^="wmd-redo-button"]').after(liSpan);
            $('#wmd-author-link-button').on('click', function() {
                $('#addLinkAuthorName').show();
            });
        }, 1000);
    },

    confirmNavigateAway: function() {
        // Description: For adding a 'are you ure you want to go away' confirmation on pages where you have started writing something
        if (window.location.href.indexOf('questions/') >= 0) {
            $(window).bind('beforeunload', function() {
                if ($('.comment-form textarea').length && $('.comment-form textarea').val()) {
                    return 'Do you really want to navigate away? Anything you have written will be lost!';
                } else {
                    return;
                }
            });
        }
    },

    sortByBountyAmount: function() {
        // Description: For adding some buttons to sort bounty's by size
        if (!SOHelper.isOnUserProfile()) { //not on the user profile page
            if ($('.bounty-indicator').length) { //if there is at least one bounty on the page
                $('.question-summary').each(function() {
                    var bountyAmount = $(this).find('.bounty-indicator').text().replace('+', '');
                    $(this).attr('data-bountyamount', bountyAmount); //add a 'bountyamount' attribute to all the questions
                });

                var $wrapper = $('#question-mini-list').length ? $('#question-mini-list') : $wrapper = $('#questions'); //homepage/questions tab

                setTimeout(function() {
                    //filter buttons:
                    $('.subheader').after('<span>sort by bounty amount:&nbsp;&nbsp;&nbsp;</span><span id="largestFirst">largest first&nbsp;&nbsp;</span><span id="smallestFirst">smallest first</span>');

                    //Thanks: http://stackoverflow.com/a/14160529/3541881
                    $('#largestFirst').css('cursor', 'pointer').on('click', function() { //largest first
                        $wrapper.find('.question-summary').sort(function(a, b) {
                            return +b.getAttribute('data-bountyamount') - +a.getAttribute('data-bountyamount');
                        }).prependTo($wrapper);
                    });

                    //Thanks: http://stackoverflow.com/a/14160529/3541881
                    $('#smallestFirst').css('cursor', 'pointer').on('click', function() { //smallest first
                        $wrapper.find('.question-summary').sort(function(a, b) {
                            return +a.getAttribute('data-bountyamount') - +b.getAttribute('data-bountyamount');
                        }).prependTo($wrapper);
                    });
                }, 500);
            }
        }
    },

    isQuestionHot: function() {
        // Description: For adding some text to questions that are in the 30 most recent hot network questions

        function addHotText() {
            $('#feed').html('<p>In the top 30 most recent hot network questions!</p>');
            $('#question-header').prepend('<div title="this question is in the top 30 most recent hot network questions!" class="sox-hot">HOT<div>');
        }
        $('#qinfo').after('<div id="feed"></div>');

        setTimeout(function() {
            $('#feed').feeds({
                feeds: {
                    se: 'http://stackexchange.com/feeds/questions'
                },
                xml: true,
                entryTemplate: '<p></p>',
                loadingTemplate: '<div></div>',
                preprocess: function(feed) {
                    if (document.URL == this.xml.find('link').attr('href')) {
                        addHotText();
                    }
                }
            });
        }, 500);
    },

    autoShowCommentImages: function() {
        // Description: For auto-inlining any links to imgur images in comments
        $('.comment .comment-text .comment-copy a').each(function() {
            if ($(this).attr('href').indexOf('imgur.com') != -1) {
                var image = $(this).attr('href');
                $(this).replaceWith('<img src="' + image + '" width="100%">');
            }
        });
    },

    showCommentScores: function() {
        // Description: For adding a button on your profile comment history pages to show your comment's scores
        var sitename = SOHelper.getSiteName('api');
        $('.history-table td b a[href*="#comment"]').each(function() {
            var id = $(this).attr('href').split('#')[1].split('_')[0].replace('comment', '');
            $(this).after('<span class="showCommentScore" id="' + id + '">&nbsp;&nbsp;&nbsp;show comment score</span>');
        });
        $('.showCommentScore').css('cursor', 'pointer').on('click', function() {
            var $that = $(this);
            SOHelper.getFromAPI('comments', $that.attr('id'), sitename, function(json) {
                $that.html('&nbsp;&nbsp;&nbsp;' + json.items[0].score);
            });
        });
    },

    answerTagsSearch: function() {
        // Description: For adding tags to answers in search
        if (window.location.href.indexOf('search?q=') > -1) { //ONLY ON SEARCH PAGES!
            var sitename = SOHelper.getSiteName('api'),
                ids = [],
                idsAndTags = {};

            $.each($('div[id*="answer"]'), function() { //loop through all *answers*
                ids.push($(this).find('.result-link a').attr('href').split('/')[2]); //Get the IDs for the questions for all the *answers*
            });
            $.getJSON('https://api.stackexchange.com/2.2/questions/' + ids.join(';') + '?site=' + sitename, function(json) {
                var itemsLength = json.items.length;
                for (var i = 0; i < itemsLength; i++) {
                    idsAndTags[json.items[i].question_id] = json.items[i].tags;
                }
                console.log(idsAndTags);

                $.each($('div[id*="answer"]'), function() { //loop through all *answers*
                    var id = $(this).find('.result-link a').attr('href').split('/')[2]; //get their ID
                    var $that = $(this);
                    for (var x = 0; x < idsAndTags[id].length; x++) { //Add the appropiate tags for the appropiate answer
                        $that.find('.summary .tags').append('<a href="/questions/tagged/' + idsAndTags[id][x] + '" class="post-tag">' + idsAndTags[id][x] + '</a>'); //add the tags and their link to the answers
                    }
                    $that.find('.summary .tags a').each(function() {
                        if ($(this).text().indexOf('status-') > -1) { //if it's a mod tag
                            $(this).addClass('moderator-tag'); //add appropiate class
                        } else if ($(this).text().match(/(discussion|feature-request|support|bug)/)) { //if it's a required tag
                            $(this).addClass('required-tag'); //add appropiate class
                        }
                    });
                });
            });
        }
    },

    stickyVoteButtons: function() {
        // Description: For making the vote buttons stick to the screen as you scroll through a post
        //https://github.com/shu8/SE_OptionalFeatures/pull/14:
        //https://github.com/shu8/Stack-Overflow-Optional-Features/issues/28: Thanks @SnoringFrog for fixing this!

        var $votecells = $(".votecell");
        $votecells.css("width", "61px");

        stickcells();

        $(window).scroll(function() {
            stickcells();
        });

        function stickcells(){
            $votecells.each(function() {
                var offset = 0;
                if ($('.topbar').css('position') == 'fixed') {
                    offset = 34;
                }
                var vote = $(this).find('.vote');
                //var post_contents = $(this).next('td.postcell, td.answercell');
                if ($(this).offset().top - $(window).scrollTop() + offset <= 0) {
                    if ($(this).offset().top + $(this).height() - $(window).scrollTop() + offset - vote.height() > 34) {
                        vote.css({
                            position: 'fixed',
                            left: $(this).offset().left + 4,
                            top: 10 + offset
                        });
                    } else {
                        vote.removeAttr("style");
                    }
                } else {
                    vote.removeAttr("style");
                }
            });
        }
    },

    titleEditDiff: function() {
        // Description: For showing the new version of a title in a diff separately rather than loads of crossing outs in red and additions in green
        setTimeout(function() {
            var $questionHyperlink = $('.summary h2 .question-hyperlink').clone(),
                $questionHyperlinkTwo = $('.summary h2 .question-hyperlink').clone(),
                link = $('.summary h2 .question-hyperlink').attr('href'),
                added = ($questionHyperlinkTwo.find('.diff-delete').remove().end().text()),
                removed = ($questionHyperlink.find('.diff-add').remove().end().text());

            $('.summary h2 .question-hyperlink').hide();
            $('.summary h2 .question-hyperlink').after('<a href="' + link + '" class="question-hyperlink"><span class="diff-delete">' + removed + '</span><span class="diff-add">' + added + '</span></a>');
        }, 1000);
    },

    metaChatBlogStackExchangeButton: function() {
        // Description: For adding buttons next to sites under the StackExchange button that lead to that site's meta, chat and blog
        var blogSites = ['math', 'serverfault', 'english', 'stats', 'diy', 'bicycles', 'webapps', 'mathematica', 'christianity', 'cooking', 'fitness', 'cstheory', 'scifi', 'tex', 'security', 'islam', 'superuser', 'gaming', 'programmers', 'gis', 'apple', 'photo', 'dba'],
            link,
            blogLink = '//' + 'blog.stackexchange.com';
        $('#your-communities-section > ul > li > a').hover(function() {
            if ($(this).attr('href').substr(0, 6).indexOf('meta') == -1) {
                link = 'http://meta.' + $(this).attr('href').substr(2, $(this).attr('href').length - 1);
                if (blogSites.indexOf($(this).attr('href').split('/')[2].split('.')[0]) != -1) {
                    blogLink = '//' + $(this).attr('href').split('/')[2].split('.')[0] + '.blogoverflow.com';
                }

                $(this).find('.rep-score').hide();
                $(this).append('<div class="related-links" style="float: right;"> \
                                 <a href="' + link + '">meta</a> \
                                 <a href="http://chat.stackexchange.com">chat</a> \
                                 <a href="' + blogLink + '">blog</a> \
                                </div>');
            }
        }, function() {
            $(this).find('.rep-score').show();
            $(this).find('.related-links').remove();
        });
    },

    metaNewQuestionAlert: function() {
        // Description: For adding a fake mod diamond that notifies you if there has been a new post posted on the current site's meta

        var NEWQUESTIONS = 'metaNewQuestionAlert-lastQuestions',
            DIAMONDON = 'new-meta-questions-diamondOn',
            DIAMONDOFF = 'new-meta-questions-diamondOff';

        var favicon = $(".current-site a[href*='meta'] .site-icon").attr('class').split('favicon-')[1];

        var metaName = 'meta.' + $(location).attr('hostname').split('.')[0],
            lastQuestions = {},
            apiLink = 'https://api.stackexchange.com/2.2/questions?pagesize=5&order=desc&sort=activity&site=' + metaName;

        var $dialog = $('<div/>', {id: 'new-meta-questions-dialog', class: 'topbar-dialog achievements-dialog dno'}),
            $header = $('<div/>', {class: 'header'}).append($('<h3/>', {text: 'new meta posts'})),
            $content = $('<div/>', {class: 'modal-content'}),
            $questions = $('<ul/>', {id: 'new-meta-questions-dialog-list', class: 'js-items items'}),
            $diamond = $('<a/>', {id: 'new-meta-questions-button',
                                  class: 'topbar-icon yes-hover new-meta-questions-diamondOff',
                                  click: function(){
                                      $diamond.toggleClass('topbar-icon-on');
                                      $dialog.toggle();
                                  }});

        $dialog.append($header).append($content.append($questions)).prependTo('.js-topbar-dialog-corral');
        $('#soxSettingsButton').before($diamond);

        $(document).mouseup(function(e) {
            if (!$dialog.is(e.target) &&
                $dialog.has(e.target).length === 0 &&
                !$(e.target).is('#new-meta-questions-button')){
                $dialog.hide();
                $diamond.removeClass("topbar-icon-on");
            }
        });

        if (GM_getValue(NEWQUESTIONS, -1) == -1) {
            GM_setValue(NEWQUESTIONS, JSON.stringify(lastQuestions));
        } else {
            lastQuestions = JSON.parse(GM_getValue(NEWQUESTIONS));
        }

        $.getJSON(apiLink, function(json) {
            var latestQuestion = json.items[0].title;
            if (latestQuestion == lastQuestions[metaName]) {
                //if you've already seen the stuff
                $diamond.removeClass(DIAMONDON).addClass(DIAMONDOFF);
            } else {
                $diamond.removeClass(DIAMONDOFF).addClass(DIAMONDON);

                for (var i = 0; i < json.items.length; i++) {
                    var title = json.items[i].title,
                        link = json.items[i].link;
                        //author = json.items[i].owner.display_name;
                    addQuestion(title, link);

                }
                lastQuestions[metaName] = latestQuestion;

                $diamond.click(function() {
                    GM_setValue(NEWQUESTIONS, JSON.stringify(lastQuestions));
                });
            }
        });

        function addQuestion(title, link){
            var $li = $('<li/>'),
                $link = $('<a/>', {href: link}),
                $icon = $('<div/>', {class: 'site-icon favicon favicon-' + favicon}),
                $message = $('<div/>', {class: 'message-text'}).append($('<h4/>', {html: title}));

            $link.append($icon).append($message).appendTo($li);
            $questions.append($li);
        }


    },

    betterCSS: function() {
        // Description: For adding the better CSS for the voting buttons and favourite button
        $('head').append('<link rel="stylesheet" href="https://cdn.rawgit.com/shu8/SE-Answers_scripts/master/coolMaterialDesignCss.css" type="text/css" />');
    },

    standOutDupeCloseMigrated: function() {
        // Description: For adding cooler signs that a questions has been closed/migrated/put on hod/is a dupe
        var questions = {};
        $.each($('.question-summary'), function() { //Find the questions and add their id's and statuses to an object
            if ($(this).find('.summary a:eq(0)').text().trim().substr($(this).find('.summary a:eq(0)').text().trim().length - 11) == '[duplicate]') {
                questions[$(this).attr('id').split('-')[2]] = 'duplicate';
                $(this).find('.summary a:eq(0)').text($(this).find('.summary a:eq(0)').text().trim().substr(0, $(this).find('.summary a:eq(0)').text().trim().length - 11)); //remove [duplicate]

            } else if ($(this).find('.summary a:eq(0)').text().trim().substr($(this).find('.summary a:eq(0)').text().trim().length - 8) == '[closed]') {
                questions[$(this).attr('id').split('-')[2]] = 'closed';
                $(this).find('.summary a:eq(0)').text($(this).find('.summary a:eq(0)').text().trim().substr(0, $(this).find('.summary a:eq(0)').text().trim().length - 8)); //remove [closed]

            } else if ($(this).find('.summary a:eq(0)').text().trim().substr($(this).find('.summary a:eq(0)').text().trim().length - 10) == '[migrated]') {
                questions[$(this).attr('id').split('-')[2]] = 'migrated';
                $(this).find('.summary a:eq(0)').text($(this).find('.summary a:eq(0)').text().trim().substr(0, $(this).find('.summary a:eq(0)').text().trim().length - 10)); //remove [migrated]

            } else if ($(this).find('.summary a:eq(0)').text().trim().substr($(this).find('.summary a:eq(0)').text().trim().length - 9) == '[on hold]') {
                questions[$(this).attr('id').split('-')[2]] = 'onhold';
                $(this).find('.summary a:eq(0)').text($(this).find('.summary a:eq(0)').text().trim().substr(0, $(this).find('.summary a:eq(0)').text().trim().length - 9)); //remove [on hold]
            }
        });

        $.each($('.question-summary'), function() { //loop through questions
            var $that = $(this);
            $.each(questions, function(key, val) { //loop through object of questions closed/dupes/migrated
                if ($that.attr('id').split('-')[2] == key) {
                    $that.find('.summary a:eq(0)').after('&nbsp;<span class="standOutDupeCloseMigrated-' + val + '">&nbsp;' + val + '&nbsp;</span>'); //add appropiate message
                }
            });
        });
    },

    editReasonTooltip: function() {
        // Description: For showing the latest revision's comment as a tooltip on 'edit [date] at [time]'

        function getComment(url, $that) {
            $.get(url, function(responseText, textStatus, XMLHttpRequest) {
                $that.find('.sox-revision-comment').attr('title', $(XMLHttpRequest.responseText).find('.revision-comment:eq(0)')[0].innerHTML);
            });
        }
        $('.question, .answer').each(function() {
            if ($(this).find('.post-signature').length > 1) {
                var id = $(this).attr('data-questionid') || $(this).attr('data-answerid');
                $(this).find('.post-signature:eq(0)').find('.user-action-time a').wrapInner('<span class="sox-revision-comment"></span>');
                var $that = $(this);
                getComment('http://' + $(location).attr('hostname') + '/posts/' + id + '/revisions', $that);
            }
        });
    },

    addSBSBtn: function() {
        // Description: For adding a button to the editor toolbar to toggle side-by-side editing
        // Thanks szego (@https://github.com/szego) for completely rewriting this! https://github.com/shu8/SE-Answers_scripts/pull/2
        function startSBS(toAppend) {
            //variables to reduce DOM searches
            var wmdinput = $('#wmd-input' + toAppend);
            var wmdpreview = $('#wmd-preview' + toAppend);
            var posteditor = $('#post-editor' + toAppend);
            var draftsaved = $('#draft-saved' + toAppend);
            var draftdiscarded = $('#draft-discarded' + toAppend);

            $('#wmd-button-bar' + toAppend).toggleClass('sbs-on');

            draftsaved.toggleClass('sbs-on');
            draftdiscarded.toggleClass('sbs-on');
            posteditor.toggleClass('sbs-on');
            wmdinput.parent().toggleClass('sbs-on'); //wmdinput.parent() has class wmd-container
            wmdpreview.toggleClass('sbs-on');

            if (toAppend.length > 0) { //options specific to making edits on existing questions/answers
                posteditor.find('.hide-preview').toggleClass('sbs-on');

                //hack: float nuttiness for "Edit Summary" box
                var editcommentp1 = $('#edit-comment' + toAppend).parent().parent().parent().parent().parent();
                editcommentp1.toggleClass('edit-comment-p1 sbs-on');
                editcommentp1.parent().toggleClass('edit-comment-p2 sbs-on');
            } else if (window.location.pathname.indexOf('questions/ask') > -1) { //extra CSS for 'ask' page
                wmdpreview.toggleClass('sbs-newq');
                draftsaved.toggleClass('sbs-newq');
                draftdiscarded.toggleClass('sbs-newq');
                $('.tag-editor').parent().toggleClass('tag-editor-p sbs-on sbs-newq');
                $('#question-only-section').children('.form-item').toggleClass('sbs-on sbs-newq');

                //swap the order of things to prevent draft saved/discarded messages from
                // moving the preview pane around
                if (wmdpreview.hasClass('sbs-on')) {
                    draftsaved.before(wmdpreview);
                } else {
                    draftdiscarded.after(wmdpreview);
                }
            }

            if (wmdpreview.hasClass('sbs-on')) { //sbs was toggled on
                $('#sidebar').addClass('sbs-on');
                $('#content').addClass('sbs-on');

                if (toAppend.length > 0) { //current sbs toggle is for an edit
                    $('.votecell').addClass('sbs-on');
                }

                //stretch the text input window to match the preview length
                // - "215" came from trial and error
                // - Can this be done using toggleClass?
                var previewHeight = wmdpreview.height();
                if (previewHeight > 215) { //default input box is 200px tall, only scale if necessary
                    wmdinput.height(previewHeight - 15);
                }
            } else { //sbs was toggled off
                //check if sbs is off for all existing questions and answers
                if (!$('.question').find('.wmd-preview.sbs-on').length && !$('.answer').find('.wmd-preview.sbs-on').length) {
                    $('.votecell').removeClass('sbs-on');

                    if (!($('#wmd-preview').hasClass('sbs-on'))) { //sbs is off for everything
                        $('#sidebar').removeClass('sbs-on');
                        $('#content').removeClass('sbs-on');
                    }
                }

                //return input text window to original size
                // - Can this be done using toggleClass?
                wmdinput.height(200);
            }
        }

        function SBS(jNode) {
            var itemid = jNode[0].id.replace(/^\D+/g, '');
            var toAppend = (itemid.length > 0 ? '-' + itemid : ''); //helps select tags specific to the question/answer being
            // edited (or new question/answer being written)
            setTimeout(function() {
                var sbsBtn = '<li class="wmd-button" title="side-by-side-editing" style="left: 500px;width: 170px;"> \
<div id="wmd-sbs-button' + toAppend + '" style="background-image: none;"> \
Toggle SBS?</div></li>';
                jNode.after(sbsBtn);

                //add click listener to sbsBtn
                jNode.next().on('click', function() {
                    startSBS(toAppend);
                });

                //add click listeners for "Save Edits" and "cancel" buttons
                // - also gets added to the "Post New Question" and "Post New Answer" button as an innocuous (I think) side effect
                $('#post-editor' + toAppend).siblings('.form-submit').children().on('click', function() {
                    if ($(this).parent().siblings('.sbs-on').length) { //sbs was on, so turn it off
                        startSBS(toAppend);
                    }
                });
            }, 1000);
        }

        //Adding script dynamically because @requiring causes the page load to hand -- don't know how to fix! :(
        var script = document.createElement('script');
        script.src = 'https://cdn.rawgit.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js';
        document.getElementsByTagName('head')[0].appendChild(script);
        //This is a heavily modified version by szego <https://github.com/szego/SE-Answers_scripts/blob/master/side-by-side-editing.user.js>:
        setTimeout(function() {
            if (window.location.pathname.indexOf('questions/ask') < 0) { //not posting a new question
                //get question and answer IDs for keeping track of the event listeners
                var anchorList = $('#answers > a'); //answers have anchor tags before them of the form <a name="#">,
                // where # is the answer ID
                // TODO: test
                var numAnchors = anchorList.length;
                var itemIDs = [];

                for (var i = 1; i <= numAnchors - 2; i++) { //the first and last anchors aren't answers
                    itemIDs.push(anchorList[i].name);
                }
                itemIDs.push($('.question').data('questionid'));

                //event listeners for adding the sbs toggle buttons for editing existing questions or answers
                for (i = 0; i <= numAnchors - 2; i++) {
                    waitForKeyElements('#wmd-redo-button-' + itemIDs[i], SBS);
                }
            }

            //event listener for adding the sbs toggle button for posting new questions or answers
            waitForKeyElements('#wmd-redo-button', SBS);
        }, 2000);
    },

    alwaysShowImageUploadLinkBox: function() {
        // Description: For always showing the 'Link from the web' box when uploading an image.
        var body = document.getElementById('body'); //Code courtesy of Siguza <http://meta.stackoverflow.com/a/306901/3541881>! :)
        if (body) {
            new MutationObserver(function(records) {
                records.forEach(function(r) {
                    Array.prototype.forEach.call(r.addedNodes, function(n) {
                        if (n.classList.contains('image-upload')) {
                            new MutationObserver(function(records, self) {
                                var link = n.querySelector('.modal-options-default.tab-page a');
                                if (link) {
                                    link.click();
                                    self.disconnect();
                                }
                            }).observe(n, {
                                childList: true
                            });
                        }
                    });
                });
            }).observe(body, {
                childList: true
            });
        }
    },

    addAuthorNameToInboxNotifications: function() {
        // Description: To add the author's name to inbox notifications

        var getAuthorName = (function() {
            var getFromAPI = {
                'comment': function(d) {
                    var comment_id = d.link.split('/')[5].split('?')[0];
                    SOHelper.getFromAPI('comments', comment_id, d.sitename, function(json) {
                        d.n.find('.item-header .item-type').text(d.n.find('.item-header .item-type').text() + ' (' + json.items[0].owner.display_name + ')');
                    });
                },
                'answer': function(d) {
                    var answer_id = d.link.split('/')[4].split('?')[0];
                    SOHelper.getFromAPI('answers', answer_id, d.sitename, function(json) {
                        d.n.find('.item-header .item-type').text(d.n.find('.item-header .item-type').text() + ' (' + json.items[0].owner.display_name + ')');
                    });
                },
                'edit suggested': function(d) {
                    var edit_id = d.link.split('/')[4];
                    SOHelper.getFromAPI('suggested-edits', edit_id, d.sitename, function(json) {
                        d.n.find('.item-header .item-type').text(d.n.find('.item-header .item-type').text() + ' (' + json.items[0].proposing_user.display_name + ')');
                    });
                },
                'other': function(d) {
                    console.log('Script does not currently support getting author information for type "' + d.n.find('.item-header .item-type').text() + '"!');
                }
            };

            return function($node) {
                (getFromAPI[$node.find('.item-header .item-type').text()] || getFromAPI.other)({
                    n: $node,
                    link: $node.find('a').eq(0).attr('href'),
                    sitename: $node.find('a').eq(0).attr('href').split('/')[2].split('.')[0]
                });
            };
            //TODO: test
        })();

        new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var length = mutation.addedNodes.length;
                for (var i = 0; i < length; i++) {
                    var $addedNode = $(mutation.addedNodes[i]);
                    if (!$addedNode.hasClass('inbox-dialog')) {
                        return;
                    }

                    for (var x = 0; x < 16; x++) { //first 15 items
                        getAuthorName($addedNode.find('.inbox-item').eq(x));
                    }
                }
            });
        }).observe(document.body, {
            childList: true,
            attributes: true,
            subtree: true
        });
    },

    flagOutcomeTime: function() {
        // Description: For adding the flag outcome time to the flag page
        //https://github.com/shu8/Stack-Overflow-Optional-Features/pull/32
        $('.flag-outcome').each(function() {
            $(this).append(' – ' + $(this).attr('title'));
        });
    },

    scrollToTop: function() {
        // Description: For adding a button at the bottom right part of the screen to scroll back to the top
        //https://github.com/shu8/Stack-Overflow-Optional-Features/pull/34
        if (SOHelper.getSiteType() !== 'chat') { // don't show scrollToTop button while in chat.
            $('<div/>', {
                id: 'sox-scrollToTop',
                click: function(e) {
                    e.preventDefault();
                    $('html, body').animate({
                        scrollTop: 0
                    }, 800);
                    return false;
                }
            }).append($('<i/>', {
                class: 'fa fa-angle-double-up fa-3x'
            })).appendTo('div.container');

            if ($(window).scrollTop() < 200) {
                $('#sox-scrollToTop').hide();
            }

            $(window).scroll(function() {
                if ($(this).scrollTop() > 200) {
                    $('#sox-scrollToTop').fadeIn();
                } else {
                    $('#sox-scrollToTop').fadeOut();
                }
            });
        }
    },

    flagPercentages: function() {
        // Description: For adding percentages to the flag summary on the flag page
        //By @enki; https://github.com/shu8/Stack-Overflow-Optional-Features/pull/38, http://meta.stackoverflow.com/q/310881/3541881, http://stackapps.com/q/6773/26088
        var group = {
            POST: 1,
            SPAM: 2,
            OFFENSIVE: 3,
            COMMENT: 4
        };
        var type = {
            TOTAL: 'flags',
            WAITING: 'waiting',
            HELPFUL: 'helpful',
            DECLINED: 'declined',
            DISPUTED: 'disputed',
            AGEDAWAY: 'aged away'
        };

        var count,
            percentage;

        function addPercentage(group, type, percentage) {
            var $span = $('<span/>', {
                text: '({0}%)'.replace('{0}', percentage),
                style: 'margin-left:5px; color: #999; font-size: 12px;'
            });
            $('td > a[href*="group=' + group + '"]:contains("' + type + '")').after($span);
        }

        function calculatePercentage(count, total) {
            var percent = (count / total) * 100;
            return +percent.toFixed(2);
        }

        function getFlagCount(group, type) {
            var flagCount = 0;
            flagCount += Number($('td > a[href*="group=' + group + '"]:contains("' + type + '")')
                .parent()
                .prev()
                .text()
                .replace(',', ''));
            return flagCount;
        }

        // add percentages
        for (var groupKey in group) {
            var item = group[groupKey],
                total = getFlagCount(item, type.TOTAL);
            for (var typeKey in type) {
                typeItem = type[typeKey];
                if (typeKey !== 'TOTAL') {
                    count = getFlagCount(item, typeItem);
                    percentage = calculatePercentage(count, total);
                    //console.log(groupKey + ": " + typeKey + " Flags -- " + count);
                    addPercentage(item, typeItem, percentage);
                }
            });
        }
    },

    linkedPostsInline: function() {
        // Description: Displays linked posts inline with an arrow

        function getIdFromUrl(url) {
            if (url.indexOf('/a/') > -1) { //eg. http://meta.stackexchange.com/a/26764/260841
                return url.split('/a/')[1].split('/')[0];

            } else if (url.indexOf('/q/') > -1) { //eg. http://meta.stackexchange.com/q/26756/260841
                return url.split('/q/')[1].split('/')[0];

            } else if (url.indexOf('/questions/') > -1) {
                if (url.indexOf('#') > -1) { //then it's probably an answer, eg. http://meta.stackexchange.com/questions/26756/how-do-i-use-a-small-font-size-in-questions-and-answers/26764#26764
                    return url.split('#')[1];

                } else { //then it's a question
                    return url.split('/questions/')[1].split('/')[0];
                }
            }
        }

        $('.post-text a, .comments .comment-copy a').each(function() {
            var url = $(this).attr('href');
            if (url && url.indexOf($(location).attr('hostname')) > -1 && /\/questions\//.test(url) && /#comment/.test(url)) {
                $(this).css('color', '#0033ff');
                $(this).before('<a class="expander-arrow-small-hide expand-post-sox"></a>');
            }
        });

        $(document).on('click', 'a.expand-post-sox', function() {
            if ($(this).hasClass('expander-arrow-small-show')) {
                $(this).removeClass('expander-arrow-small-show');
                $(this).addClass('expander-arrow-small-hide');
                $('.linkedPostsInline-loaded-body-sox').remove();
            } else if ($(this).hasClass('expander-arrow-small-hide')) {
                $(this).removeClass('expander-arrow-small-hide');
                $(this).addClass('expander-arrow-small-show');
                var $that = $(this);
                var id = getIdFromUrl($(this).next().attr('href'));
                $.get('http://' + $(location).attr('hostname') + '/posts/' + id + '/body', function(d) {
                    var div = '<div class="linkedPostsInline-loaded-body-sox" style="background-color: #ffffcc;">' + d + '</div>';
                    $that.next().after(div);
                });
            }
        });
    },

    hideHotNetworkQuestions: function() {
        // Description: Hides the Hot Network Questions module from the sidebar
        $('#hot-network-questions').remove();
    },

    hideHireMe: function() {
        // Description: Hides the Looking for a Job module from the sidebar
        $('#hireme').remove();
    },

    hideCommunityBulletin: function() {
        // Description: Hides the Community Bulletin module from the sidebar
        $('#sidebar .community-bulletin').remove();
    },

    hideSearchBar: function() {
        // Description: Replaces the searchbox with a button that takes you to the search page
        var $topbar = $('.topbar'),
            $links = $topbar.find('.topbar-menu-links'),
            $searchbar = $topbar.find('.search-container'),
            $search = $('<a/>', {
                href: '/search',
                title: 'Search ' + SOHelper.getSiteName()
            }).append($('<i/>', {
                class: 'fa fa-search'
            }));

        $searchbar.remove();
        $links.append($search);
    },
    
    themes: function() {
        theming();
    },

    editTheme: function() { //only if retheme exists
        if (JSON.parse(GM_getValue(SOX_SETTINGS)).themes) {
            var $themeEditor = $(GM_getResourceText('themeEditor')),
                $soxThemeButton = $('<a/>', {
                    id: 'soxThemeButton',
                    class: 'topbar-icon yes-hover sox-theme-button', //TODO: sox-theme-button
                    title: 'Edit site theme',
                    style: 'color: #A1A1A1',
                    click: function(e) {
                        e.preventDefault();
                        $('#sox-theme-editor').toggle();
                    }
                }),
                $icon = $('<i/>', {
                    class: 'fa fa-css3' //TODO
                });
            $themeEditor.appendTo('body');
            $soxThemeButton.append($icon).appendTo('div.network-items');
            themeEditor();
        }
    }
};
