import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { RedirectContext } from "../../App";
import { useNavigate, useLocation } from 'react-router-dom'
import { getAuthToken } from "../../components/utils/auth";
const FantasyDashboard = () => {
    const location = useLocation();
    const [leagues, setLeagues] = useState([]);
    const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
    const navigate = useNavigate();

    const authToken = getAuthToken();
    const createLeague = () => {
        navigate("/fantasy/create")
    }

    const navToLeagueHub = async (league) => {
        try {
            const response = await fetch("/api/league/geturl", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": 'Bearer ' + authToken
                },
                body: JSON.stringify({ "access_token": authToken, "league_id": league.league_id }),
            });

            const data = await response.json()
            console.log(data.message);
            navigate("/league/home/" + data.code)



        } catch (error) {
            console.error("Error:", error);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            // Handle league logic here
            try {
                const response = await fetch("/api/league/search", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": 'Bearer ' + authToken
                    },
                    body: JSON.stringify({ "access_token": authToken }),
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

                setLeagues(data.message);


            } catch (error) {
                console.error("Error:", error);
            }
        }

        fetchData();
    }, [location]);

    return (
        <div class="mt-3">
            <h1>Fantasy Dashboard</h1>
            <button onClick={createLeague}>Create League</button>
            <div style={{ marginTop: '20px' }}>
                {leagues.map((league) => (
                    <div
                        key={league.id}
                        style={{
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '15px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                        onClick={() => navToLeagueHub(league)}
                    >
                        <h2>{league.league_name}</h2>
                        <h3>{league.name}</h3>
                        <p>{league.sport}</p>
                        <p>
                            <strong>Rank:</strong> {league.league_rank}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FantasyDashboard;