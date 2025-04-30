import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import FantasyHomeButton from "../../../components/FantasyHomeButton";
import useLeagueData from "../../../components/utils/LeagueHook";
import { useLeagueContext } from "../../../components/utils/LeagueContext";
import { getAuthToken } from "../../../components/utils/auth";

function LeagueSchedule() {
  const navigate = useNavigate();
  const { code } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leagueCode = code || queryParams.get("code");

  const { league, teams, loading, error } = useLeagueData(leagueCode);
  const { setCurrentLeagueCode } = useLeagueContext();

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);



  const navToMatchup = async (matchId) => {
    const authToken = getAuthToken();
    try {
      const response = await fetch("/api/matchup/getcode", {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ matchup_id: matchId })
      });
      const data = await response.json();
      if (response.ok) {
        navigate(`/matchup/${data.code}/details`);
      } else {
        alert("Error navigating to matchup details.");
      }
    } catch (err) {
      alert("Error navigating to matchup details.");
    }
  };


  useEffect(() => {
    if (leagueCode) {
      setCurrentLeagueCode(leagueCode);
    }
  }, [leagueCode, setCurrentLeagueCode]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!league || !league.id) return;

      setScheduleLoading(true);
      setScheduleError(null);

      try {
        const authToken = getAuthToken();
        const response = await fetch('/api/league/getmatchups', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify({
            leagueId: league.id,
            week: selectedWeek
          })
        });

        const data = await response.json();
        if (response.ok) {
          setSchedule(data.matchups || []);
        } else {
          setScheduleError(data.error || 'Failed to fetch schedule.');
        }
      } catch (err) {
        setScheduleError('Error fetching schedule.');
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedule();
  }, [league, selectedWeek]);

  const availableWeeks = [...new Set(schedule.map(game => game.week))].sort((a, b) => a - b);

  const filteredSchedule = schedule.filter(game => game.week === selectedWeek);

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
              {availableWeeks.map(week => (
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
          {scheduleLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : scheduleError ? (
            <div className="alert alert-danger">{scheduleError}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Home Team</th>
                    <th>Home Score</th>
                    <th>Away Team</th>
                    <th>Away Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedule.length > 0 ? (
                    filteredSchedule.map(game => (
                      <tr key={game.id}>
                        <td><strong>{game.home_team}</strong></td>
                        <td>{game.home_team_score}</td>
                        <td>{game.away_team}</td>
                        <td>{game.away_team_score}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navToMatchup(game.id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-3">
                        No games scheduled for Week {selectedWeek}
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="card mt-4">
        <div className="card-header bg-light">Implementation Notes</div>
        <div className="card-body">
          <ul className="text-muted">
            <li>This page displays the full league schedule by week using real API data.</li>
            <li>It updates dynamically when switching weeks.</li>
            <li>It handles loading and error states gracefully.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LeagueSchedule;
