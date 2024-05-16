/************************************************************************************************************************************************************************/
/***** CHATBOX***********************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
function toggle_chatbox() {
    $('#chatbox').toggle()
    $('#chatbtn').toggle()
}
/************************************************************************************************************************************************************************/
/***** PERSON ***********************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
function add_person() {
    const n       = session_data.persons.length;
    const example = {
        "firstname": "John",
        "lastname" : "Doe",
        "role"     : "Example",
        "function" : "Peasant"
    };
    session_data.persons.push(example);
    display_person(example, n);
}

function display_person(person, n){
    $("#tab-persons table tbody").append(
        "<tr>" + 
            `<td contenteditable="true" data-field="first_name" onblur="session_data.persons[${n}].firstname = $(this).text()">${person.firstname}</td>` +
            `<td contenteditable="true" data-field="last_name"  onblur="session_data.persons[${n}].lastname  = $(this).text()">${person.lastname}</td>`  +
            `<td contenteditable="true" data-field="role"       onblur="session_data.persons[${n}].role      = $(this).text()">${person.role}</td>`      +
            `<td contenteditable="true" data-field="function"   onblur="session_data.persons[${n}].function  = $(this).text()">${person.function}</td>`  +
            `<td><button type="button"  class="btn btn-danger" onclick="delete_person(${n})"><i class="bi bi-trash3-fill"></i></button></td>`            +
        "</tr>"
    )
}
function display_all_persons() {
    const n = session_data.persons.length;
    $("#tab-persons table tbody").empty()

    for (var i = 0; i < n; i++) {
        display_person(session_data.persons[i], i);
    }
} 

function delete_person(idx) {
    // actually delete some person
    var n = session_data.persons.length;
    if (idx == 0) {
        session_data.persons.shift();
    } else {
        for(var i = idx + 1; i < n; i++) {
            session_data.persons[i-1] = session_data.persons[i];
        }
        session_data.persons.pop()
    }

    display_all_persons()
}
/************************************************************************************************************************************************************************/
/***** LOCATIONS ********************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
function add_location() {
    const n       = session_data.locations.length;
    const example = {
        "name"    : "Neverland",
        "loctype" : "Country"
    };
    session_data.locations.push(example);
    display_location(example, n);
}

function display_location(location, n){
    $("#tab-locations table tbody").append(
        "<tr>" + 
            `<td contenteditable="true" data-field="loc_name" onblur="session_data.locations[${n}].name    = $(this).text()" >${location.name}</td>`   +
            `<td contenteditable="true" data-field="loctype"  onblur="session_data.locations[${n}].loctype = $(this).text()">${location.loctype}</td>` +
            `<td><button type="button"  class="btn btn-danger" onclick="delete_location(${n})"><i class="bi bi-trash3-fill"></i></button></td>`        +
        "</tr>"
    )
}
function display_all_locations() {
    const n = session_data.locations.length;
    $("#tab-locations table tbody").empty()

    for (var i = 0; i < n; i++) {
        display_location(session_data.locations[i], i);
    }
} 

function delete_location(idx) {
    // actually delete some location
    var n = session_data.locations.length;
    if (idx == 0) {
        session_data.locations.shift();
    } else {
        for(var i = idx + 1; i < n; i++) {
            session_data.locations[i-1] = session_data.locations[i];
        }
        session_data.locations.pop()
    }

    display_all_locations()
}
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
/***** UTILS ************************************************************************************************************************************************************/
/************************************************************************************************************************************************************************/
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