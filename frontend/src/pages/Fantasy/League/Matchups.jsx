import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import FantasyHomeButton from "../../../components/FantasyHomeButton";
import useLeagueData from "../../../components/utils/LeagueHook";
import { useLeagueContext } from "../../../components/utils/LeagueContext";
import { getAuthToken } from "../../../components/utils/auth";
import { useNavigate } from 'react-router-dom';


function Matchups() {
  const { code } = useParams();
  const navigate = useNavigate();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leagueCode = code || queryParams.get("code");

  const { league, teams, userTeam, loading, error } = useLeagueData(leagueCode);
  const { setCurrentLeagueCode } = useLeagueContext();

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [matchups, setMatchups] = useState([]);
  const [matchupsLoading, setMatchupsLoading] = useState(false);
  const [matchupsError, setMatchupsError] = useState(null);

  const navToMatchup = async (matchId) => {
    try { 
      const authToken = getAuthToken();
      console.log(matchId);
      const response = await fetch("/api/matchup/getcode", {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({matchup_id: matchId})
      });

      const data = await response.json();

      const code = data.code;
      navigate(`/matchup/${code}/details`)
      return
    } catch (err) {
      setMatchupsError('Error finding matchup details.');
    } 
  };

  useEffect(() => {
    if (leagueCode) {
      setCurrentLeagueCode(leagueCode);
    }
  }, [leagueCode, setCurrentLeagueCode]);

  useEffect(() => {
    const fetchMatchups = async () => {
      if (!league || !league.id) return; // wait until league data is loaded

      setMatchupsLoading(true);
      setMatchupsError(null);

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
          setMatchups(data.matchups || []);
        } else {
          setMatchupsError(data.error || 'Failed to fetch matchups.');
        }
      } catch (err) {
        setMatchupsError('Error fetching matchups.');
      } finally {
        setMatchupsLoading(false);
      }
    };

    fetchMatchups();
  }, [league, selectedWeek]); // refetch when league or selectedWeek changes

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

  const availableWeeks = [...new Set(matchups.map(match => match.week))].sort((a, b) => a - b);

  const filteredMatchups = matchups.filter(game => game.week === selectedWeek);

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
              {availableWeeks.map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Matchups display */}
      <div className="row">
        {matchupsLoading ? (
          <div className="text-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : matchupsError ? (
          <div className="alert alert-danger">{matchupsError}</div>
        ) : filteredMatchups.length > 0 ? (
          filteredMatchups.map(match => (
            <div key={match.id} className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-light">
                  <span className="fw-bold">Week {match.week} Matchup</span>
                </div>
                <div className="card-body">
                  <div className="row align-items-center text-center">
                    <div className="col-5">
                      <div className="fw-bold mb-2">{match.home_team}</div>
                      <div className="display-6">{match.home_team_score}</div>
                      <div className="text-muted small">Home</div>
                    </div>
                    <div className="col-2">
                      <div className="display-6">vs</div>
                    </div>
                    <div className="col-5">
                      <div className="fw-bold mb-2">{match.away_team}</div>
                      <div className="display-6">{match.away_team_score}</div>
                      <div className="text-muted small">Away</div>
                    </div>
                  </div>
                </div>
                <div className="card-footer text-end">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navToMatchup(match.id)}>
                    View Details
                  </button>

                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="alert alert-info">
            No matchups scheduled for Week {selectedWeek}
          </div>
        )}
      </div>

      <div className="mt-4">
        <h5>Implementation Notes:</h5>
        <ul className="text-muted">
          <li>This page now displays real matchups from the backend.</li>
          <li>It reflects actual week schedules per league configuration.</li>
          <li>Fetching uses /api/league/getmatchups POST request with auth token.</li>
        </ul>
      </div>
    </div>
  );
}

export default Matchups;
