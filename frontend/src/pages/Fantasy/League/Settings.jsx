import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getAuthToken } from "../../../components/utils/auth";
import { RedirectContext } from "../../../App";
import FantasyHomeButton from "../../../components/FantasyHomeButton";
import useLeagueData from "../../../components/utils/LeagueHook"
import { useLeagueContext } from "../../../components/utils/LeagueContext";

const LeagueSettings = () => {
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

  const navigate = useNavigate();
  const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
  const authToken = getAuthToken();

  // State for errors and authorization
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use the custom hook to get league data
  const {
    league,
    teams,
    loading: leagueLoading,
    error: leagueError
  } = useLeagueData(leagueCode);

  // Check if user is commissioner
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const response = await fetch("/api/league/verify_commissioner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ code: leagueCode }),
        });

        if (!response.ok) {
          navigate("/unauthorized"); // Or back to dashboard
        } else {
          setAuthorized(true);
        }
      } catch (err) {
        console.error("Authorization check failed:", err);
        navigate("/unauthorized");
      } finally {
        setLoading(false);
      }
    };

    if (leagueCode) {
      verifyAccess();
    }
  }, [leagueCode, authToken, navigate]);

  const handleScoringUpdate = async (e) => {
    e.preventDefault();

    try {
      if (!league) {
        throw new Error("League data not available");
      }

      const sport = league.sport;
      const league_id = league.id;
      const creation = false;

      setRedirectLocation("/league/settings/" + leagueCode);
      navigate("/fantasy/create-ruleset", {
        state: {
          creation: creation,
          sport: sport,
          league_id: league_id
        }
      });
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to navigate to scoring rules. Please try again.");
    }
  };

  // Loading states
  if (loading || leagueLoading) {
    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>League Settings</h1>
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
  if (error || leagueError || !authorized) {
    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>League Settings</h1>
          <FantasyHomeButton leagueCode={leagueCode} />
        </div>
        <div className="alert alert-danger">
          {error || leagueError || "You are not authorized to manage this league."}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>{league?.name} Settings</h1>
        <FantasyHomeButton leagueCode={leagueCode} />
      </div>

      {/* League Info Card */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">League Information</div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>League Name:</strong> {league?.name}</p>
              <p><strong>Sport:</strong> {league?.sport}</p>
              <p><strong>League Code:</strong> {leagueCode}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Teams:</strong> {teams?.length || 0}</p>
              <p><strong>Season Status:</strong> {league?.status || "In Progress"}</p>
              <p><strong>Commissioner:</strong> {league?.commissioner_id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <strong>Scoring Rules</strong>
            </div>
            <div className="card-body">
              <p>Configure how points are awarded in your league.</p>
              <p>Update point values for different actions based on your league's preferences.</p>
              <button
                className="btn btn-primary"
                onClick={handleScoringUpdate}
              >
                Update Scoring Rules
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <strong>League Management</strong>
            </div>
            <div className="card-body">
              <p>Manage your league settings and configuration.</p>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary">Manage Teams</button>
                <button className="btn btn-outline-primary">Schedule Settings</button>
                <button className="btn btn-outline-primary">Draft Settings</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="card mb-4">
        <div className="card-header bg-light">Advanced Options</div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">League Visibility</label>
            <select className="form-select">
              <option>Private - Invite Only</option>
              <option>Public - Anyone can request to join</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Trade Deadline</label>
            <input type="date" className="form-control" />
          </div>

          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id="waiversEnabled" />
            <label className="form-check-label" htmlFor="waiversEnabled">
              Enable Waiver Wire
            </label>
          </div>

          <button className="btn btn-success">Save Changes</button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-danger mb-4">
        <div className="card-header bg-danger text-white">Danger Zone</div>
        <div className="card-body">
          <p className="text-danger">These actions cannot be undone. Be certain before proceeding.</p>
          <button className="btn btn-outline-danger me-2">Reset League</button>
          <button className="btn btn-danger">Delete League</button>
        </div>
      </div>
    </div>
  );
};

export default LeagueSettings;