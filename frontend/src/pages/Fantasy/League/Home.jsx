import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RedirectContext } from "../../../App";
import { getAuthToken } from "../../../components/utils/auth";
import { useLeagueContext } from "../../../components/utils/LeagueContext";
import {
  IconButton,
  Button,
  Grid,
  Tooltip,
  Card,
  CardContent,
  Typography,
  Snackbar,
  Box
} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Standings
import GroupsIcon from '@mui/icons-material/Groups'; // Rosters
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'; // Schedule
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; // Trade Portal
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'; // Brackets
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'; // Members
import SettingsTwoToneIcon from '@mui/icons-material/SettingsTwoTone'; // Settings (already imported)
import SportsFootballIcon from '@mui/icons-material/SportsFootball'; // Draft
import ContentCopyIcon from '@mui/icons-material/ContentCopy';



function LeagueHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { setCurrentLeagueCode } = useLeagueContext();

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [copyTooltip, setCopyTooltip] = useState("Copy to Clipboard");

  // Function to copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setOpenSnackbar(true);
      setCopyTooltip("Copied!");
      setTimeout(() => setCopyTooltip("Copy to Clipboard"), 1500);
    });
  };

  const [league, setLeague] = useState({});
  const [teams, setTeams] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const leagueCode = location.pathname.split("/").at(-1);


  const authToken = getAuthToken();

  useEffect(() => {
    if (leagueCode) {
      setCurrentLeagueCode(leagueCode);
    }
  }, [leagueCode, setCurrentLeagueCode]);

  const generateCode = async () => {
    try {
      const response = await fetch("/api/league/getcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": 'Bearer ' + authToken
        },
        body: JSON.stringify({ "access_token": authToken, "url": leagueCode }),
      });

      const data = await response.json();
      setInviteCode(`${window.location.origin}/league/join/${data.code}`);
    } catch (err) {
      console.error("Failed to generate invite code:", err);
    }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          headers: {
            "Authorization": 'Bearer ' + authToken
          }
        });
        const data = await response.json();
        setCurrentUserId(data.id);
      } catch (err) {
        console.error("Failed to fetch user ID:", err);
      }
    };

    fetchUserId();
  }, [authToken]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/league/getleague", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": 'Bearer ' + authToken
          },
          body: JSON.stringify({ "access_token": authToken, "code": leagueCode }),
        });

        if (!response.ok) {
          if (response.status === 422) {
            setRedirectLocation(location.pathname);
            navigate("/login");
            return;
          } else {
            throw new Error("League get failed");
          }
        }

        const data = await response.json();
        setLeague(data.league);
        setTeams(data.teams);

        // Save league_id locally and init chat
        const leagueId = data.teams[0]?.league_id;
        if (leagueId) {
          localStorage.setItem("league_id", leagueId);

          // Init chat room + set chat_id
          const chatResponse = await fetch("/api/chat/league/init", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + authToken,
            },
            body: JSON.stringify({ league_id: leagueId }),
          });

          const chatData = await chatResponse.json();
          if (chatResponse.ok && chatData.chat_id) {
            localStorage.setItem("chat_id", chatData.chat_id);
            console.log("✅ Chat initialized:", chatData.chat_id);
          } else {
            console.warn("⚠️ Chat initialization failed:", chatData);
          }
        }

      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, [leagueCode, authToken, location.pathname, navigate, setRedirectLocation]);

  return (
    <div className="container mt-4">
      {/* Navigation section moved to top */}
      <Box mb={4}>
        <Typography variant="h5" className="text-center mb-3">League Navigation</Typography>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%', cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}
              onClick={() => navigate(`/league/standings/${leagueCode}`)}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <EmojiEventsIcon sx={{ fontSize: 35, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Standings</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%', cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}
              onClick={() => navigate(`/league/rosters/${leagueCode}`)}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <GroupsIcon sx={{ fontSize: 35, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Rosters</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%', cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}
              onClick={() => navigate(`/league/schedule/${leagueCode}`)}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <CalendarMonthIcon sx={{ fontSize: 35, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Schedule</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%', cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}
              onClick={() => navigate(`/league/portal/${leagueCode}`)}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <SwapHorizIcon sx={{ fontSize: 35, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Trades</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%', cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}
              onClick={() => navigate(`/league/draft/${leagueCode}`)}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <SportsFootballIcon sx={{ fontSize: 35, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Draft</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* League header section with integrated invite button */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <h2 className="me-3 mb-0">{league.name} {league.sport}</h2>

          <div className="ms-2">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={generateCode}
              title="Generate invite link"
            >
              Invite
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center ms-auto">
          {inviteCode && (
            <div className="d-flex align-items-center me-3">
              <div className="position-relative" style={{ maxWidth: 'fit-content' }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  readOnly
                  value={inviteCode}
                  style={{ paddingRight: '30px' }}
                />
                <Tooltip title={copyTooltip}>
                  <IconButton
                    size="small"
                    onClick={copyToClipboard}
                    className="position-absolute"
                    style={{ right: '2px', top: '50%', transform: 'translateY(-50%)' }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
              <small className="text-muted ms-2 d-none d-md-block">Valid for 2 hours</small>
            </div>
          )}

          {currentUserId === league.commissioner && (
            <IconButton
              className="text-secondary"
              onClick={() => navigate(`/league/settings/${leagueCode}`)}
              title="League Settings"
            >
              <SettingsTwoToneIcon fontSize="Small" />
            </IconButton>
          )}

          <div className="ms-2 text-muted">Teams: {teams.length}</div>
        </div>

        {/* Notification for copy success */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={2000}
          onClose={() => setOpenSnackbar(false)}
          message="Invite code copied to clipboard!"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </div>

      {/* League members section */}
      <h4 className="mb-3">League Members</h4>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
        {teams.map((team) => (
          <div key={team.id} className="col">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-1"><strong>{team.name}</strong> (
                  <span className="text-success">{team.wins}</span>
                  -
                  <span className="text-danger">{team.losses}</span>
                  )</h5>
                <p className="card-text mb-1"><strong>Owner:</strong> {team.owner_id}</p>
                <p className="card-text mb-0">Rank: #<strong>{team.league_rank}</strong></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional navigation options can go in a "More" section if needed */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>More Options</Typography>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%', cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}
              onClick={() => navigate(`/league/brackets/${leagueCode}`)}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <EmojiEventsOutlinedIcon sx={{ fontSize: 35, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Brackets</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%', cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}
              onClick={() => navigate(`/league/members/${leagueCode}`)}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <PeopleOutlineIcon sx={{ fontSize: 35, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Members</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

export default LeagueHome;