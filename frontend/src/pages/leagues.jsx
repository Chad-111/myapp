import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Import the CSS for your Home component

function Home() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/Signup");
  };

  return (
    <div className="Home">
      <h1>Welcome to Fantasy Sports</h1>
      <p>Create and manage your fantasy leagues, teams, and players.</p>
      <button className="cta-button" onClick={handleGetStarted}>Get Started</button>

      <div className="cards-container">
        <div className="row">
          <div className="card">
            <h2>Top Leagues of the Week</h2>
            <ul>
              <li>Premier League</li>
              <li>La Liga</li>
              <li>Serie A</li>
              <li>NCAA Basketball</li>
              <li>NCAA Football</li>
              <li>NHL</li>
            </ul>
          </div>

          <div className="card">
            <h2>Top Teams of the Week</h2>
            <h3>Soccer</h3>
            <ul>
              <li>Manchester United</li>
              <li>Real Madrid</li>
              <li>Juventus</li>
            </ul>
            <h3>NCAA Basketball</h3>
            <ul>
              <li>Duke Blue Devils</li>
              <li>Gonzaga Bulldogs</li>
              <li>Kansas Jayhawks</li>
            </ul>
            <h3>NCAA Football</h3>
            <ul>
              <li>Alabama Crimson Tide</li>
              <li>Ohio State Buckeyes</li>
              <li>Clemson Tigers</li>
            </ul>
            <h3>NHL</h3>
            <ul>
              <li>Toronto Maple Leafs</li>
              <li>Boston Bruins</li>
              <li>Chicago Blackhawks</li>
            </ul>
          </div>
        </div>

        <div className="row">
          <div className="card">
            <h2>Player Streaks</h2>
            <div className="nested-card">
              <h3>Soccer</h3>
              <ul>
                <li>🔥 Lionel Messi</li>
                <li>❄️ Cristiano Ronaldo</li>
                <li>🔥 Neymar Jr.</li>
              </ul>
            </div>
            <div className="nested-card">
              <h3>NCAA Basketball</h3>
              <ul>
                <li>🔥 Zion Williamson</li>
                <li>❄️ RJ Barrett</li>
                <li>🔥 Ja Morant</li>
              </ul>
            </div>
            <div className="nested-card">
              <h3>NCAA Football</h3>
              <ul>
                <li>🔥 Tua Tagovailoa</li>
                <li>❄️ Trevor Lawrence</li>
                <li>🔥 Justin Fields</li>
              </ul>
            </div>
            <div className="nested-card">
              <h3>NHL</h3>
              <ul>
                <li>🔥 Auston Matthews</li>
                <li>❄️ Connor McDavid</li>
                <li>🔥 Sidney Crosby</li>
              </ul>
            </div>
          </div>

          <div className="card">
            <h2>Fantasy Teams Performance</h2>
            <ul>
              <li>Team A: 1200 points</li>
              <li>Team B: 1150 points</li>
              <li>Team C: 1100 points</li>
            </ul>
          </div>

          <div className="card">
            <h2>Fantasy Leaders</h2>
            <ul>
              <li>Player 1: 300 points</li>
              <li>Player 2: 280 points</li>
              <li>Player 3: 270 points</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;