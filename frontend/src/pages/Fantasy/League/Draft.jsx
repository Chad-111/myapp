import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import FantasyHomeButton from "../../../components/FantasyHomeButton";

function Draft() {
  // initial player limits:
  const playerLimits = {
    // these r kinda arbitrary but it works based on what positions we have
    nfl: 21,
    nba: 18,
    mlb: 24,
    nhl: 21,
    ncaaf: 21
  }
  // State for league information
  const [league, setLeague] = useState(null);
  // State for teams in the league
  const [teams, setTeams] = useState([]);
  // State for available players
  const [players, setPlayers] = useState([]);
  // State for the draft status
  const [draftStatus, setDraftStatus] = useState({
    currentTeam: null,
    currentPick: 1,
    isActive: false,
    isSnakeDraft: true // Toggle for snake draft format
  });
  // State for drafted players by team
  const [draftedPlayers, setDraftedPlayers] = useState({});
  // State for loading
  const [loading, setLoading] = useState(true);
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  // State for user's team
  const [userTeam, setUserTeam] = useState(null);
  const [sport, setSport] = useState(null);

  // Get league code from URL parameters or query string
  const { code } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leagueCode = code || queryParams.get("code");

  // Add this near the top of your component
  useEffect(() => {
    console.log("League code from URL:", code);
    console.log("League code from query params:", queryParams.get("code"));
    console.log("Final leagueCode used:", leagueCode);
  }, []);

  // Fetch league information
  useEffect(() => {
    if (leagueCode) {
      setLoading(true);
      const fetchLeague = async () => {
        try {
          console.log("Fetching league with code:", leagueCode);

          // Check if token exists
          const token = localStorage.getItem('authToken');
          if (!token) {
            throw new Error("Authentication token not found. Please log in again.");
          }

          const response = await axios.post("/api/league/getleague", {
            code: leagueCode,
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log("League data received:", response.data);

          setLeague(response.data.league);
          setTeams(response.data.teams);

          // Get user's team
          const userResponse = await axios.get("/api/auth/me", {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const userId = userResponse.data.id;
          const userTeam = response.data.teams.find(team => team.owner_id === userId);
          setUserTeam(userTeam);

          // Initialize drafted players object
          const initialDraftedPlayers = {};
          response.data.teams.forEach(team => {
            initialDraftedPlayers[team.id] = [];
          });
          setDraftedPlayers(initialDraftedPlayers);

          // Set initial draft status
          setDraftStatus({
            currentTeam: response.data.teams[0].id,
            currentPick: 1,
            isActive: true,
            isSnakeDraft: true
          });

          // Fetch players next
          await fetchPlayers(response.data.league.sport);
          setSport(response.data.league.sport);

        } catch (error) {
          console.error("Error fetching league:", error);
          console.error("Error details:", error.response?.data || "No response data");

          // Improved error handling with more specific messages
          if (error.response?.status === 422) {
            alert("Authentication error: Your session may have expired. Please log in again.");
          } else if (error.message.includes("token")) {
            alert(error.message);
          } else {
            alert("Failed to load draft: " + (error.response?.data?.error || error.message));
          }

          // Optionally redirect to login
          // window.location.href = "/login";
        } finally {
          setLoading(false);
        }
      };

      fetchLeague();
    }
  }, [leagueCode]);

  // Function to fetch available players based on sport
  const fetchPlayers = async (sport) => {
    try {
      console.log("Fetching players for sport:", sport);

      const league = sport;

      if (!league) {
        console.error("Unsupported sport:", sport);
        return;
      }

      // Get the token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Custom endpoint to get all players from a sport
      const response = await axios.get(`/api/players/${league}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.players) {
        console.log(`Loaded ${response.data.players.length} players for ${sport}`);
        setPlayers(response.data.players);
      } else {
        console.error("Invalid response format:", response.data);
      }
    } catch (error) {
      console.error("Error fetching players:", error);
      alert("Failed to load players. Please try again.");
    }
  };

  useEffect(() => {
    if (userTeam && draftStatus.currentTeam) {
      console.log("Current team on clock:", draftStatus.currentTeam);
      console.log("Your team ID:", userTeam.id);
      console.log("Is it your turn:", draftStatus.currentTeam === userTeam.id);
    }
  }, [draftStatus.currentTeam, userTeam]);

  // Handle drafting a player
  const draftPlayer = async (player) => {
    // Temporarily commented out to allow drafting
    // if (draftStatus.currentTeam !== userTeam?.id) {
    //   alert("It's not your turn to draft!");
    //   return;
    // }

    try {
      // Update local state
      const updatedDraftedPlayers = { ...draftedPlayers };
      if (!updatedDraftedPlayers[draftStatus.currentTeam]) {
        updatedDraftedPlayers[draftStatus.currentTeam] = [];
      }

      updatedDraftedPlayers[draftStatus.currentTeam].push(player);
      setDraftedPlayers(updatedDraftedPlayers);

      // Save to localStorage
      localStorage.setItem(`draft_${league.id}`, JSON.stringify(updatedDraftedPlayers));

      // Remove player from available list
      setPlayers(players.filter(p => p.id !== player.id));

      // Update draft order
      updateDraftOrder();

      // Optional: Try API call if it exists
      try {
        await axios.post("/api/draft/pick", {
          leagueId: league.id,
          teamId: draftStatus.currentTeam,
          playerId: player.id,
          pickNumber: draftStatus.currentPick
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        console.log("Draft pick saved to server");
      } catch (apiError) {
        console.warn("API call failed, but draft continues in local mode:", apiError);
      }
    } catch (error) {
      console.error("Error drafting player:", error);
      alert("Failed to draft player. Please try again.");
    }
  };

  // Restore draft state from localStorage if page refreshes
  useEffect(() => {
    if (league) {
      const savedDraft = localStorage.getItem(`draft_${league.id}`);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setDraftedPlayers(parsedDraft);

          // Also remove drafted players from the available list
          const allDraftedPlayerIds = new Set();
          Object.values(parsedDraft).forEach(teamPlayers => {
            teamPlayers.forEach(player => allDraftedPlayerIds.add(player.id));
          });

          setPlayers(prevPlayers => prevPlayers.filter(p => !allDraftedPlayerIds.has(p.id)));

          // Set pick number based on total drafted players
          const totalDrafted = Object.values(parsedDraft).reduce(
            (sum, players) => sum + players.length, 0
          );

          if (totalDrafted > 0) {
            // Calculate which team should be up next
            const currentPick = totalDrafted + 1;
            updateDraftOrderForPick(currentPick);
          }
        } catch (e) {
          console.error("Error restoring draft from localStorage:", e);
        }
      }
    }
  }, [league]);

  // Add this helper function
  const updateDraftOrderForPick = (pickNumber) => {
    const totalTeams = teams.length;

    // Determine which team is on the clock based on pick number
    let teamIndex;
    if (draftStatus.isSnakeDraft) {
      const round = Math.floor((pickNumber - 1) / totalTeams);
      const pickInRound = (pickNumber - 1) % totalTeams;

      // Even rounds go in reverse order
      if (round % 2 === 1) {
        teamIndex = totalTeams - 1 - pickInRound;
      } else {
        teamIndex = pickInRound;
      }
    } else {
      // Standard draft
      teamIndex = (pickNumber - 1) % totalTeams;
    }

    setDraftStatus({
      ...draftStatus,
      currentTeam: teams[teamIndex]?.id,
      currentPick: pickNumber,
      isActive: true
    });
  };

  // Update draft order based on current pick
  const updateDraftOrder = () => {
    const totalTeams = teams.length;
    const currentPick = draftStatus.currentPick;
    const newPick = currentPick + 1;

    // Determine next team based on snake draft rules if enabled
    let nextTeamIndex;
    // if draft should be over (make the logic better in the future)
    if (currentPick/totalTeams > playerLimits[sport]) {
      endDraft();
    }
    if (draftStatus.isSnakeDraft) {
      const currentRound = Math.floor(currentPick / totalTeams);
      const isEvenRound = currentRound % 2 === 1;

      // Find current team index
      const currentTeamIndex = teams.findIndex(t => t.id === draftStatus.currentTeam);

      if (isEvenRound) {
        // Even rounds go in reverse
        nextTeamIndex = (currentTeamIndex - 1 + totalTeams) % totalTeams;
      } else {
        // Odd rounds go in order
        nextTeamIndex = (currentTeamIndex + 1) % totalTeams;
      }
    } else {
      // Standard draft - just cycle through teams
      const currentTeamIndex = teams.findIndex(t => t.id === draftStatus.currentTeam);
      nextTeamIndex = (currentTeamIndex + 1) % totalTeams;
    }

    setDraftStatus({
      ...draftStatus,
      currentTeam: teams[nextTeamIndex].id,
      currentPick: newPick,
    });
  };

  // Add this function with your other functions
  const endDraft = async () => {
    try {
      // Confirm with the user
      if (!window.confirm("Are you sure you want to end the draft? This will finalize all team rosters.")) {
        return;
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Map drafted players to the format expected by the backend
      const teamRosters = Object.entries(draftedPlayers).map(([teamId, players]) => ({
        teamId: parseInt(teamId),
        players: players.map(p => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          position: p.position,
          team_name: p.team_name
        }))
      }));

      // Save draft results to backend using the new endpoint
      await axios.post("/api/draft/finalize", {
        leagueId: league.id,
        teams: teamRosters,
        sport: sport
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      alert("Draft has been finalized successfully! Team rosters are now set.");

      // Clear localStorage draft data
      localStorage.removeItem(`draft_${league.id}`);

      // Redirect to league home
      window.location.href = `/league/home/${leagueCode}`;

    } catch (error) {
      console.error("Error finalizing draft:", error);
      alert("Failed to finalize draft: " + (error.response?.data?.error || error.message));
    }
  };

  // Filter players based on search and position
  const filteredPlayers = players.filter(player => {
    const matchesSearch =
      player.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.last_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPosition = positionFilter === "All" || player.position === positionFilter;

    return matchesSearch && matchesPosition;
  });

  // Get unique positions for filter dropdown
  const positions = players.length > 0
    ? ["All", ...new Set(players.map(player => player.position))]
    : ["All"];

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">{league?.name} Draft</h1>
        <FantasyHomeButton leagueCode={code} />
      </div>

      <div className="row">
        <div className="col-12">

          <div className="alert alert-info">
            <div className="row">
              <div className="col-md-4">
                <strong>Current Pick:</strong> #{draftStatus.currentPick}
              </div>
              <div className="col-md-4">
                <strong>Team on the Clock:</strong> {teams.find(t => t.id === draftStatus.currentTeam)?.name}
              </div>
              <div className="col-md-4">
                <strong>Draft Type:</strong> {draftStatus.isSnakeDraft ? "Snake" : "Standard"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Available Players</h3>
              <div className="d-flex">
                <input
                  type="text"
                  className="form-control me-2"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="form-select"
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                >
                  {positions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="card-body" style={{ maxHeight: "600px", overflow: "auto" }}>
              <table className="table table-hover">
                <thead className="sticky-top bg-white">
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Team</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map(player => (
                    <tr key={player.id}>
                      <td>{player.first_name} {player.last_name}</td>
                      <td>{player.position}</td>
                      <td>{player.team_name}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => draftPlayer(player)}
                        // disabled={draftStatus.currentTeam !== userTeam?.id}
                        >
                          Draft
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Draft Results</h3>
            </div>
            <div className="card-body" style={{ maxHeight: "600px", overflow: "auto" }}>
              <div className="accordion" id="draftResults">
                {teams.map((team, index) => (
                  <div className="accordion-item" key={team.id}>
                    <h2 className="accordion-header">
                      <button
                        className={`accordion-button ${index !== 0 ? 'collapsed' : ''}`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#team${team.id}`}
                        aria-expanded={index === 0 ? 'true' : 'false'}
                      >
                        {team.name} {team.id === userTeam?.id ? "(Your Team)" : ""}
                      </button>
                    </h2>
                    <div
                      id={`team${team.id}`}
                      className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                      data-bs-parent="#draftResults"
                    >
                      <div className="accordion-body p-0">
                        <ul className="list-group list-group-flush">
                          {draftedPlayers[team.id]?.length > 0 ? (
                            draftedPlayers[team.id].map((player, idx) => (
                              <li key={player.id} className="list-group-item">
                                {idx + 1}. {player.first_name} {player.last_name} ({player.position})
                              </li>
                            ))
                          ) : (
                            <li className="list-group-item text-muted">No players drafted yet</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="card">
              <div className="card-header bg-warning">
                <h3 className="mb-0">Debug Tools</h3>
              </div>
              <div className="card-body">
                <button
                  className="btn btn-danger"
                  onClick={endDraft}
                >
                  End Draft & Save Teams
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Draft;