import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RedirectContext } from "../../../App";
import { getAuthToken } from "../../../components/utils/auth";
import SettingsTwoToneIcon from '@mui/icons-material/SettingsTwoTone';
import { IconButton } from "@mui/material";

function LeagueHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [league, setLeague] = useState({});
  const [teams, setTeams] = useState([]);
  const [inviteCode, setInviteCode] = useState("");

  const authToken = getAuthToken();
  const leagueCode = location.pathname.split("/").at(-1);

  const generateCode = async () => {
    try {
      const response = await fetch("/api/league/getcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": 'Bearer ' + authToken
        },
        body: JSON.stringify({ "access_token": authToken, "url": leagueCode }),
      });

      const data = await response.json();
      setInviteCode(`${window.location.origin}/league/join/${data.code}`);
    } catch (err) {
      console.error("Failed to generate invite code:", err);
    }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            "Authorization": 'Bearer ' + authToken
          }
        });
        const data = await response.json();
        setCurrentUserId(data.id);
      } catch (err) {
        console.error("Failed to fetch user ID:", err);
      }
    };

    fetchUserId();
  }, [authToken]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/league/getleague", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": 'Bearer ' + authToken
          },
          body: JSON.stringify({ "access_token": authToken, "code": leagueCode }),
        });

        if (!response.ok) {
          if (response.status === 422) {
            setRedirectLocation(location.pathname);
            navigate("/login");
            return;
          } else {
            throw new Error("League get failed");
          }
        }

        const data = await response.json();
        setLeague(data.league);
        setTeams(data.teams);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, [leagueCode, authToken, location.pathname, navigate, setRedirectLocation]);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{league.name} {league.sport}</h2>

        {currentUserId === league.commissioner && (
          <IconButton
            className="text-secondary"
            onClick={() => navigate(`/league/settings/${leagueCode}`)}


            title="League Settings"
          >
            <SettingsTwoToneIcon fontSize="Small" />
          </IconButton>
        )}

        <div className="ms-auto text-muted">Total Teams: {teams.length}</div>
      </div>


      <div className="mb-4">
        <button className="btn btn-outline-primary" onClick={generateCode}>Generate Invite Link</button>
        {inviteCode && (
          <div className="input-group mt-2">
            <input type="text" className="form-control" readOnly value={inviteCode} />
          </div>
        )}
        {inviteCode && <small className="text-muted">This code will be valid for 2 hours.</small>}
      </div>

      <h4 className="mb-3">League Members</h4>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
        {teams.map((team) => (
          <div key={team.id} className="col">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-1"><strong>{team.name}</strong> (
                  <span class="text-success">{team.wins}</span>
                  -
                  <span class="text-danger">{team.losses}</span>
                  )</h5>
                <p className="card-text mb-1"><strong>Owner:</strong> {team.owner_id}</p>
                <p className="card-text mb-0">Rank: #<strong>{team.league_rank}</strong></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for future matchups or scoreboard */}
      <div className="mt-5">
        <h4 className="mb-3">Upcoming Matchups</h4>
        <div className="text-muted">Matchup functionality coming soon...</div>
      </div>
    </div>
  );
}

export default LeagueHome;