import React from "react";
import {useLocation, useNavigate} from "react-router-dom"
import {useContext, useEffect, useState} from 'react';
import {RedirectContext} from "../../../App";
import { getAuthToken } from "../../../components/utils/auth";


function LeagueHome() {
  const location = useLocation();
  const [league, setLeague] = useState({});
  const [teams, setTeams] = useState([]);
  const authToken = getAuthToken();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const {redirectLocation, setRedirectLocation} = useContext(RedirectContext);


  const generateCode = async () => {
    const response = await fetch("/api/league/getcode", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + authToken
        },
        body: JSON.stringify({ "access_token": authToken, "url" : location.pathname.split("/").at(-1) }),
    });
    
    const data = await response.json()
    console.log(data.message);

    const code = data.code;
    setInviteCode(window.location.origin + "/league/join/" + code);
    console.log(inviteCode);

      
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/league/getleague", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authToken,
          },
          body: JSON.stringify({
            access_token: authToken,
            code: location.pathname.split("/").at(-1),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 422) {
            setRedirectLocation(location.pathname);
            navigate("/login");
          } else {
            throw new Error("League get failed");
          }
        }

        setLeague(data.league);
        setTeams(data.teams);

        // Save league_id locally and init chat
        const leagueId = data.teams[0]?.league_id;
        if (leagueId) {
          localStorage.setItem("league_id", leagueId);

          // Init chat room + set chat_id
          const chatResponse = await fetch("/api/chat/league/init", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + authToken,
            },
            body: JSON.stringify({ league_id: leagueId }),
          });

          const chatData = await chatResponse.json();
          if (chatResponse.ok && chatData.chat_id) {
            localStorage.setItem("chat_id", chatData.chat_id);
            console.log("✅ Chat initialized:", chatData.chat_id);
          } else {
            console.warn("⚠️ Chat initialization failed:", chatData);
          }
        }

      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <p>Your league: {league.name}</p>
      <p>Teams:</p>
      {teams.map((team) => (
        <div>
        <p>{team.name}</p>
        <p>{team.league_rank}</p>
        </div>
      ))}
      <div>
      <button onClick={() => generateCode()}>Invite player:</button> 
      <input type="text" readOnly value={inviteCode}/>
      </div>
      <p>This code will be valid for 2 hours.</p>
    </div>
  );
}

export default LeagueHome;