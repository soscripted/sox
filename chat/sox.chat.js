//title change hacks: http://stackoverflow.com/a/2499119/3323231\
http://stackoverflow.com/a/29540461/3323231
$("#new_tab").on("click", function() {
    $("#new_tab").before($("<li/>"));
    $("#tabs").append($("<li/>"));
    $("#tabs:last").html("<iframe/>", {
        "src": "http://chat.stackexchange.com/"
    });
})
