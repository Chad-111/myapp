import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";
import { getAuthToken, removeAuthToken, isLoggedIn as checkLogin } from "./utils/auth";
import socket from "../socket";
import { useTranslation } from 'react-i18next';

function Navbar() {
  const location = useLocation();
  const isFantasyRoute = location.pathname.startsWith("/fantasy/") || location.pathname.startsWith("/league/");
  const [isLoggedIn, setIsLoggedIn] = useState(checkLogin());
  const authToken = getAuthToken();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const { t, i18n } = useTranslation();


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
          <div className="d-flex align-items-center w-50 text-start">
            <div className="navbar-logo">DraftEmpire</div>
            <div className="ms-3">
              <select
                className="form-select form-select-sm bg-dark text-light border-secondary"
                style={{ width: '100px' }}
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
              >
                <option value="en">🇺🇸 EN</option>
                <option value="es">🇪🇸 ES</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="de">🇩🇪 DE</option>
                <option value="ru">🇷🇺 RU</option>
                <option value="bs">🇧🇦 BS</option>

                {/* ADD MORE LANGUAGES */}
              </select>
            </div>
          </div>



          <div className="d-none d-lg-block ms-auto me-auto">
            <ul className="navbar-links d-flex justify-content-center gap-2 mb-0 list-unstyled">
              {isLoggedIn && (
                <>
                  <li>
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) =>
                        `nav-link px-3 py-2 ${isActive ? 'active fw-semibold' : 'text-secondary'}`
                      }
                    >
                      {t('navbar.home')}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/fantasy/dashboard"
                      className={({ isActive }) =>
                        `nav-link px-3 py-2 ${isActive ? 'active fw-semibold' : 'text-secondary'}`
                      }
                    >
                      {t('navbar.fantasy')}
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
                <button type="button" className="btn btn-outline-light" onClick={handleLogout}>
                  {t('navbar.logout')}
                </button>
              </>
            ) : (
              <NavLink to="/" className="btn btn-outline-light">
                {t('navbar.getStarted')}
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Offcanvas */}
      <div className="offcanvas offcanvas-end offcanvas-md" tabIndex="-1" id="mobileNav" aria-labelledby="mobileNavLabel">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="mobileNavLabel">{t('navbar.menu')}</h5>
          <button type="button" className="btn-close text-reset" onClick={closeOffcanvas} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <ul className="list-unstyled">
            {isLoggedIn && (
              <li className="fw-semibold text-center mb-2">
                {t('navbar.loggedInAs')} <span className="text-primary">{username}</span>
              </li>
            )}

            <li>
              <NavLink to="/dashboard" className="nav-link" onClick={closeOffcanvas}>
                {t('navbar.home')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/fantasy/dashboard" className="nav-link" onClick={closeOffcanvas}>
                {t('navbar.fantasy')}
              </NavLink>
            </li>

            {isFantasyRoute && (
              <div className="d-lg-none">
                <hr />
                <li className="fw-semibold text-uppercase small px-2 text-muted">
                  {t('navbar.fantasy')}
                </li>
              </div>
            )}

            <li className="mt-3">
              <button className="btn btn-outline-dark w-100" onClick={() => { closeOffcanvas(); handleLogout(); }}>
                {t('navbar.logout')}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Navbar;