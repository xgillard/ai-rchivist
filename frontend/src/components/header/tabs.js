import { NavLink } from "react-router-dom";

function NavBar() {
    // determine the classname for a given nav link
    function navlink({isActive}) {
        return "nav-link " + (isActive && "active");
    }

    return (
       <div className="collapse navbar-collapse">
            <ul className="navbar-nav flex-row flex-wrap bd-navbar-nav">
                <li className="nav-item">
                    <NavLink to="document"  className={navlink} >Document</NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="metadata"  className={navlink} >Meta Data</NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="persons"   className={navlink} >Persons</NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="locations" className={navlink} >Locations</NavLink>
                </li>
            </ul>
        </div>
    );
}

export default NavBar;