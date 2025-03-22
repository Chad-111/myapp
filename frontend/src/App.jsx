// filepath: c:\Users\chadb\Desktop\webapp\frontend\src\App.jsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/navbar"; // Import your Navbar component
import Home from "./pages/Home"; // Import your Home component
import Login from "./pages/Login"; // Import your Login component

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar /> {/* Include the Navbar component */}
        <Routes>
          <Route path="/" element={<Home />} /> {/* Home route */}
          <Route path="/login" element={<Login />} /> {/* Login route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;