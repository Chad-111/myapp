import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";
import { getAuthToken, removeAuthToken, isLoggedIn as checkLogin } from "./utils/auth";

function Navbar() {
  const location = useLocation();
  const isFantasyRoute = location.pathname.startsWith("/fantasy/") || location.pathname.startsWith("/league/");
  const [isLoggedIn, setIsLoggedIn] = useState(checkLogin());
  const authToken = getAuthToken();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoggedIn(checkLogin());
  }, [location]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
        },
        body: JSON.stringify({ access_token: authToken }),
      });

      if (!response.ok) {
        throw new Error("Logout failed: " + (await response.json()).msg);
      }

      removeAuthToken();
      setIsLoggedIn(false);
      navigate("/");
    } catch (error) {
      console.error("Error: Log out failed.");
      console.error(error.message);
    }
  };

  const openOffcanvas = () => {
    const el = document.getElementById("mobileNav");
    if (el && window.bootstrap?.Offcanvas) {
      const instance = window.bootstrap.Offcanvas.getOrCreateInstance(el);
      instance.show();
    }
  };

  const closeOffcanvas = () => {
    const el = document.getElementById("mobileNav");
    if (el && window.bootstrap?.Offcanvas) {
      const instance = window.bootstrap.Offcanvas.getInstance(el);
      instance?.hide();
    }
  };

  return (
    <div className="sticky-top layout-wrapper">
      <nav className={`Navbar ${isFantasyRoute ? "compact" : ""}`}>
        <div className="container-fluid d-flex align-items-center py-2">
          <div className="navbar-logo w-50 text-start">DraftEmpire</div>

          <div className="d-none d-lg-block ms-auto me-auto">
            <ul className="navbar-links d-flex justify-content-center gap-3 mb-0 list-unstyled">
              {isLoggedIn && (
                <>
                  <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink></li>
                  <li><NavLink to="/fantasy/dashboard" className={({ isActive }) => isActive ? "active" : ""}>Fantasy</NavLink></li>
                </>
              )}
            </ul>
          </div>

          {isLoggedIn && (
            <button
              className="btn btn-outline-light d-lg-none me-2"
              type="button"
              onClick={openOffcanvas}
              aria-controls="mobileNav"
            >
              ☰
            </button>
          )}

          <div className="d-none d-lg-block w-50 text-end">
            {isLoggedIn ? (
              <button type="button" className="btn btn-outline-light" onClick={handleLogout}>Log out</button>
            ) : (
              <NavLink to="/" className="btn btn-outline-light">Get Started</NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Offcanvas */}
      <div className="offcanvas offcanvas-end offcanvas-md" tabIndex="-1" id="mobileNav" aria-labelledby="mobileNavLabel">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="mobileNavLabel">Menu</h5>
          <button type="button" className="btn-close text-reset" onClick={closeOffcanvas} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <ul className="list-unstyled">
            <li><NavLink to="/dashboard" className="nav-link" onClick={closeOffcanvas}>Home</NavLink></li>
            <li><NavLink to="/fantasy/dashboard" className="nav-link" onClick={closeOffcanvas}>Fantasy</NavLink></li>

            {isFantasyRoute && (
              <div className="d-lg-none">
                <hr />
                <li className="fw-semibold text-uppercase small px-2 text-muted">Fantasy</li>
                <li><NavLink to="/fantasy/create" className="nav-link" onClick={closeOffcanvas}>Create League</NavLink></li>
                <li><NavLink to="/league/settings" className="nav-link" onClick={closeOffcanvas}>Settings</NavLink></li>
                <li><NavLink to="/league/members" className="nav-link" onClick={closeOffcanvas}>Members</NavLink></li>
                <li><NavLink to="/league/rosters" className="nav-link" onClick={closeOffcanvas}>Rosters</NavLink></li>
                <li><NavLink to="/league/schedule" className="nav-link" onClick={closeOffcanvas}>Schedule</NavLink></li>
                <li><NavLink to="/league/matchups" className="nav-link" onClick={closeOffcanvas}>Matchups</NavLink></li>
                <li><NavLink to="/league/portal" className="nav-link" onClick={closeOffcanvas}>Trade Portal</NavLink></li>
                <li><NavLink to="/league/draft" className="nav-link" onClick={closeOffcanvas}>Live Draft</NavLink></li>
                <li><NavLink to="/league/brackets" className="nav-link" onClick={closeOffcanvas}>Brackets</NavLink></li>
              </div>
            )}
            <li className="mt-3">
              <button className="btn btn-outline-dark w-100" onClick={() => { closeOffcanvas(); handleLogout(); }}>
                Log out
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Fantasy Subnavbar - only for large screens */}
      {isFantasyRoute && (
        <nav className="FantasySubnav bg-dark py-2 d-none d-lg-flex">
          <div className="container-fluid d-flex flex-wrap gap-3 justify-content-evenly">
            <NavLink to="/fantasy/dashboard" className={({ isActive }) => isActive ? "subnav-link active" : "subnav-link"}>Home</NavLink>
            <NavLink to="/fantasy/create" className={({ isActive }) => isActive ? "subnav-link active" : "subnav-link"}>Create League</NavLink>
            <NavLink to="/league/settings" className={({ isActive }) => isActive ? "subnav-link active" : "subnav-link"}>Settings</NavLink>
            <NavLink to="/league/members" className={({ isActive }) => isActive ? "subnav-link active" : "subnav-link"}>Members</NavLink>
            <NavLink to="/league/rosters" className={({ isActive }) => isActive ? "subnav-link active" : "subnav-link"}>Rosters</NavLink>
            <NavLink to="/league/schedule" className={({ isActive }) => isActive ? "subnav-link active" : "subnav-link"}>Schedule</NavLink>
            <NavLink to="/league/matchups" className={({ isActive }) => isActive ? "subnav-link active" : "subnav-link"}>Matchups</NavLink>
            <NavLink to="/league/portal" className={({ isActive }) => isActive ? "subnav-link active" : "subnav-link"}>Trade Portal</NavLink>
            <NavLink to="/league/draft" className={({ isActive }) => isActive ? "subnav-link active" : "subnav-link"}>Live Draft</NavLink>
            <NavLink to="/league/brackets" className={({ isActive }) => isActive ? "subnav-link active" : "subnav-link"}>Brackets</NavLink>
          </div>
        </nav>
      )}

    </div>
  );
}

export default Navbar;
