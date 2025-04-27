import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import FantasyHomeButton from "../../../components/FantasyHomeButton";
import useLeagueData from "../../../components/utils/LeagueHook"
import { useLeagueContext } from "../../../components/utils/LeagueContext";

function LeagueRoster() {
  // Extract league code from params or query string
  const { code } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leagueCode = code || queryParams.get("code");

  // Use the context
  const { setCurrentLeagueCode } = useLeagueContext();

  // Update the context when the page loads
  useEffect(() => {
    if (leagueCode) {
      setCurrentLeagueCode(leagueCode);
    }
  }, [leagueCode, setCurrentLeagueCode]);

  // Use the custom hook
  const { league, teams, loading: leagueLoading, error: leagueError } = useLeagueData(leagueCode);
  const [teamPlayers, setTeamPlayers] = useState({});
  const [loadingRosters, setLoadingRosters] = useState(false);
  const [error, setError] = useState(null);

  // Fetch roster data when league data is loaded
  useEffect(() => {
    if (league && !leagueLoading) {
      fetchTeamRosters(league.id, teams);
    }
  }, [league, teams, leagueLoading]);

  // Function to fetch team rosters
  const fetchTeamRosters = async (leagueId, teams) => {
    try {
      setLoadingRosters(true);
      console.log("Fetching rosters for league ID:", leagueId);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Create an object to store players by team
      const teamPlayersMap = {};

      // Fetch team_players data from backend - now using POST with body
      const response = await axios.post("/api/league/rosters", {
        leagueId: leagueId
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log("Roster data received:", response.data);

      // Process the response
      if (response.data && response.data.rosters) {
        response.data.rosters.forEach(player => {
          if (!teamPlayersMap[player.team_id]) {
            teamPlayersMap[player.team_id] = [];
          }
          teamPlayersMap[player.team_id].push(player);
        });
        console.log("Processed team players:", teamPlayersMap);
      } else {
        console.warn("No rosters data found in response");
      }

      setTeamPlayers(teamPlayersMap);
    } catch (error) {
      console.error("Error fetching rosters:", error);
      console.error("Error details:", error.response?.data || "No response data");
      setError("Failed to load team rosters: " + (error.response?.data?.error || error.message));
    } finally {
      setLoadingRosters(false);
    }
  };

  // Group players by position for each team
  const getPlayersByPosition = (players) => {
    const positionGroups = {};

    players?.forEach(player => {
      if (!positionGroups[player.position]) {
        positionGroups[player.position] = [];
      }
      positionGroups[player.position].push(player);
    });

    return positionGroups;
  };

  // Loading state
  if (leagueLoading || loadingRosters) {
    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Team Rosters</h1>
          <FantasyHomeButton leagueCode={leagueCode} />
        </div>
        <div className="text-center mt-5">
          <div className="spinner-border" role="status"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (leagueError || error) {
    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Team Rosters</h1>
          <FantasyHomeButton leagueCode={leagueCode} />
        </div>
        <div className="alert alert-danger">{leagueError || error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">{league?.name} Rosters</h1>
        <FantasyHomeButton leagueCode={leagueCode} />
      </div>

      {teams.length === 0 ? (
        <div className="alert alert-info">No teams found in this league.</div>
      ) : (
        <div className="row">
          {teams.map(team => {
            const teamRoster = teamPlayers[team.id] || [];
            const positionGroups = getPlayersByPosition(teamRoster);

            return (
              <div className="col-lg-6 mb-4" key={team.id}>
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">{team.name}</h3>
                    <small>Owner: {team.owner_id}</small>
                  </div>

                  <div className="card-body">
                    {Object.keys(positionGroups).length > 0 ? (
                      Object.entries(positionGroups).map(([position, players]) => (
                        <div key={position} className="mb-3">
                          <h5 className="position-header">{position}</h5>
                          <div className="table-responsive">
                            <table className="table table-hover table-sm">
                              <thead className="table-light">
                                <tr>
                                  <th>Name</th>
                                  <th>Team</th>
                                  <th>Position</th>
                                </tr>
                              </thead>
                              <tbody>
                                {players.map(player => (
                                  <tr key={player.player_id}>
                                    <td>{player.first_name} {player.last_name}</td>
                                    <td>{player.team_name}</td>
                                    <td>{player.position} {player.starting_position !== "BEN" ? `(${player.starting_position})` : ""}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="alert alert-info">
                        No players on roster. Complete the draft to see players here.
                        <div className="mt-2">
                          <a href={`/league/draft/${leagueCode}`} className="btn btn-primary btn-sm">
                            Go to Draft
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LeagueRoster;