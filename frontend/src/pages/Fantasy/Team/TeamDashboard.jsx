import React, { useEffect, useState, useContext} from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // ← Add this!
import { getAuthToken } from '../../../components/utils/auth';
import { RedirectContext } from '../../../App';
const TeamDashboard = () => {
    const {redirectLocation, setRedirectLocation} = useContext(RedirectContext);
    const [team, setTeam] = useState();
    const [roster, setRoster] = useState([]);
    const [teamId, setTeamId] = useState();
    const [leagueId, setLeagueId] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();

    const navigate = useNavigate(); // ← for navigation

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
                setRoster(data.roster);
                setTeamId(data.team_id);
                setLeagueId(data.league_id);
            } catch (err) {
                setError('Failed to fetch team data.');
            } finally {
                setLoading(false);
            }
        };

        fetchTeam();
    }, []);

    const handleGoToManageLineup = async () => {
        const authToken = getAuthToken();
        try {
            const response = await fetch('/api/team/geturl', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": 'Bearer ' + authToken
                },
                body: JSON.stringify({ team_id: teamId })
            });
    
            const data = await response.json();
            if (response.ok) {
                navigate(`/team/managelineup/${data.code}`);
            } else {
                alert('Failed to navigate to team management.');
            }
        } catch (err) {
            alert('Error navigating to team management.');
        }
    };
    

    const handleGoToLeagueHub = async () => {
        const authToken = getAuthToken();
        try {
            const response = await fetch('/api/league/geturl', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": 'Bearer ' + authToken
                },
                body: JSON.stringify({ league_id: leagueId })
            });

            const data = await response.json();
            if (response.ok) {
                setRedirectLocation(location.pathname);
                navigate(`/league/home/${data.code}`);
            } else {
                alert('Failed to navigate to league.');
            }
        } catch (err) {
            alert('Error navigating to league.');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const sortedRoster = [...roster].sort((a, b) => {
        // 1. Prioritize starters (anything not BEN comes before BEN)
        if (a.position === "BEN" && b.position !== "BEN") return 1;
        if (a.position !== "BEN" && b.position === "BEN") return -1;
    
        // 2. If both same starter/bench status, sort alphabetically by position
        if (a.position < b.position) return -1;
        if (a.position > b.position) return 1;
    
        // 3. Then sort by last name as tiebreaker
        return a.last_name.localeCompare(b.last_name);
    });
    

    return (
        <div>
            <h1>Team Dashboard</h1>
            {team ? (
                <h2>{team}</h2>
            ) : (
                <p>No team data available.</p>
            )}

            <div style={{ marginBottom: "20px" }}>
                <button onClick={handleGoToManageLineup} style={{ marginRight: "10px", padding: "10px" }}>
                    Manage Lineup
                </button>
                <button onClick={handleGoToLeagueHub} style={{ padding: "10px" }}>
                    Go to League Hub
                </button>
            </div>

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
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRoster.map((player, index) => (
                            <tr key={index}>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.first_name}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.last_name}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.player_id}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.team}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.default_position}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.position}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamDashboard;
