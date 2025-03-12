/**
 * This component is meant to display and edit raw transcription of the document which is being labeled.
 * 
 * ## Required Props
 * - transcription : string ::: The transcription of the document which is being analyzed.
 * - set_transcription: a function that accepts a callback whose 1st arg is the old value yields the new value.
 *                 This function is used to set the document text transcription in the lifted state.
 * 
 * ## Optional Prop
 * - onAnalyze: a function executed whenever the user clicks on the 'initiate' button. 
 *      When this prop is not specified, then "initiate" button is not displayed.
 * 
 * @param {transcription, set_transcription} the props discussed above. 
 * @returns the virtual dom to render this component.
 */
function Transcription({transcription, set_transcription, onAnalyze}) {
    // sets the transcription in response to an UI event
    const change_handler = e => set_transcription(_old => e.target.value);

    return (
        <>
        <div className="container">
            <div className="mb-3">
                <label htmlFor="dta-document" 
                    className="form-label">
                    Transcription of the Document
                </label>
                <textarea name="dta-document" 
                        className="form-control" 
                        rows="30"
                        value={transcription}
                        onChange={change_handler}>{transcription}</textarea>
                { 
                (onAnalyze &&
                    <button type="button" className="btn btn-primary" onClick={_ => onAnalyze(transcription)}>
                        <i className="bi bi-robot"></i> Analyze Document
                    </button>)
                }
            </div>
        </div>
        </>);
}

export default Transcription;