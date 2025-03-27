import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";

// Components
import Navbar from "./components/Navbar";
// Base Website Pages
import Dashboard from "./pages/Dashboard";
import Leagues from "./pages/Leagues";
import Login from "./pages/Login";
import Signup from './pages/Signup';
// !User Specific! -> Overall Fantasy Pages
import FantasyDashboard from "./pages/Fantasy/Dashboard";
import Draft from "./pages/Fantasy/Draft";
import MyTeams from "./pages/Fantasy/MyTeam";
// !League Specific! -> Fantasy League Pages
import LeagueHome from "./pages/Fantasy/League/Home";
import Matchups from "./pages/Fantasy/League/Matchups";
import LeagueMembers from "./pages/Fantasy/League/Members";
import TradePortal from "./pages/Fantasy/League/Portal";
import LeagueRoster from "./pages/Fantasy/League/Rosters";
import LeagueSchedule from "./pages/Fantasy/League/Schedule";
import LeagueSettings from "./pages/Fantasy/League/Settings";

// Wrap routes in a layout-aware component
function Layout() {
  const location = useLocation();
  const [theme, setTheme] = useState("light");

  const isFantasyRoute = location.pathname.startsWith("/league");

  useEffect(() => {
    document.body.setAttribute("data-bs-theme", theme);
  }, [theme]);

  return (
    <>
      <Navbar />
      <button
        className="btn btn-lg btn-outline-secondary position-fixed bottom-0 end-0 m-3 z-3"
        onClick={() => setTheme(prev => (prev === "light" ? "dark" : "light"))}
      >
        Toggle {theme === "light" ? "Dark" : "Light"} Mode
      </button>

      <main className={`container-fluid ${isFantasyRoute ? 'with-sidebar' : 'standard-padding'}`}>
        <Routes>
          {/* Base Pages */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/leagues" element={<Leagues />} />

          {/* Overall Fantasy Pages */}
          <Route path="/fantasy/dashboard" element={<FantasyDashboard />} />
          <Route path="/fantasy/draft" element={<Draft />} />
          <Route path="/fantasy/myteam" element={<MyTeams />} />

          {/* League Specific Pages */}
          <Route path="/league/home" element={<LeagueHome />} />
          <Route path="/league/matchups" element={<Matchups />} />
          <Route path="/league/members" element={<LeagueMembers />} />
          <Route path="/league/portal" element={<TradePortal />} />
          <Route path="/league/rosters" element={<LeagueRoster />} />
          <Route path="/league/schedule" element={<LeagueSchedule />} />
          <Route path="/league/settings" element={<LeagueSettings />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Layout />
      </div>
    </Router>
  );
}

export default App;
