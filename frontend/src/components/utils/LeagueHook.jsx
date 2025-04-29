import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Hook to fetch and manage league data across components
 * @param {string} leagueCode - The league code to fetch data for
 * @returns {Object} League data, teams, user team, and loading/error states
 */
function useLeagueData(leagueCode) {
    const [league, setLeague] = useState(null);
    const [teams, setTeams] = useState([]);
    const [userTeam, setUserTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Clear state when league code changes
        setLeague(null);
        setTeams([]);
        setUserTeam(null);
        setLoading(true);
        setError(null);

        if (!leagueCode) {
            setLoading(false);
            setError("No league code provided");
            return;
        }

        const fetchLeagueData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error("Authentication token not found. Please log in again.");
                }

                // Fetch league data
                const response = await axios.post("/api/league/getleague", {
                    code: leagueCode,
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                setLeague(response.data.league);
                setTeams(response.data.teams);

                // Get user's team
                const userResponse = await axios.get("/api/me", {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const userId = userResponse.data.id;
                const userTeam = response.data.teams.find(team => team.owner_id === userId);
                setUserTeam(userTeam);

            } catch (err) {
                console.error("Error fetching league data:", err);
                setError(err.response?.data?.error || err.message || "Failed to load league data");
            } finally {
                setLoading(false);
            }
        };

        fetchLeagueData();
    }, [leagueCode]);

    return { league, teams, userTeam, loading, error };
}

export default useLeagueData;