import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import FantasyHomeButton from "../../../components/FantasyHomeButton";
import useLeagueData from "../../../components/utils/LeagueHook";
import { useLeagueContext } from "../../../components/utils/LeagueContext";

function Matchups() {
  // Extract league code from params or query string
  const { code } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leagueCode = code || queryParams.get("code");

  // Use the league data hook
  const { league, teams, userTeam, loading, error } = useLeagueData(leagueCode);

  // Use the context
  const { setCurrentLeagueCode } = useLeagueContext();

  // Update the context when the page loads
  useEffect(() => {
    if (leagueCode) {
      setCurrentLeagueCode(leagueCode);
    }
  }, [leagueCode, setCurrentLeagueCode]);

  // Example state for week selection
  const [selectedWeek, setSelectedWeek] = useState(1);


  // Mock matchups data - would be replaced with actual data from API
  const mockMatchups = [
    { id: 1, week: 1, homeTeam: "Team Alpha", awayTeam: "Team Beta", homeScore: 0, awayScore: 0, status: "Scheduled" },
    { id: 2, week: 1, homeTeam: "Team Charlie", awayTeam: "Team Delta", homeScore: 0, awayScore: 0, status: "Scheduled" },
    { id: 3, week: 2, homeTeam: "Team Beta", awayTeam: "Team Charlie", homeScore: 0, awayScore: 0, status: "Scheduled" },
    { id: 4, week: 2, homeTeam: "Team Delta", awayTeam: "Team Alpha", homeScore: 0, awayScore: 0, status: "Scheduled" }
  ];

  // Filter matchups by selected week
  const filteredMatchups = mockMatchups.filter(match => match.week === selectedWeek);

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Matchups</h1>
          <FantasyHomeButton leagueCode={leagueCode} />
        </div>
        <div className="text-center mt-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Matchups</h1>
          <FantasyHomeButton leagueCode={leagueCode} />
        </div>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>{league?.name} Matchups</h1>
        <FantasyHomeButton leagueCode={leagueCode} />
      </div>

      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>League Info</span>
          {userTeam && <span className="badge bg-primary">Your team: {userTeam.name}</span>}
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>League:</strong> {league?.name}</p>
              <p><strong>Sport:</strong> {league?.sport}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Teams:</strong> {teams?.length}</p>
              <p><strong>Season Status:</strong> {league?.status || "In Progress"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week selection */}
      <div className="card mb-4">
        <div className="card-header">Schedule</div>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="weekSelect" className="form-label">Select Week</label>
            <select
              id="weekSelect"
              className="form-select w-auto"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Matchups display */}
      <div className="row">
        {filteredMatchups.map(match => (
          <div key={match.id} className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-light">
                <span className="fw-bold">Week {match.week} Matchup</span>
                <span className="badge bg-secondary float-end">{match.status}</span>
              </div>
              <div className="card-body">
                <div className="row align-items-center text-center">
                  <div className="col-5">
                    <div className="fw-bold mb-2">{match.homeTeam}</div>
                    <div className="display-6">{match.homeScore}</div>
                    <div className="text-muted small">Home</div>
                  </div>
                  <div className="col-2">
                    <div className="display-6">vs</div>
                  </div>
                  <div className="col-5">
                    <div className="fw-bold mb-2">{match.awayTeam}</div>
                    <div className="display-6">{match.awayScore}</div>
                    <div className="text-muted small">Away</div>
                  </div>
                </div>
              </div>
              <div className="card-footer text-end">
                <button className="btn btn-sm btn-outline-primary">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMatchups.length === 0 && (
        <div className="alert alert-info">
          No matchups scheduled for Week {selectedWeek}
        </div>
      )}

      <div className="mt-4">
        <h5>Implementation Notes:</h5>
        <ul className="text-muted">
          <li>This page should display the upcoming matchups of specific leagues. All members not just the user.</li>
          <li>The matchups above are placeholder examples. Real implementation would fetch from backend.</li>
          <li>This should also include team records (wins/losses) alongside each team.</li>
          <li>Week selection should reflect the actual schedule from the league configuration.</li>
        </ul>
      </div>
    </div>
  );
}

export default Matchups;