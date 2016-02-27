themeEditor = function() {
    var siteName = SOHelper.getSiteName(),
        siteType = SOHelper.getSiteType();
    function userSelectElement() {
        $("#sox-theme-editor").hide();
        //highlight element under mouse - http://stackoverflow.com/questions/4711023/how-do-i-efficiently-highlight-element-under-mouse-cursor-with-an-overlay
        window.selectingElement = true;
        var $box = $("<div/>", {"class": "outer"}).css({
            display: "none",
            position: "absolute",
            zIndex: 65535,
            background: "rgba(128, 128, 255, .3)"
        }).appendTo("body"),
            mouseX, mouseY, target, lastTarget;

        // in case you need to support older browsers use a requestAnimationFrame polyfill
        // e.g: https://gist.github.com/paulirish/1579671
        window.requestAnimationFrame(function frame() {
            if (selectingElement) window.requestAnimationFrame(frame);
            if (target && target.className === "outer") {
                $box.hide();
                target = document.elementFromPoint(mouseX, mouseY);
            }
            $box.show();

            if (target === lastTarget) return;

            lastTarget = target;
            var $target = $(target);
            var offset = $target.offset();
            $box.css({
                width:  $target.outerWidth()  - 1,
                height: $target.outerHeight() - 1,
                left:   offset.left,
                top:    offset.top
            });
        });

        $("body").on("mousemove", function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            target = e.target;
        });

        $box.on("click", function() {
            selectingElement = false;
            $box.remove();
            var target = document.elementFromPoint(mouseX, mouseY);
            var $tr = $("<tr/>", {"class": "sox-attribute"});
            [].slice.call(target.attributes).forEach(function(attr) {
                $tr.append("<td>" + attr.name + "</td><td>" + attr.value + "</td>");
            });
            $("#sox-element-attributes").html($tr);
            $tr = $("<tr/>");
            [].slice.call(target.classList).forEach(function(cls){
                $tr.append("<li class=\"sox-classlist\">" + cls + "</li>");
            });
            $("#sox-element-classes").html($tr);
            $("#sox-element-id").html(target.id);
            $("#sox-element-tag").html(target.tagName.toLowerCase());
            $("body").off("mousemove");
            $("#sox-theme-editor").show();
        });
    }
    $("#sox-theme-editor-select").click(userSelectElement);
    //populate style items
    var styles = [],
        browserspecific = [];
    for(var item in document.body.style) {
        if(item.startsWith('Moz') || item.startsWith('webkit')) {
            browserspecific.push(item); //TODO: IE, mobile
        } else {
            styles.push(item);
        };
    };
    $("#sox-style-item-selector").append(styles.reduce(function(total, next) {
        return total + '<option value="' + next + '">' + next + "</option>"
    });
    $("#sox-style-item-selector-browser-specific").append(browserspecific.reduce(function(total, next) {
        return total + '<option value="' + next + '">' + next + "</option>"
    });
    $("#sox-style-item-selector").on("change", function() { //TODO: only on value change
    });
    $("#sox-style-item-selector-browser-specific").on("change", function() {
        if($("#sox-style-item-selector-browser-specific").val().contains("color") {
            $("sox-style-item-value").attr("type", "color");
        } else {
            $("sox-style-item-value").attr("type", "text");
        }
    });
    /* -------- Highlighters/anti-highlighters -------- */
    $("#sox-element-classes").on("mouseenter", "li", function(e) {
        $("." + e.target.innerHTML).addClass("sox-highlight")
    });
    $("#sox-element-classes").on("mouseleave", "li", function(e) {
        $("." + e.target.innerHTML).removeClass("sox-highlight")
    });
    $$("#sox-element-id").on("mouseenter", "li", function(e) {
        $("#" + e.target.innerHTML).addClass("sox-highlight")
    });
    $("#sox-element-id").on("mouseleave", "li", function(e) {
        $("#" + e.target.innerHTML).removeClass("sox-highlight")
    });
    /* -------- Adders -------- */
    $("#sox-element-attributes").on("click", "li", function(e) {
        //TODO: check for dupe
        //selected to css
        $("#sox-edited-rule").append('<span class="sox-rule-selector">['/*att*/ + e.target.innerHTML + "]</span>");
    });
    $("#sox-element-classes").on("click", "li", function(e) {
        //TODO: check for dupe
        $("#sox-edited-rule").append('<span class="sox-rule-selector">.' + e.target.innerHTML + "</span>");
    });
    $("#sox-element-id").on("click", function(e) {
        //TODO: check for dupe
        $("#sox-edited-rule").append('<span class="sox-rule-selector">#' + e.target.innerHTML + "</span>");
    });
    $("#sox-element-tag").on("click", function(e) {
        //TODO: check for dupe
        $("#sox-edited-rule").append('<span class="sox-rule-selector">' + e.target.innerHTML + "</span>");
    });
    $("#sox-rule-applies-to").on("click", "li", function(e) {
        $("#sox-rule-applies-to").remove($(e.target));
    });
    //Add rule click handler
    $("#sox-add-style-item").on("click", function() {
        var styleName = $("#sox-style-item-selector").is(':enabled')
            ? $("#sox-style-item-selector").val()
            : $("#sox-style-item-selector-browser-specific").val();
        $("#sox-edited-rule").html($("#sox-edited-rule").html().replace(/\r\n}$/m, "    " + styleName + ":" + $("sox-style-item-value").val() + ";\r\n}"))
    });
    $("#sox-rule-toggle-display").on("click", function() {

    });
    //TODO: load existing rule - parse css - display as what name?
    var matches = /^(?:\s*([^{,]+),)*(?:\s*([^{]+))\s*\{(?:\s*([^:]+):\s*([^;]+)\s*;)+\s*\}\s*$/.exec(foo) //TODO: get all results
    $("#sox-rule-add").on("click", function() {
        var save = true;
        if (GM_getValue(siteName + "_" + siteType + "_" + THEME_NAME + "_CSS")) {
            save = confirm('Overwrite existing theme?');
        }
        if (save) {
            GM_setValue(siteName + "_" + siteType + "_" + THEME_NAME + "_CSS",
                GM_getValue(siteName + "_" + siteType + "_" + THEME_NAME + "_CSS") + "\n" + $("sox-edited-rule").text()
            );
        }
    });
    //TODO: @media - only when [height|v] under - find valid media rules
    //must be child of e.target.parentElement - highlight, yes/yes and continue/go up one level/cancel
    //TODO: option to cleanup/split rules with same settings/same selectors (order selectors first, type -> depth)
    //TODO: delete theme: GM_deleteValue(siteName + "_" + siteType + "_" + THEME_NAME + "_CSS")
    //TODO: theme URL manager
    //TODO: theme repos
}
