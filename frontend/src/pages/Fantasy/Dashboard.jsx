import React from 'react';
import {useContext, useEffect} from 'react';
import { AuthContext } from "../../App";
import {useNavigate} from 'react-router-dom'

const FantasyDashboard = () => {
    const leagues = [
        { id: 1, name: 'Fantasy Football League', rank: 3, points: 1200 },
        { id: 2, name: 'Fantasy Basketball League', rank: 1, points: 1500 },
        { id: 3, name: 'Fantasy Baseball League', rank: 5, points: 980 },
    ];

    const [{authToken, setAuthToken}, {isLoggedIn, setIsLoggedIn}] = useContext(AuthContext);
    const navigate = useNavigate();
    const createLeague = () => {
        navigate("/")
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
                throw new Error("League get failed");
            }

            const data = await response.json();
            console.log("Message", data);


            } catch (error) {
                console.error("Error:", error);
            }
        }

        fetchData();
    }, []);

    return (
        <div class="Fantasy" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
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
                    >
                        <h2>{league.name}</h2>
                        <p>
                            <strong>Rank:</strong> {league.rank}
                        </p>
                        <p>
                            <strong>Points:</strong> {league.points}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FantasyDashboard;