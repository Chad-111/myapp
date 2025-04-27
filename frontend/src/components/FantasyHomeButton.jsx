import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { useLeagueContext } from '../components/utils/LeagueContext';

function FantasyHomeButton({ leagueCode, className = '' }) {
    const navigate = useNavigate();
    const { currentLeagueCode } = useLeagueContext();

    // Use provided leagueCode or fall back to context
    const finalLeagueCode = leagueCode || currentLeagueCode;

    const handleClick = () => {
        if (finalLeagueCode) {
            // If a league code is provided, go to that league's home page
            navigate(`/league/home/${finalLeagueCode}`);
        } else {
            // Otherwise go to the fantasy dashboard
            navigate('/fantasy/dashboard');
        }
    };

    return (
        <Tooltip title={finalLeagueCode ? "League Home" : "Fantasy Dashboard"}>
            <IconButton
                className={`fantasy-home-btn ${className}`}
                onClick={handleClick}
                size="small"
                color="primary"
            >
                <HomeIcon />
            </IconButton>
        </Tooltip>
    );
}

export default FantasyHomeButton;