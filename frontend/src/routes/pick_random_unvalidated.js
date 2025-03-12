import { Navigate, useLoaderData, useRouteError } from "react-router-dom";
import classes from './pick_random_unvalidated.module.css'

function PickRandomUnvalidated() {
    const random_id = useLoaderData().id;
    return (<Navigate to={`/annotate/${random_id}`} />);
}

export function CouldNotFindDocumentToAnnotate() {
    console.error(useRouteError());
    return (<>
        <header className={`${classes.NavBar} navbar navbar-expand-lg justify-content-center`} data-bs-theme="dark">
        <nav className="container-xxl bd-gutter flex-wrap flex-lg-nowrap">
            <button className={classes.NavBarBrand} ><i className="bi bi-robot"></i> AI-rchivist</button>
        </nav>
        </header>
        <div className="container-xxl bd-gutter mt-3 my-md-4 bd-layout">
            <div className="container">
                <div className="mb-3">
                    <h3>Could not find any fresh documents to annotate.</h3>
                    That probably means the annotation task is complete (or the backend server is down).
                </div>
            </div>
        </div>
    </>);
}

export async function loader() {
    console.log(`API URL = ${process.env.REACT_APP_API_URL}`)
    const response = await fetch(`${process.env.REACT_APP_API_URL}/notvalidated`);
    
    if ( !response.ok ) {
        throw Error("Could not fetch a random notvalidated document");
    } else {
        return await response.json();
    }
}

export default PickRandomUnvalidated;