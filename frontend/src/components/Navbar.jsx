// src/components/Navbar.jsx
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react"
import "./Navbar.css";
import { AuthContext } from "../App";

function Navbar() {
  const location = useLocation();
  const isFantasyRoute = location.pathname.startsWith("/fantasy/") || location.pathname.startsWith("/league/");
  const [{authToken, setAuthToken}, {isLoggedIn, setIsLoggedIn}] = useContext(AuthContext);
  const navigate = useNavigate();

  // handle logout
  const handleLogout = async (e) => {
    e.preventDefault();
    // Handle logout logic here, trim access token.
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": 'Bearer ' + authToken
        },
        body: JSON.stringify({ "access_token": authToken}),
      });

      if (!response.ok) {
        throw new Error("Logout failed: " + response.json().msg);
      }

      const data = await response.json();
      console.log("Logout successful:", data);

      // Remove access token from context
      setAuthToken(null);
      setIsLoggedIn(false); // Ensure UI updates

      // Redirect to the home page or another page
      navigate("/");

    } catch (error) {
      console.error("Error: Log out failed.");
      console.error(error.message);
    }
  };




  return (
    <div className="sticky-top layout-wrapper">
      <nav className={`Navbar ${isFantasyRoute ? 'compact' : ''}`}>
        <div className="navbar-wrapper-left">
          <div className="navbar-logo">DraftEmpire</div>
          <div className="navbar-spacer" />
        </div>
        <ul className="navbar-links">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink>
          </li>
          <li>
            <NavLink to="/fantasy/dashboard" className={({ isActive }) => isActive ? "active" : ""}>Fantasy</NavLink>
          </li>
        </ul>
        <div className="navbar-wrapper-right">
          <div className="navbar-spacer" />
          {
            isLoggedIn ?
              (<button type="button" className={`btn btn-outline-light`} onClick={handleLogout}>Log out</button>) :
              (<NavLink to="/login" className={`btn btn-outline-light`}>Get Started</NavLink>)
          }
        </div>
      </nav>

      {/* Sidebar for League sub-routes */}
      {isFantasyRoute && (
        <aside className="FantasySidebar">
          <h5 className="sidebar-heading">DraftEmpire Fantasy</h5>
          <ul className="sidebar-links">
            <li>
              <NavLink to="/fantasy/dashboard" className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink>
            </li>
            <li>
              <NavLink to="/fantasy/create" className={({ isActive }) => isActive ? "active" : ""}>Create League</NavLink>
            </li>
            <li>
              <NavLink to="/league/settings" className={({ isActive }) => isActive ? "active" : ""}>Settings</NavLink>
            </li>
            <li>
              <NavLink to="/league/members" className={({ isActive }) => isActive ? "active" : ""}>Members</NavLink>
            </li>
            <li>
              <NavLink to="/league/rosters" className={({ isActive }) => isActive ? "active" : ""}>Rosters</NavLink>
            </li>
            <li>
              <NavLink to="/league/schedule" className={({ isActive }) => isActive ? "active" : ""}>Schedule</NavLink>
            </li>
            <li>
              <NavLink to="/league/matchups" className={({ isActive }) => isActive ? "active" : ""}>Matchups</NavLink>
            </li>
            <li>
              <NavLink to="/league/portal" className={({ isActive }) => isActive ? "active" : ""}>Trade Portal</NavLink>
            </li>
            <li>
              <NavLink to="/league/draft" className={({ isActive }) => isActive ? "active" : ""}>Live Draft</NavLink>
            </li>
            <li>
              <NavLink to="/league/brackets" className={({ isActive }) => isActive ? "active" : ""}>Brackets</NavLink>
            </li>
          </ul>
          <hr />
          <NavLink to="/" className="btn btn-outline-light">Return</NavLink>
        </aside>
      )}
    </div>
  );
}

export default Navbar;
