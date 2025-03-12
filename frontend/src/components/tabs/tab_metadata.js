import DocumentType from "../metadata/document_type";
import Dates from "../metadata/dates";
import Summary from "../metadata/summary";

/**
 * This component is meant to display and edit the document meta data (excluding persons and locations).
 * 
 * ## Required Props
 * - metadata : object ::: the metadata of the document that is being analyzed. 
 *                  This object should conform to the schema of the 'documentdata' property of the app_state.
 * 
 * - set_metadata: a function that accepts a callback whose 1st arg is the old value yields the new value.
 *                 This function is used to change the metadata in the lifted state.
 * 
 * @param {metadata, set_metadata} the props discussed above. 
 * @returns the virtual dom to render this component.
 */
function MetaData({metadata, set_metadata}) {
    // sub hook to edit only the doctype
    function set_doctype(callback) {
        set_metadata(meta => ({...meta, doctype: callback(meta.doctype) }))
    }
    // sub hook to edit only the act_date
    function set_act_date(callback) {
        set_metadata(meta => ({...meta, act_date: callback(meta.act_date) }))
    }
    // sub hook to edit only the fact date
    function set_fact_date(callback) {
        set_metadata(meta => ({...meta, fact_date: callback(meta.fact_date) }))
    }
    // sub hook to edit only the summary
    function set_summary(callback) {
        set_metadata(meta => ({...meta, summary: callback(meta.summary) }))
    }
    return (
        <div className="container">
            <DocumentType 
                doctype={metadata.doctype} 
                set_doctype={set_doctype} 
                />
            <Dates 
                act_date={metadata.act_date}
                fact_date={metadata.fact_date}
                set_act_date={set_act_date}
                set_fact_date={set_fact_date}
                />
            <Summary 
                summary={metadata.summary}
                set_summary={set_summary}
                />
        </div>);
}

export default MetaData;