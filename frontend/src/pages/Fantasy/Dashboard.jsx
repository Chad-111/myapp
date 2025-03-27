import React from 'react';

const FantasyDashboard = () => {
    const leagues = [
        { id: 1, name: 'Fantasy Football League', rank: 3, points: 1200 },
        { id: 2, name: 'Fantasy Basketball League', rank: 1, points: 1500 },
        { id: 3, name: 'Fantasy Baseball League', rank: 5, points: 980 },
    ];

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
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