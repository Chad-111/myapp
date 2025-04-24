import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Import the CSS for your Login component
import { RedirectContext } from "../App";
import { setAuthToken } from "../components/utils/auth";
import socket from "../socket";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle login logic here
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      console.log("Login successful:", data);

      // Store access token in local storage
      setAuthToken(data.access_token);

      // Disconnect any previous socket connection, then connect with the new token
      console.log("Socket connected?", socket.connected);
      socket.disconnect();
      socket.connect();

      // Redirect to the home page or another page
      navigate(redirectLocation);
      setRedirectLocation("/");

    } catch (error) {
      console.error("Error:", error);
      setError("Login failed. Please check your credentials and try again.");
    }
  };

  return (
    <div className="Login">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">Login</button>
        <button type="button" className="register-button" onClick={() => navigate("/signup")}>
          Register
        </button>
      </form>
    </div>
  );
}

export default Login;