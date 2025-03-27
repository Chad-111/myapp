// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { NavLink } from "react-router-dom";

<NavLink to="/league/home" className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink>


function Navbar() {
  const location = useLocation();
  const isFantasyRoute = location.pathname.startsWith("/league/");

  return (
    <div className="layout-wrapper">
      <nav className={`Navbar ${isFantasyRoute ? 'compact' : ''}`}>
        <div className="navbar-wrapper">
          <div className="navbar-logo">DraftEmpire</div>
          <div className="navbar-spacer" />
        </div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/league/home">Fantasy</Link></li>
          <li><Link to="/portal">Trade Portal</Link></li>
          <li><Link to="/matchups">Matchups</Link></li>
          <li><Link to="/rankings">Rankings</Link></li>
          <li><Link to="/draft">Live Draft</Link></li>
        </ul>
      </nav>



      {/* Sidebar for League sub-routes */}
      {isFantasyRoute && (
        <aside className="FantasySidebar">
          <h5 className="sidebar-heading">DraftEmpire Fantasy</h5>
          <ul className="sidebar-links">
            <li><Link to="/league/home">Home</Link></li>
            <li><Link to="/league/settings">Settings</Link></li>
            <li><Link to="/league/members">Members</Link></li>
            <li><Link to="/league/rosters">Rosters</Link></li>
            <li><Link to="/league/schedule">Schedule</Link></li>
          </ul>
          <hr />
          <Link to="/" className="btn btn-outline-light">Return</Link>
        </aside>
      )}
    </div>
  );
}

export default Navbar;