import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FantasyDashboard = () => {
    const [leagues, setLeagues] = useState([]);

    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:5000/api/leagues", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setLeagues(res.data);
            } catch (err) {
                console.error("Error fetching leagues", err);
            }
        };

        fetchLeagues();
    }, []);

    const handleJoin = async (leagueId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`http://localhost:5000/api/league/join/${leagueId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            alert("Successfully joined league!");
        } catch (err) {
            console.error("Error joining league", err);
            alert("Failed to join league");
        }
    };

    return (
        <div className="Fantasy" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Fantasy Dashboard</h1>
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
                        <button onClick={() => handleJoin(league.id)}>Join</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FantasyDashboard;
