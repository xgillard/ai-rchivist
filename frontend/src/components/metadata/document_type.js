/**
 * This component is meant to display and edit the document type metadata
 * 
 * ## Required props
 * - doctype: str ::: the type of the document
 * - set_doctype: a function that accepts a callback whose 1st arg is the old value yields the new value.
 *                This function is used to set the doctype in the lifted state.
 * 
 * @param {doctype, set_doctype} the props discussed above. 
 * @returns the virtual dom to render this component.
 */
function DocumentType({doctype, set_doctype}) {
    // actually sets the doctype in response to an user interface event
    function doctype_handler(event) {
        set_doctype(_doctype => event.target.value)
    }

    return (
        <div className="input-group mb-3">
            <span className="input-group-text">Type of the Document</span>
            <select className="form-select" aria-label="Type of the document" value={doctype} onChange={doctype_handler}>
                <option value="UNKNOWN"  >Unknown</option>
                <option value="REMISSION">Remission</option>
                <option value="SENTENCE" >Sentence</option>
            </select>
        </div>);
}

export default DocumentType;