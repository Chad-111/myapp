import React, { useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import FantasyHomeButton from "../../../components/FantasyHomeButton";
import useLeagueData from "../../../components/utils/LeagueHook";
import { useLeagueContext } from "../../../components/utils/LeagueContext";

function LeagueMembers() {
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

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>League Members</h1>
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
          <h1>League Members</h1>
          <FantasyHomeButton leagueCode={leagueCode} />
        </div>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>{league?.name} Members</h1>
        <FantasyHomeButton leagueCode={leagueCode} />
      </div>

      <div className="card mb-4">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <span>League Members</span>
          <span>Total: {teams?.length || 0}</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Team Name</th>
                  <th>Owner</th>
                  <th>Rank</th>
                  <th>Record</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                {teams && teams.map(team => (
                  <tr key={team.id}>
                    <td>{team.name}</td>
                    <td>{team.owner_id}</td>
                    <td>#{team.league_rank || 'N/A'}</td>
                    <td>
                      <span className="text-success">{team.wins || 0}</span>-
                      <span className="text-danger">{team.losses || 0}</span>
                    </td>
                    <td>{team.created_at ? new Date(team.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
                {(!teams || teams.length === 0) && (
                  <tr>
                    <td colSpan="5" className="text-center">No members found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {league?.commissioner && (
        <div className="card mt-4">
          <div className="card-header bg-light">
            Commissioner Tools
          </div>
          <div className="card-body">
            <p className="card-text text-muted">Commissioner tools will be available here for managing league members.</p>
            <p className="card-text text-muted">Options might include removing members, changing permissions, etc.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeagueMembers;