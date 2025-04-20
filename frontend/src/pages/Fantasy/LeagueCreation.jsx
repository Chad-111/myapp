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
        <div className="container py-5" style={{ maxWidth: "600px" }}>
            <div className="card shadow border-0">
                <div className="card-body p-4">
                    <h2 className="text-center mb-4">Create a Fantasy League</h2>

                    {error && (
                        <div className="alert alert-danger text-center" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleCreateLeague} className="needs-validation">
                        <div className="form-floating mb-3">
                            <select
                                className="form-select"
                                id="sport"
                                required
                                value={sport}
                                onChange={(e) => setSport(e.target.value)}
                            >
                                <option value="" disabled>Select a sport</option>
                                <option value="NHL">NHL</option>
                                <option value="NCAAF">College Football</option>
                                <option value="MLB">MLB</option>
                            </select>
                            <label htmlFor="sport">Sport</label>
                        </div>

                        <div className="form-floating mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="league_name"
                                placeholder="League Name"
                                required
                                value={leagueName}
                                onChange={(e) => setLeagueName(e.target.value)}
                            />
                            <label htmlFor="league_name">League Name</label>
                        </div>

                        <div className="form-floating mb-4">
                            <input
                                type="text"
                                className="form-control"
                                id="team_name"
                                placeholder="Team Name"
                                required
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                            />
                            <label htmlFor="team_name">Your Team Name</label>
                        </div>

                        <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
                            Create League
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

}


export default LeagueCreation;