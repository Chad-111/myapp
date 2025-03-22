import React from "react";
import "./Navbar.css"; // Import the CSS for your Navbar

function Navbar() {
  return (
    <nav className="Navbar">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/leagues">Leagues</a></li>
        <li><a href="/teams">Teams</a></li>
        <li><a href="/players">Players</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
      </nav>
  );
}

export default Navbar;