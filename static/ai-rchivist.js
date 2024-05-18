/************************************************************************************************************************************************************************/
/***** NAVIGATION *******************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
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
/************************************************************************************************************************************************************************/
/***** GLOBAL STATE *****************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
var state = {
    "document_data": {
        "document" : "example document",
        "doctype"  : "UNKNOWN",
        "act_date" : "UNKNOWN",
        "fact_date": "UNKNOWN",
        "summary"  : {
            "en"   : "english",
            "fr"   : "french",
            "nl"   : "dutch",
            "de"   : "german"
        },
        "persons"  : [],
        "locations": []
    },
    "conversation" : []
};
var document_data = state.document_data;
var conversation  = state.conversation;

function set_global_state(newstate) {
    state = newstate;
    set_global_documentdata(state.document_data);
    set_global_conversation(state.conversation);
}
function set_global_documentdata(data) {
    document_data = data;
    refresh_documentdata(document_data);
}
function refresh_documentdata(data) {
    refresh_document(data.document);
    refresh_metadata(data);
    refresh_persons(data.persons);
    refresh_locations(data.locations);
}
function set_global_conversation(convers) {
    conversation  = state.conversation;
    refresh_conversation(conversation);
}
/************************************************************************************************************************************************************************/
/***** CHATBOX***********************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
function toggle_chatbox() {
    $('#chatbox').toggle()
    $('#chatbtn').toggle()
}
function refresh_conversation(conversation) {
    // TODO
}
function send_chat() {
    // prepare to send message
    message = {
        "role"   : "user",
        "content": $("#message-input").val()
    };
    conversation.push(message);

    // actually do send the message
    $.ajax({
        url:         "/chat",
        type:        "POST",
        data:        JSON.stringify(state),
        contentType: "application/json; charset=utf-8",
        dataType:    "json",
        success:     set_global_state, 
        error:       error_handler,
    });
}
/************************************************************************************************************************************************************************/
/***** DOCUMENT *********************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
function refresh_document(doc) {
    $("#dta-document").val(doc)
}
function initiate_conversation() {
    $.ajax({
        url:         "/initiate",
        type:        "POST",
        data:        JSON.stringify(document_data.document),
        contentType: "application/json; charset=utf-8",
        dataType:    "json",
        success:     set_global_state, 
        error:       error_handler,
    });
}
/************************************************************************************************************************************************************************/
/***** METADATA *********************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
function refresh_metadata(metadata) {
    set_metadata_doctype(metadata.doctype);
    $("#dta-actdate").val(metadata.act_date);
    $("#dta-factdate").val(metadata.fact_date);
    set_metadata_summary(metadata.summary);
}
function set_metadata_doctype(dtype){
    if (dtype == "REMISSION" || dtype == "SENTENCE") {
        $("#dta-doctype").val(dtype);
    } else {
        $("#dta-doctype").val("UNKNOWN");
    }
}
function set_metadata_summary(summary){
    $("#dta-summary-en").val(summary.en);
    $("#dta-summary-fr").val(summary.fr);
    $("#dta-summary-nl").val(summary.nl);
    $("#dta-summary-de").val(summary.de);
}
/************************************************************************************************************************************************************************/
/***** PERSON ***********************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
function refresh_persons() {
    const n = document_data.persons.length;
    $("#tab-persons table tbody").empty()

    for (var i = 0; i < n; i++) {
        display_person(document_data.persons[i], i);
    }
}

function display_person(person, n){
    $("#tab-persons table tbody").append(
        "<tr>" + 
            `<td contenteditable="true" data-field="first_name" onblur="document_data.persons[${n}].firstname = $(this).text()">${person.firstname}</td>` +
            `<td contenteditable="true" data-field="last_name"  onblur="document_data.persons[${n}].lastname  = $(this).text()">${person.lastname}</td>`  +
            `<td contenteditable="true" data-field="role"       onblur="document_data.persons[${n}].role      = $(this).text()">${person.role}</td>`      +
            `<td contenteditable="true" data-field="function"   onblur="document_data.persons[${n}].function  = $(this).text()">${person.function}</td>`  +
            `<td><button type="button"  class="btn btn-danger" onclick="delete_person(${n})"><i class="bi bi-trash3-fill"></i></button></td>`            +
        "</tr>"
    )
}

function add_person() {
    const n       = document_data.persons.length;
    const example = {
        "firstname": "John",
        "lastname" : "Doe",
        "role"     : "Example",
        "function" : "Peasant"
    };
    document_data.persons.push(example);
    display_person(example, n);
}

function delete_person(idx) {
    // actually delete some person
    var n = document_data.persons.length;
    if (idx == 0) {
        document_data.persons.shift();
    } else {
        for(var i = idx + 1; i < n; i++) {
            document_data.persons[i-1] = document_data.persons[i];
        }
        document_data.persons.pop()
    }

    refresh_persons()
}
/************************************************************************************************************************************************************************/
/***** LOCATIONS ********************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
function refresh_locations() {
    const n = document_data.locations.length;
    $("#tab-locations table tbody").empty()

    for (var i = 0; i < n; i++) {
        display_location(document_data.locations[i], i);
    }
} 
function display_location(location, n){
    $("#tab-locations table tbody").append(
        "<tr>" + 
            `<td contenteditable="true" data-field="loc_name" onblur="document_data.locations[${n}].name    = $(this).text()" >${location.name}</td>`   +
            `<td contenteditable="true" data-field="loctype"  onblur="document_data.locations[${n}].loctype = $(this).text()">${location.loctype}</td>` +
            `<td><button type="button"  class="btn btn-danger" onclick="delete_location(${n})"><i class="bi bi-trash3-fill"></i></button></td>`        +
        "</tr>"
    )
}
function add_location() {
    const n       = document_data.locations.length;
    const example = {
        "name"    : "Neverland",
        "loctype" : "Country"
    };
    document_data.locations.push(example);
    display_location(example, n);
}
function delete_location(idx) {
    // actually delete some location
    var n = document_data.locations.length;
    if (idx == 0) {
        document_data.locations.shift();
    } else {
        for(var i = idx + 1; i < n; i++) {
            document_data.locations[i-1] = document_data.locations[i];
        }
        document_data.locations.pop()
    }

    refresh_locations()
}
/************************************************************************************************************************************************************************/
/***** UTILS ************************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
function post(url, data) {
    return $.ajax({
        url:         url,
        type:        "POST",
        data:        JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType:    "json",
        success:     function(){
            console.log("post ok")
        }, 
        error: error_handler,
    })  
}
function error_handler(xhr, err) {
    $("#error-panel").html(
        `
        <div class="errorbox">
            <div class="errorbox-header">
                <span class="errorbox-title"> <i class="bi bi-cone-striped"></i> Oops !</span>
                <button class="btn-close" aria-label="Close" onclick="$('#error-panel').hide()"></button>
            </div>
            <div class="errorbox-body">
                ${xhr.responseText}
            </div>
        </div>
        `
    );
    $("#error-panel").show();
}