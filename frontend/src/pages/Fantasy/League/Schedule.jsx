import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import FantasyHomeButton from "../../../components/FantasyHomeButton";
import useLeagueData from "../../../components/utils/LeagueHook";
import { useLeagueContext } from "../../../components/utils/LeagueContext";

function LeagueSchedule() {
  // Extract league code from params or query string
  const { code } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leagueCode = code || queryParams.get("code");

  // Use the league data hook
  const { league, teams, loading, error } = useLeagueData(leagueCode);

  // Use the context
  const { setCurrentLeagueCode } = useLeagueContext();

  // Update the context when the page loads
  useEffect(() => {
    if (leagueCode) {
      setCurrentLeagueCode(leagueCode);
    }
  }, [leagueCode, setCurrentLeagueCode]);

  // Week selection state
  const [selectedWeek, setSelectedWeek] = useState(1);

  // Mock schedule data - would be replaced with actual data from API
  const mockSchedule = [
    { id: 1, week: 1, homeTeam: "Team Alpha", awayTeam: "Team Beta", date: "2025-05-03", time: "1:00 PM" },
    { id: 2, week: 1, homeTeam: "Team Charlie", awayTeam: "Team Delta", date: "2025-05-03", time: "4:30 PM" },
    { id: 3, week: 2, homeTeam: "Team Beta", awayTeam: "Team Charlie", date: "2025-05-10", time: "1:00 PM" },
    { id: 4, week: 2, homeTeam: "Team Delta", awayTeam: "Team Alpha", date: "2025-05-10", time: "4:30 PM" }
  ];

  // Filter schedule by selected week
  const filteredSchedule = mockSchedule.filter(game => game.week === selectedWeek);

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>League Schedule</h1>
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
          <h1>League Schedule</h1>
          <FantasyHomeButton leagueCode={leagueCode} />
        </div>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>{league?.name} Schedule</h1>
        <FantasyHomeButton leagueCode={leagueCode} />
      </div>

      {/* League Info Card */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          League Information
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

      {/* Week Selection */}
      <div className="card mb-4">
        <div className="card-header">
          Schedule Navigation
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="weekSelect" className="form-label">View Schedule by Week</label>
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

      {/* Schedule Display */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <strong>Week {selectedWeek} Schedule</strong>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Home Team</th>
                  <th>Away Team</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map(game => (
                  <tr key={game.id}>
                    <td>{game.date}</td>
                    <td>{game.time}</td>
                    <td><strong>{game.homeTeam}</strong></td>
                    <td>{game.awayTeam}</td>
                    <td>Home Field</td>
                  </tr>
                ))}
                {filteredSchedule.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-3">
                      No games scheduled for Week {selectedWeek}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="card mt-4">
        <div className="card-header bg-light">Implementation Notes</div>
        <div className="card-body">
          <ul className="text-muted">
            <li>This page displays the full league schedule by week</li>
            <li>The schedule above contains placeholder data and should be replaced with real data from the API</li>
            <li>The schedule should be generated based on the league settings (number of weeks, teams, etc.)</li>
            <li>Each game should link to a detailed matchup page</li>
            <li>Consider adding filters for viewing a specific team's schedule</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LeagueSchedule;