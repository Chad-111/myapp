import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";
import { getAuthToken, removeAuthToken, isLoggedIn as checkLogin } from "./utils/auth";
import socket from "../socket";

function Navbar() {
  const location = useLocation();
  const isFantasyRoute = location.pathname.startsWith("/fantasy/") || location.pathname.startsWith("/league/");
  const [isLoggedIn, setIsLoggedIn] = useState(checkLogin());
  const authToken = getAuthToken();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  useEffect(() => {
    setIsLoggedIn(checkLogin());

    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          headers: {
            Authorization: "Bearer " + authToken,
          },
        });
        const data = await response.json();
        if (response.ok && data.username) {
          setUsername(data.username);
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };

    if (checkLogin()) {
      fetchUserInfo();
    }

  }, [location]);

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

      // Disconnect from the socket server
      socket.disconnect();

      // Redirect to the home page or another page
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
            <ul className="navbar-links d-flex justify-content-center gap-2 mb-0 list-unstyled">
              {isLoggedIn && (
                <>
                  <li><NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `nav-link px-3 py-2 ${isActive ? 'active fw-semibold' : 'text-secondary'}`
                    }
                  >
                    Home
                  </NavLink></li>
                  <li><NavLink
                    to="/fantasy/dashboard"
                    className={({ isActive }) =>
                      `nav-link px-3 py-2 ${isActive ? 'active fw-semibold' : 'text-secondary'}`
                    }
                  >
                    Fantasy
                  </NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>

          {isLoggedIn && (
            <button
              className="btn btn-outline-light d-lg-none ms-auto me-2"
              type="button"
              onClick={openOffcanvas}
              aria-controls="mobileNav"
            >
              ☰
            </button>
          )}

          <div className="d-none d-lg-block w-50 text-end">
            {isLoggedIn ? (
              <>
                <span className="me-3 text-light fw-semibold">{username}</span>
                <button type="button" className="btn btn-outline-light" onClick={handleLogout}>Log out</button>
              </>
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
            {isLoggedIn && (
              <li className="fw-semibold text-center mb-2">Logged in as <span className="text-primary">{username}</span></li>
            )}

            <li><NavLink to="/dashboard" className="nav-link" onClick={closeOffcanvas}>Home</NavLink></li>
            <li><NavLink to="/fantasy/dashboard" className="nav-link" onClick={closeOffcanvas}>Fantasy</NavLink></li>

            {isFantasyRoute && (
              <div className="d-lg-none">
                <hr />
                <li className="fw-semibold text-uppercase small px-2 text-muted">Fantasy</li>
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
    </div>
  );
}

export default Navbar;
