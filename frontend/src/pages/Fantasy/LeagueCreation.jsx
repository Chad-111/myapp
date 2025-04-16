import { React } from 'react'
import { useContext, useEffect, useState } from 'react';
import { RedirectContext } from "../../App";
import { useNavigate, useLocation } from 'react-router-dom'
import { getAuthToken } from "../../components/utils/auth";


function LeagueCreation() {
    const location = useLocation();
    const [name, setName] = useState("");
    const [teamName, setTeamName] = useState("");
    const [leagueName, setLeagueName] = useState("");
    const [error, setError] = useState("");
    const [sport, setSport] = useState("");
    const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
    const navigate = useNavigate();
    const authToken = getAuthToken();



    const handleCreateLeague = async (e) => {
        e.preventDefault();
        // Handle league creation logic here
        try {



            const response = await fetch("/api/league/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": 'Bearer ' + authToken
                },
                body: JSON.stringify({
                    "access_token": authToken,
                    "league_name": leagueName,
                    "sport": sport,
                    "team_name": teamName
                }),
            });

            if (!response.ok) {
                if (response.status == 422) {
                    setRedirectLocation(location.pathname);
                    navigate("/login")
                } else {
                    throw new Error("League get failed");
                }
            }

            const data = await response.json();
            console.log("Message", data);

            navigate("/fantasy/dashboard")


        } catch (error) {
            console.error("Error:", error);
            setError("League creation failed. Please try again.");
        }
    }

    return (
        <div className="LeagueCreation">
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleCreateLeague}>
                <div className="form-group">
                    <label htmlFor="sport">Sport:</label>
                    <select required name="sport" id="sport" value={sport} onChange={(e) => setSport(e.target.value)}>
                        <option value="NHL">NHL</option>
                        <option value="NCAAF">College Football</option>
                        <option value="MLB">MLB</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="league_name">Name your league: </label>
                    <input
                        type="text"
                        id="league_name"
                        required
                        value={leagueName}
                        onChange={(e) => setLeagueName(e.target.value)}
                    />

                </div>
                <div className="form-group">
                    <label htmlFor="team_name">Name your team: </label>
                    <input
                        type="text"
                        id="team_name"
                        required
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                    />
                </div>

                <button type="submit" className="create-button">Create league</button>
            </form>
        </div>
    );
}


export default LeagueCreation;