/**
 * This component is meant to display and edit the list of persons that are mentioned in the document.
 * 
 * ## Required Props
 * - persons : array ::: The list of persons that are mentioned in the text
 * - set_persons: a function that accepts a callback whose 1st arg is the old value of the list and yields the new value.
 *                 This function is used to reflect changes made through the UI in the lifted state.
 * 
 * @param {persons, set_persons} the props discussed above. 
 * @returns the virtual dom to render this component.
 */
function Persons({persons, set_persons}) {
    // add a person to the list
    function add_person_handler(_event) {
        const example = {
            "firstname": "John",
            "lastname" : "Doe",
            "role"     : "Example",
            "function" : "Peasant"
        };
        set_persons(pers => pers.concat(example))
    }
    return (
        <div className="container">
            <table className="table">
                <thead>
                <tr>
                    <th scope="col">First Name</th>
                    <th scope="col">Last Name</th>
                    <th scope="col">Role</th>
                    <th scope="col">Function</th>
                    <th scope="col"></th>
                </tr>
                </thead>
                <tbody>
                    { persons.map((_item, i) => PersonRow({i: i, persons: persons, set_persons: set_persons})) }
                </tbody>
            </table>
            <button type="button" className="btn btn-primary" onClick={add_person_handler}><i className="bi bi-plus-circle"></i> Add Person</button>
        </div>);
}

/** This sub component displays the details of one single person */
function PersonRow({i, persons, set_persons}) {
    // utility function to copy the list of person but apply a given callback only to the person at index i
    function copy_except(pers, callback) {
        return pers.map((item, j) => (j === i ? callback(item) : item));
    }
    // sub hook to update the state associated with one given person
    function set_person(callback) {
        set_persons(pers => copy_except(pers, callback))
    }
    // delete a person from the list
    function delete_person_handler(_event) {
        set_persons(pers => pers.filter((_item, j) => j !== i))
    }
    // reacts to a change in the person firstname
    function firstname_handler(event) {
        set_person(old => ({...old, firstname: event.target.innerText}))
    }
    // reacts to a change in the person lastname
    function lastname_handler(event) {
        set_person(old => ({...old, lastname: event.target.innerText}))
    }
    // reacts to a change in the person's role
    function role_handler(event) {
        set_person(old => ({...old, role: event.target.innerText}))
    }
    // reacts to a change in the person's function
    function function_handler(event) {
        set_person(old => ({...old, "function": event.target.innerText}))
    }

    const person = persons[i];
    return (
        <tr key={"__person_"+person.firstname+"_"+person.lastname+"_"+i+"__"}>
            <td contentEditable={true} suppressContentEditableWarning={true} onBlur={firstname_handler}>{person.firstname} </td>
            <td contentEditable={true} suppressContentEditableWarning={true} onBlur={lastname_handler} >{person.lastname}  </td>
            <td contentEditable={true} suppressContentEditableWarning={true} onBlur={role_handler}     >{person.role}      </td>
            <td contentEditable={true} suppressContentEditableWarning={true} onBlur={function_handler} >{person.function}  </td>
            <td><button type="button"  className="btn btn-danger" onClick={delete_person_handler}><i className="bi bi-trash3-fill"></i></button></td>
        </tr>);
}

export default Persons;