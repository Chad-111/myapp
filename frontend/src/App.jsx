import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from './pages/Signup';
import Roster from "./pages/Roster";
import Matchups from "./pages/Matchups";
import Rankings from "./pages/Rankings";
import Draft from "./pages/Draft";
import TradePortal from "./pages/Portal";
import Leagues from "./pages/Leagues";
import LeagueHome from "./pages/League/Home";
import LeagueSettings from "./pages/League/Settings";
import LeagueMembers from "./pages/League/Members";
import LeagueRosters from "./pages/League/Rosters";
import LeagueSchedule from "./pages/League/Schedule";

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
        className="btn btn-sm btn-outline-secondary position-fixed bottom-0 end-0 m-3 z-3"
        onClick={() => setTheme(prev => (prev === "light" ? "dark" : "light"))}
      >
        Toggle {theme === "light" ? "Dark" : "Light"} Mode
      </button>

      <main className={`container-fluid ${isFantasyRoute ? 'pt-3 ps-md-5' : 'px-2 px-md-4 py-4'}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/matchups" element={<Matchups />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/draft" element={<Draft />} />
          <Route path="/portal" element={<TradePortal />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/league/home" element={<LeagueHome />} />
          <Route path="/league/settings" element={<LeagueSettings />} />
          <Route path="/league/members" element={<LeagueMembers />} />
          <Route path="/league/rosters" element={<LeagueRosters />} />
          <Route path="/league/schedule" element={<LeagueSchedule />} />
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
