import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import './Brackets.css';
import FantasyHomeButton from '../../../components/FantasyHomeButton';
import { useLeagueContext } from "../../../components/utils/LeagueContext";

const API_URL = 'https://apinext.collegefootballdata.com/teams/fbs';
const CFBD_API_KEY = 'YIeJpPgTk9vCO/i34NeuH2XppeCELHoa8jmc6ZPTlrm45a9lLZP2vl3Eb4QkQkFR';


export default function Brackets() {
  // Extract league code from params or query string
  const { code } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leagueCode = code || queryParams.get("code");

  // Use the context
  const { setCurrentLeagueCode } = useLeagueContext();

  // Update the context when the page loads
  useEffect(() => {
    if (leagueCode) {
      setCurrentLeagueCode(leagueCode);
    }
  }, [leagueCode, setCurrentLeagueCode]);

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [winners, setWinners] = useState({});


  const [slotSelections, setSlotSelections] = useState({});

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${CFBD_API_KEY}`,
            Accept: 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch teams');
        const data = await response.json();
        setTeams(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) return <div>Loading teams...</div>;
  if (error) return <div>Error: {error}</div>;


  const sortedTeams = [...teams].sort((a, b) => a.school.localeCompare(b.school));


  const bracket = [
    {
      name: 'Playoff First Round',
      matchups: [
        { id: 'r1-m0', slotA: { type: 'TEAM', slotId: 'r1-m0A' }, slotB: { type: 'TEAM', slotId: 'r1-m0B' } },
        { id: 'r1-m1', slotA: { type: 'TEAM', slotId: 'r1-m1A' }, slotB: { type: 'TEAM', slotId: 'r1-m1B' } },
        { id: 'r1-m2', slotA: { type: 'TEAM', slotId: 'r1-m2A' }, slotB: { type: 'TEAM', slotId: 'r1-m2B' } },
        { id: 'r1-m3', slotA: { type: 'TEAM', slotId: 'r1-m3A' }, slotB: { type: 'TEAM', slotId: 'r1-m3B' } }
      ],
      roundClass: ''
    },
    {
      name: 'Quarterfinals',
      matchups: [
        { id: 'r2-m0', slotA: { type: 'TEAM', slotId: 'r2-bye0' }, slotB: { type: 'WINNER', matchId: 'r1-m0' } },
        { id: 'r2-m1', slotA: { type: 'TEAM', slotId: 'r2-bye1' }, slotB: { type: 'WINNER', matchId: 'r1-m1' } },
        { id: 'r2-m2', slotA: { type: 'TEAM', slotId: 'r2-bye2' }, slotB: { type: 'WINNER', matchId: 'r1-m2' } },
        { id: 'r2-m3', slotA: { type: 'TEAM', slotId: 'r2-bye3' }, slotB: { type: 'WINNER', matchId: 'r1-m3' } }
      ],
      roundClass: ''
    },
    {
      name: 'Semifinals',
      matchups: [
        { id: 'r3-m0', slotA: { type: 'WINNER', matchId: 'r2-m0' }, slotB: { type: 'WINNER', matchId: 'r2-m1' } },
        { id: 'r3-m1', slotA: { type: 'WINNER', matchId: 'r2-m2' }, slotB: { type: 'WINNER', matchId: 'r2-m3' } }
      ],
      roundClass: 'semifinals'
    },
    {
      name: 'Championship',
      matchups: [
        { id: 'r4-m0', slotA: { type: 'WINNER', matchId: 'r3-m0' }, slotB: { type: 'WINNER', matchId: 'r3-m1' } }
      ],
      roundClass: 'final-round'
    }
  ];

  function getSlotTeam(slot) {
    if (!slot) return null;
    if (slot.type === 'TEAM') {
      const selectedId = slotSelections[slot.slotId] || '';
      return sortedTeams.find(t => String(t.id) === String(selectedId)) || null;
    } else if (slot.type === 'WINNER') {
      return winners[slot.matchId] || null;
    }
    return null;
  }


  const handleWinnerSelect = (matchId, teamId) => {
    if (!teamId) {
      setWinners(prev => {
        const copy = { ...prev };
        delete copy[matchId];
        return copy;
      });
      return;
    }
    const found = sortedTeams.find(t => String(t.id) === String(teamId));
    if (found) {
      setWinners(prev => ({ ...prev, [matchId]: found }));
    }
  };


  const handleSlotSelect = (slotId, teamId) => {
    setSlotSelections(prev => ({ ...prev, [slotId]: teamId }));
  };

  function Matchup({ match }) {
    const teamA = getSlotTeam(match.slotA);
    const teamB = getSlotTeam(match.slotB);

    const possibleTeams = [];
    if (teamA) possibleTeams.push(teamA);
    if (teamB) possibleTeams.push(teamB);

    const chosenWinner = winners[match.id] || null;
    const chosenWinnerId = chosenWinner?.id || '';
    const canChooseWinner = (possibleTeams.length === 2);

    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <FantasyHomeButton leagueCode={leagueCode} />
        </div>
        <div className="bracket-matchup">

          <div className="teams-vertical">
            <TeamSquare
              slot={match.slotA}
              team={teamA}
              onSlotSelect={handleSlotSelect}
              allTeams={sortedTeams}
            />
            <TeamSquare
              slot={match.slotB}
              team={teamB}
              onSlotSelect={handleSlotSelect}
              allTeams={sortedTeams}
            />
          </div>


          {canChooseWinner ? (
            <div className="select-winner">
              <label>Winner:</label>
              <select value={chosenWinnerId} onChange={(e) => handleWinnerSelect(match.id, e.target.value)}>
                <option value="">--Pick Winner--</option>
                {possibleTeams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.school}
                  </option>
                ))}
              </select>
              {chosenWinner && (
                <div className="team-display bracket-winner-display">
                  {chosenWinner.logos?.[0] && (
                    <img
                      src={chosenWinner.logos[0]}
                      alt={chosenWinner.school}
                      className="team-logo"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  )}
                  <span className="team-name">{chosenWinner.school}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="pending-label">Waiting for both teams...</div>
          )}
        </div>
      </div>
    );
  }


  function TeamSquare({ slot, team, onSlotSelect, allTeams }) {
    if (!slot) return <div className="team-square empty-square">---</div>;


    let bgColor = '#ccc';
    if (team?.color && team.color !== 'string') {
      bgColor = '#' + team.color.replace(/^#/, '');
    }

    if (slot.type === 'TEAM') {
      const slotId = slot.slotId;
      const selectedId = team ? team.id : '';

      return (
        <div className="team-square-wrapper">

          {team?.logos?.[0] && (
            <img
              src={team.logos[0]}
              alt={team.school}
              className="team-square-logo"
              onError={(e) => (e.target.style.display = 'none')}
            />
          )}

          <div className="team-square" style={{ backgroundColor: bgColor }}>
            <select
              className="team-dropdown"
              value={selectedId}
              onChange={(e) => onSlotSelect(slotId, e.target.value)}
            >
              <option value="">--Choose a Team--</option>
              {allTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.school}
                </option>
              ))}
            </select>

            {team && (
              <div className="square-team-display">
                <span className="square-team-name">{team.school}</span>
              </div>
            )}
          </div>
        </div>
      );
    } else if (slot.type === 'WINNER') {
      if (!team) {
        return <div className="team-square empty-square">Waiting...</div>;
      }
      return (
        <div className="team-square-wrapper">
          {team.logos?.[0] && (
            <img
              src={team.logos[0]}
              alt={team.school}
              className="team-square-logo"
              onError={(e) => (e.target.style.display = 'none')}
            />
          )}
          <div className="team-square" style={{ backgroundColor: bgColor }}>
            <span className="square-team-name">{team.school}</span>
          </div>
        </div>
      );
    }

    return <div className="team-square empty-square">???</div>;
  }

  return (
    <div className="bracket-wrapper">
      <div className="bracket-container">
        {bracket.map((roundObj, i) => {
          const isFirst = (i === 0);
          const isLast = (i === bracket.length - 1);

          let roundClass = 'bracket-round';
          if (!isFirst) roundClass += ' not-first-round';
          if (isLast) roundClass += ' final-round';
          if (roundObj.roundClass) roundClass += ` ${roundObj.roundClass}`;

          return (
            <div key={roundObj.name} className={roundClass}>
              <h3>{roundObj.name}</h3>
              {roundObj.matchups.map(match => (
                <Matchup key={match.id} match={match} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}