import {React} from 'react'
import {useContext, useEffect, useState} from 'react';
import { RedirectContext } from "../../App";
import {useNavigate, useLocation} from 'react-router-dom'
import { getAuthToken } from "../../components/utils/auth";


function LeagueJoin() {
    const location = useLocation();
    const [name, setName] = useState("");
    const [teamName, setTeamName] = useState("");
    const [error, setError] = useState("");
    const {redirectLocation, setRedirectLocation} = useContext(RedirectContext);
    const navigate = useNavigate();
    const authToken = getAuthToken();
    
    

    const handleJoinLeague = async (e) => {
        e.preventDefault();
        // Handle league creation logic here
        try {

            const code = location.pathname.split("/").at(-1);
        
        
            const response = await fetch("/api/league/join", {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                "Authorization": 'Bearer ' + authToken
                },
                body: JSON.stringify({ 
                    "access_token": authToken, 
                    "name" : teamName,
                    "code" : code
                }),
            });
    
            if (!response.ok) {
                if (response.status == 422) {
                    setRedirectLocation(location.pathname);
                    navigate("/login")
                } else {
                    throw new Error("League get failed");
                }
            } else {
    
                const data = await response.json();
                console.log("Message", data);
                
                navigate("/fantasy/dashboard")
            }

        } catch (error) {
            console.error("Error:", error);
            setError("League creation failed. Please try again.");
        }
    }

    return (
        <div className="LeagueCreation">
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleJoinLeague}>
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

                <button type="submit" className="create-button">Create team</button>
            </form>
        </div>
    );
}


export default LeagueJoin;