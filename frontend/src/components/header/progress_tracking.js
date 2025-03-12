import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ProgressBar from 'react-bootstrap/ProgressBar';
import classes from "./progress_tracking.module.css"

import ErrorBox from '../error_box';

function ProgressTracking() {
    const [progress, set_progress] = useState({done: 0, all: 1});
    const [errormsg, set_errormsg] = useState(null);

    // this effect is used to go fetch the progression whenever the component is loaded
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/progression`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Bad response");
                }
            })
            .then(data => set_progress(data))
            .catch(err => set_errormsg(err));
    }, 
    []);

    return (<>
        <div className={classes.CustomProgressBar} >
            <ProgressBar 
                    variant="info" 
                    animated 
                    striped 
                    min={0} 
                    max={progress.full} 
                    now={100} 
                    className={classes.ThickProgressBar}
                    />
            <span className={classes.AlwaysOnLabel}>{ progress.done } / {progress.full}</span>
        </div>
        {(errormsg && createPortal(<ErrorBox title="Progress Tracking" error={errormsg} onClose={_ => set_errormsg(null)}/>, document.getElementById("error-panel")))}
    </>);
}

export default ProgressTracking;