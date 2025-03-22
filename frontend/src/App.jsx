// filepath: c:\Users\chadb\Desktop\webapp\frontend\src\App.jsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/navbar"; // Import your Navbar component
import Home from "./pages/Home"; // Import your Home component
import Login from "./pages/Login"; // Import your Login component
import Signup from "./pages/Signup";
import LeagueHome from "./pages/League/LeagueHome";
  import LeagueSettings from "./pages/League/LeagueSettings";
  import LeagueMembers from "./pages/League/LeagueMembers";
  import LeagueRosters from "./pages/League/LeagueRosters";
  import LeagueSchedule from "./pages/League/LeagueSchedule";


function App() {
  return (
    <Router>
      <div className="App">
        <Navbar /> {/* Include the Navbar component */}
        <Routes>
          <Route path="/" element={<Home />} /> {/* Home route */}
          <Route path="/login" element={<Login />} /> {/* Login route */}
          <Route path="/signup" element={<Signup />} /> {/* Signup route */}
          <Route path="/league/home" element={<LeagueHome />} />
          <Route path="/league/settings" element={<LeagueSettings />} />
          <Route path="/league/members" element={<LeagueMembers />} />
          <Route path="/league/rosters" element={<LeagueRosters />} />
          <Route path="/league/schedule" element={<LeagueSchedule />} />
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;