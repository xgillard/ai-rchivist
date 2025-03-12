/**
 * This component is meant to display and edit the list of locations that are mentioned in the document.
 * 
 * ## Required Props
 * - locations : array ::: The list of locations that are mentioned in the text
 * - set_locations: a function that accepts a callback whose 1st arg is the old value of the list and yields the new value.
 *                 This function is used to reflect changes made through the UI in the lifted state.
 * 
 * @param {locations, set_locations} the props discussed above. 
 * @returns the virtual dom to render this component.
 */
function Locations({locations, set_locations}) {
    // add a person to the list
    function add_location_handler(_event) {
        const example = {
            "name"    : "Neverland",
            "loctype" : "Country"
        };
        set_locations(locs => locs.concat(example))
    }
    return (
        <div className="container">
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Location Type</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody>
                    { locations.map((_item, i) => LocationRow({i: i, locations: locations, set_locations: set_locations})) }
                </tbody>
            </table>
            <button type="button" className="btn btn-primary" onClick={add_location_handler}><i className="bi bi-plus-circle"></i> Add Location</button>
        </div>);
}

/** This sub component displays the details of one single person */
function LocationRow({i, locations, set_locations}) {
    // utility function to copy the list but apply a given callback only to the item at index i
    function copy_except(locs, callback) {
        return locs.map((item, j) => (j === i ? callback(item) : item));
    }
    // sub hook to update the state associated with one given location
    function set_location(callback) {
        set_locations(locs => copy_except(locs, callback))
    }
    // delete a location from the list
    function delete_location_handler(_event) {
        set_locations(locs => locs.filter((_item, j) => j !== i))
    }
    // reacts to a change in the location name
    function name_handler(event) {
        set_location(old => ({...old, name: event.target.innerText}))
    }
    // reacts to a change in the location type
    function loctype_handler(event) {
        set_location(old => ({...old, loctype: event.target.innerText}))
    }

    const location = locations[i];
    return (
        <tr key={"__location_"+location.name+"_"+i+"__"}>
            <td contentEditable={true} suppressContentEditableWarning={true} onBlur={name_handler}>{location.name}</td>
            <td contentEditable={true} suppressContentEditableWarning={true} onBlur={loctype_handler} >{location.loctype}</td>
            <td><button type="button"  className="btn btn-danger" onClick={delete_location_handler}><i className="bi bi-trash3-fill"></i></button></td>
        </tr>);
}

export default Locations;