import React, { useEffect, useState, createContext } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import IconButton from '@mui/material/IconButton';
import LightModeTwoToneIcon from '@mui/icons-material/LightModeTwoTone';
import DarkModeTwoToneIcon from '@mui/icons-material/DarkModeTwoTone';
import { motion, AnimatePresence } from "framer-motion";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";
import socket from "./socket";
import { getAuthToken } from "./components/utils/auth";



import ProtectedRoute from "./components/utils/ProtectedRoute";
// Components
import Navbar from "./components/Navbar";
import ChatWidget from "./components/Chat/ChatWidget";
// Base Website Pages
import Dashboard from "./pages/Dashboard";
import Start from './pages/Start';
// !User Specific! -> Overall Fantasy Pages
import FantasyDashboard from "./pages/Fantasy/Dashboard";
import Draft from "./pages/Fantasy/Draft";
import MyTeams from "./pages/Fantasy/MyTeam";
import LeagueCreation from "./pages/Fantasy/LeagueCreation";
// !League Specific! -> Fantasy League Pages
import LeagueHome from "./pages/Fantasy/League/Home";
import Matchups from "./pages/Fantasy/League/Matchups";
import LeagueMembers from "./pages/Fantasy/League/Members";
import TradePortal from "./pages/Fantasy/League/Portal";
import Brackets from './pages/Fantasy/League/Brackets';
import LeagueRoster from "./pages/Fantasy/League/Rosters";
import LeagueSchedule from "./pages/Fantasy/League/Schedule";
import LeagueSettings from "./pages/Fantasy/League/Settings";
import Join from "./pages/Fantasy/Join";

export const RedirectContext = createContext("/dashboard");

// Wrap routes in a layout-aware component
function Layout() {
  const location = useLocation();
  const [theme, setTheme] = useState("light");
  const isFantasyRoute = location.pathname.startsWith("/league");
  const [redirectLocation, setRedirectLocation] = useState("/dashboard");
  useEffect(() => {
    document.body.setAttribute("data-bs-theme", theme);
  }, [theme]);

  // Check if the user is logged in and connect to the socket
  useEffect(() => {
    if (getAuthToken()) {
      socket.connect();
    }
  }, []);

  return (
    <>
      <RedirectContext.Provider value={{ redirectLocation, setRedirectLocation }}>
        <Navbar />
        <IconButton
          color="primary"
          className="position-fixed bottom-0 end-0 m-3 z-3"
          aria-label={`switch to ${theme === "light" ? "dark" : "light"} mode`}
          onClick={() => setTheme(prev => (prev === "light" ? "dark" : "light"))}
          disableRipple={true} // disables the ripple effect on click
          disableFocusRipple={true} // disables the focus ripple effect when tabbed to
          sx={{
            color: theme === "dark" ? "#ffda6a" : "#2e4482", // set custom color
            '&:hover': {
              backgroundColor: 'transparent', // disables blue hover bg
              color: theme === "dark" ? "#ffda6a" : "#2e4482", // hover color
            }
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "light" ? (
              <motion.div
                key="dark-icon"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <DarkModeTwoToneIcon fontSize="large" />
              </motion.div>
            ) : (
              <motion.div
                key="light-icon"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <LightModeTwoToneIcon fontSize="large" />
              </motion.div>
            )}
          </AnimatePresence>
        </IconButton>


        <main className={`container-fluid ${isFantasyRoute ? 'with-sidebar' : 'standard-padding'}`}>
          <Routes>
            {/* Public Route */}
            <Route path="/" element={<Start />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/fantasy/dashboard" element={<ProtectedRoute><FantasyDashboard /></ProtectedRoute>} />
            <Route path="/fantasy/draft" element={<ProtectedRoute><Draft /></ProtectedRoute>} />
            <Route path="/fantasy/myteam" element={<ProtectedRoute><MyTeams /></ProtectedRoute>} />
            <Route path="/fantasy/create" element={<ProtectedRoute><LeagueCreation /></ProtectedRoute>} />
            <Route path="/league/home/*" element={<ProtectedRoute><LeagueHome /></ProtectedRoute>} />
            <Route path="/league/matchups/*" element={<ProtectedRoute><Matchups /></ProtectedRoute>} />
            <Route path="/league/members/*" element={<ProtectedRoute><LeagueMembers /></ProtectedRoute>} />
            <Route path="/league/portal/*" element={<ProtectedRoute><TradePortal /></ProtectedRoute>} />
            <Route path="/league/brackets/*" element={<ProtectedRoute><Brackets /></ProtectedRoute>} />
            <Route path="/league/rosters/*" element={<ProtectedRoute><LeagueRoster /></ProtectedRoute>} />
            <Route path="/league/schedule/*" element={<ProtectedRoute><LeagueSchedule /></ProtectedRoute>} />
            <Route path="/league/settings/*" element={<ProtectedRoute><LeagueSettings /></ProtectedRoute>} />
            <Route path="/league/join/*" element={<ProtectedRoute><Join /></ProtectedRoute>} />
          </Routes>
        </main>
        <ChatWidget />
      </RedirectContext.Provider>
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

