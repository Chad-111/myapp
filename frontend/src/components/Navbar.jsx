// src/components/Navbar.jsx
import { NavLink, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const isFantasyRoute = location.pathname.startsWith("/fantasy/") || location.pathname.startsWith("/league/");
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("access_token") !== null)

  // handle logout
  const handleLogout = async (e) => {
    e.preventDefault();
    // Handle logout logic here
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      console.log("Logout successful:", data);

      // Remove access token from local storage
      localStorage.removeItem("access_token");
      setIsLoggedIn(false); // Ensure UI updates

      // Redirect to the home page or another page
      navigate("/");

    } catch (error) {
      console.error("Error:", error);
      setError("Log out failed. Please check your credentials and try again.");
    }
  };


  return (
    <div className="layout-wrapper">
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
          <button type="button" className={`btn btn-outline-light ${isLoggedIn ? "active" : ""}`} onClick={handleLogout}>Log out</button>
          <NavLink to="/login" className={`btn btn-outline-light ${isLoggedIn ? "" : "active"}`}>Get Started</NavLink>
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
          </ul>
          <hr />
          <NavLink to="/" className="btn btn-outline-light">Return</NavLink>
        </aside>
      )}
    </div>
  );
}

export default Navbar;
