import React, { useEffect, useState } from 'react';
import { getAuthToken } from '../../../components/utils/auth';

const POSITION_LIMITS = {
    nfl: { "QB": 1, "RB": 2, "WR": 2, "TE": 1, "FLX": 1, "DST": 1, "K": 1 },
    ncaaf: { "QB": 1, "RB": 2, "WR": 2, "TE": 1, "FLX": 1, "DST": 1, "K": 1 },
    nhl: { "F": 4, "C": 2, "D": 4, "G": 2 },
    nba: { "PG": 2, "SG": 2, "SF": 2, "PF": 2, "C": 2 },
    mlb: { "IF": 6, "OF": 4, "P": 5, "C": 2 }
};

const FLEX_MAP = {
    nfl: { FLX: ["RB", "WR", "TE"] },
    ncaaf: { FLX: ["RB", "WR", "TE"] },
    mlb: {
        IF: ["1B", "2B", "SS", "3B", "IF"],
        OF: ["OF", "LF", "CF", "RF"],
        P: ["SP", "RP", "CP", "P"]
    },
    nhl: {
        F: ["RW", "LW", "F"]
    }
};

const ManageLineup = () => {
    const [team, setTeam] = useState();
    const [teamId, setTeamId] = useState();
    const [roster, setRoster] = useState([]);
    const [sport, setSport] = useState("");
    const [startingLineup, setStartingLineup] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeam = async () => {
            const authToken = getAuthToken();
            const urlParts = window.location.pathname.split('/');
            const code = urlParts[urlParts.length - 1];
        
            try {
                const response = await fetch('/api/team/getteam', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": 'Bearer ' + authToken
                    },
                    body: JSON.stringify({ code: code })
                });
                const data = await response.json();
                setTeam(data.team_name);
                setTeamId(data.team_id);
                setRoster(data.roster);
                setSport(data.sport);
        
                // 🧠 Build initialLineup based on returned roster's current starting positions
                const initialLineup = {};
                Object.keys(POSITION_LIMITS[data.sport]).forEach(pos => {
                    initialLineup[pos] = 0;
                });
        
                data.roster.forEach(player => {
                    if (player.position !== "BEN") {
                        if (initialLineup[player.position] !== undefined) {
                            initialLineup[player.position]++;
                        } else {
                            // Safety: if backend sent unexpected starting position
                            initialLineup[player.position] = 1;
                        }
                    }
                });
        
                setStartingLineup(initialLineup);
            } catch (err) {
                console.log(err);
                setError('Failed to fetch team data.');
            } finally {
                setLoading(false);
            }
        };
        

        fetchTeam();
    }, []);

    const handleToggleStart = (playerIndex) => {
        const updatedRoster = [...roster];
        const player = updatedRoster[playerIndex];
        const playerDefaultPos = player.default_position;
    
        if (player.position !== 'BEN') {
            // Move player to bench
            setStartingLineup(prev => ({
                ...prev,
                [player.position]: (prev[player.position] || 0) - 1
            }));
            updatedRoster[playerIndex].position = "BEN";
        } else {
            const currentCount = startingLineup[playerDefaultPos] || 0;
            const maxAllowed = POSITION_LIMITS[sport][playerDefaultPos] || 0;

            console.log(currentCount);
            console.log(maxAllowed);
            console.log('sport:', sport);
            console.log('playerDefaultPos:', playerDefaultPos);
            console.log('POSITION_LIMITS[sport]:', POSITION_LIMITS[sport]);
    
            if (currentCount < maxAllowed) {
                // Start player at their default position
                setStartingLineup(prev => ({
                    ...prev,
                    [playerDefaultPos]: currentCount + 1
                }));
                updatedRoster[playerIndex].position = playerDefaultPos;
            } else {
                // Try to assign flex
                let assignedFlex = null;
                const flexOptions = FLEX_MAP[sport];
    
                if (flexOptions) {
                    for (const flexPos in flexOptions) {
                        if (flexOptions[flexPos].includes(playerDefaultPos)) {
                            const flexCurrent = startingLineup[flexPos] || 0;
                            const flexMax = POSITION_LIMITS[sport][flexPos] || 0;
    
                            if (flexCurrent < flexMax) {
                                assignedFlex = flexPos;
                                break;
                            }
                        }
                    }
                }
    
                if (assignedFlex) {
                    setStartingLineup(prev => ({
                        ...prev,
                        [assignedFlex]: (prev[assignedFlex] || 0) + 1
                    }));
                    updatedRoster[playerIndex].position = assignedFlex;
                } else {
                    alert(`Cannot start more players at ${playerDefaultPos} or eligible flex.`);
                    return;
                }
            }
        }
    
        setRoster(updatedRoster);
    };
    

    const handleSaveLineup = async () => {
        const authToken = getAuthToken();
        try {
            const response = await fetch('/api/team/changelineup', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": 'Bearer ' + authToken
                },
                body: JSON.stringify({
                    team_id: teamId,
                    lineup: roster.map(player => ({
                        player_id: player.player_id,
                        new_position: player.position
                    }))
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Lineup successfully saved!');
            } else {
                alert(data.error || 'Failed to save lineup.');
            }
        } catch (err) {
            alert('Error saving lineup.');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Manage Lineup</h1>
            {team ? (
                <h2>{team}</h2>
            ) : (
                <p>No team data available.</p>
            )}
            <button onClick={handleSaveLineup} style={{ marginBottom: "20px", padding: "10px" }}>
                Save Lineup
            </button>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>First Name</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Last Name</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Player ID</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Team</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Default Position</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Current Position</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roster.map((player, index) => (
                            <tr key={index}>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.first_name}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.last_name}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.player_id}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.team}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.default_position}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.position}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    <button onClick={() => handleToggleStart(index)}>
                                        {player.position !== "BEN" ? "Bench" : "Start"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageLineup;
