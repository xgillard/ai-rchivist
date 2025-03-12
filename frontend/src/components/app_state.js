import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Routes, Route, Navigate } from "react-router-dom";

import ErrorBox from "./error_box";
import PleaseWait from "./please_wait";

import Tabs from "./header/tabs";
import ProgressTracking from "./header/progress_tracking";
import SelectModel from "./header/select_model";
import PrevNextSave from "./header/prev_next_save";

import Transcription from "./tabs/tab_transcription";
import MetaData from "./tabs/tab_metadata";
import Persons from "./tabs/tab_persons";
import Locations from "./tabs/tab_locations";
import Chat from "./chat/chat";

import classes from "./app_state.module.css"

/**
 * This component is meant to display and edit the whole application state. 
 * As such it should be considered the main entry point of the actual ai-rchivist code.
 * 
 * ## Required Props
 * - app_state : object ::: overall application state fetched from the database.
 * 
 * - set_app_state: a function that accepts a callback whose 1st arg is the old value yields the new value.
 *                 This function is used to change the lifted state.
 * 
 * @param {app_state, set_app_state} the props discussed above. 
 * @returns the virtual dom to render this component.
 */
function AppState({app_state, set_app_state}) {
    const [loading, set_loading] = useState(false);
    const [error, set_error] = useState(null);

    // to only change the model in use when interacting with the llm
    const set_model =useCallback(function(callback) {
        set_app_state(state => ({...state, model: callback(state.model)}))
    }, [set_app_state]);

    // update the conversation
    const set_conversation = useCallback(function(callback) {
        set_app_state(state => ({...state, conversation: callback(state.conversation)}))
    }, [set_app_state]);

    // to only change the transcription information
    const set_transcription = useCallback(function(callback) {
        set_app_state(state => ({...state, document: callback(state.document) }))
    }, [set_app_state]);

    // to only change the metadata information
    const set_metadata = useCallback(function(callback) {
        set_app_state(state => ({...state, documentdata: callback(state.documentdata) }))
    }, [set_app_state]);

    // to only change the list of persons
    const set_persons = useCallback(function(callback) {
        set_metadata(meta => ({...meta, persons: callback(meta.persons) }))
    }, [set_metadata]);

    // to only change the list of locations
    const set_locations = useCallback(function(callback) {
        set_metadata(meta => ({...meta, locations: callback(meta.locations) }))
    }, [set_metadata]);

    // this callback performs a complete round trip to the llm and re-initializes
    // the whole metadata and conversation history. It really consists in asking 
    // a new model to analyze the document from scratch and use that as output.
    const onAnalyze = useCallback(function(text) {
        const analyze_request = {
            model: app_state.model, 
            document: text
        };

        set_loading(true);
        fetch(`${process.env.REACT_APP_API_URL}/initiate`,
            {
                method: "POST",
                headers: {"Content-Type": "application/json; charset=utf-8"},
                body: JSON.stringify(analyze_request)
            }
        )
        .then(response => {
            if (response.ok) {
                return response.json()
            } else {
                throw new Error("Bad response", response);
            }
        })
        .then(({documentdata, conversation}) => {
            set_metadata((old) => ({...old, ...documentdata}));
            set_conversation((_old) => conversation)
        })
        .catch((err) => set_error(err))
        .finally(() => set_loading(false))
    }, 
    [app_state, set_metadata, set_conversation, set_error, set_loading]);

    return (
        <>
            <header className={`${classes.NavBar} navbar navbar-expand-lg justify-content-center`} data-bs-theme="dark">
                <nav className="container-xxl bd-gutter flex-wrap flex-lg-nowrap">
                    <button className={`${classes.NavBarBrand} navbar-brand`} ><i className="bi bi-robot"></i> AI-rchivist</button>
                
                    <Tabs />
                    <div className="d-flex col-2">
                        <ProgressTracking />
                        <PrevNextSave app_state={app_state} />
                    </div>
                    <SelectModel model={app_state.model} set_model={set_model} />
                </nav>
            </header>
            <div className="container-xxl bd-gutter mt-3 my-md-4 bd-layout">
                <Routes>
                    <Route path="document"   element={<Transcription transcription={app_state.document}           set_transcription={set_transcription} onAnalyze={onAnalyze} /> } />
                    <Route path="metadata"   element={<MetaData      metadata={app_state.documentdata}            set_metadata={set_metadata}           /> } />
                    <Route path="persons"    element={<Persons       persons={app_state.documentdata.persons}     set_persons={set_persons}             /> } />
                    <Route path="locations"  element={<Locations     locations={app_state.documentdata.locations} set_locations={set_locations}         /> } />
                    <Route path="*"          element={<Navigate      to="document" />} />
                </Routes>
            </div>
            <Chat conversation={app_state.conversation} model={app_state.model} set_conversation={set_conversation} set_metadata={set_metadata} />
            {(loading && createPortal(<PleaseWait />, document.getElementById("please-wait")))}
            {(error   && createPortal(<ErrorBox title="Analyze Document" error={error} onClose={_ => set_error(null)}/>, document.getElementById("error-panel")))}
        </>
    );
}

export default AppState;