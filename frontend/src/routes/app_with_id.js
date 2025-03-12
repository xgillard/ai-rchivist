import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createPortal } from "react-dom";

import AppState from "../components/app_state";
import ErrorBox from "../components/error_box";


const default_model     = "ministral-3b-latest";
const default_app_state = {
  id: 0,
  model: default_model,
  document: "example document",
  documentdata: {
    doctype: "UNKNOWN",
    act_date: "UNKNOWN",
    fact_date: "UNKNOWN",
    persons: [],
    locations: [],
    summary: {
      en: "",
      fr: "",
      nl: "",
      de: "",
    }
  },
  conversation: [],
};


function AppWithId() {
    const id = useParams().id;
    const [app_state, set_app_state] = useState(default_app_state);
    const [errormsg,  set_errormsg]  = useState(null);

    useEffect(() => {
      get_state_by_id(id)
        .then(state => set_app_state(old => ({...old, ...state})))
        .catch(err  => set_errormsg(err) );
    }, 
    [id])

    return (
      <>
        <AppState app_state={app_state} set_app_state={set_app_state} />
        {(errormsg && createPortal(<ErrorBox title="Main Display" error={errormsg} onClose={set_errormsg(null)}/>, document.getElementById("error-panel")))}
      </>);
}

function get_state_by_id(id) {
    return fetch(`${process.env.REACT_APP_API_URL}/document/${id}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Bad response");
        }
      })
      .then(data => {
        if (! data.model ) {
          data.model = default_model;
        }
        return data;
      });
}

export default AppWithId;