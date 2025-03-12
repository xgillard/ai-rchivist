/**
 * This component is meant to display and edit the act_date and fact_date of a document. 
 * 
 * ## Required Props
 * - act_date : string ::: The date when the act was made
 * - fact_date: string ::: The date when the facts discussed in the document took place.
 * - set_act_date: a function that accepts a callback whose 1st arg is the old value yields the new value.
 *                 This function is used to set the act date in the lifted state.
 * - set_fact_date: a function that accepts a callback whose 1st arg is the old value yields the new value.
 *                 This function is used to set the fact date in the lifted state.
 * 
 * @param {act_date, fact_date, set_act_date, set_fact_date} the props discussed above. 
 * @returns the virtual dom to render this component.
 */
function Dates({act_date, fact_date, set_act_date, set_fact_date}) {
    // handler that will actually set the act date in response to an UI event
    function act_date_handler(event) {
        set_act_date(_old => event.target.value)
    }
    // handler that will actually set the fact date in response to an UI event
    function fact_date_handler(event) {
        set_fact_date(_old => event.target.value)
    }
    
    return (
        <div className="input-group mb-3">
            <span className="input-group-text">Act Date</span>
            <input type="text" className="form-control" aria-label="Act Date" value={act_date} onChange={act_date_handler} />
            
            <span className="input-group-text">Facts Date</span>
            <input type="text" className="form-control" aria-label="Facts Date" value={fact_date} onChange={fact_date_handler} />
        </div>);
}

export default Dates;