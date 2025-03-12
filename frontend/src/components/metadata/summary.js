/**
 * This component is meant to display and edit the summary metadata
 * 
 * ## Required props
 * - summary: str ::: the summary in 4 languages (en, fr, nl, de)
 * - set_summary: a function that accepts a callback whose 1st arg is the old value yields the new value.
 *                This function is used to set the complete summary object in the lifted state.
 * 
 * @param {summary, set_summary} the props discussed above. 
 * @returns the virtual dom to render this component.
 */
function Summary({summary, set_summary}) {
    // actually sets the value of the english summary in response to an user interface event
    function en_handler(event) {
        set_summary(sum => ({...sum, en: event.target.value}))
    }
    // actually sets the value of the french summary in response to an user interface event
    function fr_handler(event) {
        set_summary(sum => ({...sum, fr: event.target.value}))
    }
    // actually sets the value of the dutch summary in response to an user interface event
    function nl_handler(event) {
        set_summary(sum => ({...sum, nl: event.target.value}))
    }
    // actually sets the value of the german summary in response to an user interface event
    function de_handler(event) {
        set_summary(sum => ({...sum, de: event.target.value}))
    }
    return (
    <>
        <div className="mb-3">
            <label htmlFor="dta-summary-en" className="form-label">Summary in English</label>
            <textarea name="dta-summary-en" className="form-control" aria-label="Summary in English" value={summary.en} onChange={en_handler} ></textarea>
        </div>

        <div className="mb-3">
            <label htmlFor="dta-summary-fr" className="form-label">Summary in French</label>
            <textarea name="dta-summary-fr" className="form-control" aria-label="Summary in French" value={summary.fr} onChange={fr_handler} ></textarea>
        </div>

        <div className="mb-3">
            <label htmlFor="dta-summary-nl" className="form-label">Summary in Dutch</label>
            <textarea name="dta-summary-nl" className="form-control" aria-label="Summary in Dutch" value={summary.nl} onChange={nl_handler} ></textarea>
        </div>
            
        <div className="mb-3">
            <label htmlFor="dta-summary-de" className="form-label">Summary in German</label>
            <textarea name="dta-summary-de" className="form-control" aria-label="Summary in German" value={summary.de} onChange={de_handler} ></textarea>
        </div>
    </>);
}

export default Summary;