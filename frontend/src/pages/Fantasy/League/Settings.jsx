import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getAuthToken } from "../../../components/utils/auth";
import { RedirectContext } from "../../../App";

const LeagueSettings = () => {
  const location = useLocation();
  const { code } = useParams();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
  const leagueCode = location.pathname.split("/").at(-1);
  const authToken = getAuthToken();
  const {error, setError} = useState(""); 

  const handleScoringUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const league_data_response = await fetch("/api/league/getleague", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({access_token: authToken, code: leagueCode})
      });

      const league_data = await league_data_response.json();
      console.log(league_data);

      const sport = league_data.league.sport;

      const league_id = league_data.league.id;
      const creation = false;
      setRedirectLocation("/league/settings/" + leagueCode)
      navigate("/fantasy/create-ruleset", {state: {creation: creation, sport : sport, league_id: league_id}})

      
      
    } catch (error) {
      console.error("Error:", error);
      setError("League creation failed. Please try again.");
    }

  };


  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const response = await fetch("/api/league/verify_commissioner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          navigate("/unauthorized"); // Or back to dashboard
        } else {
          setAuthorized(true);
        }
      } catch (err) {
        console.error("Authorization check failed:", err);
        navigate("/unauthorized");
      }
    };

    verifyAccess();
  }, [code]);

  if (!authorized) return null; // or loading spinner

  return (
    <div className="mt-3">
      <h1>League Settings</h1>
      <p>You are authorized to manage this league.</p>
      <button onClick={(e) => handleScoringUpdate(e)}>Update Scoring Rules</button>
    </div>
  );
};

export default LeagueSettings;
