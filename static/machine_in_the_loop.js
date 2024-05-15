function toggle_chatbox() {
    $('#chatbox').toggle()
    $('#chatbtn').toggle()
}

function nav_to(tab) {
    var tabs      = ["document", "metadata", "persons", "locations"];

    var targettab = `#tab-${tab}`;
    var targetnav = `#nav-${tab}`;

    tabs.forEach(function(tab) {
        var tabname = `#tab-${tab}`;
        var navname = `#nav-${tab}`;

        if (tabname == targettab) {
            $(navname).addClass("active");
            $(tabname).show();
        } else {
            $(navname).removeClass("active");
            $(tabname).hide();
        }
    });
}

function post(url, data) {
    $.ajax({
        url:         url,
        type:        "POST",
        data:        JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType:    "json",
        success:     function(){
            console.log("post ok")
        }
    })  
}