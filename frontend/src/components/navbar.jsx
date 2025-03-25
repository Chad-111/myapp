import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css"; // Import the CSS for your Navbar

function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Function to close dropdown when clicking a link
  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <nav className={`Navbar ${isDropdownOpen ? "translate-up" : ""}`}>
      <ul>
        <li><Link to="/">Leagues</Link></li>
        <li><Link to="/roster">Roster</Link></li>
        {/* League Dropdown */}
        <li
          className="dropdown"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <Link to="/League/Home" onClick={closeDropdown} className="dropbtn">League ▾</Link>
          <ul className={`dropdown-content ${isDropdownOpen ? "show" : ""}`}>
            <li><Link to="/league/home" onClick={closeDropdown}>League Home</Link></li>
            <li><Link to="/league/settings" onClick={closeDropdown}>Settings</Link></li>
            <li><Link to="/league/members" onClick={closeDropdown}>Members</Link></li>
            <li><Link to="/league/rosters" onClick={closeDropdown}>Rosters</Link></li>
            <li><Link to="/league/schedule" onClick={closeDropdown}>Schedule</Link></li>
          </ul>
        </li>
        <li><Link to="/portal">Trade Portal</Link></li>
        <li><Link to="/matchups">Matchups</Link></li>
        <li><Link to="/rankings">Rankings</Link></li>
        <li><Link to="/draft">Live Draft</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;