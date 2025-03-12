import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import ErrorBox from "../error_box";
import classes from './prev_next_save.module.css'

function PrevNextSave({app_state}) {
    const navigate = useNavigate();
    const [errormsg, set_errormsg] = useState(null);
    
    // navigation
    const back = _ => navigate(-1); // navigate to prev
    const next = _ => navigate("/"); // navigate to next
    
    const save = useCallback(function () {
        fetch(`${process.env.REACT_APP_API_URL}/save`, 
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
                body:   JSON.stringify(app_state)
            }
        )
        .then(response => {
            if (! response.ok) {
                throw new Error("Bad response");
            }
        })
        .catch( err => set_errormsg(err) )
    }, 
    [app_state])

    const btn_class_name = `btn btn-header btn-outline-secondary ${classes.LightBackgroundBtn}`;
    return (
        <>
        <div className="btn-group">
            <button className={btn_class_name} onClick={back}>
                <i className="bi bi-chevron-compact-left"></i>
            </button>
            <button className={btn_class_name} onClick={save}>
                <i className="bi bi-floppy2"></i>
            </button>
            <button className={btn_class_name} onClick={next}>
                <i className="bi bi-chevron-compact-right"></i>
            </button>
        </div>
        {(errormsg && createPortal(<ErrorBox title="Save" error={errormsg} onClose={_ => set_errormsg(null)}/>, document.getElementById("error-panel")))}
        </>);
}

export default PrevNextSave;