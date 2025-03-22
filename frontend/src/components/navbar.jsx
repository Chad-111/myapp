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
        <li><Link to="/">Home</Link></li>
        <li><Link to="/my-team">My Team</Link></li>
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
        <li><Link to="/players">Players</Link></li>
        <li><Link to="/standings">Standings</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;